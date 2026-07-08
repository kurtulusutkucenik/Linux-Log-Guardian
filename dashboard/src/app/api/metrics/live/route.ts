import { NextResponse } from "next/server";
import { parseGuardianMetrics } from "@/lib/prometheusParse";
import { guardianMetricsUrl } from "@/lib/guardianMetricsUrl";

export const dynamic = "force-dynamic";

const CACHE_MS = 3000;
let cache: { ts: number; body: ReturnType<typeof parseGuardianMetrics> } | null = null;

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.body, {
      headers: { "Cache-Control": "private, max-age=2" },
    });
  }

  const url = guardianMetricsUrl();
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { reachable: false, eps: 0, ts: now, error: `HTTP ${res.status}` },
        { status: 200 },
      );
    }
    const text = await res.text();
    const body = parseGuardianMetrics(text);
    cache = { ts: now, body };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, max-age=2" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        reachable: false,
        eps: 0,
        lines_total: 0,
        alerts_total: 0,
        bans_success: 0,
        bans_failed: 0,
        unique_ips: 0,
        parse_errors: 0,
        xdp_active: 0,
        ts: now,
        error: err instanceof Error ? err.message : "fetch failed",
        hint: "GUARDIAN_METRICS_URL=http://metrics-relay:19091/metrics",
      },
      { status: 200 },
    );
  }
}
