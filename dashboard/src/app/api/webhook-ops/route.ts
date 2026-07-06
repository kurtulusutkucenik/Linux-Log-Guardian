import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { parseGuardianMetrics } from "@/lib/prometheusParse";

export const dynamic = "force-dynamic";

const DATA_DIR = process.env.BENCH_DATA_DIR || "/data/lg";

type GuardianNotifications = {
  enabled?: boolean;
  dry_run?: boolean;
  telegram?: boolean;
  telegram_route?: boolean;
  telegram_batch_sec?: number;
  telegram_topic_waf?: number;
  telegram_topic_ban?: number;
  queue_depth?: number;
  quiet_hours?: boolean;
  quiet_active?: boolean;
  ack_24h?: number;
  unacked_24h?: number;
};

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
  const [status, proof, undo, live] = await Promise.all([
    readJson<{ ipc?: string; notifications?: GuardianNotifications }>("guardian-status.json"),
    readJson<{
      pass?: boolean;
      batch_sec?: number;
      route_enabled?: boolean;
      mode?: string;
      date?: string;
      prod_e2e?: { ok?: boolean; skipped?: boolean };
      metrics_delta?: number;
      alerts_total?: number;
    }>("webhook-route-proof-report.json"),
    readJson<{
      pass?: boolean;
      ip?: string;
      mode?: string;
      date?: string;
    }>("telegram-operator-undo-e2e-report.json"),
    fetchLiveMetrics(),
  ]);

  const n = status?.notifications ?? {};
  const ipcOk = status?.ipc === "ok";
  const batchSec = live?.webhook_telegram_batch_sec || n.telegram_batch_sec || proof?.batch_sec || 0;
  const routeOn =
    Boolean(n.telegram_route) ||
    live?.webhook_telegram_route === 1 ||
    proof?.route_enabled === true;
  const telegramLive = Boolean(n.telegram) && !Boolean(n.dry_run);
  const metricsLive = Boolean(live?.reachable);
  const dataMode: "live" | "proof" | "unknown" = telegramLive && (metricsLive || ipcOk)
    ? "live"
    : proof?.pass
      ? "proof"
      : metricsLive
        ? "live"
        : "unknown";

  return NextResponse.json({
    data_mode: dataMode,
    telegram_enabled: Boolean(n.telegram),
    telegram_route: routeOn,
    batch_sec: batchSec,
    batch_active: batchSec > 0,
    queue_depth: live?.webhook_queue_depth ?? n.queue_depth ?? 0,
    ack_24h: live?.telegram_ack_24h ?? n.ack_24h ?? 0,
    unacked_24h: live?.telegram_unacked_24h ?? n.unacked_24h ?? 0,
    quiet_active: Boolean(n.quiet_active) || live?.webhook_quiet_active === 1,
    dry_run: Boolean(n.dry_run),
    proof_pass: proof?.pass === true,
    proof_mode: proof?.mode ?? null,
    prod_e2e_ok:
      proof?.prod_e2e?.ok === true && proof?.prod_e2e?.skipped !== true,
    prod_e2e_at: proof?.date ?? null,
    prod_e2e_metrics_delta: proof?.metrics_delta ?? null,
    prod_e2e_alerts: proof?.alerts_total ?? null,
    undo_e2e_ok: undo?.pass === true,
    undo_e2e_at: undo?.date ?? null,
    undo_e2e_ip: undo?.ip ?? null,
    undo_e2e_mode: undo?.mode ?? null,
    webhook_sent: live?.webhook_sent_total ?? 0,
    webhook_fail: live?.webhook_fail_total ?? 0,
    webhook_drops: live?.webhook_queue_drops_total ?? 0,
    topics: {
      waf: n.telegram_topic_waf ?? 0,
      ban: n.telegram_topic_ban ?? 0,
    },
  });
}
