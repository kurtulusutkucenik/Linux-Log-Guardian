"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ExternalLink, Loader2, Radio } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";
import { grafanaDashboardUrl } from "@/lib/grafanaPanels";
import type { MessageKey } from "@/lib/i18n";

type Spark = { t: string; v: number };
type TsRow = Record<string, string | number>;
type Payload = {
  reachable: boolean;
  source?: string;
  tenant?: string;
  hint?: string;
  ts?: number;
  rangeSec?: number;
  stats?: Record<string, number>;
  socStats?: Record<string, number>;
  sparklines?: Record<string, Spark[]>;
  timeseries?: Record<string, TsRow[]>;
  table?: { metric: string; value: number }[];
};

const STAT_COLORS: Record<string, string> = {
  lines: "#6366f1",
  ban_ok: "#16a34a",
  ban_fail: "#be123c",
  parse_err: "#d97706",
  eps: "#0891b2",
  xdp: "#a78bfa",
  unique_ips: "#22d3ee",
  ringbuf: "#f97316",
  ja3_clusters: "#c084fc",
  ja3_bans: "#a855f7",
  threat_iocs: "#f59e0b",
  fp_trusted: "#34d399",
  bp_ipset: "#16a34a",
  bp_failed: "#f87171",
};

const CORE_STATS: { id: string; labelKey: MessageKey }[] = [
  { id: "lines", labelKey: "grafanaStatLines" },
  { id: "ban_ok", labelKey: "grafanaStatBanOk" },
  { id: "ban_fail", labelKey: "grafanaStatBanFail" },
  { id: "parse_err", labelKey: "grafanaStatParseErr" },
  { id: "eps", labelKey: "grafanaStatEps" },
  { id: "xdp", labelKey: "grafanaStatXdp" },
];

const EXTRA_STATS: { id: string; labelKey: MessageKey }[] = [
  { id: "unique_ips", labelKey: "grafanaStatUniqueIps" },
  { id: "ringbuf", labelKey: "grafanaStatRingbuf" },
];

const SOC_STATS: { id: string; labelKey: MessageKey }[] = [
  { id: "ja3_clusters", labelKey: "grafanaSocJa3Clusters" },
  { id: "ja3_bans", labelKey: "grafanaSocJa3Bans" },
  { id: "threat_iocs", labelKey: "grafanaSocThreatIocs" },
  { id: "fp_trusted", labelKey: "grafanaSocFpTrusted" },
  { id: "bp_ipset", labelKey: "grafanaSocBpIpset" },
  { id: "bp_failed", labelKey: "grafanaSocBpFailed" },
];

const tooltipStyle = {
  background: "#0f1419",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 11,
};

function MiniStat({
  title,
  value,
  spark,
  color,
  alert,
}: {
  title: string;
  value: string;
  spark: Spark[];
  color: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`glass-panel p-3 flex flex-col min-h-[92px] border transition-colors ${
        alert ? "border-red-500/35 bg-red-500/5" : "border-white/5 hover:border-white/10"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-white/40 truncate">{title}</p>
      <p className={`text-lg font-bold font-mono mt-0.5 ${alert ? "text-red-300" : "text-white"}`}>
        {value}
      </p>
      {spark.length > 1 && (
        <div className="h-9 mt-auto -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark}>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                fill={`${color}22`}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MiniTs({
  title,
  data,
  keys,
  colors,
  height = 128,
}: {
  title: string;
  data: TsRow[];
  keys: { key: string; name: string }[];
  colors: string[];
  height?: number;
}) {
  if (!data.length) {
    return (
      <div className="glass-panel p-3 border border-white/5 min-h-[140px] flex items-center justify-center">
        <p className="text-[10px] text-white/30">{title} — …</p>
      </div>
    );
  }
  return (
    <div className="glass-panel p-3 border border-white/5">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-2 truncate">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 8 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: "#64748b", fontSize: 8 }} width={32} />
          <Tooltip contentStyle={tooltipStyle} />
          {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
          {keys.map((k, i) => (
            <Line
              key={k.key}
              type="monotone"
              dataKey={k.key}
              name={k.name}
              stroke={colors[i] ?? "#0891b2"}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function fmtStat(id: string, v: number): string {
  if (id === "eps") return v.toFixed(1);
  if (id === "xdp") return v >= 1 ? "ON" : "OFF";
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function GrafanaMiniPanels({ tenant = "default" }: { tenant?: string }) {
  const { t } = useLanguage();
  const [data, setData] = useState<Payload | null>(null);
  const [rangeSec, setRangeSec] = useState(3600);
  const [loading, setLoading] = useState(false);
  const reqGen = useRef(0);

  const fetchMetrics = useCallback(
    async (range: number) => {
      const gen = ++reqGen.current;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/metrics/grafana?tenant=${encodeURIComponent(tenant)}&range=${range}&_t=${Date.now()}`,
          { credentials: "same-origin", cache: "no-store" },
        );
        const body = (await res.json()) as Payload;
        if (gen !== reqGen.current) return;
        if (!res.ok) {
          setData({
            reachable: false,
            hint:
              (body as Payload & { error?: string })?.error === "Unauthorized"
                ? t("grafanaMiniAuth")
                : body?.hint,
            rangeSec: range,
          });
          return;
        }
        setData({ ...body, rangeSec: body.rangeSec ?? range });
      } catch {
        if (gen === reqGen.current) setData({ reachable: false, rangeSec: range });
      } finally {
        if (gen === reqGen.current) setLoading(false);
      }
    },
    [tenant, t],
  );

  useEffect(() => {
    void fetchMetrics(rangeSec);
  }, [rangeSec, tenant, fetchMetrics]);

  const poll = useCallback(() => fetchMetrics(rangeSec), [fetchMetrics, rangeSec]);
  useVisibleInterval(poll, 12000, true);

  const chartsReady =
    !loading && data != null && (data.rangeSec === undefined || data.rangeSec === rangeSec);

  const stats = data?.stats ?? {};
  const socStats = data?.socStats ?? {};
  const sparks = chartsReady ? (data?.sparklines ?? {}) : {};
  const ts = chartsReady ? (data?.timeseries ?? {}) : {};

  const sourceLabel = useMemo(() => {
    if (!data?.reachable) return null;
    if (data.source === "prometheus") return t("grafanaSourcePrometheus");
    if (data.source === "guardian-direct") return t("grafanaSourceDirect");
    return t("grafanaSourcePrometheus");
  }, [data, t]);

  const updatedAt = data?.ts
    ? new Date(data.ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <section className="glass-panel p-5 md:p-6 border border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-primary" />
            {t("grafanaMiniTitle")}
          </h2>
          <p className="text-xs text-white/45 mt-1">{t("grafanaMiniSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sourceLabel && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
              <Radio className="w-3 h-3" />
              {sourceLabel}
            </span>
          )}
          <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/40">
            tenant={tenant}
          </span>
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {([3600, 21600] as const).map((r) => {
              const active = rangeSec === r;
              const busy = active && loading;
              return (
                <button
                  key={r}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (r !== rangeSec) setRangeSec(r);
                  }}
                  className={`text-[10px] px-2.5 py-1 transition-colors inline-flex items-center gap-1 min-w-[2.5rem] justify-center ${
                    active
                      ? "bg-primary/20 text-primary"
                      : "bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10"
                  } disabled:opacity-70`}
                >
                  {busy ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    r === 3600 ? t("grafanaRange1h") : t("grafanaRange6h")
                  )}
                </button>
              );
            })}
          </div>
          {loading && (
            <span className="text-[10px] text-primary/80 animate-pulse">{t("grafanaRangeLoading")}</span>
          )}
          {!loading && updatedAt && (
            <span className="text-[10px] text-white/30">
              {t("grafanaUpdated")} {updatedAt}
            </span>
          )}
        </div>
      </div>

      {!data?.reachable && !loading && (
        <p className="text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          {data?.hint || t("grafanaMiniOffline")}
        </p>
      )}
      {data?.reachable && data?.source === "guardian-direct" && data?.hint && (
        <p className="text-xs text-cyan-200/80 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
          {data.hint}
        </p>
      )}

      {/* Core stats — Grafana row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
        {CORE_STATS.map(({ id, labelKey }) => (
          <MiniStat
            key={id}
            title={t(labelKey)}
            value={fmtStat(id, stats[id] ?? 0)}
            spark={sparks[id] ?? []}
            color={STAT_COLORS[id] ?? "#0891b2"}
          />
        ))}
      </div>

      {/* Time series — EPS + HTTP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <MiniTs
          title={t("grafanaChartEps")}
          data={ts.eps_ts ?? []}
          keys={[{ key: "eps", name: "EPS" }]}
          colors={["#0891b2"]}
        />
        <MiniTs
          title={t("grafanaChartHttp")}
          data={ts.http_status ?? []}
          keys={[
            { key: "4xx", name: "4xx" },
            { key: "5xx", name: "5xx" },
          ]}
          colors={["#16a34a", "#eab308"]}
        />
      </div>

      {/* Alert + ban rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <MiniTs
          title={t("grafanaChartAlertRate")}
          data={ts.alert_rate ?? []}
          keys={[{ key: "alerts_s", name: "alerts/s" }]}
          colors={["#d97706"]}
        />
        <MiniTs
          title={t("grafanaChartBanRate")}
          data={ts.ban_rate ?? []}
          keys={[
            { key: "success", name: "success" },
            { key: "fail", name: "fail" },
          ]}
          colors={["#16a34a", "#be123c"]}
        />
      </div>

      {/* Extra stats + parse rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {EXTRA_STATS.map(({ id, labelKey }) => (
          <MiniStat
            key={id}
            title={t(labelKey)}
            value={fmtStat(id, stats[id] ?? 0)}
            spark={sparks[id] ?? []}
            color={STAT_COLORS[id] ?? "#0891b2"}
          />
        ))}
        <MiniTs
          title={t("grafanaChartParseRate")}
          data={ts.parse_rate ?? []}
          keys={[{ key: "parse_s", name: "parse/s" }]}
          colors={["#be123c"]}
          height={100}
        />
      </div>

      {/* SOC row — threat / FP / ban pipeline / JA3 */}
      <div className="pt-2 border-t border-white/10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-3">
          {t("grafanaSocSection")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 mb-2">
          {SOC_STATS.map(({ id, labelKey }) => {
            const v = socStats[id] ?? 0;
            return (
              <MiniStat
                key={id}
                title={t(labelKey)}
                value={fmtStat(id, v)}
                spark={sparks[id] ?? []}
                color={STAT_COLORS[id] ?? "#0891b2"}
                alert={id === "bp_failed" && v > 0}
              />
            );
          })}
        </div>
        <MiniTs
          title={t("grafanaChartBanPipeline")}
          data={ts.ban_pipeline_rate ?? []}
          keys={[
            { key: "ipc", name: "ipc" },
            { key: "xdp", name: "xdp" },
            { key: "ipset", name: "ipset" },
            { key: "ja3", name: "ja3" },
          ]}
          colors={["#6366f1", "#a78bfa", "#16a34a", "#c084fc"]}
          height={120}
        />
      </div>

      {data?.table && data.table.length > 0 && (
        <details className="glass-panel p-3 border border-white/5 group">
          <summary className="text-[10px] font-semibold uppercase tracking-wider text-white/50 cursor-pointer list-none flex items-center justify-between">
            {t("grafanaMiniTable")}
            <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-white/40 text-left border-b border-white/10">
                  <th className="py-1.5 pr-4">Metric</th>
                  <th className="py-1.5">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.table.map((row) => (
                  <tr key={row.metric} className="border-b border-white/5">
                    <td className="py-1.5 pr-4 text-white/70">{row.metric}</td>
                    <td className="py-1.5 text-primary">{row.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <div className="flex justify-end pt-1">
        <a
          href={grafanaDashboardUrl(tenant)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/40 hover:text-primary inline-flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-primary/30 hover:bg-white/5"
        >
          {t("grafanaMiniLink")} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </section>
  );
}
