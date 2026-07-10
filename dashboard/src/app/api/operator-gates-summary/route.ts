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
  const [morning, fleet, vpsRemote, vpsPrep, e9, relay, epsSmoke] = await Promise.all([
    readJson<{
      pass?: boolean;
      proof_pass?: number;
      proof_tests?: number;
    }>("morning-operator-gate-report.json"),
    readJson<{
      pass?: boolean;
      online?: number;
      total?: number;
    }>("fleet-offline-gate-report.json"),
    readJson<{
      ssh_ok?: boolean;
      soak_proof_72h?: number;
      xdp_mode?: string | null;
    }>("vps-remote-status-report.json"),
    readJson<{ pass?: boolean; competitive_proof?: string }>("vps-prep-gate-report.json"),
    readJson<{ pass?: boolean; competitive_proof?: string }>("enterprise-e9-verify-report.json"),
    readJson<{ pass?: boolean; fail_count?: number }>("relay-lan-exposure-report.json"),
    readJson<{
      pass?: boolean;
      lines_delta?: number;
      peak_eps?: number;
      derived_eps?: number;
    }>("webhook-eps-smoke-report.json"),
  ]);

  const handsOff = Boolean(vpsRemote?.ssh_ok) && (vpsRemote?.soak_proof_72h ?? 0) >= 72;

  return NextResponse.json({
    at: new Date().toISOString(),
    morning: morning
      ? {
          pass: morning.pass === true,
          proof:
            morning.proof_pass != null && morning.proof_tests != null
              ? `${morning.proof_pass}/${morning.proof_tests}`
              : null,
        }
      : null,
    fleet: fleet
      ? {
          pass: fleet.pass === true,
          online: `${fleet.online ?? 0}/${fleet.total ?? 0}`,
        }
      : null,
    vps: {
      pass: vpsPrep?.pass === true || handsOff,
      hands_off: handsOff,
      ssh_ok: vpsRemote?.ssh_ok === true,
      soak_72h: (vpsRemote?.soak_proof_72h ?? 0) >= 72,
      xdp_mode: vpsRemote?.xdp_mode ?? null,
      proof: vpsPrep?.competitive_proof ?? null,
    },
    e9: e9
      ? {
          pass: e9.pass === true,
          proof: e9.competitive_proof ?? null,
        }
      : null,
    relay_lan: relay
      ? {
          pass: relay.pass === true,
          fail_count: relay.fail_count ?? 0,
        }
      : null,
    eps_smoke: epsSmoke
      ? {
          pass:
            epsSmoke.pass === true &&
            (epsSmoke.lines_delta ?? 0) >= 1 &&
            ((epsSmoke.peak_eps ?? 0) > 0 || (epsSmoke.derived_eps ?? 0) > 0.5),
          peak_eps: epsSmoke.peak_eps ?? null,
          derived_eps: epsSmoke.derived_eps ?? null,
          lines_delta: epsSmoke.lines_delta ?? null,
        }
      : null,
  });
}
