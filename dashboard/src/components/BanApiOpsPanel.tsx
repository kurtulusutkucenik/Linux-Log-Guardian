"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCopy, KeyRound, Network, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type BanApiStatus = {
  relay?: { ok?: boolean; url?: string };
  host?: { ok?: boolean; url?: string };
  docker?: { ok?: boolean };
  metrics?: { ok?: boolean; live?: boolean; url?: string };
  host_api_bridge?: { ok?: boolean; note?: string };
  dashboard_ban_pass?: boolean;
  ban_path?: string | null;
  mtls_strict?: boolean;
  enterprise_gate?: {
    pass?: boolean;
    mode?: string;
    mutation_ok?: boolean;
  };
  setup?: { enable?: string; sync?: string; gate?: string };
  soar?: {
    enabled?: boolean;
    url?: string;
    caddy_mtls_verify?: boolean;
    caddy_skipped?: boolean;
    mtls_lab?: boolean;
  };
  mtls_expiry?: {
    pass?: boolean;
    min_days_left?: number | null;
    warn_days?: number;
    certs?: Array<{ id?: string; days_left?: number; ok?: boolean }>;
    check_cmd?: string;
  } | null;
};

function chip(ok: boolean | undefined, label: string) {
  const good = ok === true;
  return (
    <span
      className={`text-xs font-mono px-2 py-1 rounded-md border ${
        good
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : ok === false
            ? "bg-red-500/10 border-red-500/30 text-red-300"
            : "bg-white/5 border-white/10 text-white/40"
      }`}
    >
      {label}: {good ? "OK" : ok === false ? "FAIL" : "—"}
    </span>
  );
}

export function BanApiOpsPanel() {
  const { t } = useLanguage();
  const [data, setData] = useState<BanApiStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const enableCmd = data?.setup?.enable ?? "sudo bash scripts/enable_enterprise_soar_api.sh";
  const soarCurl =
    "curl -k --cert deploy/mtls/client.crt --key deploy/mtls/client.key -X POST 'https://localhost:9443/api/v1/ban?ip=203.0.113.55&reason=soar-test'";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ban-api-status", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as BanApiStatus;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const soar = data?.soar;
  const soarLabel = soar?.enabled
    ? soar.caddy_mtls_verify
      ? t("banApiSoarOn")
      : t("banApiSoarEnabledNoVerify")
    : t("banApiSoarOff");

  const copyEnable = async () => {
    try {
      await navigator.clipboard.writeText(enableCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <KeyRound className="w-4 h-4 text-cyan-300" />
        <h3 className="text-sm font-semibold text-cyan-200">{t("banApiOpsTitle")}</h3>
        <Link
          href="/tests#test-enterprise-soar-gate"
          className="text-xs text-cyan-300/80 hover:text-cyan-200 underline-offset-2 hover:underline"
        >
          {t("banApiOpsTestsLink")}
        </Link>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-white/10 text-white/50 hover:text-white/80 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {t("banApiRefresh")}
        </button>
      </div>
      <p className="text-xs text-white/45">{t("banApiOpsDesc")}</p>
      <div className="flex flex-wrap gap-2">
        {chip(data?.host?.ok, t("banApiHost"))}
        {chip(data?.host_api_bridge?.ok, t("banApiBridge"))}
        {chip(data?.relay?.ok, t("banApiRelay"))}
        {chip(data?.metrics?.ok, t("banApiMetrics"))}
        {chip(data?.docker?.ok, t("banApiDocker"))}
        <span
          className={`text-xs font-mono px-2 py-1 rounded-md border ${
            soar?.enabled
              ? "bg-violet-500/10 border-violet-500/30 text-violet-200"
              : "bg-white/5 border-white/10 text-white/40"
          }`}
        >
          SOAR :9443 — {soarLabel}
        </span>
        <span
          className={`text-xs font-mono px-2 py-1 rounded-md border ${
            data?.enterprise_gate?.pass
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
              : data?.enterprise_gate?.pass === false
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-white/5 border-white/10 text-white/40"
          }`}
        >
          gate: {data?.enterprise_gate?.mode ?? "—"}
          {data?.enterprise_gate?.pass === true ? " OK" : data?.enterprise_gate?.pass === false ? " FAIL" : ""}
        </span>
        <span
          className={`text-xs font-mono px-2 py-1 rounded-md border ${
            data?.mtls_strict
              ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
              : "bg-white/5 border-white/10 text-white/40"
          }`}
        >
          strict: {data?.mtls_strict ? "on" : "off"}
        </span>
        {data?.mtls_expiry && (
          <span
            className={`text-xs font-mono px-2 py-1 rounded-md border ${
              data.mtls_expiry.pass
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-200"
            }`}
            title={data.mtls_expiry.certs
              ?.map((c) => `${c.id ?? "?"}: ${c.days_left ?? "?"}d`)
              .join(" · ")}
          >
            {t("banApiMtlsExpiry")}: {data.mtls_expiry.min_days_left ?? "—"}d
            {data.mtls_expiry.pass ? " OK" : " WARN"}
          </span>
        )}
      </div>
      {!soar?.enabled && (
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-[11px] text-white/50 font-mono bg-black/30 px-2 py-1 rounded border border-white/10">
            {enableCmd}
          </code>
          <button
            type="button"
            onClick={() => void copyEnable()}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-200 hover:bg-violet-500/25"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            {copied ? t("banApiCopied") : t("banApiCopyEnable")}
          </button>
        </div>
      )}
      {soar?.enabled && (
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-[10px] text-white/45 font-mono bg-black/30 px-2 py-1 rounded border border-white/10 break-all">
            {soarCurl}
          </code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(soarCurl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* ignore */
              }
            }}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-200 hover:bg-violet-500/25"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            {copied ? t("banApiCopied") : t("banApiCopySoarCurl")}
          </button>
        </div>
      )}
      <div className="grid gap-1 text-xs text-white/40 font-mono">
        <span className="flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 shrink-0" />
          {data?.relay?.url ?? "http://ban-api-relay:18090"}
          {data?.host_api_bridge?.note ? ` · ${data.host_api_bridge.note}` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 shrink-0" />
          {data?.metrics?.url ?? "http://metrics-relay:19091/metrics"}
          {data?.metrics?.live ? " · live" : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          {soar?.url ?? "https://localhost:9443"}
          {data?.ban_path ? ` · ${data.ban_path}` : ""}
        </span>
      </div>
      {data?.dashboard_ban_pass && (
        <p className="text-xs text-emerald-300/90 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          {t("banApiSmokePass")}
        </p>
      )}
    </div>
  );
}
