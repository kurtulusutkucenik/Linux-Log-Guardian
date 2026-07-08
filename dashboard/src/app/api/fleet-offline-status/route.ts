import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

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
  const [gate, multi] = await Promise.all([
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
  ]);

  let liveOnline = 0;
  let liveTotal = 0;
  let liveAgents: { id: string; online: boolean; age_sec: number }[] = [];
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
  } catch {
    /* prisma yoksa gate sayilarina dus */
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
      weekly: "bash scripts/weekly_operator_ritual.sh",
    },
  });
}
