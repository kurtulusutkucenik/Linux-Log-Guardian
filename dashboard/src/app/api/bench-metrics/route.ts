import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

async function readJson(name: string) {
  const dir = process.env.BENCH_DATA_DIR;
  const candidates = [
    ...(dir ? [path.join(dir, name)] : []),
    path.join("/data/lg", name),
    path.join(process.cwd(), name),
    path.join(process.cwd(), "..", name),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      return JSON.parse(raw);
    } catch {
      /* next */
    }
  }
  return null;
}

export async function GET() {
  const bench = await readJson("bench-vs-modsec.json");
  const ban = await readJson("bench-ban-latency.json");
  const fp = await readJson("fp-report.json");
  const live = await readJson("guardian-status.json");
  const falco = await readJson("rules/generated-falco-host.json");
  const crs = await readJson("crs-parity-report.json");
  const isolation = await readJson("tenant-isolation-report.json");

  const available = Boolean(bench || ban || fp || live || crs);

  const modsec = bench
    ? {
        eps: bench.modsecurity?.eps,
        latency_us_per_line: bench.modsecurity?.latency_us_per_line,
        guardian_latency_us_per_line: bench.log_guardian?.latency_us_per_line,
        eps_ratio: bench.comparison?.guardian_eps_over_crs_replay ?? null,
        latency_ratio: bench.comparison?.crs_latency_over_guardian ?? null,
        same_corpus: bench.comparison?.same_log_corpus ?? true,
        note: bench.modsecurity?.note,
      }
    : null;

  return NextResponse.json({
    available,
    bench,
    modsec,
    ban,
    fp,
    live,
    falco: falco ? { count: falco.count } : null,
    crs: crs
      ? {
          attack_recall_pct: crs.guardian?.attack_recall_pct,
          parity_pct: crs.parity_pct,
          pass: crs.pass,
        }
      : null,
    isolation: isolation
      ? {
          pass: isolation.pass,
          checks_passed: isolation.checks_passed,
          checks_total: isolation.checks_total,
          tenant_id: isolation.tenant?.id,
        }
      : null,
    hint: available
      ? null
      : "Run: bash scripts/competitive_suite.sh",
  });
}
