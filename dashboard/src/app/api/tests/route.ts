import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { evaluateValidationTests, type TestReports } from "@/lib/validationTests";

export const dynamic = "force-dynamic";

async function readJson(name: string): Promise<unknown | null> {
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

async function readBestSoak(): Promise<unknown | null> {
  const files = ["soak-report.json", "soak-report.short.json"];
  let best: { duration_sec?: number } | null = null;
  for (const f of files) {
    const data = (await readJson(f)) as { duration_sec?: number } | null;
    if (!data) continue;
    const sec = data.duration_sec ?? 0;
    if (!best || sec > (best.duration_sec ?? 0)) best = data;
  }
  return best;
}

export async function GET(req: NextRequest) {
  const localeParam = req.nextUrl.searchParams.get("locale");
  const locale = localeParam === "en" ? "en" : "tr";

  const [crs, fp, realAttack, realAttack10k, liveAttack, ja3Cluster, ja3ClusterBanLive, fpClusterTrust, lineageLive, nginxConsult, owaspCorpus, trHostingCorpus, threatIntelSync, soak, soakShort, isolation, bench, ban, live] =
    await Promise.all([
      readJson("crs-parity-report.json"),
      readJson("fp-report.json"),
      readJson("real-attack-report.json"),
      readJson("real-attack-report-10k.json"),
      readJson("live-attack-report.json"),
      readJson("ja3-cluster-report.json"),
      readJson("ja3-cluster-ban-live.json"),
      readJson("fp-cluster-trust-report.json"),
      readJson("lineage-live-report.json"),
      readJson("nginx-inline-consult-report.json"),
      readJson("owasp-corpus-report.json"),
      readJson("tr-hosting-corpus-report.json"),
      readJson("threat-intel-sync-report.json"),
      readBestSoak(),
      readJson("soak-report.short.json"),
      readJson("tenant-isolation-report.json"),
      readJson("bench-vs-modsec.json"),
      readJson("bench-ban-latency.json"),
      readJson("guardian-status.json"),
    ]);

  const reports: TestReports = {
    crs: crs as TestReports["crs"],
    fp: fp as TestReports["fp"],
    realAttack: realAttack as TestReports["realAttack"],
    realAttack10k: realAttack10k as TestReports["realAttack10k"],
    liveAttack: liveAttack as TestReports["liveAttack"],
    ja3Cluster: ja3Cluster as TestReports["ja3Cluster"],
    ja3ClusterBanLive: ja3ClusterBanLive as TestReports["ja3ClusterBanLive"],
    fpClusterTrust: fpClusterTrust as TestReports["fpClusterTrust"],
    lineageLive: lineageLive as TestReports["lineageLive"],
    nginxConsult: nginxConsult as TestReports["nginxConsult"],
    owaspCorpus: owaspCorpus as TestReports["owaspCorpus"],
    trHostingCorpus: trHostingCorpus as TestReports["trHostingCorpus"],
    threatIntelSync: threatIntelSync as TestReports["threatIntelSync"],
    soak: soak as TestReports["soak"],
    soakShort: soakShort as TestReports["soakShort"],
    isolation: isolation as TestReports["isolation"],
    bench: bench as TestReports["bench"],
    ban: ban as TestReports["ban"],
    live: live as TestReports["live"],
  };

  const tests = evaluateValidationTests(reports, locale);
  const passed = tests.filter((t) => t.status === "pass").length;
  const failed = tests.filter((t) => t.status === "fail").length;
  const pending = tests.filter((t) => t.status === "pending").length;

  return NextResponse.json({
    available: tests.length > 0,
    tests,
    summary: { total: tests.length, passed, failed, pending },
    hint:
      tests.length === 0
        ? "Run: bash scripts/competitive_suite.sh && bash scripts/soak_test.sh"
        : null,
  });
}
