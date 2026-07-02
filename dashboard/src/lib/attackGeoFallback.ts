import { readFile } from "fs/promises";
import path from "path";

export type FallbackIpMeta = {
  ip: string;
  reason?: string;
  kind: "ban" | "incident";
};

function expandIpBlock(block: string): string[] {
  const m = block.trim().match(/^([\d.]+)-([\d.]+)$/);
  if (!m) return [block.trim()];
  const start = m[1].split(".").map(Number);
  const endLast = Number(m[2].split(".")[3]);
  const startLast = start[3];
  if (start.length !== 4 || !Number.isFinite(endLast) || endLast < startLast || endLast - startLast > 32) {
    return [m[1]];
  }
  const ips: string[] = [];
  for (let d = startLast; d <= endLast; d++) {
    ips.push(`${start[0]}.${start[1]}.${start[2]}.${d}`);
  }
  return ips;
}

function ipFromConnectDetail(detail: string): string | null {
  const m = detail.trim().match(/^([\da-f.:]+)(?::\d+)?$/i);
  return m?.[1] ?? null;
}

function skipIp(ip: string): boolean {
  if (!ip || ip === "127.0.0.1" || ip.startsWith("127.")) return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  return false;
}

function addIp(
  out: Map<string, FallbackIpMeta>,
  ip: string,
  reason: string,
  kind: "ban" | "incident",
) {
  const key = ip.trim();
  if (!key || skipIp(key)) return;
  if (!out.has(key)) out.set(key, { ip: key, reason, kind });
}

async function readJsonFile(dir: string, name: string): Promise<unknown | null> {
  try {
    const raw = await readFile(path.join(dir, name), "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Live ban/incident yokken kanit raporlarindan saldirgan IP'leri topla. */
export async function fetchFallbackAttackIps(dataDir: string): Promise<FallbackIpMeta[]> {
  const out = new Map<string, FallbackIpMeta>();

  const live = (await readJsonFile(dataDir, "live-attack-report.json")) as {
    ban_proof?: { ip?: string };
  } | null;
  if (live?.ban_proof?.ip) addIp(out, live.ban_proof.ip, "live-attack ban_proof", "ban");

  const ja3 = (await readJsonFile(dataDir, "ja3-cluster-ban-live.json")) as {
    ip_block?: string;
  } | null;
  if (ja3?.ip_block) {
    for (const ip of expandIpBlock(ja3.ip_block)) {
      addIp(out, ip, "JA3 cluster block", "ban");
    }
  }

  for (const name of ["bench-ban-latency.json", "dashboard-ban-api-report.json"]) {
    const doc = (await readJsonFile(dataDir, name)) as { test_ip?: string } | null;
    if (doc?.test_ip) addIp(out, doc.test_ip, name.replace(".json", ""), "ban");
  }

  const treeRaw = await readJsonFile(dataDir, "attack_tree.json");
  const trees = Array.isArray(treeRaw)
    ? treeRaw
    : (treeRaw as { trees?: unknown[] } | null)?.trees ?? [];
  for (const tree of trees) {
    const events = (tree as { events?: { type?: string; detail?: string }[] }).events ?? [];
    for (const ev of events) {
      if (ev.type !== "NET_CONNECT" || !ev.detail) continue;
      const ip = ipFromConnectDetail(ev.detail);
      if (ip) addIp(out, ip, "lineage NET_CONNECT", "incident");
    }
  }

  const cp = (await readJsonFile(dataDir, "competitive-proof.json")) as {
    liveAttack?: { ban_proof?: { ip?: string } };
    ja3ClusterBanLive?: { ip_block?: string };
    banLatency?: { test_ip?: string };
  } | null;
  if (cp?.liveAttack?.ban_proof?.ip) {
    addIp(out, cp.liveAttack.ban_proof.ip, "competitive-proof ban", "ban");
  }
  if (cp?.ja3ClusterBanLive?.ip_block) {
    for (const ip of expandIpBlock(cp.ja3ClusterBanLive.ip_block)) {
      addIp(out, ip, "competitive-proof JA3", "ban");
    }
  }
  if (cp?.banLatency?.test_ip) addIp(out, cp.banLatency.test_ip, "competitive-proof bench", "ban");

  const ja3Report = (await readJsonFile(dataDir, "ja3-cluster-report.json")) as {
    sample_ips?: string[];
    category?: string;
  } | null;
  if (ja3Report?.sample_ips?.length) {
    for (const ip of ja3Report.sample_ips) {
      addIp(out, ip, `JA3 ${ja3Report.category ?? "distributed"}`, "incident");
    }
  }

  const proofReplay = (await readJsonFile(dataDir, "proof-replay-webhook-ban.json")) as {
    ip_block?: string;
  } | null;
  if (proofReplay?.ip_block) {
    for (const ip of expandIpBlock(proofReplay.ip_block)) {
      addIp(out, ip, "proof-replay WAF ban", "ban");
    }
  }

  const authLog = (await readJsonFile(dataDir, "auth-log-report.json")) as {
    sample_ips?: string[];
  } | null;
  if (authLog?.sample_ips?.length) {
    for (const ip of authLog.sample_ips) {
      addIp(out, ip, "auth.log brute SSH", "incident");
    }
  }

  return [...out.values()].slice(0, 48);
}
