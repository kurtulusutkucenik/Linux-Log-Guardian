import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { fetchBannedIps } from "@/lib/fetchBannedIps";
import { parseGuardianMetrics } from "@/lib/prometheusParse";

export const dynamic = "force-dynamic";

const DATA_DIR = process.env.BENCH_DATA_DIR || "/data/lg";

async function readJson<T>(name: string): Promise<T | null> {
  for (const base of [DATA_DIR, process.cwd(), path.join(process.cwd(), "..")]) {
    try {
      const raw = await readFile(path.join(base, name), "utf8");
      return JSON.parse(raw) as T;
    } catch {
      /* next */
    }
  }
  return null;
}

async function fetchLiveMetrics() {
  const url =
    process.env.GUARDIAN_METRICS_URL ||
    process.env.PROMETHEUS_METRICS_URL ||
    "http://host.docker.internal:9091/metrics";
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return parseGuardianMetrics(await res.text());
  } catch {
    return null;
  }
}

export async function GET() {
  const [gate, checklist, e9, status, intelReport, live] = await Promise.all([
    readJson<{
      pass?: boolean;
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
      threat_intel_legacy_rows?: number;
      threat_intel_summary_rows?: number;
      date?: string;
      fail_reason?: string;
    }>("edge-protection-gate-report.json"),
    readJson<{
      pass?: boolean;
      date?: string;
      summary?: { pass?: number; warn?: number; fail?: number; total?: number };
      laptop_fail_ids?: string[];
      laptop_warn_ids?: string[];
    }>("edge-protection-checklist-report.json"),
    readJson<{
      pass?: boolean;
      date?: string;
      competitive_proof?: string;
      enterprise_escalation?: boolean;
      edge_checklist?: boolean;
      morning_operator?: boolean;
      docs_consistency?: boolean;
    }>("enterprise-e9-verify-report.json"),
    readJson<{
      ipc?: string;
      xdp_mode?: string;
      db?: { bans_active?: number };
      daemon?: { xdp_active?: boolean };
    }>("guardian-status.json"),
    readJson<{
      pass?: boolean;
      ban_events_total?: number;
      intel_legacy_rows?: number;
      intel_summary_rows?: number;
      stale_rows?: number;
      intel_ban_db_ttl_days?: number;
      max_total_rows?: number;
      date?: string;
    }>("intel-ban-db-report.json"),
    fetchLiveMetrics(),
  ]);

  const ipc = gate?.ipc ?? status?.ipc ?? "?";
  const xdpMode = gate?.xdp_mode ?? status?.xdp_mode ?? "?";
  const dataMode: "live" | "proof" | "unknown" =
    ipc === "ok" && gate?.pass ? "live" : gate ? "proof" : "unknown";

  const liveBans = await fetchBannedIps({ countOnly: true }).catch(() => ({
    count: 0,
    source: "empty",
    bans: [],
  }));
  const liveCount = liveBans.count ?? 0;
  const gateIpset = gate?.ipset_entries ?? 0;
  const gateBans = gate?.bans_active ?? status?.db?.bans_active ?? 0;
  const bansActive =
    liveCount > 0 ? liveCount : gateIpset > 0 ? gateIpset : gateBans;
  const ipsetEntries = liveCount > 0 ? liveCount : gateIpset;

  const banEventsLive = live?.reachable ? live.ban_events_total : null;
  const intelLegacyLive = live?.reachable ? live.intel_ban_legacy_rows : null;
  const intelSummaryLive = live?.reachable ? live.intel_ban_summary_rows : null;
  const banEventsTotal =
    banEventsLive != null && banEventsLive > 0
      ? banEventsLive
      : (intelReport?.ban_events_total ?? gate?.threat_intel_summary_rows ?? 0);
  const intelLegacy =
    intelLegacyLive != null
      ? intelLegacyLive
      : (intelReport?.intel_legacy_rows ?? gate?.threat_intel_legacy_rows ?? 0);
  const intelSummary =
    intelSummaryLive != null && intelSummaryLive > 0
      ? intelSummaryLive
      : (intelReport?.intel_summary_rows ?? gate?.threat_intel_summary_rows ?? 0);
  const intelBanDb = {
    pass: intelReport?.pass !== false && intelLegacy === 0,
    ban_events_total: banEventsTotal,
    intel_legacy_rows: intelLegacy,
    intel_summary_rows: intelSummary,
    stale_rows: intelReport?.stale_rows ?? 0,
    ttl_days: intelReport?.intel_ban_db_ttl_days ?? 7,
    max_total_rows: intelReport?.max_total_rows ?? 50000,
    at: intelReport?.date ?? gate?.date ?? null,
    data_source: (banEventsLive != null ? "live" : "report") as "live" | "report",
  };

  return NextResponse.json({
    data_mode: dataMode,
    gate_pass: gate?.pass === true,
    gate_at: gate?.date ?? null,
    gate_fail_reason: gate?.fail_reason ?? null,
    ipc,
    xdp_mode: xdpMode,
    xdp_active: gate?.xdp_active ?? status?.daemon?.xdp_active ?? false,
    default_nic: gate?.default_nic ?? "?",
    wifi_nic: gate?.wifi_nic ?? false,
    nginx_log_format: gate?.nginx_log_format ?? false,
    nginx_snippets: gate?.nginx_snippets ?? false,
    nginx_live: gate?.nginx_live ?? false,
    whitelist_count: gate?.whitelist_count ?? 0,
    ipset_entries: ipsetEntries,
    bans_active: bansActive,
    bans_active_db: gate?.bans_active_db ?? gateBans,
    bans_source: liveCount > 0 ? liveBans.source : gateIpset > 0 ? "ipset" : "db",
    threat_intel_legacy_rows: intelLegacy,
    threat_intel_summary_rows: intelSummary,
    intel_ban_db: intelBanDb,
    edge_checklist: checklist
      ? {
          pass: checklist.pass === true,
          at: checklist.date ?? null,
          pass_n: checklist.summary?.pass ?? 0,
          warn_n: checklist.summary?.warn ?? 0,
          fail_n: checklist.summary?.fail ?? 0,
          total: checklist.summary?.total ?? 0,
          fail_ids: checklist.laptop_fail_ids ?? [],
          warn_ids: checklist.laptop_warn_ids ?? [],
        }
      : null,
    enterprise_e9: e9
      ? {
          pass: e9.pass === true,
          at: e9.date ?? null,
          competitive_proof: e9.competitive_proof ?? null,
          enterprise_escalation: e9.enterprise_escalation === true,
          edge_checklist: e9.edge_checklist === true,
          morning_operator: e9.morning_operator === true,
          docs_consistency: e9.docs_consistency === true,
        }
      : null,
  });
}
