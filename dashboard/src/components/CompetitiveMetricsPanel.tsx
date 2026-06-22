"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "axios";
import { useLanguage } from "./LanguageProvider";

type BenchPayload = {
  available: boolean;
  bench?: {
    log_guardian?: { eps: number; elapsed_sec: number; maxrss_kb: number };
  };
  ban?: {
    ban_latency_ms: number | null;
    ipset_confirmed?: boolean;
    target_ms?: number;
  };
  fp?: {
    benign?: { fp_rate_pct: number; lines: number; alerts: number };
    attack?: { alerts: number };
    target_fp_pct?: number;
  };
  live?: {
    ipc?: string;
    ban_pipeline?: { ipc: number; xdp: number; ipset: number; failed: number };
    metrics?: { eps?: number; reachable?: boolean };
    daemon?: {
      xdp_active?: boolean;
      execve_probe?: boolean;
      lineage_probe?: boolean;
    } | null;
    l7_http?: {
      ebpf_hits?: number;
      probe_active?: boolean | string;
      get?: number;
      post?: number;
    };
  };
  falco?: { count: number };
  modsec?: {
    eps?: number;
    latency_us_per_line?: number;
    guardian_latency_us_per_line?: number;
    eps_ratio?: number | null;
  };
};

export function CompetitiveMetricsPanel() {
  const { t } = useLanguage();
  const [data, setData] = useState<BenchPayload | null>(null);

  useEffect(() => {
    axios
      .get("/api/bench-metrics")
      .then((r) => setData(r.data))
      .catch(() => setData({ available: false }));
  }, []);

  if (!data?.available) {
    return (
      <div className="glass-panel p-4 text-sm text-white/45">
        {t("benchHint")}
      </div>
    );
  }

  const eps = data.bench?.log_guardian?.eps ?? 0;
  const rssMb = ((data.bench?.log_guardian?.maxrss_kb ?? 0) / 1024).toFixed(1);
  const banMs = data.ban?.ban_latency_ms;
  const fp = data.fp?.benign?.fp_rate_pct;
  const fpOk = fp != null && fp < (data.fp?.target_fp_pct ?? 5);
  const banOk = banMs != null && banMs < (data.ban?.target_ms ?? 50);
  const bp = data.live?.ban_pipeline;
  const liveEps = data.live?.metrics?.eps;
  const l7 = data.live?.l7_http;
  const l7Active =
    l7?.probe_active === true || l7?.probe_active === "true";
  const mod = data.modsec;

  const chartData = [
    { name: t("benchEps"), value: eps, fill: "#0891b2" },
    ...(liveEps != null && liveEps > 0
      ? [{ name: t("benchLiveEps"), value: Math.round(liveEps), fill: "#6366f1" }]
      : []),
    ...(banMs != null
      ? [{ name: t("benchBanMs"), value: banMs, fill: banOk ? "#16a34a" : "#d97706" }]
      : []),
    ...(fp != null
      ? [{ name: t("benchFpPct"), value: fp, fill: fpOk ? "#16a34a" : "#d97706" }]
      : []),
    ...(bp
      ? [
          { name: "IPC", value: bp.ipc, fill: "#0891b2" },
          { name: "XDP", value: bp.xdp, fill: "#16a34a" },
          { name: "ipset", value: bp.ipset, fill: "#d97706" },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="glass-panel p-4 lg:col-span-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
          {t("benchTitle")}
        </h3>
        <ResponsiveContainer width="100%" minWidth={0} height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "#0f1419",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-panel p-4 flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
          {t("benchKpi")}
        </h3>
        <div>
          <p className="text-2xl font-bold text-primary">{eps.toLocaleString()}</p>
          <p className="text-xs text-white/45">{t("benchEps")} · RSS {rssMb} MB</p>
        </div>
        {banMs != null && (
          <div>
            <p className={`text-2xl font-bold ${banOk ? "text-success" : "text-warning"}`}>
              {banMs.toFixed(1)} ms
            </p>
            <p className="text-xs text-white/45">{t("benchBanMs")}</p>
          </div>
        )}
        {fp != null && (
          <div>
            <p className={`text-2xl font-bold ${fpOk ? "text-success" : "text-warning"}`}>
              {fp.toFixed(2)}%
            </p>
            <p className="text-xs text-white/45">{t("fpPanelRate")}</p>
          </div>
        )}
        {data.falco?.count != null && (
          <div>
            <p className="text-2xl font-bold text-white/90">{data.falco.count}</p>
            <p className="text-xs text-white/45">{t("benchFalcoRules")}</p>
          </div>
        )}
        {mod?.guardian_latency_us_per_line != null && mod.guardian_latency_us_per_line > 0 && (
          <div>
            <p className="text-sm font-semibold text-white/80">
              {mod.guardian_latency_us_per_line} µs/{t("benchPerLine")}
            </p>
            <p className="text-xs text-white/45">
              CRS replay: {mod.latency_us_per_line ?? "—"} µs · EPS×
              {mod.eps_ratio ?? "—"}
            </p>
          </div>
        )}
        {l7 && (
          <div>
            <p
              className={`text-sm font-semibold ${l7Active ? "text-success" : "text-white/50"}`}
            >
              {t("benchL7Probe")}: {l7Active ? "ON" : "OFF"}
            </p>
            <p className="text-xs text-white/45">
              {t("benchL7Hits")}: {l7.ebpf_hits ?? 0} · GET {l7.get ?? 0} POST {l7.post ?? 0}
            </p>
          </div>
        )}
        {data.live?.ipc && (
          <p className="text-xs text-white/40 mt-auto">
            IPC: {data.live.ipc}
            {data.live.daemon?.xdp_active ? " · XDP" : ""}
            {data.live.daemon?.lineage_probe ? " · lineage" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
