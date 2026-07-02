import { NextRequest, NextResponse } from "next/server";
import { fetchBannedIps } from "@/lib/fetchBannedIps";
import {
  fetchLiveDemoBansResult,
  fetchProofBansResult,
} from "@/lib/proofBanFallback";
import { resolveBansDisplayMode } from "@/lib/bansDisplayMode";
import {
  bansCacheKey,
  getCachedBans,
  invalidateAllBansCache,
  setCachedBans,
} from "@/lib/bansCache";

export const dynamic = "force-dynamic";

const BENCH_DATA_DIR = process.env.BENCH_DATA_DIR || "/data/lg";

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

  const mode = await resolveBansDisplayMode(BENCH_DATA_DIR);
  let out;

  if (mode.kind === "proof") {
    out =
      (await fetchProofBansResult(BENCH_DATA_DIR, opts)) ?? {
        count: 0,
        source: "empty",
        bans: [],
      };
  } else if (mode.kind === "live-demo") {
    out = fetchLiveDemoBansResult(mode.ips, opts);
  } else {
    const data = await fetchBannedIps(opts);
    if (
      data.count === 0 &&
      (data.source === "empty" || !data.bans.length)
    ) {
      const proof = await fetchProofBansResult(BENCH_DATA_DIR, opts);
      out = proof ?? data;
    } else {
      out = { ...data, data_mode: "live" as const };
    }
  }
  setCachedBans(key, out);

  return NextResponse.json(out, {
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
