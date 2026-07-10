"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity, Server, Network, ShieldAlert, Skull,
  Box, Lock, Database, Building2, ChevronDown, Terminal, Send
} from "lucide-react";
import axios from "axios";
import { useLanguage } from "@/components/LanguageProvider";
import { SocKindFilterProvider } from "@/components/SocKindFilterContext";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";
import { formatTimeAgo } from "@/lib/formatTimeAgo";
import { FleetOpsPanel } from "@/components/FleetOpsPanel";
import { VpsPrepPanel } from "@/components/VpsPrepPanel";
import { E9RunbookPanel } from "@/components/E9RunbookPanel";

const FleetCharts = dynamic(
  () => import("@/components/FleetCharts").then((m) => m.FleetCharts),
  { ssr: false, loading: () => <div className="glass-panel h-52 animate-pulse" /> },
);
const ValidationTestsPanel = dynamic(
  () => import("@/components/ValidationTestsPanel").then((m) => m.ValidationTestsPanel),
  { ssr: false, loading: () => <div className="glass-panel h-48 animate-pulse" /> },
);
const OpsMetricsCharts = dynamic(
  () => import("@/components/GrafanaMiniPanels").then((m) => m.GrafanaMiniPanels),
  { ssr: false, loading: () => <div className="glass-panel h-64 animate-pulse" /> },
);
const IncidentsPanel = dynamic(
  () => import("@/components/IncidentsPanel").then((m) => m.IncidentsPanel),
  { ssr: false },
);
const BannedIpsPanel = dynamic(
  () => import("@/components/BannedIpsPanel").then((m) => m.BannedIpsPanel),
  { ssr: false, loading: () => <div className="glass-panel h-40 animate-pulse" /> },
);
const AttackWorldMap = dynamic(
  () => import("@/components/AttackWorldMap").then((m) => m.AttackWorldMap),
  { ssr: false, loading: () => <div className="glass-panel h-64 animate-pulse" /> },
);
const SocTimelinePanel = dynamic(
  () => import("@/components/SocTimelinePanel").then((m) => m.SocTimelinePanel),
  { ssr: false, loading: () => <div className="glass-panel h-48 animate-pulse" /> },
);
const WebhookOpsPanel = dynamic(
  () => import("@/components/WebhookOpsPanel").then((m) => m.WebhookOpsPanel),
  { ssr: false, loading: () => <div className="glass-panel h-28 animate-pulse" /> },
);
const EdgeProtectionPanel = dynamic(
  () => import("@/components/EdgeProtectionPanel").then((m) => m.EdgeProtectionPanel),
  { ssr: false, loading: () => <div className="glass-panel h-28 animate-pulse" /> },
);
const LineageL7Panel = dynamic(
  () => import("@/components/LineageL7Panel").then((m) => m.LineageL7Panel),
  { ssr: false, loading: () => <div className="glass-panel h-28 animate-pulse" /> },
);
const FpMetricsPanel = dynamic(
  () => import("@/components/FpMetricsPanel").then((m) => m.FpMetricsPanel),
  { ssr: false, loading: () => <div className="glass-panel h-24 animate-pulse" /> },
);

export interface AgentTelemetry {
  agent_id: string;
  tenant_id: string;
  eps: number;
  total_lines: number;
  alerts_total: number;
  rce_detections: number;
  tarpit_active: number;
  tarpit_trapped: number;
  mesh_peers: number;
  unique_ips: number;
  tls_decrypted?: number;
  etcd_peers?: number;
  last_seen: Date;
  status: "Online" | "Offline";
  remote_shadow?: boolean;
  xdp_mode?: string | null;
  soak_proof_72h?: number | null;
  hostname?: string | null;
  host?: string | null;
}

interface TenantInfo {
  tenant_id: string;
  agent_count: number;
  online_agents: number;
  total_eps: number;
  total_rce: number;
  total_tarpit: number;
  tls_decrypted: number;
  etcd_peers: number;
}

interface TlsStatus {
  tls_read_calls: number;
  tls_bytes: number;
  uprobe_active: boolean;
  etcd_connected: boolean;
  etcd_peers: number;
}

/* Tenant badge renkleri (döngüsel) */
const TENANT_COLORS = [
  { border: "border-l-[#7c3aed]", badge: "bg-[#7c3aed]/20 text-[#a78bfa]" },
  { border: "border-l-[#0891b2]", badge: "bg-[#0891b2]/20 text-[#67e8f9]" },
  { border: "border-l-[#d97706]", badge: "bg-[#d97706]/20 text-[#fcd34d]" },
  { border: "border-l-[#16a34a]", badge: "bg-[#16a34a]/20 text-[#86efac]" },
  { border: "border-l-[#be123c]", badge: "bg-[#be123c]/20 text-[#fda4af]" },
];

function tenantColor(tenantId: string, idx: number) {
  return TENANT_COLORS[idx % TENANT_COLORS.length];
}

export default function FleetDashboard() {
  const { t, locale } = useLanguage();
  const [fleet, setFleet] = useState<AgentTelemetry[]>([]);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("*");
  const [tenantDropOpen, setTenantDropOpen] = useState(false);
  const [tlsStatus, setTlsStatus] = useState<TlsStatus | null>(null);
  const [commandIp, setCommandIp] = useState("");
  const [banToast, setBanToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [epsFromLive, setEpsFromLive] = useState(false);
  const [kpiFromSnapshot, setKpiFromSnapshot] = useState(false);
  const [fleetPendingCommands, setFleetPendingCommands] = useState(0);
  const [globalStats, setGlobalStats] = useState({
    activeAgents: 0,
    totalEps: 0,
    totalRce: 0,
    totalTarpit: 0,
    totalK8sKills: 0,
    totalTlsDecrypted: 0,
    etcdPeers: 0,
  });

  const k8sTick = useRef(0);

  const fetchAll = useCallback(async () => {
    try {
      const headers: Record<string, string> =
        selectedTenant !== "*"
          ? { "X-Tenant-ID": selectedTenant }
          : {};

      const [fleetRes, tenantRes, tlsRes, metricsRes, snapRes] = await Promise.allSettled([
        axios.get("/api/fleet?stale_hours=6", { headers }),
        axios.get("/api/tenants"),
        axios.get("/api/tls-status"),
        fetch("/api/metrics/live").then((r) => r.json()),
        fetch("/api/dashboard-snapshot").then((r) => (r.ok ? r.json() : null)),
      ]);

      let liveEps = 0;
      let fleetRce = 0;
      let fleetTarpit = 0;

      if (metricsRes.status === "fulfilled" && metricsRes.value?.reachable) {
        liveEps = Number(metricsRes.value.eps) || 0;
      }

      if (fleetRes.status === "fulfilled") {
        const agents: AgentTelemetry[] = fleetRes.value.data.fleet;
        setFleet(agents);
        setFleetPendingCommands(Number(fleetRes.value.data.pending_commands) || 0);

        let active = 0, eps = 0, rce = 0, tarpit = 0, tls = 0;
        agents.forEach(a => {
          if (a.status === "Online" && !a.remote_shadow) { active++; eps += a.eps; }
          else if (a.status === "Online" && a.remote_shadow) { /* SSH monitor — EPS laptop KPI dışı */ }
          rce    += a.rce_detections;
          tarpit += a.tarpit_active;
          tls    += a.tls_decrypted || 0;
        });
        fleetRce = rce;
        fleetTarpit = tarpit;

        const useLive = liveEps > 0;
        if (useLive) eps = liveEps;
        setEpsFromLive(useLive);

        let k8sKills = 0;
        k8sTick.current += 1;
        if (k8sTick.current % 5 === 1) {
          try {
            const k8sRes = await axios.get("/api/k8s");
            k8sKills = k8sRes.data.totalKills;
          } catch { /* noop */ }
          setGlobalStats(prev => ({ ...prev, totalK8sKills: k8sKills }));
        }

        setGlobalStats(prev => ({
          ...prev,
          activeAgents: active,
          totalEps: eps,
          totalRce: rce,
          totalTarpit: tarpit,
          totalTlsDecrypted: tls,
        }));
      } else if (liveEps > 0) {
        setEpsFromLive(true);
        setGlobalStats(prev => ({ ...prev, totalEps: liveEps }));
      } else {
        setEpsFromLive(false);
      }

      if (snapRes.status === "fulfilled" && snapRes.value?.hints) {
        const h = snapRes.value.hints as {
          rce_blocked?: number;
          l7_blocked?: number;
          alerts_total?: number;
        };
        const useSnap =
          liveEps === 0 &&
          fleetRce === 0 &&
          ((h.rce_blocked ?? 0) > 0 || (h.l7_blocked ?? 0) > 0);
        if (useSnap) {
          setGlobalStats((prev) => ({
            ...prev,
            totalRce: prev.totalRce > 0 ? prev.totalRce : (h.rce_blocked ?? 0),
            totalTarpit:
              prev.totalTarpit > 0 ? prev.totalTarpit : (h.l7_blocked ?? 0),
          }));
          setKpiFromSnapshot(true);
        } else {
          setKpiFromSnapshot(false);
        }
      } else {
        setKpiFromSnapshot(false);
      }

      if (tenantRes.status === "fulfilled") {
        setTenants(tenantRes.value.data.tenants || []);
      }

      if (tlsRes.status === "fulfilled") {
        const s: TlsStatus = tlsRes.value.data;
        setTlsStatus(s);
        setGlobalStats(prev => ({
          ...prev,
          etcdPeers: s.etcd_peers,
        }));
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, [selectedTenant]);

  useVisibleInterval(fetchAll, 8000, true);

  const handleCommand = async (type: string, payload: string, targetAgentId?: string) => {
    if (!payload) return;
    try {
      const res = await axios.post("/api/fleet/commands", {
        commandType: type,
        payload,
        targetAgentId,
        reason: "dashboard-home",
      });
      const ib = res.data?.immediateBan;
      const ok = ib?.ok ?? false;
      setBanToast({
        ok,
        msg: ib?.message || res.data?.message || (ok ? t("banSuccess") : t("banQueuedOnly")),
      });
      setCommandIp("");
      setTimeout(() => setBanToast(null), 5000);
    } catch (err) {
      console.error("Command failed", err);
      setBanToast({ ok: false, msg: t("banFailed") });
      setTimeout(() => setBanToast(null), 5000);
    }
  };

  /* Tenant index haritası */
  const tenantIndexMap = new Map<string, number>();
  tenants.forEach((t, i) => tenantIndexMap.set(t.tenant_id, i));

  const selectedLabel =
    selectedTenant === "*" ? t("allTenants") : selectedTenant;

  const sortedFleet = useMemo(
    () =>
      [...fleet].sort((a, b) => {
        if (a.remote_shadow && !b.remote_shadow) return 1;
        if (!a.remote_shadow && b.remote_shadow) return -1;
        if (a.status !== b.status) return a.status === "Online" ? -1 : 1;
        return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
      }),
    [fleet],
  );

  const laptopFleet = useMemo(() => fleet.filter((a) => !a.remote_shadow), [fleet]);
  const remoteFleet = useMemo(() => fleet.filter((a) => a.remote_shadow), [fleet]);
  const offlineCount =
    laptopFleet.length - laptopFleet.filter((a) => a.status === "Online").length;

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col gap-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex justify-between items-center glass-panel p-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t("fleetTitle")}
          </h1>
          <p className="text-sm text-foreground/60 mt-1">{t("fleetSubtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* ── Tenant Selector ─────────────────────── */}
          <div className="relative">
            <button
              id="tenant-selector-btn"
              onClick={() => setTenantDropOpen(o => !o)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10
                         px-4 py-2 rounded-full border border-white/10
                         transition-all text-sm font-medium"
            >
              <Building2 className="w-4 h-4 text-primary" />
              <span className="max-w-[160px] truncate">{selectedLabel}</span>
              <ChevronDown className={`w-4 h-4 opacity-60 transition-transform
                ${tenantDropOpen ? "rotate-180" : ""}`} />
            </button>

            {tenantDropOpen && (
              <div className="absolute right-0 mt-2 w-64 glass-panel border
                              border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* All Tenants seçeneği */}
                <button
                  id="tenant-option-all"
                  onClick={() => { setSelectedTenant("*"); setTenantDropOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10
                    transition-colors flex items-center justify-between
                    ${selectedTenant === "*" ? "bg-primary/10 text-primary" : ""}`}
                >
                  <span className="font-medium">{t("allTenants")}</span>
                  <span className="text-xs opacity-50">{tenants.length} {t("tenantsCount")}</span>
                </button>

                <div className="border-t border-white/5" />

                {tenants.map((t, i) => {
                  const col = tenantColor(t.tenant_id, i);
                  return (
                    <button
                      key={t.tenant_id}
                      id={`tenant-option-${t.tenant_id}`}
                      onClick={() => { setSelectedTenant(t.tenant_id); setTenantDropOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10
                        transition-colors flex items-center justify-between
                        ${selectedTenant === t.tenant_id ? "bg-primary/10" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          col.badge.includes("violet") ? "bg-violet-400" :
                          col.badge.includes("cyan")   ? "bg-cyan-400"   :
                          col.badge.includes("amber")  ? "bg-amber-400"  :
                          col.badge.includes("green")  ? "bg-green-400"  :
                          "bg-rose-400"
                        }`} />
                        <span className="font-mono truncate max-w-[130px]">{t.tenant_id}</span>
                      </div>
                      <span className="text-xs opacity-50">
                        {t.online_agents}/{t.agent_count} online
                      </span>
                    </button>
                  );
                })}

                {tenants.length === 0 && (
                  <div className="px-4 py-3 text-sm text-white/40 text-center">
                    No tenants connected yet
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Online badge */}
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2
                          rounded-full border border-white/10">
            <span className={`relative flex h-3 w-3 ${globalStats.activeAgents > 0 ? "" : "opacity-60"}`}>
              {globalStats.activeAgents > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-primary" />
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3
                ${globalStats.activeAgents > 0 ? "bg-primary" : "bg-danger"}`} />
            </span>
            <span className="text-sm font-medium">
              {laptopFleet.length > 0
                ? `${globalStats.activeAgents}/${laptopFleet.length} ${t("nodesOnline")}${
                    remoteFleet.length > 0
                      ? ` · +${remoteFleet.length} ${t("fleetRemoteMonitor")}`
                      : ""
                  }`
                : `${globalStats.activeAgents} ${t("nodesOnline")}`}
            </span>
          </div>
        </div>
      </header>

      {offlineCount > 0 && laptopFleet.length > 0 && (
        <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-2.5">
          {offlineCount}{" "}
          {fleetPendingCommands > 0
            ? t("fleetOfflineBannerWithPending").replace("{n}", String(fleetPendingCommands))
            : t("fleetOfflineBannerStale")}
        </p>
      )}

      <FleetOpsPanel />
      <VpsPrepPanel />
      <E9RunbookPanel />

      {/* ── Tenant Segmentation Bar ─────────────────────────────────── */}
      {selectedTenant === "*" && tenants.length > 0 && (
        <div className="glass-panel p-4 flex flex-wrap gap-3 items-center">
          <span className="text-xs text-white/40 uppercase tracking-wider font-semibold mr-2">
            {t("tenantSegments")}
          </span>
          {tenants.map((t, i) => {
            const col = tenantColor(t.tenant_id, i);
            return (
              <button
                key={t.tenant_id}
                id={`tenant-seg-${t.tenant_id}`}
                onClick={() => setSelectedTenant(t.tenant_id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs
                  font-mono border border-white/10 hover:border-white/30 transition-all
                  ${col.badge}`}
              >
                <span>{t.tenant_id}</span>
                <span className="opacity-60">
                  {t.online_agents}/{t.agent_count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Canlı grafikler (önce kendi panellerimiz) ───────────────── */}
      <OpsMetricsCharts tenant={selectedTenant === "*" ? "default" : selectedTenant} />

      {/* ── Global KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* EPS */}
        <div id="kpi-eps" className="glass-panel p-5 flex flex-col gap-2 relative overflow-hidden group col-span-1">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-12 h-12 text-primary" />
          </div>
          <p className="text-xs text-foreground/70 uppercase tracking-wider font-semibold">{t("globalEps")}</p>
          <p className="text-3xl font-bold text-white">{globalStats.totalEps.toFixed(1)}</p>
          {epsFromLive && (
            <p className="text-[10px] text-primary/70 font-mono">{t("epsLiveMetrics")}</p>
          )}
        </div>

        {/* RCE */}
        <div id="kpi-rce" className="glass-panel p-5 flex flex-col gap-2 relative overflow-hidden group col-span-1">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldAlert className="w-12 h-12 text-danger" />
          </div>
          <p className="text-xs text-foreground/70 uppercase tracking-wider font-semibold">{t("rcePrevented")}</p>
          <p className="text-3xl font-bold text-danger">{globalStats.totalRce.toLocaleString()}</p>
          {kpiFromSnapshot && globalStats.totalRce > 0 && (
            <p className="text-[10px] text-amber-400/70 mt-auto">{t("kpiSnapshotHint")}</p>
          )}
        </div>

        {/* Tarpits */}
        <div id="kpi-tarpit" className="glass-panel p-5 flex flex-col gap-2 relative overflow-hidden group col-span-1">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Skull className="w-12 h-12 text-secondary" />
          </div>
          <p className="text-xs text-foreground/70 uppercase tracking-wider font-semibold">{t("activeTarpits")}</p>
          <p className="text-3xl font-bold text-secondary">{globalStats.totalTarpit.toLocaleString()}</p>
        </div>

        {/* K8s */}
        <div id="kpi-k8s" className="glass-panel p-5 flex flex-col gap-2 relative overflow-hidden group col-span-1">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Box className="w-12 h-12 text-warning" />
          </div>
          <p className="text-xs text-foreground/70 uppercase tracking-wider font-semibold">{t("k8sIsolated")}</p>
          <p className="text-3xl font-bold text-warning">{globalStats.totalK8sKills.toLocaleString()}</p>
        </div>

        {/* Phase 5: TLS Decrypted */}
        <div id="kpi-tls" className="glass-panel p-5 flex flex-col gap-2 relative overflow-hidden group col-span-1">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Lock className="w-12 h-12 text-[#7c3aed]" />
          </div>
          <p className="text-xs text-foreground/70 uppercase tracking-wider font-semibold">{t("tlsDecrypted")}</p>
          <p className="text-3xl font-bold text-[#a78bfa]">
            {globalStats.totalTlsDecrypted.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-auto">
            <span className={`w-1.5 h-1.5 rounded-full ${
              tlsStatus?.uprobe_active ? "bg-green-400" : "bg-white/20"
            }`} />
            <span className="text-xs opacity-50">
              {tlsStatus?.uprobe_active ? t("uprobeActive") : t("noUprobe")}
            </span>
          </div>
        </div>

        {/* Phase 5: Etcd Peers */}
        <div id="kpi-etcd" className="glass-panel p-5 flex flex-col gap-2 relative overflow-hidden group col-span-1">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Database className="w-12 h-12 text-[#0891b2]" />
          </div>
          <p className="text-xs text-foreground/70 uppercase tracking-wider font-semibold">{t("etcdPeers")}</p>
          <p className="text-3xl font-bold text-[#67e8f9]">
            {globalStats.etcdPeers}
          </p>
          <div className="flex items-center gap-1.5 mt-auto">
            <span className={`w-1.5 h-1.5 rounded-full ${
              tlsStatus?.etcd_connected ? "bg-cyan-400 animate-pulse" : "bg-white/20"
            }`} />
            <span className="text-xs opacity-50">
              {tlsStatus?.etcd_connected ? t("raftConsensus") : t("disconnected")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Saldırı haritası + SOC (paylaşılan tür filtresi) ───────── */}
      <SocKindFilterProvider>
        <AttackWorldMap />
        <SocTimelinePanel />
        <EdgeProtectionPanel />
      </SocKindFilterProvider>

      <WebhookOpsPanel />

      <LineageL7Panel />

      <FpMetricsPanel />

      {/* ── Doğrulama testleri ───────────────────────────────────────── */}
      <ValidationTestsPanel compact showHeaderLink />

      {fleet.length > 0 && (
        <FleetCharts
          agents={fleet.map((a) => ({
            agent_id: a.agent_id,
            eps: a.eps,
            alerts_total: a.alerts_total,
            status: a.status,
          }))}
        />
      )}

      <BannedIpsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentsPanel />
      </div>

      {/* ── Active Fleet Command Panel ─────────────────────────────────── */}
      <div className="glass-panel p-5 border border-primary/20 bg-primary/5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
            <Terminal className="w-5 h-5" />
            {t("fleetCommand")}
          </h2>
          <a
            href="/fleet/dispatch"
            className="text-xs text-primary/80 hover:text-primary hover:underline"
          >
            {t("fleetDispatchLink")} →
          </a>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <p className="text-sm text-white/70 flex-1">
            {t("fleetCommandDesc")} {t("banToastHint")}
          </p>
          {banToast && (
            <p
              className={`text-xs px-3 py-1.5 rounded-lg ${
                banToast.ok
                  ? "bg-green-500/15 text-green-300 border border-green-500/30"
                  : "bg-amber-500/15 text-amber-200 border border-amber-500/30"
              }`}
            >
              {banToast.msg}
            </p>
          )}
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder={t("banIpPlaceholder")}
              value={commandIp}
              onChange={e => setCommandIp(e.target.value)}
              className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary w-full md:w-64 font-mono"
            />
            <button
              onClick={() => handleCommand("BAN_IP", commandIp)}
              disabled={!commandIp}
              className="bg-primary text-black font-bold px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {t("executeBan")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Fleet Nodes Grid ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          {selectedTenant === "*"
            ? t("guardianNodes")
            : `${t("guardianNodes")} — ${selectedTenant}`}
          {selectedTenant !== "*" && (
            <button
              onClick={() => setSelectedTenant("*")}
              className="ml-2 text-xs text-white/30 hover:text-white/70 transition-colors font-normal"
            >
              ({t("clearFilter")})
            </button>
          )}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {fleet.length === 0 ? (
            <div className="col-span-full glass-panel p-12 flex flex-col
                            items-center justify-center text-center opacity-50">
              <Server className="w-12 h-12 mb-4 text-white/50" />
              <p className="text-lg">
                {selectedTenant === "*" ? t("noAgents") : t("noAgentsTenant")}
              </p>
              <p className="text-sm">
                {selectedTenant === "*"
                  ? t("startAgentHint")
                  : t("tryOtherTenant")}
              </p>
            </div>
          ) : (
            sortedFleet.map(agent => {
              const tIdx = tenantIndexMap.get(agent.tenant_id) ?? 0;
              const col  = tenantColor(agent.tenant_id, tIdx);
              const onlineBorder = agent.remote_shadow
                ? "border-l-sky-500/60"
                : agent.status === "Online"
                  ? col.border
                  : "border-l-danger/50 opacity-60";

              return (
                <div
                  key={agent.agent_id}
                  className={`glass-panel p-5 border-l-4 ${onlineBorder} ${
                    agent.remote_shadow ? "border border-sky-500/15" : ""
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-mono text-lg font-bold text-white">
                        {agent.agent_id}
                      </h3>
                      {agent.remote_shadow && agent.hostname && (
                        <p className="text-[10px] text-sky-300/70 font-mono">{agent.hostname}</p>
                      )}
                      <p className="text-xs text-white/50 font-mono">
                        {agent.remote_shadow
                          ? t("fleetRemoteLastPull")
                          : `${t("lastSeenAgo")}: ${formatTimeAgo(agent.last_seen, locale)}`}
                      </p>
                      {agent.status === "Offline" && !agent.remote_shadow && (
                        <p className="text-[10px] text-amber-400/80 mt-1">{t("agentOfflineQueue")}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-1 text-xs font-bold uppercase rounded
                        ${agent.remote_shadow
                          ? "bg-sky-500/15 text-sky-300"
                          : agent.status === "Online"
                            ? "bg-primary/20 text-primary"
                            : "bg-danger/20 text-danger"}`}>
                        {agent.remote_shadow ? t("fleetRemoteMonitor") : agent.status}
                      </span>
                      {/* Phase 5: Tenant Badge */}
                      <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full
                        ${col.badge}`}>
                        {agent.tenant_id}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white/5 p-2.5 rounded">
                      <p className="text-xs text-white/50 uppercase">Traffic</p>
                      <p className="font-mono font-bold text-base">
                        {agent.eps.toFixed(1)}{" "}
                        <span className="text-xs font-normal opacity-50">EPS</span>
                      </p>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded">
                      <p className="text-xs text-white/50 uppercase">Unique IPs</p>
                      <p className="font-mono font-bold text-base">{agent.unique_ips}</p>
                    </div>

                    {/* Phase 5: TLS + Etcd */}
                    {(agent.tls_decrypted !== undefined) && (
                      <div className="bg-[#7c3aed]/10 p-2.5 rounded border border-[#7c3aed]/20">
                        <p className="text-xs text-[#a78bfa]/70 uppercase flex items-center gap-1">
                          <Lock className="w-3 h-3" /> TLS Decrypted
                        </p>
                        <p className="font-mono font-bold text-base text-[#a78bfa]">
                          {agent.tls_decrypted.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {(agent.etcd_peers !== undefined) && (
                      <div className="bg-[#0891b2]/10 p-2.5 rounded border border-[#0891b2]/20">
                        <p className="text-xs text-[#67e8f9]/70 uppercase flex items-center gap-1">
                          <Database className="w-3 h-3" /> Etcd Peers
                        </p>
                        <p className="font-mono font-bold text-base text-[#67e8f9]">
                          {agent.etcd_peers}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center text-sm
                                  border-t border-white/10 pt-3 mt-2">
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1 text-danger font-mono" title="RCE">
                        <ShieldAlert className="w-4 h-4" /> {agent.rce_detections}
                      </span>
                      <span className="flex items-center gap-1 text-secondary font-mono" title="Tarpit">
                        <Skull className="w-4 h-4" /> {agent.tarpit_active}
                      </span>
                      <span className="flex items-center gap-1 text-primary font-mono" title="Mesh Peers">
                        <Network className="w-4 h-4" /> {agent.mesh_peers}
                      </span>
                    </div>
                    <span className="text-xs text-white/40 font-mono">
                      {agent.total_lines.toLocaleString()} lines
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
