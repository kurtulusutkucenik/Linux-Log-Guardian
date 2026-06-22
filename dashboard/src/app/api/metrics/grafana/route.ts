import { NextRequest, NextResponse } from "next/server";
import {
  GRAFANA_SOC_STAT_PANELS,
  GRAFANA_SOC_TS_PANELS,
  GRAFANA_STAT_PANELS,
  GRAFANA_TABLE_METRICS,
  GRAFANA_TELEGRAM_STAT_PANELS,
  GRAFANA_TS_PANELS,
  tenantExpr,
} from "@/lib/grafanaPanels";
import {
  promInstant,
  promRange,
  promRangeMulti,
  promReachable,
} from "@/lib/prometheusClient";
import { parseGuardianMetrics } from "@/lib/prometheusParse";

export const dynamic = "force-dynamic";

const CACHE_MS = 5000;
let cache: { key: string; ts: number; body: unknown } | null = null;

function guardianMetricsUrl(): string {
  return (
    process.env.GUARDIAN_METRICS_URL ||
    process.env.PROMETHEUS_METRICS_URL ||
    "http://host.docker.internal:9091/metrics"
  );
}

async function liveGuardianStats(): Promise<{
  stats: Record<string, number>;
  socStats: Record<string, number>;
  telegramStats: Record<string, number>;
  alerts_total?: number;
  reachable: boolean;
  hint?: string;
} | null> {
  try {
    const res = await fetch(guardianMetricsUrl(), {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const snap = parseGuardianMetrics(await res.text());
    if (!snap.reachable) return null;
    return {
      reachable: true,
      hint: "Canli :9091 metrikleri (Prometheus yok). Gecmis grafikler: bash scripts/dashboard_stack.sh",
      stats: {
        lines: snap.lines_total,
        ban_ok: snap.bans_success,
        ban_fail: snap.bans_failed,
        parse_err: snap.parse_errors,
        eps: snap.eps,
        xdp: snap.xdp_active,
        unique_ips: snap.unique_ips,
        ringbuf: 0,
        alerts: snap.alerts_total,
        http_4xx: snap.http_4xx,
        http_5xx: snap.http_5xx,
      },
      socStats: {
        ja3_clusters: snap.ja3_clusters_active,
        ja3_bans: snap.ja3_cluster_bans_total,
        threat_iocs: snap.threat_total_iocs,
        fp_trusted: snap.fp_trusted_ips,
        bp_ipset: snap.ban_pipeline_ipset,
        bp_failed: snap.ban_pipeline_failed,
      },
      telegramStats: {
        tg_ack: snap.telegram_ack_24h,
        tg_unacked: snap.telegram_unacked_24h,
        quiet_hours: snap.webhook_quiet_hours,
        quiet_active: snap.webhook_quiet_active,
      },
      alerts_total: snap.alerts_total,
    };
  } catch {
    return null;
  }
}

function rangeSparkStep(rangeSec: number): number {
  return Math.max(30, Math.ceil(rangeSec / 48));
}

function rangeTsStep(rangeSec: number): number {
  return Math.max(60, Math.ceil(rangeSec / 72));
}

export async function GET(req: NextRequest) {
  const tenant = req.nextUrl.searchParams.get("tenant") || "default";
  const rangeSec = parseInt(req.nextUrl.searchParams.get("range") || "3600", 10);
  const cacheKey = `${tenant}:${rangeSec}`;

  if (cache && cache.key === cacheKey && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.body, {
      headers: { "Cache-Control": "private, max-age=4" },
    });
  }

  const reachable = await promReachable();
  if (!reachable) {
    const live = await liveGuardianStats();
    if (live) {
      const body = {
        reachable: true,
        source: "guardian-direct",
        tenant,
        rangeSec,
        ts: Date.now(),
        hint: live.hint,
        stats: live.stats,
        socStats: live.socStats,
        telegramStats: live.telegramStats,
        sparklines: {},
        timeseries: {},
        table: [
          { metric: "alerts_total", value: live.alerts_total ?? 0 },
          { metric: "eps", value: live.stats.eps ?? 0 },
          { metric: "ja3_clusters_active", value: live.socStats.ja3_clusters ?? 0 },
          { metric: "ban_pipeline_ipset", value: live.socStats.bp_ipset ?? 0 },
        ],
      };
      cache = { key: cacheKey, ts: Date.now(), body };
      return NextResponse.json(body, {
        headers: { "Cache-Control": "private, max-age=4" },
      });
    }
    const fallback = {
      reachable: false,
      tenant,
      hint: "Prometheus yok — bash scripts/dashboard_stack.sh  (log-guardian :9091 acik mi?)",
      stats: {},
      socStats: {},
      telegramStats: {},
      sparklines: {},
      timeseries: {},
      table: [],
    };
    return NextResponse.json(fallback, { status: 200 });
  }

  const stats: Record<string, number> = {};
  const socStats: Record<string, number> = {};
  const telegramStats: Record<string, number> = {};
  const sparklines: Record<string, { t: string; v: number }[]> = {};

  const sparkStep = rangeSparkStep(rangeSec);
  const tsStep = rangeTsStep(rangeSec);

  await Promise.all(
    GRAFANA_STAT_PANELS.map(async (p) => {
      const q = tenantExpr(p.expr, tenant);
      const [instant, spark] = await Promise.all([
        promInstant(q),
        promRange(q, rangeSec, sparkStep),
      ]);
      stats[p.id] = instant ?? 0;
      sparklines[p.id] = spark.map((s) => ({ t: s.label, v: s.v }));
    }),
  );

  await Promise.all(
    GRAFANA_SOC_STAT_PANELS.map(async (p) => {
      const q = tenantExpr(p.expr, tenant);
      const [instant, spark] = await Promise.all([
        promInstant(q),
        promRange(q, rangeSec, sparkStep),
      ]);
      socStats[p.id] = instant ?? 0;
      sparklines[p.id] = spark.map((s) => ({ t: s.label, v: s.v }));
    }),
  );

  await Promise.all(
    GRAFANA_TELEGRAM_STAT_PANELS.map(async (p) => {
      const q = tenantExpr(p.expr, tenant);
      const [instant, spark] = await Promise.all([
        promInstant(q),
        promRange(q, rangeSec, sparkStep),
      ]);
      telegramStats[p.id] = instant ?? 0;
      sparklines[p.id] = spark.map((s) => ({ t: s.label, v: s.v }));
    }),
  );

  const timeseries: Record<string, Record<string, string | number>[]> = {};
  await Promise.all(
    [...GRAFANA_TS_PANELS, ...GRAFANA_SOC_TS_PANELS].map(async (panel) => {
      timeseries[panel.id] = await promRangeMulti(
        panel.series.map((s) => ({
          key: s.key,
          query: tenantExpr(s.expr, tenant),
        })),
        rangeSec,
        tsStep,
      );
    }),
  );

  const table = await Promise.all(
    GRAFANA_TABLE_METRICS.map(async (m) => ({
      metric: m.label,
      value: (await promInstant(tenantExpr(m.expr, tenant))) ?? 0,
    })),
  );

  const live = await liveGuardianStats();
  if (live?.reachable && live.stats) {
    const counterKeys = [
      "lines",
      "ban_ok",
      "ban_fail",
      "parse_err",
      "unique_ips",
      "alerts",
    ] as const;
    for (const k of counterKeys) {
      const lv = live.stats[k] ?? 0;
      const pv = stats[k] ?? 0;
      if (lv > pv) stats[k] = lv;
    }
    for (const [k, v] of Object.entries(live.socStats ?? {})) {
      if ((socStats[k] ?? 0) < v) socStats[k] = v;
    }
    for (const [k, v] of Object.entries(live.telegramStats ?? {})) {
      if ((telegramStats[k] ?? 0) < v) telegramStats[k] = v;
    }
    if ((live.stats.eps ?? 0) > (stats.eps ?? 0)) {
      stats.eps = live.stats.eps ?? 0;
    }
  }

  const body = {
    reachable: true,
    source: "prometheus",
    tenant,
    rangeSec,
    ts: Date.now(),
    hint:
      live?.reachable && (stats.lines ?? 0) === 0 && (stats.ban_ok ?? 0) === 0
        ? live.hint
        : undefined,
    stats,
    socStats,
    telegramStats,
    sparklines,
    timeseries,
    table,
  };

  cache = { key: cacheKey, ts: Date.now(), body };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, max-age=4" },
  });
}
