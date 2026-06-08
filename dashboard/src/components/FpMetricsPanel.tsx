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
  }, []);

  if (!data?.available || data.benign == null) return null;

  const fp = data.benign.fp_rate_pct;
  const ok = fp < (data.target_fp_pct ?? 5);

  return (
    <div className="glass-panel p-4 border-l-4 border-l-emerald-500/50">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
        {t("fpPanelTitle")}
      </h3>
      <div className="flex items-end gap-4">
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
          {data.fp_trust?.enabled && (
            <div className="text-white/45 text-xs mt-1">
              <p>
                FP learn: {data.fp_trust.trusted_ips ?? 0} trusted /{" "}
                {data.fp_trust.suppressed_total ?? 0} suppressed
              </p>
              {(data.fp_trust.trusted_ips ?? 0) === 0 && (
                <p className="text-warning/80 mt-1">{t("fpPanelWarmup")}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
