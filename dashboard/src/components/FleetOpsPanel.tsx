"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCopy, Network, RefreshCw, Server } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type FleetOfflineStatus = {
  at?: string | null;
  gate?: {
    pass?: boolean;
    reason?: string | null;
    online?: number;
    total?: number;
    mode?: string | null;
    max_age_min?: number;
  };
  live?: {
    online?: number;
    total?: number;
    agents?: { id: string; online: boolean; age_sec: number; remote_shadow?: boolean }[];
    heartbeat_sec?: number;
  };
  multi?: {
    pass?: boolean;
    mode?: string | null;
    agent_count?: number;
    online_count?: number;
    agents?: string[];
    vm_fallback?: boolean;
  } | null;
  setup?: {
    gate?: string;
    refresh?: string;
    host_keepalive?: string;
    prune?: string;
    prune_demo?: string;
    prune_dry?: string;
    weekly?: string;
  };
  prune?: {
    pass?: boolean;
    at?: string | null;
    closed_last?: number;
    stale_hours?: number;
    pending_total?: number;
    pending_young?: number;
    pending_stale?: number;
    needs_prune?: boolean;
    items?: Array<{
      type: string;
      status: string;
      target: string;
      age_h: number;
      payload: string;
    }>;
  };
  report_stale?: boolean;
  remote_shadow?: {
    agent_id?: string;
    host?: string | null;
    hostname?: string | null;
    xdp_mode?: string | null;
    soak_proof_72h?: number | null;
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
            ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
            : "bg-white/5 border-white/10 text-white/40"
      }`}
    >
      {label}: {good ? "OK" : ok === false ? "WARN" : "—"}
    </span>
  );
}

export function FleetOpsPanel() {
  const { t } = useLanguage();
  const [data, setData] = useState<FleetOfflineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const refreshCmd = data?.setup?.refresh ?? "FLEET_MODE=laptop-simulated bash scripts/fleet_multi_node_e2e.sh";
  const pruneCmd = data?.setup?.prune ?? "bash scripts/fleet_prune_pending_commands.sh";
  const pruneDemoCmd =
    data?.setup?.prune_demo ?? "STALE_MINUTES=30 bash scripts/fleet_prune_pending_commands.sh";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fleet-offline-status", { cache: "no-store" });
      if (!res.ok) return;
      setData((await res.json()) as FleetOfflineStatus);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const gate = data?.gate;
  const live = data?.live;
  const liveOnline = live?.online ?? gate?.online ?? 0;
  const liveTotal = live?.total ?? gate?.total ?? 0;

  return (
    <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Network className="w-4 h-4 text-violet-300" />
        <h3 className="text-sm font-semibold text-violet-200">{t("fleetOpsTitle")}</h3>
        <Link
          href="/tests#test-fleet-offline-gate"
          className="text-xs text-violet-300/80 hover:text-violet-200 underline-offset-2 hover:underline"
        >
          {t("fleetOpsTestsLink")}
        </Link>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-white/10 text-white/50 hover:text-white/80 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {t("fleetOpsRefresh")}
        </button>
      </div>
      <p className="text-xs text-white/45">{t("fleetOpsDesc")}</p>
      <div className="flex flex-wrap gap-2">
        {chip(gate?.pass, t("fleetOpsGate"))}
        <span className="text-xs font-mono px-2 py-1 rounded-md border bg-white/5 border-white/10 text-white/70">
          {t("fleetOpsLive")}: {liveOnline}/{liveTotal}
        </span>
        {gate && (
          <span
            className={`text-xs font-mono px-2 py-1 rounded-md border bg-white/5 border-white/10 ${
              data?.report_stale ? "text-amber-200/90 border-amber-500/25" : "text-white/50"
            }`}
            title={data?.report_stale ? t("fleetOpsReportStale") : undefined}
          >
            {t("fleetOpsReport")}: {gate.online ?? 0}/{gate.total ?? 0}
            {data?.report_stale ? " · " + t("fleetOpsReportStaleShort") : ""}
          </span>
        )}
        {gate?.mode && (
          <span className="text-xs font-mono px-2 py-1 rounded-md border bg-white/5 border-white/10 text-white/50">
            {gate.mode}
          </span>
        )}
        {typeof gate?.max_age_min === "number" && (
          <span className="text-xs font-mono px-2 py-1 rounded-md border bg-white/5 border-white/10 text-white/40">
            max {gate.max_age_min}m
          </span>
        )}
        {data?.prune && (
          <span
            className={`text-xs font-mono px-2 py-1 rounded-md border ${
              (data.prune.pending_stale ?? 0) === 0
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-200"
            }`}
            title={t("fleetOpsPruneHint")}
          >
            {t("fleetOpsPrune")}: {data.prune.pending_total ?? 0}
            {(data.prune.pending_stale ?? 0) > 0
              ? ` (${data.prune.pending_stale} >${data.prune.stale_hours ?? 48}h)`
              : ""}
          </span>
        )}
        {data?.remote_shadow && (
          <span
            className="text-xs font-mono px-2 py-1 rounded-md border bg-sky-500/10 border-sky-500/30 text-sky-300"
            title={data.remote_shadow.host ?? undefined}
          >
            {t("fleetRemoteMonitor")}: {data.remote_shadow.agent_id}
          </span>
        )}
      </div>
      {gate?.reason && gate.pass === false && (
        <p className="text-xs text-amber-200/90">{gate.reason}</p>
      )}
      {live?.agents && live.agents.length > 0 && (
        <p className="text-xs text-white/40 font-mono flex flex-wrap items-center gap-x-2 gap-y-1">
          <Server className="w-3.5 h-3.5 shrink-0" />
          {live.agents.map((a) => (
            <span
              key={a.id}
              className={
                a.remote_shadow
                  ? "text-sky-300/90"
                  : a.online
                    ? "text-emerald-300/90"
                    : "text-white/35"
              }
            >
              {a.id}
              {a.remote_shadow ? ` (${t("fleetRemoteMonitor")})` : a.online ? "" : ` (${Math.round(a.age_sec / 60)}m)`}
            </span>
          ))}
        </p>
      )}
      {data?.prune?.items && data.prune.items.length > 0 && (
        <p className="text-xs text-white/40 font-mono space-y-0.5">
          {data.prune.items.map((item, i) => (
            <span key={`${item.type}-${item.target}-${i}`} className="block">
              {item.type} → {item.target} ({item.status}, {item.age_h}h)
            </span>
          ))}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-[11px] text-white/50 font-mono bg-black/30 px-2 py-1 rounded border border-white/10">
          {refreshCmd}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(refreshCmd);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* ignore */
            }
          }}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-200 hover:bg-violet-500/25"
        >
          <ClipboardCopy className="w-3.5 h-3.5" />
          {copied ? t("fleetOpsCopied") : t("fleetOpsCopyRefresh")}
        </button>
      </div>
      {data?.prune && (
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-[11px] text-white/50 font-mono bg-black/30 px-2 py-1 rounded border border-white/10">
            {pruneCmd}
          </code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(pruneCmd);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* ignore */
              }
            }}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-200 hover:bg-violet-500/25"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            {copied ? t("fleetOpsCopied") : t("fleetOpsCopyPrune")}
          </button>
          {(data.prune.pending_stale ?? 0) > 0 && (
            <span className="text-xs text-amber-200/90">{t("fleetOpsPruneStale")}</span>
          )}
        </div>
      )}
      {data?.prune && (data.prune.pending_young ?? data.prune.pending_total ?? 0) > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-[11px] text-white/45 font-mono bg-black/20 px-2 py-1 rounded border border-white/10">
            {pruneDemoCmd}
          </code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(pruneDemoCmd);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* ignore */
              }
            }}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/50 hover:text-white/80"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            {copied ? t("fleetOpsCopied") : t("fleetOpsCopyPruneDemo")}
          </button>
          <span className="text-xs text-white/35">{t("fleetOpsPruneDemoHint")}</span>
        </div>
      )}
    </div>
  );
}
