import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { fetchBannedIps } from "@/lib/fetchBannedIps";

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

export async function GET() {
  const [gate, status] = await Promise.all([
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
      ipc?: string;
      xdp_mode?: string;
      db?: { bans_active?: number };
      daemon?: { xdp_active?: boolean };
    }>("guardian-status.json"),
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
    threat_intel_legacy_rows: gate?.threat_intel_legacy_rows ?? 0,
    threat_intel_summary_rows: gate?.threat_intel_summary_rows ?? 0,
  });
}
