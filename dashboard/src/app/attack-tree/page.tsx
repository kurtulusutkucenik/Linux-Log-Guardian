"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  ShieldAlert,
  Terminal,
  Network,
  FileCode,
  Search,
  Server,
  AlertTriangle,
  GitBranch,
  List,
} from "lucide-react";
import { LineageGraph } from "@/components/LineageGraph";
import { useLanguage } from "@/components/LanguageProvider";
import {
  treeToGraph,
  riskClass,
  type AttackTree,
  type LineageEvent,
} from "@/lib/lineageGraph";
import { collectBanIpsFromTree, ipFromConnectDetail } from "@/lib/banUtils";
import { BanIpButton } from "@/components/BanIpButton";
import { BannedIpsPanel } from "@/components/BannedIpsPanel";
import { useBannedIpSet, useBannedIps } from "@/context/BannedIpsContext";

type ApiResponse = {
  trees: AttackTree[];
  total: number;
  high_risk: number;
  source: string;
  data_mode?: "live" | "preview" | "none";
  live?: boolean;
  preview_only?: boolean;
  setup_hint?: string;
  probes?: {
    ipc?: string;
    lineage_probe?: boolean;
    l7_probe?: boolean;
    l7_ebpf_hits?: number;
  } | null;
  graph?: { nodes: unknown[]; edges: unknown[] };
};

export default function AttackTreePage() {
  const { t } = useLanguage();
  const bannedSet = useBannedIpSet();
  const { refresh: refreshBans } = useBannedIps();
  const [trees, setTrees] = useState<AttackTree[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    high_risk: 0,
    source: "",
    data_mode: "none" as ApiResponse["data_mode"],
    live: false,
    setup_hint: "",
    probes: null as ApiResponse["probes"],
  });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState<"graph" | "timeline">("graph");

  const fetchTrees = async () => {
    try {
      const res = await fetch("/api/attack-tree");
      const data: ApiResponse = await res.json();
      setTrees(data.trees || []);
      setMeta({
        total: data.total ?? 0,
        high_risk: data.high_risk ?? 0,
        source: data.source ?? "",
        data_mode: data.data_mode ?? (data.live ? "live" : "none"),
        live: data.live ?? data.data_mode === "live",
        setup_hint: data.setup_hint ?? "",
        probes: data.probes ?? null,
      });
      if ((data.trees?.length ?? 0) > 0 && selected >= data.trees.length)
        setSelected(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrees();
    const timer = setInterval(fetchTrees, 10000);
    return () => clearInterval(timer);
  }, []);

  const active = trees[selected];
  const banIps = useMemo(
    () => (active ? collectBanIpsFromTree(active.events) : []),
    [active],
  );
  const graph = useMemo(
    () => (active ? treeToGraph(active, String(selected)) : { nodes: [], edges: [] }),
    [active, selected],
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case "FILE_READ":
        return <FileCode className="w-5 h-5 text-blue-400" />;
      case "EXEC_SHELL":
        return <Terminal className="w-5 h-5 text-red-400" />;
      case "NET_CONNECT":
        return <Network className="w-5 h-5 text-purple-400" />;
      case "FILE_WRITE":
        return <FileCode className="w-5 h-5 text-orange-400" />;
      case "NET_RECV":
        return <Activity className="w-5 h-5 text-cyan-400" />;
      default:
        return <Search className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-xl">
            <GitBranch className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {t("lineageTitle")}
            </h1>
            <p className="text-white/45 text-sm">{t("lineageSubtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="glass-panel px-3 py-1.5 text-white/70">
            {t("lineageTrees")}: <strong>{meta.total}</strong>
          </span>
          <span className="glass-panel px-3 py-1.5 text-red-400">
            {t("lineageHighRisk")}: <strong>{meta.high_risk}</strong>
          </span>
          {meta.data_mode === "live" && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
              {t("lineageBadgeLive")}
            </span>
          )}
          {meta.data_mode === "preview" && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-amber-500/15 text-amber-300 border-amber-500/30">
              {t("lineageBadgePreview")}
            </span>
          )}
          {meta.probes?.lineage_probe && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-mono border bg-cyan-500/10 text-cyan-300 border-cyan-500/25">
              lineage eBPF
            </span>
          )}
          {meta.probes?.l7_probe && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-mono border bg-violet-500/10 text-violet-300 border-violet-500/25">
              L7 {meta.probes.l7_ebpf_hits ?? 0}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-white/5 rounded-2xl" />
          <div className="h-48 bg-white/5 rounded-2xl" />
        </div>
      ) : trees.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">{t("lineageEmpty")}</p>
          <p className="text-white/35 text-xs mt-3 max-w-lg mx-auto">
            {meta.setup_hint || t("lineageEmptyHint")}
          </p>
          <p className="text-white/25 text-xs mt-2 font-mono">
            {t("lineagePreviewHint")}
          </p>
        </div>
      ) : (
        <>
          <BannedIpsPanel compact className="mb-2" />

          <div className="flex flex-wrap gap-2">
            {trees.map((tree, idx) => (
              <button
                key={`${tree.pid}-${idx}`}
                type="button"
                onClick={() => setSelected(idx)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  selected === idx
                    ? "bg-primary/20 border-primary/40 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                {tree.comm} · {tree.pid}
                <span
                  className={`ml-2 ${
                    riskClass(tree.risk) === "high"
                      ? "text-red-400"
                      : riskClass(tree.risk) === "medium"
                        ? "text-orange-400"
                        : "text-blue-400"
                  }`}
                >
                  {tree.risk.toFixed(0)}
                </span>
              </button>
            ))}
          </div>

          {active && (
            <div className="glass-panel overflow-hidden">
              <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center text-sm ${
                      riskClass(active.risk) === "high"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : riskClass(active.risk) === "medium"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {active.risk >= 85 && (
                      <AlertTriangle className="w-4 h-4 mr-1 animate-pulse" />
                    )}
                    {t("lineageRisk")}: {active.risk.toFixed(1)}
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {active.comm}{" "}
                    <span className="text-white/40 font-mono text-sm">
                      PID {active.pid}
                    </span>
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {banIps.map((ip) => (
                    <BanIpButton
                      key={ip}
                      ip={ip}
                      reason={`lineage-c2-${active.pid}`}
                      compact
                      banned={bannedSet.has(ip)}
                      onRefresh={refreshBans}
                    />
                  ))}
                  {active.agentId && (
                    <span className="text-xs text-white/40 flex items-center">
                      <Server className="w-3 h-3 mr-1" />
                      {active.agentId}
                    </span>
                  )}
                  <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setView("graph")}
                      className={`px-3 py-1 rounded-md text-xs flex items-center gap-1 ${
                        view === "graph" ? "bg-white/10 text-white" : "text-white/50"
                      }`}
                    >
                      <GitBranch className="w-3 h-3" />
                      {t("lineageGraph")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("timeline")}
                      className={`px-3 py-1 rounded-md text-xs flex items-center gap-1 ${
                        view === "timeline" ? "bg-white/10 text-white" : "text-white/50"
                      }`}
                    >
                      <List className="w-3 h-3" />
                      {t("lineageTimeline")}
                    </button>
                  </div>
                </div>
              </div>

              {view === "graph" ? (
                <div className="p-4">
                  <LineageGraph graph={graph} height={440} />
                </div>
              ) : (
                <div className="p-6">
                  <div className="relative border-l-2 border-white/15 ml-4 space-y-6">
                    {(active.events ?? []).map((ev: LineageEvent, evIdx: number) => (
                      <div key={evIdx} className="relative pl-8">
                        <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-[#0f1419] border-2 border-white/20 z-10" />
                        <div className="bg-black/30 border border-white/10 p-4 rounded-xl flex items-start gap-4">
                          <div className="p-2 bg-white/5 rounded-lg shrink-0">
                            {getEventIcon(ev.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1 gap-2">
                              <h3 className="font-semibold text-white text-sm">
                                {ev.type}
                              </h3>
                              <span className="text-xs text-white/40 font-mono shrink-0">
                                {new Date(ev.ts * 1000).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-white/70 font-mono text-xs break-all">
                              {ev.detail}
                            </p>
                            {ev.type === "NET_CONNECT" && (() => {
                              const c2 = ipFromConnectDetail(ev.detail);
                              if (!c2) return null;
                              return (
                                <div className="mt-2">
                                  <BanIpButton
                                    ip={c2}
                                    reason={`lineage-${ev.type}-${active.pid}`}
                                    compact
                                    banned={bannedSet.has(c2)}
                                    onRefresh={refreshBans}
                                  />
                                </div>
                              );
                            })()}
                            <p className="text-xs text-white/35 mt-2">
                              {ev.comm} · PID {ev.pid}
                              {ev.ppid ? ` · PPID ${ev.ppid}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
