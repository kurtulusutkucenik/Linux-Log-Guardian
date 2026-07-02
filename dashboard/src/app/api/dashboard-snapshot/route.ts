import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { fetchSocTimelineFallback } from "@/lib/socTimelineFallback";

export const dynamic = "force-dynamic";

const DATA_DIR = process.env.BENCH_DATA_DIR || "/data/lg";

type GuardianStatus = {
  db?: { alerts_total?: number; bans_active?: number };
  incidents?: { active?: number };
  l7_http?: { blocked?: number; inspected?: number };
};

async function readJson<T>(name: string): Promise<T | null> {
  try {
    const raw = await readFile(path.join(DATA_DIR, name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function lineageRceCount(): Promise<number> {
  try {
    const raw = await readFile(path.join(DATA_DIR, "attack_tree.json"), "utf8");
    const parsed = JSON.parse(raw) as
      | { events?: { type?: string }[] }[]
      | { trees?: { events?: { type?: string }[] }[] };
    const trees = Array.isArray(parsed) ? parsed : parsed.trees ?? [];
    let n = 0;
    for (const tree of trees) {
      for (const ev of tree.events ?? []) {
        if (ev.type === "EXEC_SHELL") n++;
      }
    }
    return n;
  } catch {
    return 0;
  }
}

export async function GET() {
  const [status, rceFromTree, socFallback] = await Promise.all([
    readJson<GuardianStatus>("guardian-status.json"),
    lineageRceCount(),
    fetchSocTimelineFallback(DATA_DIR),
  ]);

  const lineageLive = socFallback.filter((e) => e.kind === "lineage").length;
  const banProof = socFallback.filter((e) => e.kind === "ban").length;

  return NextResponse.json({
    hints: {
      from_snapshot: true,
      rce_blocked: rceFromTree,
      lineage_events: lineageLive,
      proof_ban_entries: banProof,
      alerts_total: status?.db?.alerts_total ?? 0,
      bans_active_db: status?.db?.bans_active ?? 0,
      incidents_active: status?.incidents?.active ?? 0,
      l7_blocked: status?.l7_http?.blocked ?? 0,
    },
  });
}
