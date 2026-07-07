"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useLanguage } from "./LanguageProvider";

type FpData = {
  available: boolean;
  benign?: { fp_rate_pct: number; lines: number; alerts: number };
  attack?: { alerts: number };
  target_fp_pct?: number;
  fp_trust?: {
    enabled?: boolean;
    trusted_ips?: number;
    partial_ips?: number;
    suppressed_total?: number;
    tenant_clean_ema?: number;
    trust_days?: number;
    min_samples?: number;
  };
};

export function FpMetricsPanel() {
  const { t } = useLanguage();
  const [data, setData] = useState<FpData | null>(null);

  useEffect(() => {
    axios
      .get("/api/fp-metrics")
      .then((r) => setData(r.data))
      .catch(() => setData({ available: false }));
    const id = setInterval(() => {
      axios
        .get("/api/fp-metrics")
        .then((r) => setData(r.data))
        .catch(() => setData({ available: false }));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  if (!data?.available || data.benign == null) return null;

  const fp = data.benign.fp_rate_pct;
  const ok = fp < (data.target_fp_pct ?? 5);
  const trust = data.fp_trust;
  const ema = trust?.tenant_clean_ema ?? 0;
  const minSamples = trust?.min_samples ?? 100;
  const trusted = trust?.trusted_ips ?? 0;
  const partial = trust?.partial_ips ?? 0;
  const warmupPct = trust?.enabled
    ? Math.min(100, Math.round(((trusted + partial * 0.5) / Math.max(1, minSamples)) * 100))
    : 0;
  const warmed = trusted >= Math.min(10, minSamples / 10);

  return (
    <div className="glass-panel p-4 border-l-4 border-l-emerald-500/50" id="fp-adaptive">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
        {t("fpPanelTitle")}
      </h3>
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className={`text-3xl font-bold ${ok ? "text-success" : "text-warning"}`}>
            {fp.toFixed(2)}%
          </p>
          <p className="text-xs text-white/45">{t("fpPanelRate")}</p>
        </div>
        <div className="text-sm text-white/60">
          <p>
            {t("fpPanelBenign")}: {data.benign.alerts}/{data.benign.lines}
          </p>
          {data.attack && (
            <p>
              {t("fpPanelAttack")}: {data.attack.alerts} alerts
            </p>
          )}
        </div>
        {trust?.enabled ? (
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-[10px] text-white/40 mb-1">
              <span>{t("fpPanelEma")}</span>
              <span className="font-mono">{(ema * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-1">
              <div
                className={`h-full transition-all ${warmed ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${warmupPct}%` }}
              />
            </div>
            <p className="text-[10px] text-white/35">
              {trusted} {t("fpPanelTrusted")} · {partial} partial · {trust.suppressed_total ?? 0}{" "}
              {t("fpPanelSuppressed")}
            </p>
            {!warmed && (
              <p className="text-[10px] text-amber-300/90 mt-1">{t("fpPanelWarmup")}</p>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-amber-300/90 max-w-md">{t("fpPanelColdStart")}</p>
        )}
      </div>
    </div>
  );
}
