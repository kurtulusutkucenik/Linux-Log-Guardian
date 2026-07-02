import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import os from "os";
import { fetchBannedIps } from "@/lib/fetchBannedIps";
import { guardianApiAuthHeaders } from "@/lib/guardianApiAuth";
import { guardianApiBase } from "@/lib/guardianApiBase";
import type { AttackTree, LineageEvent } from "@/lib/lineageGraph";
import type { SocTimelineEntry, SocTimelineResponse } from "@/lib/socTimelineTypes";
import { fetchSocTimelineFallback } from "@/lib/socTimelineFallback";

export const dynamic = "force-dynamic";

const GUARDIAN_API = guardianApiBase();
const MAX = 32;
const LINEAGE_MIN_RISK = 55;
const BENCH_DATA_DIR = process.env.BENCH_DATA_DIR || "/data/lg";

type StatusAlert = {
  ts?: number;
  ip?: string;
  level?: number;
  message?: string;
  incident_id?: string;
};

type StatusBan = {
  ts?: number;
  ip?: string;
  action?: string;
  reason?: string;
};

type StatusAck = {
  ts?: number;
  ack_key?: string;
  operator?: string;
  operator_id?: string;
};

type GuardianStatus = {
  recent_alerts?: StatusAlert[];
  recent_bans?: StatusBan[];
  recent_telegram_acks?: StatusAck[];
};

function isPublicIp(ip?: string): boolean {
  if (!ip || ip === "lineage" || ip === "system") return false;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
}

function isWafMessage(msg?: string): boolean {
  if (!msg) return false;
  return /WAF|SchemaViolation|SQLi|XSS|CRS|force_waf/i.test(msg);
}

async function readGuardianStatus(): Promise<{ data: GuardianStatus | null; source: string }> {
  const candidates = [
    path.join(BENCH_DATA_DIR, "guardian-status.json"),
    path.join(process.cwd(), "guardian-status.json"),
    path.join(process.cwd(), "..", "guardian-status.json"),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      return { data: JSON.parse(raw) as GuardianStatus, source: "guardian_status" };
    } catch {
      /* next */
    }
  }
  return { data: null, source: "empty" };
}

function wafAlertEntries(alerts: StatusAlert[]): SocTimelineEntry[] {
  const out: SocTimelineEntry[] = [];
  const seen = new Set<string>();
  for (const a of alerts) {
    if (!isWafMessage(a.message) && a.ip !== "lineage") {
      if (!isPublicIp(a.ip) || (a.level ?? 0) < 2) continue;
    }
    if (a.ip === "lineage") continue;
    if (!isPublicIp(a.ip) && !isWafMessage(a.message)) continue;
    const ip = isPublicIp(a.ip) ? a.ip : undefined;
    const id = `waf-${a.ts ?? 0}-${ip ?? "evt"}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      kind: "waf",
      ts: a.ts ?? 0,
      title: ip ?? (a.incident_id || "WAF alarm"),
      detail: a.message ?? "WAF alarm",
      ip,
      risk: a.level != null ? a.level * 20 : undefined,
      href: ip ? `/bans?search=${encodeURIComponent(ip)}` : "/tests",
    });
  }
  return out;
}

function statusBanEntries(bans: StatusBan[]): SocTimelineEntry[] {
  const out: SocTimelineEntry[] = [];
  for (const b of bans) {
    const act = (b.action ?? "").toLowerCase();
    if (act === "unban" || act === "info") continue;
    if (!isPublicIp(b.ip)) continue;
    out.push({
      id: `status-ban-${b.ts ?? 0}-${b.ip}`,
      kind: "ban",
      ts: b.ts ?? 0,
      title: b.ip!,
      detail: b.reason ?? (act || "kernel ban"),
      ip: b.ip,
      href: `/bans?search=${encodeURIComponent(b.ip!)}`,
    });
  }
  return out;
}

function telegramAckEntries(acks: StatusAck[]): SocTimelineEntry[] {
  const out: SocTimelineEntry[] = [];
  for (const a of acks) {
    const key = a.ack_key ?? "";
    const ip = isPublicIp(key) ? key : undefined;
    const operator = a.operator?.trim() || a.operator_id?.trim() || "operator";
    out.push({
      id: `ack-${a.ts ?? 0}-${key || operator}`,
      kind: "ack",
      ts: a.ts ?? 0,
      title: ip ?? key ?? operator,
      detail: ip ? `Gördüm · ${operator}` : `Gördüm · ${operator}`,
      ip,
      href: ip ? `/bans?search=${encodeURIComponent(ip)}` : undefined,
    });
  }
  return out;
}

type IncidentRow = {
  incident_id?: string;
  ip?: string;
  risk_score?: number;
  primary_signal?: string;
  last_ts?: number;
  first_ts?: number;
};

async function fetchIncidents(): Promise<{ rows: IncidentRow[]; source: string }> {
  try {
    const res = await fetch(`${GUARDIAN_API}/api/v1/incidents`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
      headers: guardianApiAuthHeaders(),
    });
    if (res.ok) {
      const data = (await res.json()) as { incidents?: IncidentRow[] };
      return { rows: data.incidents ?? [], source: "guardian_api" };
    }
  } catch {
    /* fallback */
  }
  return { rows: [], source: "empty" };
}

async function readAttackTrees(): Promise<{ trees: AttackTree[]; source: string }> {
  const candidates = [
    process.env.ATTACK_TREE_PATH,
    "/data/lg/attack_tree.json",
    "/run/log-guardian/attack_tree.json",
    path.join(process.cwd(), "attack_tree.json"),
    path.join(process.cwd(), "..", "attack_tree.json"),
    path.join(os.homedir(), ".local/share/log-guardian/attack_tree.json"),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      const parsed = JSON.parse(raw) as AttackTree[] | { trees?: AttackTree[] };
      const trees = Array.isArray(parsed) ? parsed : parsed.trees ?? [];
      if (trees.length > 0) return { trees, source: "daemon_file" };
    } catch {
      /* next */
    }
  }

  try {
    const res = await fetch(`${GUARDIAN_API}/api/v1/attack-tree`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
      headers: guardianApiAuthHeaders(),
    });
    if (res.ok) {
      const data = (await res.json()) as { trees?: AttackTree[] };
      if (data.trees?.length) return { trees: data.trees, source: "guardian_api" };
    }
  } catch {
    /* empty */
  }

  return { trees: [], source: "empty" };
}

function incidentEntries(rows: IncidentRow[]): SocTimelineEntry[] {
  return rows.map((inc) => ({
    id: `inc-${inc.incident_id ?? inc.ip}`,
    kind: "incident" as const,
    ts: inc.last_ts ?? inc.first_ts ?? 0,
    title: inc.incident_id ?? "incident",
    detail: inc.primary_signal ?? "multi-signal",
    ip: inc.ip,
    risk: inc.risk_score,
    href: inc.incident_id ? `/?incident=${encodeURIComponent(inc.incident_id)}` : undefined,
  }));
}

function banEntries(
  bans: { ip: string; reason?: string; ts?: number }[],
): SocTimelineEntry[] {
  const now = Math.floor(Date.now() / 1000);
  return bans.map((b, i) => ({
    id: `ban-${b.ip}-${b.ts ?? i}`,
    kind: "ban" as const,
    ts: b.ts && b.ts > 1_000_000_000 ? b.ts : now - i,
    title: b.ip,
    detail: b.reason ?? "kernel ban",
    ip: b.ip,
    href: "/bans",
  }));
}

function lineageEntries(trees: AttackTree[]): SocTimelineEntry[] {
  const out: SocTimelineEntry[] = [];
  const hotTypes = new Set(["EXEC_SHELL", "NET_CONNECT", "FILE_READ"]);
  for (const tree of trees) {
    if ((tree.risk ?? 0) < LINEAGE_MIN_RISK) continue;
    for (const ev of tree.events ?? []) {
      const e = ev as LineageEvent;
      if (!hotTypes.has(e.type)) continue;
      out.push({
        id: `lg-${tree.pid}-${e.ts}-${e.type}`,
        kind: "lineage",
        ts: e.ts,
        title: `${tree.comm} · ${e.type}`,
        detail: e.detail,
        risk: tree.risk,
        href: "/attack-tree",
      });
    }
  }
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const previewEnv = process.env.SOC_TIMELINE_PREVIEW !== "0";
  const previewQuery = searchParams.get("preview") === "1";
  const allowPreview = previewEnv || previewQuery;

  const [inc, banRes, lineage, status] = await Promise.all([
    fetchIncidents(),
    fetchBannedIps({ limit: 20, offset: 0 }),
    readAttackTrees(),
    readGuardianStatus(),
  ]);

  const statusAlerts = status.data?.recent_alerts ?? [];
  const statusBans = status.data?.recent_bans ?? [];
  const statusAcks = status.data?.recent_telegram_acks ?? [];

  const entries = [
    ...incidentEntries(inc.rows),
    ...banEntries(banRes.bans),
    ...lineageEntries(lineage.trees),
    ...wafAlertEntries(statusAlerts),
    ...statusBanEntries(statusBans),
    ...telegramAckEntries(statusAcks),
  ]
    .filter((e) => e.ts > 0 || e.kind === "ban")
    .sort((a, b) => b.ts - a.ts)
    .slice(0, MAX);

  const deduped: SocTimelineEntry[] = [];
  const seenIds = new Set<string>();
  for (const e of entries) {
    if (seenIds.has(e.id)) continue;
    seenIds.add(e.id);
    deduped.push(e);
  }
  const finalSorted = deduped.sort((a, b) => b.ts - a.ts).slice(0, MAX);

  let data_mode: SocTimelineResponse["data_mode"] = "none";
  const liveSources = [
    inc.source === "guardian_api" && inc.rows.length > 0,
    banRes.source !== "empty" && banRes.count > 0,
    lineage.source !== "empty" && lineage.trees.length > 0,
    status.source === "guardian_status" &&
      (wafAlertEntries(statusAlerts).length > 0 ||
        statusBanEntries(statusBans).length > 0 ||
        telegramAckEntries(statusAcks).length > 0),
  ];
  const liveCount = liveSources.filter(Boolean).length;

  let finalEntries = finalSorted;
  if (entries.length > 0) {
    data_mode = liveCount >= 2 ? "live" : "live_partial";
  } else if (allowPreview) {
    const fallback = await fetchSocTimelineFallback(BENCH_DATA_DIR);
    if (fallback.length > 0) {
      finalEntries = fallback.slice(0, MAX);
      data_mode = "preview";
    }
  }

  const body: SocTimelineResponse = {
    entries: finalEntries,
    sources: {
      incidents: inc.source,
      bans: banRes.source,
      lineage: lineage.source,
      status: status.source,
    },
    data_mode,
    preview_allowed: allowPreview,
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, max-age=5" },
  });
}
