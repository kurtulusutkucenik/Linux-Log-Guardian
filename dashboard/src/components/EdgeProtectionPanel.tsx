"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Globe, RefreshCw, Shield } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { useBannedIps } from "@/context/BannedIpsContext";
import { useSocKindFilter, type SocKindFilter } from "./SocKindFilterContext";

type EdgeStatus = {
  data_mode?: "live" | "proof" | "unknown";
  gate_pass?: boolean;
  gate_at?: string | null;
  gate_fail_reason?: string | null;
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
  bans_active_db?: number;
  bans_source?: string;
  threat_intel_legacy_rows?: number;
  threat_intel_summary_rows?: number;
  intel_ban_db?: {
    pass?: boolean;
    ban_events_total?: number;
    intel_legacy_rows?: number;
    intel_summary_rows?: number;
    stale_rows?: number;
    ttl_days?: number;
    max_total_rows?: number;
    at?: string | null;
    data_source?: "live" | "report";
  };
  edge_checklist?: {
    pass?: boolean;
    at?: string | null;
    pass_n?: number;
    warn_n?: number;
    fail_n?: number;
    total?: number;
    fail_ids?: string[];
    warn_ids?: string[];
  } | null;
  enterprise_e9?: {
    pass?: boolean;
    at?: string | null;
    competitive_proof?: string | null;
    enterprise_escalation?: boolean;
    edge_checklist?: boolean;
    morning_operator?: boolean;
    docs_consistency?: boolean;
    eps_smoke?: boolean;
    eps_smoke_peak?: number | null;
  } | null;
  relay_lan?: {
    pass?: boolean;
    fail_count?: number;
    bridge_up?: boolean;
    docker0_ip?: string | null;
    at?: string | null;
    check_cmd?: string;
  } | null;
  eps_smoke?: {
    pass?: boolean;
    peak_eps?: number | null;
    lines_delta?: number | null;
    at?: string | null;
    run_cmd?: string;
  } | null;
};

function statClass(ok: boolean | undefined): string {
  if (ok === undefined) return "text-white/50";
  return ok ? "text-emerald-300" : "text-amber-300";
}

export function EdgeProtectionPanel() {
  const { t } = useLanguage();
  const { totalCount: navBanCount, preview: banPreview } = useBannedIps();
  const { kindFilter, setKindFilter } = useSocKindFilter();
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

  const liveBanCount =
    !banPreview && navBanCount > 0
      ? navBanCount
      : (data?.bans_active ?? 0);
  const ipsetDisplay =
    !banPreview && navBanCount > 0 ? navBanCount : (data?.ipset_entries ?? 0);

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

      {!data?.gate_pass && data?.gate_fail_reason && (
        <p className="text-xs text-amber-300/90 mb-3">
          {t("edgeGateFail")}: {data.gate_fail_reason}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="text-[10px] uppercase tracking-wide text-white/35 mr-1">
          {t("edgeSocLinks")}:
        </span>
        {(
          [
            ["all", t("socFilterAll")],
            ["incident", t("socKindIncident")],
            ["ban", t("edgeSocBan")],
            ["ack", t("edgeSocAck")],
            ["waf", t("socKindWaf")],
            ["lineage", t("edgeSocLineage")],
          ] as const
        ).map(([filter, label]) => (
          <button
            key={filter}
            type="button"
            onClick={() => setKindFilter(filter as SocKindFilter, { scroll: true })}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              kindFilter === filter
                ? "border-orange-400/50 bg-orange-500/15 text-orange-100"
                : "border-orange-500/25 text-orange-200/80 hover:text-orange-100 hover:border-orange-400/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
            {ipsetDisplay}
            <span className="text-white/35 text-xs ml-1">
              WL {data?.whitelist_count ?? 0}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">{t("edgeStatRelayLan")}</p>
          <p className={`text-sm font-semibold ${statClass(data?.relay_lan?.pass)}`}>
            {data?.relay_lan?.pass ? "OK" : data?.relay_lan?.pass === false ? "FAIL" : "—"}
          </p>
        </div>
        <a
          href="#live-ops-metrics"
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 hover:border-cyan-500/30 transition-colors"
        >
          <p className="text-[10px] uppercase tracking-wide text-white/40">{t("edgeStatEpsSmoke")}</p>
          <p className={`text-sm font-semibold ${statClass(data?.eps_smoke?.pass)}`}>
            {data?.eps_smoke?.pass
              ? (data.eps_smoke.peak_eps ?? 0) > 0
                ? data.eps_smoke.peak_eps?.toFixed(1)
                : "OK"
              : data?.eps_smoke
                ? "—"
                : "—"}
          </p>
        </a>
      </div>

      {(data?.edge_checklist || data?.enterprise_e9) && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 space-y-2">
          {data.edge_checklist && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-white/50">{t("edgeChecklistTitle")}</span>
              <span
                className={
                  data.edge_checklist.pass
                    ? "text-emerald-300 font-medium"
                    : "text-amber-300 font-medium"
                }
              >
                {data.edge_checklist.pass_n}/{data.edge_checklist.total}
                {(data.edge_checklist.warn_n ?? 0) > 0 &&
                  ` · ${data.edge_checklist.warn_n} ${t("edgeChecklistWarn")}`}
              </span>
            </div>
          )}
          {data.enterprise_e9 && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-white/50">{t("edgeE9Title")}</span>
              <span
                className={
                  data.enterprise_e9.pass
                    ? "text-emerald-300 font-medium"
                    : "text-amber-300 font-medium"
                }
              >
                {data.enterprise_e9.pass ? "OK" : "—"}
                {data.enterprise_e9.competitive_proof
                  ? ` · ${data.enterprise_e9.competitive_proof}`
                  : ""}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-white/35">
        <span className="inline-flex items-center gap-1">
          <Globe className="w-3 h-3" />
          {t("edgeThreatSummary")}: {data?.intel_ban_db?.intel_summary_rows ?? data?.threat_intel_summary_rows ?? 0}
          {(data?.intel_ban_db?.intel_legacy_rows ?? data?.threat_intel_legacy_rows ?? 0) > 0 && (
            <span className="text-amber-400/80">
              · legacy {data?.intel_ban_db?.intel_legacy_rows ?? data?.threat_intel_legacy_rows}
            </span>
          )}
        </span>
        <span
          className={
            (data?.intel_ban_db?.pass === false ||
              (data?.intel_ban_db?.ban_events_total ?? 0) >
                (data?.intel_ban_db?.max_total_rows ?? 50000))
              ? "text-amber-400/90"
              : ""
          }
          title={t("edgeBanDbRunbook")}
        >
          {t("edgeBanDbRows")}: {data?.intel_ban_db?.ban_events_total ?? "—"}
          {data?.intel_ban_db?.data_source === "live" ? " · live" : ""}
        </span>
        <span
          className={
            (data?.intel_ban_db?.stale_rows ?? 0) >= 500
              ? "text-amber-400/90"
              : ""
          }
          title={t("edgeBanDbStaleHint")}
        >
          {t("edgeBanDbStale")}: {data?.intel_ban_db?.stale_rows ?? "—"}
        </span>
        <span>
          {t("edgeBansActive")}:{" "}
          {liveBanCount > 0 ? (
            <Link
              href="/bans"
              className="text-orange-300/90 hover:text-orange-200 hover:underline"
              title={
                (data?.bans_active_db ?? 0) > liveBanCount
                  ? `${t("edgeBansDbHint")} (${data?.bans_active_db})`
                  : undefined
              }
            >
              {liveBanCount}
            </Link>
          ) : (
            liveBanCount
          )}
        </span>
      </div>

      <p className="text-[10px] text-white/30 mt-3">
        <Link href="/tests" className="text-orange-400/70 hover:text-orange-300 hover:underline">
          {t("testsViewAll")}
        </Link>
        {" · "}
        <Link href="/tests?q=edge#test-edge-protection-gate" className="text-orange-400/70 hover:text-orange-300 hover:underline">
          {t("edgeGateLink")}
        </Link>
        {" · "}
        <a
          href="https://github.com/kurtulusutkucenik/Linux-Log-Guardian/blob/main/docs/ENTERPRISE_SUPPORT.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-400/70 hover:text-orange-300 hover:underline"
        >
          {t("edgeE9Link")}
        </a>
        {" · "}
        <Link href="/tests?q=intel#test-intel-ban-db" className="text-orange-400/70 hover:text-orange-300 hover:underline">
          {t("edgeBanDbLink")}
        </Link>
      </p>
    </div>
  );
}
