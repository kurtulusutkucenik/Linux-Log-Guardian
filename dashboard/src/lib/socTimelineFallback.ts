import { readFile } from "fs/promises";
import path from "path";
import type { SocTimelineEntry } from "./socTimelineTypes";

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

function parseIsoTs(iso?: string): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
}

async function readJsonFile(dir: string, name: string): Promise<unknown | null> {
  try {
    const raw = await readFile(path.join(dir, name), "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Canli API bosken kanit raporlarindan SOC timeline onizlemesi. */
export async function fetchSocTimelineFallback(dataDir: string): Promise<SocTimelineEntry[]> {
  const out: SocTimelineEntry[] = [];
  const seen = new Set<string>();

  const push = (entry: SocTimelineEntry) => {
    if (seen.has(entry.id)) return;
    seen.add(entry.id);
    out.push(entry);
  };

  const ja3Live = (await readJsonFile(dataDir, "ja3-cluster-ban-live.json")) as {
    date?: string;
    ip_block?: string;
    pass?: boolean;
  } | null;
  if (ja3Live?.ip_block) {
    const ts = parseIsoTs(ja3Live.date);
    for (const ip of expandIpBlock(ja3Live.ip_block)) {
      push({
        id: `proof-ja3-ban-${ip}`,
        kind: "ban",
        ts,
        title: ip,
        detail: "JA3 cluster live ban (proof)",
        ip,
        href: `/bans?search=${encodeURIComponent(ip)}`,
      });
    }
  }

  const ja3 = (await readJsonFile(dataDir, "ja3-cluster-report.json")) as {
    date?: string;
    sample_ips?: string[];
    category?: string;
    recall_pct?: number;
  } | null;
  if (ja3?.sample_ips?.length) {
    const ts = parseIsoTs(ja3.date);
    const detail = `distributed ${ja3.category ?? "scanner"} recall ${ja3.recall_pct ?? "?"}%`;
    for (const ip of ja3.sample_ips.slice(0, 12)) {
      push({
        id: `proof-ja3-dist-${ip}`,
        kind: "incident",
        ts,
        title: ip,
        detail,
        ip,
        href: "/#attack-world-map",
      });
    }
  }

  const proofReplay = (await readJsonFile(dataDir, "proof-replay-webhook-ban.json")) as {
    date?: string;
    ip_block?: string;
    pass?: boolean;
  } | null;
  if (proofReplay?.ip_block) {
    const ts = parseIsoTs(proofReplay.date);
    for (const ip of expandIpBlock(proofReplay.ip_block)) {
      push({
        id: `proof-replay-${ip}`,
        kind: "ban",
        ts,
        title: ip,
        detail: "corpus replay force_waf ban (proof)",
        ip,
        href: `/bans?search=${encodeURIComponent(ip)}`,
      });
    }
  }

  const live = (await readJsonFile(dataDir, "live-attack-report.json")) as {
    date?: string;
    ban_proof?: { ip?: string; reason?: string };
  } | null;
  if (live?.ban_proof?.ip) {
    push({
      id: `proof-live-ban-${live.ban_proof.ip}`,
      kind: "ban",
      ts: parseIsoTs(live.date),
      title: live.ban_proof.ip,
      detail: live.ban_proof.reason ?? "live-attack harness ban_proof",
      ip: live.ban_proof.ip,
      href: `/bans?search=${encodeURIComponent(live.ban_proof.ip)}`,
    });
  }

  const proofWebhook = (await readJsonFile(dataDir, "webhook-route-proof-report.json")) as {
    date?: string;
    prod_e2e?: { ok?: boolean };
    alerts_total?: number;
    metrics_delta?: number;
  } | null;
  if (proofWebhook?.prod_e2e?.ok) {
    const ts = parseIsoTs(proofWebhook.date);
    push({
      id: "proof-webhook-waf",
      kind: "waf",
      ts,
      title: "203.0.113.198",
      detail: `prod webhook E2E — ${proofWebhook.alerts_total ?? 1} alarm, Δ${proofWebhook.metrics_delta ?? 2} Telegram`,
      ip: "203.0.113.198",
      href: "/tests",
    });
    push({
      id: "proof-webhook-ban",
      kind: "ban",
      ts: ts > 0 ? ts + 1 : ts,
      title: "203.0.113.198",
      detail: "prod webhook E2E — ipset ban (RFC5737)",
      ip: "203.0.113.198",
      href: "/bans?search=203.0.113.198",
    });
  }

  return out
    .filter((e) => e.ts > 0 || e.kind === "ban")
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 20);
}
