import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { guardianMetricsUrl } from "@/lib/guardianMetricsUrl";

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
  const [caddy, dashBan, banMtls, soarGate, mtlsExpiry] = await Promise.all([
    readJson<{
      enabled?: boolean;
      enabled_at?: string | null;
      soar_url?: string;
      dashboard_url?: string;
      relay_url?: string;
      metrics_relay_url?: string;
      host_api_bridge?: string;
      host_api_url?: string;
      metrics_ok?: boolean;
      host_api_bridge_ok?: boolean;
      caddy_mtls_verify?: boolean;
      caddy_skipped?: boolean;
      mtls_verify?: boolean;
      mtls_strict?: boolean;
      relay_ok?: boolean;
      host_ok?: boolean;
      docker_ok?: boolean;
      dashboard_ban_pass?: boolean;
      date?: string;
    }>("caddy-mtls-status.json"),
    readJson<{
      pass?: boolean;
      date?: string;
      host_api?: { ok?: boolean; url?: string };
      relay_api?: { ok?: boolean; url?: string };
      docker_api?: { ok?: boolean };
      metrics_api?: { ok?: boolean; url?: string };
      host_api_bridge?: { ok?: boolean; note?: string };
      ban_path?: string;
      test_ip?: string;
    }>("dashboard-ban-api-report.json"),
    readJson<{
      pass?: boolean;
      mtls_verify?: boolean;
      caddy_mtls_verify?: boolean;
      caddy_skipped?: boolean;
      date?: string;
    }>("ban-api-mtls-report.json"),
    readJson<{
      pass?: boolean;
      mode?: string;
      soar_enabled?: boolean;
      mtls_strict?: boolean;
      dashboard_ban_ok?: boolean;
      caddy_mtls_ok?: boolean | null;
      mutation_ok?: boolean;
      date?: string;
      fail_reason?: string | null;
    }>("enterprise-soar-gate-report.json"),
    readJson<{
      pass?: boolean;
      skipped?: boolean;
      min_days_left?: number | null;
      warn_days?: number;
      certs?: Array<{ id?: string; days_left?: number; ok?: boolean }>;
      date?: string;
    }>("mtls-cert-expiry-report.json"),
  ]);

  const relayOk = dashBan?.relay_api?.ok ?? caddy?.relay_ok ?? false;
  const hostOk = dashBan?.host_api?.ok ?? caddy?.host_ok ?? false;
  const dockerOk = dashBan?.docker_api?.ok ?? caddy?.docker_ok ?? false;
  const metricsReportOk = dashBan?.metrics_api?.ok ?? caddy?.metrics_ok ?? false;
  const bridgeOk =
    dashBan?.host_api_bridge?.ok ?? caddy?.host_api_bridge_ok ?? (relayOk && metricsReportOk);

  let metricsLiveOk = false;
  try {
    const res = await fetch(guardianMetricsUrl(), {
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const text = await res.text();
      metricsLiveOk = text.includes("loganalyzer_");
    }
  } catch {
    metricsLiveOk = false;
  }

  return NextResponse.json({
    at: soarGate?.date ?? caddy?.date ?? dashBan?.date ?? banMtls?.date ?? null,
    relay: {
      ok: relayOk,
      url: dashBan?.relay_api?.url ?? caddy?.relay_url ?? "http://ban-api-relay:18090",
    },
    host: {
      ok: hostOk,
      url: dashBan?.host_api?.url ?? caddy?.host_api_url ?? "http://127.0.0.1:8090",
    },
    docker: {
      ok: dockerOk,
    },
    metrics: {
      ok: metricsLiveOk || metricsReportOk,
      live: metricsLiveOk,
      url: dashBan?.metrics_api?.url ?? caddy?.metrics_relay_url ?? "http://metrics-relay:19091/metrics",
    },
    host_api_bridge: {
      ok: bridgeOk,
      note: dashBan?.host_api_bridge?.note ?? caddy?.host_api_bridge ?? "docker0 :18091/:19092",
    },
    ban_path: dashBan?.ban_path ?? null,
    dashboard_ban_pass: dashBan?.pass ?? caddy?.dashboard_ban_pass ?? false,
    soar: {
      enabled: caddy?.enabled === true,
      enabled_at: caddy?.enabled_at ?? null,
      url: caddy?.soar_url ?? "https://localhost:9443",
      caddy_mtls_verify: banMtls?.caddy_mtls_verify ?? caddy?.caddy_mtls_verify ?? false,
      caddy_skipped: banMtls?.caddy_skipped ?? caddy?.caddy_skipped ?? true,
      mtls_lab: banMtls?.mtls_verify === true,
    },
    setup: {
      enable: "sudo bash scripts/enable_enterprise_soar_api.sh",
      disable: "sudo bash scripts/disable_enterprise_soar_api.sh",
      test: "bash scripts/caddy_api_mtls_e2e.sh",
      smoke: "bash scripts/dashboard_ban_smoke.sh",
      gate: "bash scripts/enterprise_soar_gate.sh",
      sync: "sudo bash scripts/caddy_mtls_setup.sh sync",
    },
    enterprise_gate: {
      pass: soarGate?.pass === true,
      mode: soarGate?.mode ?? (caddy?.enabled ? "enterprise" : "community"),
      mutation_ok: soarGate?.mutation_ok ?? banMtls?.pass === true,
    },
    mtls_strict: soarGate?.mtls_strict === true || caddy?.mtls_strict === true,
    mtls_expiry: mtlsExpiry?.skipped
      ? null
      : {
          pass: mtlsExpiry?.pass === true,
          min_days_left: mtlsExpiry?.min_days_left ?? null,
          warn_days: mtlsExpiry?.warn_days ?? 14,
          certs: mtlsExpiry?.certs ?? [],
          date: mtlsExpiry?.date ?? null,
          check_cmd: "bash scripts/mtls_cert_expiry_check.sh",
        },
  });
}
