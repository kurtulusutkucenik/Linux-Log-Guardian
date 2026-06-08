"use client";

import { useCallback, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ExternalLink } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

type Snap = {
  t: string;
  eps: number;
  lines: number;
  alerts: number;
  bans: number;
  uniqueIps: number;
  parseErr: number;
  xdp: number;
};

const MAX_POINTS = 36;

function pushPoint(prev: Snap[], raw: Record<string, unknown>): Snap[] {
  const d = new Date();
  const t = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const next: Snap = {
    t,
    eps: Number(raw.eps) || 0,
    lines: Number(raw.lines_total) || 0,
    alerts: Number(raw.alerts_total) || 0,
    bans: Number(raw.bans_success) || 0,
    uniqueIps: Number(raw.unique_ips) || 0,
    parseErr: Number(raw.parse_errors) || 0,
    xdp: Number(raw.xdp_active) || 0,
  };
  const out = [...prev, next];
  return out.length > MAX_POINTS ? out.slice(-MAX_POINTS) : out;
}

export function OpsMetricsCharts() {
  const { t } = useLanguage();
  const [series, setSeries] = useState<Snap[]>([]);
  const [live, setLive] = useState<Record<string, unknown> | null>(null);
  const [reachable, setReachable] = useState(true);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/metrics/live");
      const data = await res.json();
      setLive(data);
      setReachable(Boolean(data.reachable));
      if (data.reachable) setSeries((p) => pushPoint(p, data));
    } catch {
      setReachable(false);
    }
  }, []);

  useVisibleInterval(poll, 10000, true);

  const last = series[series.length - 1];
  const barNow = last
    ? [
        { name: "EPS", v: last.eps, fill: "#0891b2" },
        { name: "Alerts", v: last.alerts, fill: "#d97706" },
        { name: "Bans", v: last.bans, fill: "#16a34a" },
        { name: "IPs", v: last.uniqueIps, fill: "#6366f1" },
        { name: "ParseErr", v: last.parseErr, fill: "#be123c" },
      ]
    : [];

  const grafanaHref =
    process.env.NEXT_PUBLIC_GRAFANA_EMBED_URL?.split("/d/")[0] ||
    "http://127.0.0.1:3002";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Activity className="w-5 h-5 text-primary" />
          {t("opsMetricsTitle")}
        </h2>
        <a
          href={`${grafanaHref}/d/log-guardian-01/linux-log-guardian?var-tenant=default`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Grafana {t("opsMetricsFull")} <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {!reachable && (
        <p className="text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          {t("opsMetricsOffline")} — :9091/metrics
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "EPS", value: last?.eps.toFixed(1) ?? "—", color: "text-primary" },
          { label: t("globalAlerts"), value: last?.alerts.toLocaleString() ?? "—", color: "text-warning" },
          { label: "Lines", value: last?.lines.toLocaleString() ?? "—", color: "text-white" },
          { label: "Bans OK", value: last?.bans.toLocaleString() ?? "—", color: "text-success" },
          { label: "Unique IP", value: last?.uniqueIps.toLocaleString() ?? "—", color: "text-[#a78bfa]" },
          { label: "XDP", value: last?.xdp ? "ON" : "OFF", color: last?.xdp ? "text-success" : "text-white/40" },
        ].map((k) => (
          <div key={k.label} className="glass-panel p-3">
            <p className="text-[10px] uppercase tracking-wider text-white/40">{k.label}</p>
            <p className={`text-xl font-bold font-mono ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
            EPS {t("opsMetricsTrend")}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="epsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={40} />
              <Tooltip contentStyle={{ background: "#0f1419", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="eps" stroke="#0891b2" fill="url(#epsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
            {t("opsMetricsAlertsBans")}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={40} />
              <Tooltip contentStyle={{ background: "#0f1419", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="alerts" stroke="#d97706" dot={false} strokeWidth={2} name="Alerts" />
              <Line type="monotone" dataKey="bans" stroke="#16a34a" dot={false} strokeWidth={2} name="Bans" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
            {t("opsMetricsThroughput")}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 9 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={48} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#0f1419", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="lines" stroke="#6366f1" fill="#6366f133" strokeWidth={2} name="Lines" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
            {t("opsMetricsSnapshot")}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barNow}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={40} />
              <Tooltip contentStyle={{ background: "#0f1419", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                {barNow.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {live && (
        <p className="text-[10px] text-white/30 font-mono text-right">
          prometheus · {String(live.ts ?? "")}
        </p>
      )}
    </div>
  );
}
