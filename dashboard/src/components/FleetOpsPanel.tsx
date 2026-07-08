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
    agents?: { id: string; online: boolean; age_sec: number }[];
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
    weekly?: string;
  };
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
          <span className="text-xs font-mono px-2 py-1 rounded-md border bg-white/5 border-white/10 text-white/50">
            {t("fleetOpsReport")}: {gate.online ?? 0}/{gate.total ?? 0}
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
      </div>
      {gate?.reason && gate.pass === false && (
        <p className="text-xs text-amber-200/90">{gate.reason}</p>
      )}
      {live?.agents && live.agents.length > 0 && (
        <p className="text-xs text-white/40 font-mono flex flex-wrap items-center gap-x-2 gap-y-1">
          <Server className="w-3.5 h-3.5 shrink-0" />
          {live.agents.map((a) => (
            <span key={a.id} className={a.online ? "text-emerald-300/90" : "text-white/35"}>
              {a.id}
              {a.online ? "" : ` (${Math.round(a.age_sec / 60)}m)`}
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
    </div>
  );
}
