import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

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
  const [status, wasm] = await Promise.all([
    readJson<{
      ipc?: string;
      xdp_mode?: string;
      wasm?: { native?: boolean; enabled?: boolean; plugins_native?: number; plugins_active?: number };
      l7_http?: {
        inspected?: number;
        blocked?: number;
        ebpf_hits?: number;
        probe_active?: boolean;
        probe?: string;
      };
      daemon?: {
        lineage_events?: number;
        lineage_connects?: number;
        l7_probe?: boolean;
        l7_http_hits?: number;
        xdp_active?: boolean;
        execve_probe?: boolean;
      };
    }>("guardian-status.json"),
    readJson<{
      mode?: string;
      pass?: boolean;
      plugins_native?: number;
      alerts_on_sqli?: number;
      plugin_bytes?: number;
    }>("wasm-status.json"),
  ]);

  const wasmNative =
    wasm?.mode === "native" && wasm.pass === true
      ? true
      : Boolean(status?.wasm?.native);
  const l7 = status?.l7_http ?? {};
  const daemon = status?.daemon ?? {};

  return NextResponse.json({
    data_mode: status?.ipc === "ok" ? "live" : "preview",
    ipc: status?.ipc ?? "unknown",
    xdp_mode: status?.xdp_mode ?? "unknown",
    xdp_active: Boolean(daemon.xdp_active),
    wasm: {
      mode: wasm?.mode ?? (wasmNative ? "native" : "stub"),
      pass: wasm?.pass ?? wasmNative,
      plugins_native: wasm?.plugins_native ?? status?.wasm?.plugins_native ?? 0,
      alerts_on_sqli: wasm?.alerts_on_sqli ?? 0,
      plugin_bytes: wasm?.plugin_bytes ?? 0,
    },
    l7: {
      probe_active: Boolean(l7.probe_active || daemon.l7_probe),
      probe: l7.probe ?? "—",
      inspected: l7.inspected ?? 0,
      blocked: l7.blocked ?? 0,
      ebpf_hits: l7.ebpf_hits ?? 0,
      http_hits: daemon.l7_http_hits ?? 0,
    },
    lineage: {
      events: daemon.lineage_events ?? 0,
      connects: daemon.lineage_connects ?? 0,
      execve_probe: Boolean(daemon.execve_probe),
    },
  });
}
