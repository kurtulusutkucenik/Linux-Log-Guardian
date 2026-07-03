import { NextRequest, NextResponse } from "next/server";
import { invalidateAllBansCache } from "@/lib/bansCache";
import { timingSafeTokenInList } from "@/lib/timingSafeToken";

export const dynamic = "force-dynamic";

function cacheBustAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7).trim();
  if (!token) return false;
  const allowed = [
    process.env.DASHBOARD_CACHE_BUST_KEY,
    process.env.GUARDIAN_API_TOKEN,
    process.env.DASHBOARD_FLEET_API_KEY,
    process.env.FLEET_API_KEY,
  ].filter((k): k is string => Boolean(k && k.length > 0));
  return timingSafeTokenInList(token, allowed);
}

/** Host scriptleri (dashboard_live_demo) — JWT olmadan bans cache temizligi */
export async function POST(req: NextRequest) {
  if (!cacheBustAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  invalidateAllBansCache();
  return NextResponse.json({ ok: true, invalidated: "bans" });
}
