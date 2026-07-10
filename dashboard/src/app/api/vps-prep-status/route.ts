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

function excerptRemote(raw?: string | null): string | null {
  if (!raw) return null;
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 6);
  return lines.length > 0 ? lines.join(" · ") : null;
}

export async function GET() {
  const [gate, remote] = await Promise.all([
    readJson<{
      date?: string;
      pass?: boolean;
      fail_count?: number;
      laptop_mode?: boolean;
      vps_available?: boolean;
      competitive_proof?: string;
      xdp_report_mode?: string | null;
      vps_when_ready?: string[];
      doc?: string;
    }>("vps-prep-gate-report.json"),
    readJson<{
      date?: string;
      pass?: boolean;
      reachable?: boolean;
      host_up?: boolean;
      ssh_ok?: boolean;
      auth_error?: boolean;
      connection_error?: boolean;
      host?: string;
      port?: number;
      hostname?: string | null;
      remote_root?: string | null;
      xdp_mode?: string | null;
      soak_active?: boolean | null;
      soak_mode?: string | null;
      soak_elapsed?: string | null;
      soak_progress?: number | null;
      soak_proof_72h?: number | null;
      soak_synced?: boolean | null;
      soak_failures?: string | null;
      eps?: number | null;
      raw_excerpt?: string;
      hint?: string;
    }>("vps-remote-status-report.json"),
  ]);

  const remoteSshOk = remote?.ssh_ok === true || remote?.reachable === true;
  const remoteHostUp = remote?.host_up === true || remote?.auth_error === true;
  const remotePass = remote?.pass === true;
  const remoteXdp =
    remoteSshOk && remote && "xdp_mode" in remote && remote.xdp_mode
      ? String(remote.xdp_mode)
      : null;

  return NextResponse.json({
    at: remote?.date ?? gate?.date ?? null,
    pass: gate?.pass === true,
    laptop_mode: gate?.laptop_mode !== false && !remoteSshOk,
    vps_available: gate?.vps_available === true || remoteSshOk,
    competitive_proof: gate?.competitive_proof ?? null,
    xdp_mode: remoteXdp ?? gate?.xdp_report_mode ?? null,
    steps: gate?.vps_when_ready ?? [
      "sudo bash install.sh",
      "sudo bash scripts/install_first_run.sh",
      "sudo bash scripts/vps_xdp_proof.sh",
      "bash scripts/post_install_verify.sh",
    ],
    doc: gate?.doc ?? "docs/VPS_SETUP.md",
    remote: remote
      ? {
          pass: remotePass,
          reachable: remoteSshOk,
          host_up: remoteHostUp,
          ssh_ok: remoteSshOk,
          auth_error: remote.auth_error === true,
          connection_error: remote.connection_error === true,
          at: remote.date ?? null,
          host: remote.host ?? null,
          port: remote.port ?? 22,
          hostname: remote.hostname ?? null,
          remote_root: remote.remote_root ?? null,
          xdp_mode: remote.xdp_mode ?? null,
          soak_active: remote.soak_active === true,
          soak_mode: remote.soak_mode ?? null,
          soak_elapsed: remote.soak_elapsed ?? null,
          soak_progress: typeof remote.soak_progress === "number" ? remote.soak_progress : null,
          soak_proof_72h: typeof remote.soak_proof_72h === "number" ? remote.soak_proof_72h : null,
          soak_synced: remote.soak_synced === true,
          soak_failures: remote.soak_failures ?? null,
          eps: typeof remote.eps === "number" ? remote.eps : null,
          excerpt: excerptRemote(remote.raw_excerpt),
          hint: remote.hint ?? null,
        }
      : null,
    setup: {
      gate: "bash scripts/vps_prep_gate.sh",
      doc: "docs/VPS_SETUP.md",
      xdp: "sudo bash scripts/vps_xdp_proof.sh",
      remote: "QUIET=1 source .cache/vps-production.env && bash scripts/vps_remote_status.sh",
      remote_host: "VPS_HOST=root@HOST bash scripts/vps_remote_status.sh",
      ssh_copy_id: "ssh-copy-id root@157.173.122.198",
    },
  });
}
