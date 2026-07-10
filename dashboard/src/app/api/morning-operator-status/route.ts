import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_DIR = process.env.BENCH_DATA_DIR || "/data/lg";

type MorningReport = {
  pass?: boolean;
  date?: string;
  laptop_core_ok?: boolean;
  laptop_core_refreshed?: boolean;
  presentation_ship_ok?: boolean;
  dashboard_ok?: boolean;
  attack_map_parity_ok?: boolean;
  telegram_soc_ok?: boolean;
  eps_smoke_ok?: boolean;
  eps_smoke_peak?: number | null;
  eps_smoke_lines_delta?: number | null;
  proof_tests?: number;
  proof_pass?: number;
  proof_freshness_ok?: boolean;
  proof_stale_ids?: string[];
  dash_url?: string;
  fail_reason?: string;
  script?: string;
  chain_script?: string;
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
  const report = await readJson<MorningReport>("morning-operator-gate-report.json");

  if (!report) {
    return NextResponse.json({
      pass: null,
      at: null,
      checks: [],
      proof_pass: null,
      proof_tests: null,
      run_cmd: "bash scripts/morning_operator_gate.sh",
      chain_cmd: "bash scripts/morning_operator_chain.sh",
      dash_url: "https://localhost:8443/tests",
    });
  }

  const epsDetail =
    report.eps_smoke_ok === true && report.eps_smoke_peak != null
      ? `pk${Number(report.eps_smoke_peak).toFixed(1)}`
      : report.eps_smoke_ok === true
        ? "ok"
        : null;

  const checks = [
    { id: "laptop_core", ok: report.laptop_core_ok === true, detail: report.laptop_core_refreshed ? "refreshed" : "report" },
    { id: "presentation_ship", ok: report.presentation_ship_ok === true },
    { id: "dashboard", ok: report.dashboard_ok === true },
    { id: "attack_map", ok: report.attack_map_parity_ok === true },
    { id: "telegram_soc", ok: report.telegram_soc_ok === true },
    { id: "proof_freshness", ok: report.proof_freshness_ok === true },
    /* Bilgilendirici — morning pass'i bloklamaz; rapor alanı yoksa gizle */
    ...(report.eps_smoke_ok !== undefined
      ? [{ id: "eps_smoke", ok: report.eps_smoke_ok === true, detail: epsDetail }]
      : []),
  ];

  return NextResponse.json({
    pass: report.pass === true,
    at: report.date ?? null,
    fail_reason: report.fail_reason ?? null,
    checks,
    proof_pass: report.proof_pass ?? null,
    proof_tests: report.proof_tests ?? null,
    proof_stale_ids: report.proof_stale_ids ?? [],
    run_cmd: report.script ?? "bash scripts/morning_operator_gate.sh",
    chain_cmd: report.chain_script ?? "bash scripts/morning_operator_chain.sh",
    dash_url: report.dash_url ?? "https://localhost:8443/tests",
    eps_smoke_ok: report.eps_smoke_ok === true,
    eps_smoke_peak: report.eps_smoke_peak ?? null,
    eps_smoke_lines_delta: report.eps_smoke_lines_delta ?? null,
  });
}
