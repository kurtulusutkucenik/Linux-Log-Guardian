"use client";

import { useEffect, useState, useRef } from "react";
import {
  ShieldCheck, FileText, Download, CheckCircle2,
  AlertTriangle, ShieldAlert, Server, Activity,
  Clock,
} from "lucide-react";
import axios from "axios";

import { useLanguage } from "@/components/LanguageProvider";

// ── Types ──────────────────────────────────────────────────────────────────
interface SecurityControl {
  standard: string;
  id: string;
  name: string;
  status: string;
  evidence: string;
  detail: string;
}

interface NodeDetail {
  id: string;
  status: string;
  rce_prevented: number;
  tarpit_active: number;
  eps: number;
  alerts: number;
  mesh_peers: number;
  total_lines: number;
  last_seen: string;
}

interface ReportData {
  reportDate: string;
  standards: string[];
  generatedBy: string;
  executiveSummary: {
    totalAgentsActive: number;
    onlineAgents: number;
    systemHealth: string;
    totalThreatsMitigated: number;
    totalEventsProcessed: number;
    totalAlerts: number;
    totalMeshPeers: number;
    peakEps: string;
    siemStatus: string;
  };
  securityControls: SecurityControl[];
  nodes: NodeDetail[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
const STANDARD_COLORS: Record<string, string> = {
  "SOC2":     "bg-cyan-900/40 text-cyan-300 border-cyan-700/40",
  "PCI-DSS":  "bg-violet-900/40 text-violet-300 border-violet-700/40",
  "KVKK":     "bg-amber-900/40 text-amber-300 border-amber-700/40",
  "ISO 27001":"bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
};

const FILTER_STANDARDS = ["ALL", "SOC2", "PCI-DSS", "KVKK", "ISO 27001"] as const;


export default function ReportsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeStd, setActiveStd] = useState<string>("ALL");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios
      .get("/api/reports", { withCredentials: true })
      .then((r) => {
        setData(r.data);
        setLoadError("");
      })
      .catch((e) => {
        console.error("Report load failed", e);
        const hint =
          e.response?.data?.hint ||
          e.response?.data?.error ||
          e.message ||
          t("reportsError");
        setLoadError(String(hint));
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => window.print();

  const downloadExport = async (format: "json" | "pdf") => {
    try {
      const res = await fetch(`/api/reports/export?format=${format}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as { hint?: string; error?: string }).hint || (err as { error?: string }).error || `Export failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Export failed — check console");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white">
        <div className="relative">
          <ShieldCheck className="w-16 h-16 text-primary opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
        <p className="text-sm text-white/50 font-mono tracking-widest animate-pulse">{t("reportsLoading").toUpperCase()}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-danger font-mono px-6 text-center">
        <p>{t("reportsError")}</p>
        {loadError && <p className="text-sm text-white/50 max-w-lg">{loadError}</p>}
      </div>
    );
  }

  const filteredControls = activeStd === "ALL"
    ? data.securityControls
    : data.securityControls.filter(c => c.standard === activeStd);

  const passedCount = data.securityControls.filter(c => c.status === "PASSED").length;
  const totalCount  = data.securityControls.length;
  const passRate    = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="min-h-screen" ref={printRef}>

      {/* ── Top Controls Bar ── */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-4 print:hidden">
        <div className="glass-panel p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Compliance &amp; Audit Reports
            </h1>
            <p className="text-sm text-white/40 mt-0.5 font-mono">
              SOC2 · PCI-DSS · KVKK · ISO 27001 &nbsp;|&nbsp;
              Generated: {new Date(data.reportDate).toLocaleString("en-US", {
                year: "numeric", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Standard Filter */}
            <div className="flex flex-wrap gap-1.5">
              {FILTER_STANDARDS.map(std => (
                <button
                  key={std}
                  onClick={() => setActiveStd(std)}
                  className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border transition-all duration-200
                    ${activeStd === std
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {std}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadExport("json")}
                className="flex items-center gap-2 bg-white/10 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-white/15 transition-all border border-white/10"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <button
                type="button"
                onClick={() => downloadExport("pdf")}
                className="flex items-center gap-2 bg-white/10 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-white/15 transition-all border border-white/10"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                id="btn-export-pdf"
                onClick={handlePrint}
                className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/80 transition-all duration-200 shadow-lg shadow-primary/20"
              >
                <Download className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Compliance Score Banner ── */}
      <div className="max-w-6xl mx-auto px-6 pb-4 print:hidden">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Controls Passed", value: `${passedCount}/${totalCount}`, sub: `${passRate}% pass rate`, color: "text-success", icon: <CheckCircle2 className="w-5 h-5 text-success" /> },
            { label: "Threats Mitigated", value: data.executiveSummary.totalThreatsMitigated.toLocaleString(), sub: "RCE + Tarpits", color: "text-danger", icon: <ShieldAlert className="w-5 h-5 text-danger" /> },
            { label: "Events Analyzed", value: Number(data.executiveSummary.totalEventsProcessed).toLocaleString(), sub: `${data.executiveSummary.peakEps} EPS peak`, color: "text-primary", icon: <Activity className="w-5 h-5 text-primary" /> },
            { label: "Fleet Health", value: data.executiveSummary.systemHealth, sub: `${data.executiveSummary.onlineAgents}/${data.executiveSummary.totalAgentsActive} nodes online`, color: "text-white", icon: <Server className="w-5 h-5 text-white/60" /> },
          ].map(kpi => (
            <div key={kpi.label} className="kpi-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">{kpi.label}</p>
                {kpi.icon}
              </div>
              <p className={`text-3xl font-black ${kpi.color} font-mono`}>{kpi.value}</p>
              <p className="text-xs text-white/30 mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          A4 PRINT-READY REPORT BODY
      ══════════════════════════════════════════════════════════════════ */}
      <div
        id="report-body"
        className="max-w-6xl mx-auto px-6 pb-16 print:px-0 print:max-w-none print:pb-0"
      >
        <div className="bg-white text-black rounded-xl shadow-2xl print:shadow-none print:rounded-none">

          {/* ── Report Header ── */}
          <div className="p-10 pb-8 border-b-4 border-black flex justify-between items-end">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">CONFIDENTIAL — INTERNAL USE ONLY</p>
                  <p className="text-xs font-mono text-gray-400">{data.generatedBy}</p>
                </div>
              </div>
              <h2 className="text-4xl font-black tracking-tight uppercase leading-none">
                Security Audit<br />
                <span className="text-gray-400 text-3xl">& Compliance Report</span>
              </h2>
            </div>
            <div className="text-right">
              <div className="inline-flex flex-col items-end gap-1 border-2 border-black px-5 py-3 rounded-lg">
                <p className="text-xs uppercase font-bold tracking-widest text-gray-500">Report Date</p>
                <p className="font-mono font-bold text-lg leading-tight">
                  {new Date(data.reportDate).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}
                </p>
                <p className="font-mono text-sm text-gray-500">
                  {new Date(data.reportDate).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", timeZoneName:"short" })}
                </p>
              </div>
            </div>
          </div>

          {/* ── Standards & Executive Summary ── */}
          <div className="p-10 grid grid-cols-2 gap-12 border-b border-gray-200">
            {/* Standards */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2 mb-5">Compliance Standards</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {data.standards.map(std => (
                  <span key={std} className="bg-gray-100 text-gray-800 font-bold px-4 py-1.5 rounded-full text-sm border border-gray-200">
                    {std}
                  </span>
                ))}
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Overall Compliance Score</p>
                <div className="flex items-end gap-3">
                  <p className="text-5xl font-black">{passRate}%</p>
                  <p className="text-gray-500 text-sm pb-2">({passedCount} of {totalCount} controls passed)</p>
                </div>
                <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-1000"
                    style={{ width: `${passRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Executive Summary KPIs */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2 mb-5">Executive Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "System Health", value: data.executiveSummary.systemHealth },
                  { label: "Threats Blocked", value: data.executiveSummary.totalThreatsMitigated.toLocaleString(), highlight: true },
                  { label: "Events Analyzed", value: Number(data.executiveSummary.totalEventsProcessed).toLocaleString() },
                  { label: "Peak EPS", value: data.executiveSummary.peakEps },
                  { label: "Security Alerts", value: data.executiveSummary.totalAlerts.toLocaleString() },
                  { label: "Mesh IoC Peers", value: data.executiveSummary.totalMeshPeers.toString() },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">{item.label}</p>
                    <p className={`text-xl font-black font-mono ${item.highlight ? "text-red-600" : "text-gray-900"}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SIEM Status Bar ── */}
          <div className="px-10 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 print:bg-gray-800" />
              <span className="font-mono text-sm font-bold text-gray-800">SIEM Forwarder</span>
              <span className="font-mono text-sm text-gray-500">{data.executiveSummary.siemStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-mono text-xs text-gray-400">Real-time TCP stream · JSON payload · Logstash:5044</span>
            </div>
          </div>

          {/* ── Security Controls Assessment ── */}
          <div className="p-10 border-b border-gray-200">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2 mb-6">
              Security Controls Assessment
            </h3>
            <div className="flex flex-col gap-3">
              {filteredControls.map(ctrl => (
                <div
                  key={ctrl.id}
                  className="flex items-start gap-5 p-5 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  {/* Status Icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {ctrl.status === "PASSED" ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border font-mono ${STANDARD_COLORS[ctrl.standard] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {ctrl.standard}
                      </span>
                      <span className="font-black text-gray-900 font-mono">{ctrl.id}</span>
                      <span className="text-gray-600 font-medium">— {ctrl.name}</span>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase ${ctrl.status === "PASSED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                        {ctrl.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Evidence:</strong> {ctrl.evidence}
                    </p>
                    <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 font-mono">
                      {ctrl.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Fleet Deployment Matrix ── */}
          <div className="p-10 border-b border-gray-200">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2 mb-6">
              Fleet Deployment Matrix
            </h3>
            {data.nodes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Server className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No Guardian agents currently reporting to the fleet.</p>
              </div>
            ) : (
              <table className="w-full text-sm font-mono border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-500 font-bold border border-gray-200">Node Identifier</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-500 font-bold border border-gray-200">Status</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-500 font-bold border border-gray-200">EPS</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-500 font-bold border border-gray-200">RCE Kills</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-500 font-bold border border-gray-200">Tarpits</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-500 font-bold border border-gray-200">Alerts</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-500 font-bold border border-gray-200">Mesh Peers</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-wider text-gray-500 font-bold border border-gray-200">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.nodes.map((node, i) => (
                    <tr key={node.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="py-3 px-4 font-bold border border-gray-200">{node.id}</td>
                      <td className="py-3 px-4 border border-gray-200">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${node.status === "Online" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${node.status === "Online" ? "bg-green-500" : "bg-red-500"}`} />
                          {node.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 border border-gray-200">{node.eps.toFixed(1)}</td>
                      <td className="py-3 px-4 border border-gray-200 text-red-600 font-bold">{node.rce_prevented}</td>
                      <td className="py-3 px-4 border border-gray-200 text-purple-600 font-bold">{node.tarpit_active}</td>
                      <td className="py-3 px-4 border border-gray-200">{node.alerts}</td>
                      <td className="py-3 px-4 border border-gray-200">{node.mesh_peers}</td>
                      <td className="py-3 px-4 border border-gray-200 text-gray-500 text-xs">
                        {new Date(node.last_seen).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Fleet Totals */}
                <tfoot>
                  <tr className="bg-gray-900 text-white">
                    <td className="py-3 px-4 font-black border border-gray-700 text-xs uppercase tracking-wider">FLEET TOTAL</td>
                    <td className="py-3 px-4 border border-gray-700 text-xs">
                      {data.executiveSummary.onlineAgents}/{data.executiveSummary.totalAgentsActive} online
                    </td>
                    <td className="py-3 px-4 border border-gray-700 font-bold">{data.executiveSummary.peakEps}</td>
                    <td className="py-3 px-4 border border-gray-700 font-bold text-red-400">
                      {data.nodes.reduce((s, n) => s + n.rce_prevented, 0)}
                    </td>
                    <td className="py-3 px-4 border border-gray-700 font-bold text-purple-400">
                      {data.nodes.reduce((s, n) => s + n.tarpit_active, 0)}
                    </td>
                    <td className="py-3 px-4 border border-gray-700 font-bold">
                      {data.executiveSummary.totalAlerts.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 border border-gray-700">{data.executiveSummary.totalMeshPeers}</td>
                    <td className="py-3 px-4 border border-gray-700 text-gray-400 text-xs">—</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* ── Attestation Footer ── */}
          <div className="p-10">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-4">Attestation &amp; Certification</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                This report was automatically generated by the <strong>Log Guardian Policy Engine v2.0</strong> and
                reflects the real-time security posture of the monitored fleet at the time of generation.
                All evidence is derived from live telemetry streams. This document is intended for internal
                audit purposes and disclosure to authorized security personnel (CISO, security team) only.
              </p>
              <div className="grid grid-cols-3 gap-8">
                {["Security Officer", "Fleet Administrator", "Compliance Reviewer"].map(role => (
                  <div key={role}>
                    <div className="h-12 border-b-2 border-gray-300 mb-2" />
                    <p className="text-xs text-gray-500 font-mono">{role}</p>
                    <p className="text-xs text-gray-400 font-mono">Date: _______________</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-400 font-mono">
              CONFIDENTIAL — Do not distribute without authorization.
              Generated by Log Guardian Enterprise Security Platform.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
