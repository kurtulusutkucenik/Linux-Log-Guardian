import { NextRequest, NextResponse } from "next/server";
import { fetchBannedIps } from "@/lib/fetchBannedIps";
import {
  bansCacheKey,
  getCachedBans,
  invalidateAllBansCache,
  setCachedBans,
} from "@/lib/bansCache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const countOnly = sp.get("count_only") === "1";
  const limit = sp.get("limit") ? parseInt(sp.get("limit")!, 10) : 50;
  const offset = sp.get("offset") ? parseInt(sp.get("offset")!, 10) : 0;
  const search = sp.get("search")?.trim() || sp.get("q")?.trim() || undefined;
  const bust = sp.has("bust") || sp.has("_t");

  const opts = {
    countOnly,
    limit: countOnly ? undefined : limit,
    offset: countOnly ? undefined : offset,
    search,
  };

  const key = bansCacheKey(opts);
  const cached = bust ? null : getCachedBans(key);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "private, max-age=3" },
    });
  }

  const data = await fetchBannedIps(opts);
  setCachedBans(key, data);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": countOnly ? "private, max-age=3" : "private, max-age=2",
    },
  });
}

/** Dashboard ban/unban sonrasi cache temizligi */
export async function POST() {
  invalidateAllBansCache();
  return NextResponse.json({ ok: true });
}
