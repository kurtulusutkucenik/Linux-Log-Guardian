import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_DIR = process.env.BENCH_DATA_DIR || "/data/lg";

type E9Report = {
  pass?: boolean;
  fail_count?: number;
  date?: string;
  competitive_proof?: string;
  enterprise_escalation?: boolean;
  edge_checklist?: boolean;
  relay_lan_exposure?: boolean;
  morning_operator?: boolean;
  eps_smoke?: boolean;
  eps_smoke_peak?: number | null;
  docs_consistency?: boolean;
  vps_prep?: boolean;
  vps_remote?: boolean;
  script?: string;
  doc?: string;
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
  const report = await readJson<E9Report>("enterprise-e9-verify-report.json");

  if (!report) {
    return NextResponse.json({
      pass: null,
      at: null,
      competitive_proof: null,
      fail_count: null,
      checks: [],
      run_cmd: "bash scripts/enterprise_e9_verify.sh",
      doc: "docs/ENTERPRISE_SUPPORT.md",
    });
  }

  const checks = [
    {
      id: "competitive_proof",
      ok: !!report.competitive_proof,
      detail: report.competitive_proof ?? null,
    },
    { id: "enterprise_escalation", ok: report.enterprise_escalation === true },
    { id: "edge_checklist", ok: report.edge_checklist === true },
    { id: "relay_lan_exposure", ok: report.relay_lan_exposure === true },
    { id: "morning_operator", ok: report.morning_operator === true },
    {
      id: "eps_smoke",
      ok: report.eps_smoke === true,
      detail:
        report.eps_smoke_peak != null
          ? `pk${Number(report.eps_smoke_peak).toFixed(1)}`
          : report.eps_smoke === true
            ? "ok"
            : null,
    },
    { id: "docs_consistency", ok: report.docs_consistency === true },
    { id: "vps_prep", ok: report.vps_prep === true },
    { id: "vps_remote", ok: report.vps_remote === true },
  ];

  return NextResponse.json({
    pass: report.pass === true,
    at: report.date ?? null,
    competitive_proof: report.competitive_proof ?? null,
    fail_count: report.fail_count ?? 0,
    checks,
    run_cmd: report.script ?? "bash scripts/enterprise_e9_verify.sh",
    doc: report.doc ?? "docs/ENTERPRISE_SUPPORT.md",
  });
}
