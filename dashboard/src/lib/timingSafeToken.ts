import { timingSafeEqual } from "crypto";

/** Constant-time string compare for API keys / bearer tokens. */
export function timingSafeTokenEquals(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function timingSafeTokenInList(
  token: string,
  allowed: readonly string[],
): boolean {
  for (const candidate of allowed) {
    if (timingSafeTokenEquals(token, candidate)) return true;
  }
  return false;
}
