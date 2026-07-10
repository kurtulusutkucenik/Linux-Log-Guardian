import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { buildVpsFleetShadow, readVpsRemoteStatus, VPS_FLEET_AGENT_ID } from "@/lib/vpsFleetShadow";

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
  const staleHoursDefault = 48;
  const [gate, multi, pruneReport] = await Promise.all([
    readJson<{
      date?: string;
      pass?: boolean;
      reason?: string;
      online?: number;
      total?: number;
      mode?: string;
      max_age_min?: number;
    }>("fleet-offline-gate-report.json"),
    readJson<{
      date?: string;
      pass?: boolean;
      mode?: string;
      agent_count?: number;
      online_count?: number;
      agents?: string[];
      vm_fallback?: boolean;
    }>("fleet-multi-node-report.json"),
    readJson<{
      date?: string;
      pass?: boolean;
      closed?: number;
      dry_run?: boolean;
      stale_hours?: number;
      pending_young?: number;
      pending_total?: number;
      pending_young_items?: Array<{
        type?: string;
        status?: string;
        target?: string;
        age_h?: number;
        payload?: string;
      }>;
      groups?: Record<string, number>;
    }>("fleet-prune-cmds-report.json"),
  ]);

  let liveOnline = 0;
  let liveTotal = 0;
  let liveAgents: { id: string; online: boolean; age_sec: number; remote_shadow?: boolean }[] = [];
  let pendingTotal = 0;
  let pendingStale = 0;
  let pendingYoung = 0;
  let pendingItems: {
    type: string;
    status: string;
    target: string;
    age_h: number;
    payload: string;
  }[] = [];
  const staleHours = pruneReport?.stale_hours ?? staleHoursDefault;
  const cutoff = new Date(Date.now() - staleHours * 3600 * 1000);

  try {
    const now = Date.now();
    const ONLINE_MS = 15_000;
    const agents = await prisma.telemetry.findMany({
      select: { agentId: true, lastSeen: true },
    });
    liveTotal = agents.length;
    liveAgents = agents.map((a) => {
      const age = Math.max(0, (now - new Date(a.lastSeen).getTime()) / 1000);
      const online = age * 1000 < ONLINE_MS;
      if (online) liveOnline += 1;
      return { id: a.agentId, online, age_sec: Math.round(age) };
    });

    const [pendingCount, stuck] = await Promise.all([
      prisma.agentCommand.count({
        where: { executed: false, status: { in: ["delivered", "pending"] } },
      }),
      prisma.agentCommand.findMany({
        where: { executed: false, status: { in: ["delivered", "pending"] } },
        select: { commandType: true, status: true, targetAgentId: true, payload: true, createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 24,
      }),
    ]);
    pendingTotal = pendingCount;
    for (const c of stuck) {
      const ageH = Math.max(0, (Date.now() - new Date(c.createdAt).getTime()) / 3600000);
      if (new Date(c.createdAt) < cutoff) pendingStale += 1;
      else {
        pendingYoung += 1;
        if (pendingItems.length < 8) {
          pendingItems.push({
            type: c.commandType,
            status: c.status,
            target: c.targetAgentId || "*",
            age_h: Math.round(ageH * 10) / 10,
            payload: c.payload.slice(0, 64),
          });
        }
      }
    }
  } catch {
    /* prisma yoksa gate sayilarina dus */
    pendingTotal = pruneReport?.pending_total ?? 0;
    pendingYoung = pruneReport?.pending_young ?? 0;
    pendingStale = Math.max(0, pendingTotal - pendingYoung);
    pendingItems = (pruneReport?.pending_young_items ?? []).map((c) => ({
      type: c.type ?? "?",
      status: c.status ?? "?",
      target: c.target ?? "*",
      age_h: c.age_h ?? 0,
      payload: c.payload ?? "",
    }));
  }

  const vpsRemote = await readVpsRemoteStatus();
  const shadow = buildVpsFleetShadow(vpsRemote);
  if (shadow && !liveAgents.some((a) => a.id === VPS_FLEET_AGENT_ID)) {
    liveAgents = [
      ...liveAgents,
      { id: shadow.agent_id, online: true, age_sec: 0, remote_shadow: true },
    ];
  }

  return NextResponse.json({
    at: gate?.date ?? multi?.date ?? null,
    gate: {
      pass: gate?.pass === true,
      reason: gate?.reason || null,
      online: gate?.online ?? multi?.online_count ?? 0,
      total: gate?.total ?? multi?.agent_count ?? 0,
      mode: gate?.mode ?? multi?.mode ?? null,
      max_age_min: gate?.max_age_min ?? 15,
    },
    live: {
      online: liveOnline,
      total: liveTotal,
      agents: liveAgents,
      heartbeat_sec: 15,
    },
    remote_shadow: shadow
      ? {
          agent_id: shadow.agent_id,
          host: shadow.host,
          hostname: shadow.hostname,
          xdp_mode: shadow.xdp_mode,
          soak_proof_72h: shadow.soak_proof_72h,
        }
      : null,
    report_stale:
      liveTotal > 0 &&
      ((gate?.online ?? multi?.online_count ?? 0) !== liveOnline ||
        (gate?.total ?? multi?.agent_count ?? 0) !== liveTotal),
    multi: multi
      ? {
          pass: multi.pass === true,
          mode: multi.mode ?? null,
          agent_count: multi.agent_count ?? 0,
          online_count: multi.online_count ?? 0,
          agents: multi.agents ?? [],
          vm_fallback: multi.vm_fallback === true,
        }
      : null,
    setup: {
      gate: "bash scripts/fleet_offline_gate.sh",
      refresh: "FLEET_MODE=laptop-simulated bash scripts/fleet_multi_node_e2e.sh",
      host_keepalive: "bash scripts/host_fleet_agent_setup.sh --install-user-service",
      prune: "bash scripts/fleet_prune_pending_commands.sh",
      prune_demo: "STALE_MINUTES=30 bash scripts/fleet_prune_pending_commands.sh",
      prune_dry: "DRY_RUN=1 bash scripts/fleet_prune_pending_commands.sh",
      weekly: "bash scripts/weekly_operator_ritual.sh",
    },
    prune: {
      pass: pruneReport?.pass !== false,
      at: pruneReport?.date ?? null,
      closed_last: pruneReport?.closed ?? 0,
      stale_hours: staleHours,
      pending_total: pendingTotal,
      pending_young: pendingYoung,
      pending_stale: pendingStale,
      needs_prune: pendingStale > 0,
      items: pendingItems,
    },
  });
}
