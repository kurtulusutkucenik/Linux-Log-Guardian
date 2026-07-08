/** Basit login rate limit (IP basina) — yalnizca basarisiz denemeler. */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = parseInt(process.env.DASHBOARD_LOGIN_RL_MAX || '10', 10) || 10;

function isLoopbackAddress(key: string): boolean {
  const k = key.trim().toLowerCase();
  if (!k) return false;
  if (k === '::1' || k === 'localhost') return true;
  if (k.startsWith('127.')) return true;
  return false;
}

/** Laptop prod (DOMAIN=localhost): docker bridge / LAN — operator kilidi onleme */
function isPrivateLabAddress(key: string): boolean {
  const k = key.trim();
  if (!k) return false;
  if (isLoopbackAddress(k)) return true;
  if (/^10\./.test(k)) return true;
  if (/^192\.168\./.test(k)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(k)) return true;
  return false;
}

/** Dev: localhost bypass. Prod lab: RFC1918 bypass. Prod VPS: yalnizca acik env. */
function bypassLoginRateLimit(key: string): boolean {
  const k = key.trim();
  if (process.env.NODE_ENV !== 'production') {
    if (!k || k === 'unknown') return true;
    if (isLoopbackAddress(k)) return true;
    return false;
  }
  if (process.env.DASHBOARD_LOGIN_RL_LAB === '1' && isPrivateLabAddress(k)) {
    return true;
  }
  if (isLoopbackAddress(k) && process.env.DASHBOARD_LOGIN_RL_BYPASS_LOOPBACK === '1') {
    return true;
  }
  return false;
}

export function loginRateLimitKey(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

export function checkLoginRateLimit(key: string): { ok: boolean; retryAfterSec?: number } {
  if (bypassLoginRateLimit(key)) {
    return { ok: true };
  }
  const bucketKey = key.trim() || 'unknown';
  const now = Date.now();
  let b = buckets.get(bucketKey);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(bucketKey, b);
  }
  if (b.count >= MAX_ATTEMPTS) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true };
}

export function recordLoginFailure(key: string): void {
  if (bypassLoginRateLimit(key)) return;
  const bucketKey = key.trim() || 'unknown';
  const now = Date.now();
  let b = buckets.get(bucketKey);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(bucketKey, b);
  }
  b.count += 1;
}

/** Test / e2e — bucket sifirla */
export function resetLoginRateLimitForTests(key?: string): void {
  if (key) buckets.delete(key.trim() || 'unknown');
  else buckets.clear();
}
