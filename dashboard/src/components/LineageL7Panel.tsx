"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Blocks, GitBranch, Layers, RefreshCw } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type LineageL7 = {
  data_mode?: "live" | "preview";
  ipc?: string;
  xdp_mode?: string;
  xdp_active?: boolean;
  wasm?: {
    mode?: string;
    pass?: boolean;
    plugins_native?: number;
    alerts_on_sqli?: number;
    plugin_bytes?: number;
  };
  l7?: {
    probe_active?: boolean;
    probe?: string;
    inspected?: number;
    blocked?: number;
    ebpf_hits?: number;
    http_hits?: number;
  };
  lineage?: {
    events?: number;
    connects?: number;
    execve_probe?: boolean;
  };
};

export function LineageL7Panel() {
  const { t } = useLanguage();
  const [data, setData] = useState<LineageL7 | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/lineage-l7", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as LineageL7);
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

  const wasmOk = data?.wasm?.pass && data?.wasm?.mode === "native";
  const l7On = data?.l7?.probe_active;
  const isLive = data?.data_mode === "live";
  const execLive = Boolean(data?.lineage?.execve_probe);

  return (
    <div className="glass-panel p-5 border border-cyan-500/15" id="lineage-l7">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-cyan-300">
          <Layers className="w-5 h-5" />
          {t("lineageL7Title")}
        </h2>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
              {t("attackMapLive")}
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 bg-amber-500/10">
              {t("lineageL7Preview")}
            </span>
          )}
          {execLive && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-violet-500/30 text-violet-300 bg-violet-500/10">
              RCE probe
            </span>
          )}
          <Link href="/attack-tree" className="text-xs text-cyan-400/70 hover:text-cyan-300 hover:underline">
            {t("socTimelineAttackTree")} →
          </Link>
          <Link href="/plugins" className="text-xs text-violet-400/70 hover:text-violet-300 hover:underline">
            Wasm →
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs px-2 py-1 rounded border border-white/10 text-white/60 hover:text-white"
          >
            <RefreshCw className="w-3 h-3 inline" />
          </button>
        </div>
      </div>

      <p className="text-xs text-white/45 mb-4">{t("lineageL7Subtitle")}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/35 mb-1 flex items-center gap-1">
            <Blocks className="w-3 h-3" />
            Wasm
          </p>
          <p className={`text-lg font-bold ${wasmOk ? "text-emerald-400" : "text-amber-400"}`}>
            {data?.wasm?.mode ?? "—"}
          </p>
          <p className="text-[10px] text-white/35 mt-1">
            {data?.wasm?.plugins_native ?? 0} native · {data?.wasm?.plugin_bytes ?? 0} B
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/35 mb-1">L7 eBPF</p>
          <p className={`text-lg font-bold ${l7On ? "text-cyan-300" : "text-white/40"}`}>
            {l7On ? "ON" : "OFF"}
          </p>
          <p className="text-[10px] text-white/35 mt-1 truncate" title={data?.l7?.probe}>
            {data?.l7?.inspected ?? 0} insp · {data?.l7?.blocked ?? 0} blk
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/35 mb-1 flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            Lineage
          </p>
          <p className="text-lg font-bold text-violet-300">{data?.lineage?.events ?? 0}</p>
          <p className="text-[10px] text-white/35 mt-1">
            {data?.lineage?.connects ?? 0} connect · execve {data?.lineage?.execve_probe ? "ON" : "off"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/35 mb-1">XDP / IPC</p>
          <p className="text-lg font-bold text-white/80">{data?.xdp_mode ?? "—"}</p>
          <p className="text-[10px] text-white/35 mt-1">
            IPC {data?.ipc ?? "—"} · XDP {data?.xdp_active ? "ON" : "OFF"}
          </p>
        </div>
      </div>
    </div>
  );
}
