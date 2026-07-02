import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const BENCH_DATA_DIR = process.env.BENCH_DATA_DIR || "/data/lg";

type StatusAck = {
  ts?: number;
  ack_key?: string;
  operator?: string;
  operator_id?: string;
};

function isPublicIp(ip?: string): boolean {
  return Boolean(ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip));
}

async function readAcks(): Promise<StatusAck[]> {
  const candidates = [
    path.join(BENCH_DATA_DIR, "guardian-status.json"),
    path.join(process.cwd(), "guardian-status.json"),
    path.join(process.cwd(), "..", "guardian-status.json"),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      const data = JSON.parse(raw) as { recent_telegram_acks?: StatusAck[] };
      return data.recent_telegram_acks ?? [];
    } catch {
      /* next */
    }
  }
  return [];
}

export async function GET() {
  const rows = await readAcks();
  const by_ip: Record<string, { operator: string; ts: number }> = {};
  for (const a of rows) {
    const key = a.ack_key ?? "";
    if (!isPublicIp(key)) continue;
    if (!by_ip[key] || (a.ts ?? 0) > (by_ip[key].ts ?? 0)) {
      by_ip[key] = {
        operator: a.operator?.trim() || a.operator_id?.trim() || "operator",
        ts: a.ts ?? 0,
      };
    }
  }
  return NextResponse.json({
    acks: rows,
    by_ip,
    count: Object.keys(by_ip).length,
  });
}
