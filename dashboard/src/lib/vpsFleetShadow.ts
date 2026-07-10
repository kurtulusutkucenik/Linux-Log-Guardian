import { readFile } from "fs/promises";
import path from "path";

export const VPS_FLEET_AGENT_ID = "node-vps-01";

export function isVpsFleetShadowAgent(agentId: string | null | undefined): boolean {
  return agentId === VPS_FLEET_AGENT_ID;
}

export type VpsRemoteStatus = {
  pass?: boolean;
  ssh_ok?: boolean;
  hostname?: string | null;
  host?: string | null;
  remote_root?: string | null;
  xdp_mode?: string | null;
  eps?: number | null;
  soak_proof_72h?: number | null;
  date?: string | null;
};

export type VpsFleetShadowAgent = {
  agent_id: string;
  tenant_id: string;
  tenant_name: string;
  eps: number;
  total_lines: number;
  alerts_total: number;
  rce_detections: number;
  tarpit_active: number;
  tarpit_trapped: number;
  mesh_peers: number;
  unique_ips: number;
  tls_decrypted: number;
  etcd_peers: number;
  incidents_active: number;
  incidents_correlated: number;
  attack_trees: number;
  last_seen: Date;
  status: "Online";
  remote_shadow: true;
  xdp_mode: string | null;
  soak_proof_72h: number | null;
  hostname: string | null;
  host: string | null;
};

const DATA_DIR = process.env.BENCH_DATA_DIR || "/data/lg";

export async function readVpsRemoteStatus(): Promise<VpsRemoteStatus | null> {
  for (const base of [DATA_DIR, process.cwd(), path.join(process.cwd(), "..")]) {
    try {
      const raw = await readFile(path.join(base, "vps-remote-status-report.json"), "utf8");
      return JSON.parse(raw) as VpsRemoteStatus;
    } catch {
      /* next */
    }
  }
  return null;
}

export function buildVpsFleetShadow(
  remote: VpsRemoteStatus | null | undefined,
): VpsFleetShadowAgent | null {
  if (!remote?.ssh_ok) return null;
  const at = remote.date ? new Date(remote.date) : new Date();
  return {
    agent_id: VPS_FLEET_AGENT_ID,
    tenant_id: "vps-prod",
    tenant_name: "VPS prod",
    eps: remote.eps ?? 0,
    total_lines: 0,
    alerts_total: 0,
    rce_detections: 0,
    tarpit_active: 0,
    tarpit_trapped: 0,
    mesh_peers: 0,
    unique_ips: 0,
    tls_decrypted: 0,
    etcd_peers: 0,
    incidents_active: 0,
    incidents_correlated: 0,
    attack_trees: 0,
    last_seen: at,
    status: "Online",
    remote_shadow: true,
    xdp_mode: remote.xdp_mode ?? null,
    soak_proof_72h: remote.soak_proof_72h ?? null,
    hostname: remote.hostname ?? null,
    host: remote.host ?? null,
  };
}
