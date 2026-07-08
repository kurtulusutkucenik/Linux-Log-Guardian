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
  const gate = await readJson<{
    date?: string;
    pass?: boolean;
    fail_count?: number;
    laptop_mode?: boolean;
    vps_available?: boolean;
    competitive_proof?: string;
    xdp_report_mode?: string | null;
    vps_when_ready?: string[];
    doc?: string;
  }>("vps-prep-gate-report.json");

  return NextResponse.json({
    at: gate?.date ?? null,
    pass: gate?.pass === true,
    laptop_mode: gate?.laptop_mode !== false,
    vps_available: gate?.vps_available === true,
    competitive_proof: gate?.competitive_proof ?? null,
    xdp_mode: gate?.xdp_report_mode ?? null,
    steps: gate?.vps_when_ready ?? [
      "sudo bash install.sh",
      "sudo bash scripts/install_first_run.sh",
      "sudo bash scripts/vps_xdp_proof.sh",
      "bash scripts/post_install_verify.sh",
    ],
    doc: gate?.doc ?? "docs/VPS_SETUP.md",
    setup: {
      gate: "bash scripts/vps_prep_gate.sh",
      doc: "docs/VPS_SETUP.md",
      xdp: "sudo bash scripts/vps_xdp_proof.sh",
    },
  });
}
