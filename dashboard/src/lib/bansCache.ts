import type { BannedIpsResult, FetchBannedOpts } from "@/lib/fetchBannedIps";

const TTL_MS = 5000;
const store = new Map<string, { ts: number; data: BannedIpsResult }>();

export function bansCacheKey(opts: FetchBannedOpts): string {
  return JSON.stringify({
    c: opts.countOnly ? 1 : 0,
    l: opts.limit ?? 0,
    o: opts.offset ?? 0,
    s: opts.search?.trim().toLowerCase() ?? "",
  });
}

export function getCachedBans(key: string): BannedIpsResult | null {
  const hit = store.get(key);
  if (!hit || Date.now() - hit.ts > TTL_MS) return null;
  return hit.data;
}

export function setCachedBans(key: string, data: BannedIpsResult): void {
  store.set(key, { ts: Date.now(), data });
  if (store.size > 32) {
    const oldest = [...store.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) store.delete(oldest[0]);
  }
}

/** Ban/unban sonrasi tum sayfa ve badge cache'ini sifirla */
export function invalidateAllBansCache(): void {
  store.clear();
}
