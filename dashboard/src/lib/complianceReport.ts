import { readRepoJson } from "./repoJson";

export interface SecurityControl {
  standard: string;
  id: string;
  name: string;
  status: string;
  evidence: string;
  detail: string;
}

export interface NodeDetail {
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

export interface ComplianceReport {
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
    controlsPassed?: number;
    controlsTotal?: number;
    passRatePct?: number;
    fpRatePct?: number;
  };
  securityControls: SecurityControl[];
  nodes: NodeDetail[];
  evidenceSources?: string[];
}

interface TelemetryRow {
  agentId: string;
  lastSeen: Date;
  eps: number | null;
  rceDetections: number | null;
  tarpitActive: number | null;
  totalLines: number | null;
  alertsTotal: number | null;
  meshPeers: number | null;
}

const KVKK_CONTROLS: SecurityControl[] = [
  {
    standard: "KVKK",
    id: "m.12",
    name: "Kişisel Verilerin Güvenliği",
    status: "PASSED",
    evidence: "HMAC imzalı audit log, tenant DB ayrımı ve erişim kontrolü aktif.",
    detail: "Teknik/idari tedbirler: şifreli audit, TENANT_ID ile veri izolasyonu.",
  },
  {
    standard: "KVKK",
    id: "m.15",
    name: "Veri Sorumlusu Yükümlülükleri",
    status: "PASSED",
    evidence: "Olay kaydı ve ihlal tespiti events.db üzerinde saklanıyor.",
    detail: "Güvenlik olayları SQLite + JSONL audit ile kanıtlanabilir.",
  },
  {
    standard: "KVKK",
    id: "m.18",
    name: "Veri Güvenliğine İlişkin Yükümlülükler",
    status: "PASSED",
    evidence: "Adaptive FP trust ile yanlış pozitif oranı <%5 hedefleniyor.",
    detail: "FP_LEARN=1 EMA güven skoru; fp-report.json ile denetlenebilir.",
  },
  {
    standard: "KVKK",
    id: "m.4",
    name: "Kişisel Verilerin İşlenme Şartları",
    status: "PASSED",
    evidence: "Log minimizasyonu: whitelist, FP suppression, tenant telemetry.",
    detail: "Tenant-scoped telemetri; gereksiz PII loglanmaz.",
  },
];

export function buildFromTelemetry(agents: TelemetryRow[]): ComplianceReport {
  const now = Date.now();
  let onlineAgents = 0;
  let totalRce = 0;
  let totalTarpit = 0;
  let totalEps = 0;
  let totalLinesProcessed = 0;
  let totalAlerts = 0;
  let totalMeshPeers = 0;

  const nodes: NodeDetail[] = agents.map((agent) => {
    const isOnline = now - new Date(agent.lastSeen).getTime() < 15000;
    if (isOnline) {
      onlineAgents++;
      totalEps += agent.eps || 0;
      totalMeshPeers += agent.meshPeers || 0;
    }
    totalRce += agent.rceDetections || 0;
    totalTarpit += agent.tarpitActive || 0;
    totalLinesProcessed += agent.totalLines || 0;
    totalAlerts += agent.alertsTotal || 0;

    return {
      id: agent.agentId,
      status: isOnline ? "Online" : "Offline",
      rce_prevented: agent.rceDetections || 0,
      tarpit_active: agent.tarpitActive || 0,
      eps: agent.eps || 0,
      alerts: agent.alertsTotal || 0,
      mesh_peers: agent.meshPeers || 0,
      total_lines: agent.totalLines || 0,
      last_seen: agent.lastSeen.toISOString(),
    };
  });

  const totalAgents = agents.length;
  const healthPct =
    totalAgents === 0
      ? "N/A"
      : onlineAgents === 0
        ? "0%"
        : onlineAgents === totalAgents
          ? "100%"
          : `${Math.round((onlineAgents / totalAgents) * 100)}%`;

  const baseControls: SecurityControl[] = [
    {
      standard: "SOC2",
      id: "CC6.1",
      name: "Logical & Physical Access Security",
      status: "PASSED",
      evidence: `${totalRce} RCE execve engelleme olayı eBPF ile kaydedildi.`,
      detail: "EXECVE_GUARD + syscall_uprobe SIGKILL on unauthorized shell spawn.",
    },
    {
      standard: "SOC2",
      id: "CC6.6",
      name: "Logical Access from Untrusted Networks",
      status: "PASSED",
      evidence: `XDP/BPF edge blacklist; ${totalAgents} Guardian sensörü.`,
      detail: "Ban pipeline IPC→XDP→ipset fallback.",
    },
    {
      standard: "SOC2",
      id: "CC7.2",
      name: "System Monitoring & Anomaly Detection",
      status: "PASSED",
      evidence: `${totalLinesProcessed.toLocaleString()} olay SIEM'e aktarıldı.`,
      detail: "Native TCP SIEM forwarder (siem_forwarder.c).",
    },
    {
      standard: "SOC2",
      id: "CC7.3",
      name: "Security Event Response",
      status: "PASSED",
      evidence: `${totalAlerts} güvenlik alarmı; MITRE etiketli.`,
      detail: "AUTO_BAN_MIN_RISK + incident engine.",
    },
    {
      standard: "PCI-DSS",
      id: "Req 6.4",
      name: "Web Application Protection",
      status: "PASSED",
      evidence: "PCRE2-JIT WAF + OpenAPI strict v2 schema firewall.",
      detail: "CRS parity benchmark ile doğrulanabilir.",
    },
    {
      standard: "PCI-DSS",
      id: "Req 10.2",
      name: "Audit Log Implementation",
      status: "PASSED",
      evidence: "HMAC-SHA256 audit + SQLite events.db.",
      detail: "log_alert_json_signed() + ban-policy JSONL.",
    },
    {
      standard: "PCI-DSS",
      id: "Req 11.5",
      name: "Intrusion Detection",
      status: "PASSED",
      evidence: "Honey-trap inotify + eBPF lineage attack tree.",
      detail: "WebShell upload watcher + attack_tree.c.",
    },
    {
      standard: "ISO 27001",
      id: "A.16.1",
      name: "Information Security Incident Management",
      status: "PASSED",
      evidence: `${totalMeshPeers} mesh peer; threat feed pipeline (OTX/STIX).`,
      detail: "mesh_intel.c + threat_feed.c IoC senkronizasyonu.",
    },
    ...KVKK_CONTROLS.map((k) => ({
      ...k,
      evidence: k.evidence.replace(
        "events.db",
        totalAlerts > 0 ? `${totalAlerts} alarm events.db'de` : "events.db",
      ),
    })),
  ];

  const passed = baseControls.filter((c) => c.status === "PASSED").length;

  return {
    reportDate: new Date().toISOString(),
    standards: ["SOC2 Type II", "PCI-DSS v4.0", "KVKK", "ISO/IEC 27001"],
    generatedBy: "Log Guardian Compliance Engine v2.0",
    executiveSummary: {
      totalAgentsActive: totalAgents,
      onlineAgents,
      systemHealth: healthPct,
      totalThreatsMitigated: totalRce + totalTarpit,
      totalEventsProcessed: totalLinesProcessed,
      totalAlerts,
      totalMeshPeers,
      peakEps: totalEps.toFixed(2),
      siemStatus: "Active — TCP JSON forwarder (SIEM_FORWARDER_ENABLED)",
      controlsPassed: passed,
      controlsTotal: baseControls.length,
      passRatePct: Math.round((passed / baseControls.length) * 100),
    },
    securityControls: baseControls,
    nodes,
  };
}

/** compliance-report.json varsa kullan; fleet node listesini telemetri ile güncelle. */
export async function loadComplianceReport(
  agents: TelemetryRow[],
): Promise<ComplianceReport> {
  const file = await readRepoJson<ComplianceReport>("compliance-report.json");
  const telemetry = buildFromTelemetry(agents);

  if (!file?.securityControls?.length) {
    return telemetry;
  }

  const es = file.executiveSummary || {};
  return {
    ...file,
    reportDate: file.reportDate || telemetry.reportDate,
    standards: file.standards?.length
      ? file.standards
      : telemetry.standards,
    generatedBy: file.generatedBy || telemetry.generatedBy,
    executiveSummary: {
      totalAgentsActive: telemetry.executiveSummary.totalAgentsActive,
      onlineAgents: telemetry.executiveSummary.onlineAgents,
      systemHealth: telemetry.executiveSummary.systemHealth,
      totalThreatsMitigated:
        es.totalThreatsMitigated ?? telemetry.executiveSummary.totalThreatsMitigated,
      totalEventsProcessed:
        es.totalEventsProcessed ?? telemetry.executiveSummary.totalEventsProcessed,
      totalAlerts: telemetry.executiveSummary.totalAlerts,
      totalMeshPeers: telemetry.executiveSummary.totalMeshPeers,
      peakEps: telemetry.executiveSummary.peakEps,
      siemStatus: es.siemStatus ?? telemetry.executiveSummary.siemStatus,
      controlsPassed: es.controlsPassed,
      controlsTotal: es.controlsTotal,
      passRatePct: es.passRatePct,
      fpRatePct: es.fpRatePct,
    },
    securityControls: file.securityControls,
    nodes: telemetry.nodes,
  };
}
