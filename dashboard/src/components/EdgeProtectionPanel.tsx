"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Globe, RefreshCw, Shield } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type EdgeStatus = {
  data_mode?: "live" | "proof" | "unknown";
  gate_pass?: boolean;
  gate_at?: string | null;
  ipc?: string;
  xdp_mode?: string;
  xdp_active?: boolean;
  default_nic?: string;
  wifi_nic?: boolean;
  nginx_log_format?: boolean;
  nginx_snippets?: boolean;
  nginx_live?: boolean;
  whitelist_count?: number;
  ipset_entries?: number;
  bans_active?: number;
  threat_intel_legacy_rows?: number;
  threat_intel_summary_rows?: number;
};

function statClass(ok: boolean | undefined): string {
  if (ok === undefined) return "text-white/50";
  return ok ? "text-emerald-300" : "text-amber-300";
}

export function EdgeProtectionPanel() {
  const { t } = useLanguage();
  const [data, setData] = useState<EdgeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/edge-status", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as EdgeStatus);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) {
    return <div className="glass-panel h-28 animate-pulse" />;
  }

  const isLive = data?.data_mode === "live";
  const nginxOk = Boolean(data?.nginx_log_format || data?.nginx_snippets);
  const xdpLabel =
    data?.xdp_mode === "kernel-xdp"
      ? t("edgeXdpKernel")
      : data?.xdp_mode === "ipset-fallback"
        ? t("edgeXdpIpset")
        : (data?.xdp_mode ?? "—");

  return (
    <div className="glass-panel p-5 border border-orange-500/15" id="edge-protection">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-orange-300">
          <Shield className="w-5 h-5" />
          {t("edgeProtectionTitle")}
        </h2>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
              {t("attackMapLive")}
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 bg-amber-500/10">
              {t("edgeProofMode")}
            </span>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="p-1.5 rounded border border-white/10 text-white/50 hover:text-white hover:border-white/25"
            aria-label="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-xs text-white/45 mb-4">{t("edgeProtectionSubtitle")}</p>

      {data?.gate_pass && (
        <p className="text-xs text-emerald-300/90 mb-3">
          {t("edgeGateOk")} · {data.default_nic}
          {data.wifi_nic ? ` (${t("edgeWifiHint")})` : ""}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">{t("edgeStatIpc")}</p>
          <p className={`text-sm font-semibold ${statClass(data?.ipc === "ok")}`}>
            {data?.ipc ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">{t("edgeStatXdp")}</p>
          <p className={`text-sm font-semibold ${statClass(data?.ipc === "ok")}`}>{xdpLabel}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">{t("edgeStatNginx")}</p>
          <p className={`text-sm font-semibold ${statClass(nginxOk)}`}>
            {nginxOk ? "OK" : "—"}
            {data?.nginx_live ? " · :80" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">{t("edgeStatIpset")}</p>
          <p className="text-sm font-semibold text-white/80">
            {data?.ipset_entries ?? 0}
            <span className="text-white/35 text-xs ml-1">
              WL {data?.whitelist_count ?? 0}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-white/35">
        <span className="inline-flex items-center gap-1">
          <Globe className="w-3 h-3" />
          {t("edgeThreatSummary")}: {data?.threat_intel_summary_rows ?? 0}
          {(data?.threat_intel_legacy_rows ?? 0) > 0 && (
            <span className="text-amber-400/80">
              · legacy {data?.threat_intel_legacy_rows}
            </span>
          )}
        </span>
        <span>
          {t("edgeBansActive")}: {data?.bans_active ?? 0}
        </span>
      </div>

      <p className="text-[10px] text-white/30 mt-3">
        <Link href="/tests" className="text-orange-400/70 hover:text-orange-300 hover:underline">
          {t("testsViewAll")}
        </Link>
        {" · "}
        <Link href="/tests?q=edge" className="text-orange-400/70 hover:text-orange-300 hover:underline">
          {t("edgeGateLink")}
        </Link>
      </p>
    </div>
  );
}
