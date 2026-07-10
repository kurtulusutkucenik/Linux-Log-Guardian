import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_DIR = process.env.BENCH_DATA_DIR || "/data/lg";

type EpsSmokeReport = {
  pass?: boolean;
  date?: string;
  fail_reason?: string | null;
  lines_delta?: number;
  peak_eps?: number;
  derived_eps?: number;
  eps_after?: number;
  alerts_delta?: number;
  inject_lines?: number;
  script?: string;
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

export async function GET() {
  const report = await readJson<EpsSmokeReport>("webhook-eps-smoke-report.json");

  if (!report) {
    return NextResponse.json({
      pass: null,
      at: null,
      run_cmd: "sudo bash scripts/webhook_nginx_eps_smoke.sh",
      upgrade_cmd: "sudo bash scripts/upgrade_log_guardian_binary.sh",
    });
  }

  const pass =
    report.pass === true &&
    (report.lines_delta ?? 0) >= 1 &&
    ((report.peak_eps ?? 0) > 0 || (report.derived_eps ?? 0) > 0.5);

  return NextResponse.json({
    pass,
    at: report.date ?? null,
    fail_reason: report.fail_reason ?? null,
    lines_delta: report.lines_delta ?? null,
    peak_eps: report.peak_eps ?? null,
    derived_eps: report.derived_eps ?? null,
    eps_after: report.eps_after ?? null,
    alerts_delta: report.alerts_delta ?? null,
    inject_lines: report.inject_lines ?? null,
    run_cmd: report.script ?? "sudo bash scripts/webhook_nginx_eps_smoke.sh",
    upgrade_cmd: "sudo bash scripts/upgrade_log_guardian_binary.sh",
  });
}
