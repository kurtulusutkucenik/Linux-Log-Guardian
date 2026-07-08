import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { enrichGateTestDocs } from "@/lib/gateTestDocs";
import { alignTestsToProof, evaluateValidationTests, type TestReports } from "@/lib/validationTests";

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

  const [opsGates, crs, fp, realAttack, realAttack10k, liveAttack, ja3Cluster, ja3ClusterBanLive, fpClusterTrust, lineageLive, nginxConsult, nginxHybrid, banProfileE2e, ipv6BanE2e, apiMutationTokenE2e, apiMutationAuditE2e, dashboardLoginRlE2e, hardeningRollbackGate, dashboardJwtIdleGate, mtlsCertExpiry, banApiMtls, caddyMtlsStatus, enterpriseSoarGate, owaspCorpus, trHostingCorpus, customerCorpus, threatIntelSync, soak, soakShort, isolation, bench, ban, live, dashboardBanApi, dashboardLiveDemo, attackMap, webhookRoute, webhookTelegramLive, webhookTelegramAckLive, telegramOperatorUndoE2e, telegramSocGate, bansTelegramOps, edgeProtectionGate, intelBanDb, grafanaParityGate, websitePreviewGate, enterpriseEscalationGate, vmHostPrepGate, docsConsistencyGate, vmFleetGate, laptopExcellenceGate, websiteLiveGate, releaseReadyGate, demoRehearsalGate, presentationShipGate, demoVideoGate, githubShipGate, laptopCoreGate, morningOperatorGate, authLog, siemExport, honeypotFeed, l7ProbeProd, crowdsecBouncer, taxiiFeed, parserFuzz, banPolicyAudit, distRiskProof, lineageIncident, wasm, fleetMultiNode, fleetOfflineGate, grafanaProvision, copilotOllama, marketplaceSignedApi, complianceExport, vpsXdp, arm64Build, prodStack, phase100Fast, k8sAdmission, k8sKind, meshEtcdDocker, meshEtcdLive] =
    await Promise.all([
      readJson("ops-gate-report.json"),
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
      readJson("nginx-hybrid-report.json"),
      readJson("ban-profile-e2e-report.json"),
      readJson("ipv6-ban-e2e-report.json"),
      readJson("api-mutation-token-e2e-report.json"),
      readJson("api-mutation-audit-e2e-report.json"),
      readJson("dashboard-login-rl-e2e-report.json"),
      readJson("hardening-rollback-gate-report.json"),
      readJson("dashboard-jwt-idle-gate-report.json"),
      readJson("mtls-cert-expiry-report.json"),
      readJson("ban-api-mtls-report.json"),
      readJson("caddy-mtls-status.json"),
      readJson("enterprise-soar-gate-report.json"),
      readJson("owasp-corpus-report.json"),
      readJson("tr-hosting-corpus-report.json"),
      readJson("customer-corpus-report.json"),
      readJson("threat-intel-sync-report.json"),
      readBestSoak(),
      readJson("soak-report.short.json"),
      readJson("tenant-isolation-report.json"),
      readJson("bench-vs-modsec.json"),
      readJson("bench-ban-latency.json"),
      readJson("guardian-status.json"),
      readJson("dashboard-ban-api-report.json"),
      readJson("dashboard-live-demo.json"),
      readJson("attack-map-report.json"),
      readJson("webhook-route-proof-report.json"),
      readJson("webhook-telegram-live-report.json"),
      readJson("webhook-telegram-ack-live-report.json"),
      readJson("telegram-operator-undo-e2e-report.json"),
      readJson("telegram-soc-gate-report.json"),
      readJson("bans-telegram-ops-report.json"),
      readJson("edge-protection-gate-report.json"),
      readJson("intel-ban-db-report.json"),
      readJson("grafana-parity-gate-report.json"),
      readJson("website-preview-gate-report.json"),
      readJson("enterprise-escalation-gate-report.json"),
      readJson("vm-host-prep-gate-report.json"),
      readJson("docs-consistency-gate-report.json"),
      readJson("vm-fleet-gate-report.json"),
      readJson("laptop-excellence-gate-report.json"),
      readJson("website-live-gate-report.json"),
      readJson("release-ready-gate-report.json"),
      readJson("demo-rehearsal-gate-report.json"),
      readJson("presentation-ship-gate-report.json"),
      readJson("demo-video-gate-report.json"),
      readJson("github-ship-gate-report.json"),
      readJson("laptop-core-gate-report.json"),
      readJson("morning-operator-gate-report.json"),
      readJson("auth-log-report.json"),
      readJson("siem-export-report.json"),
      readJson("honeypot-feed-report.json"),
      readJson("l7-probe-prod-report.json"),
      readJson("crowdsec-bouncer-report.json"),
      readJson("taxii-feed-report.json"),
      readJson("parser-fuzz-report.json"),
      readJson("ban-policy-audit-report.json"),
      readJson("dist-risk-proof-report.json"),
      readJson("lineage-incident-report.json"),
      readJson("wasm-status.json"),
      readJson("fleet-multi-node-report.json"),
      readJson("fleet-offline-gate-report.json"),
      readJson("grafana-provision-report.json"),
      readJson("copilot-ollama-report.json"),
      readJson("marketplace-signed-api-report.json"),
      readJson("compliance-export-report.json"),
      readJson("vps-xdp-report.json"),
      readJson("arm64-build-report.json"),
      readJson("prod-stack-e2e-report.json"),
      readJson("phase100-fast-gate-report.json"),
      readJson("k8s-admission-report.json"),
      readJson("k8s-kind-e2e-report.json"),
      readJson("mesh-etcd-docker-report.json"),
      readJson("mesh-etcd-live-report.json"),
    ]);

  const reports: TestReports = {
    opsGates: opsGates as TestReports["opsGates"],
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
    nginxHybrid: nginxHybrid as TestReports["nginxHybrid"],
    banProfileE2e: banProfileE2e as TestReports["banProfileE2e"],
    ipv6BanE2e: ipv6BanE2e as TestReports["ipv6BanE2e"],
    apiMutationTokenE2e: apiMutationTokenE2e as TestReports["apiMutationTokenE2e"],
    apiMutationAuditE2e: apiMutationAuditE2e as TestReports["apiMutationAuditE2e"],
    dashboardLoginRlE2e: dashboardLoginRlE2e as TestReports["dashboardLoginRlE2e"],
    hardeningRollbackGate: hardeningRollbackGate as TestReports["hardeningRollbackGate"],
    dashboardJwtIdleGate: dashboardJwtIdleGate as TestReports["dashboardJwtIdleGate"],
    mtlsCertExpiry: mtlsCertExpiry as TestReports["mtlsCertExpiry"],
    banApiMtls: banApiMtls as TestReports["banApiMtls"],
    caddyMtlsStatus: caddyMtlsStatus as TestReports["caddyMtlsStatus"],
    enterpriseSoarGate: enterpriseSoarGate as TestReports["enterpriseSoarGate"],
    owaspCorpus: owaspCorpus as TestReports["owaspCorpus"],
    trHostingCorpus: trHostingCorpus as TestReports["trHostingCorpus"],
    customerCorpus: customerCorpus as TestReports["customerCorpus"],
    threatIntelSync: threatIntelSync as TestReports["threatIntelSync"],
    soak: soak as TestReports["soak"],
    soakShort: soakShort as TestReports["soakShort"],
    isolation: isolation as TestReports["isolation"],
    bench: bench as TestReports["bench"],
    ban: ban as TestReports["ban"],
    live: live as TestReports["live"],
    dashboardBanApi: dashboardBanApi as TestReports["dashboardBanApi"],
    dashboardLiveDemo: dashboardLiveDemo as TestReports["dashboardLiveDemo"],
    attackMap: attackMap as TestReports["attackMap"],
    webhookRoute: webhookRoute as TestReports["webhookRoute"],
    webhookTelegramLive: webhookTelegramLive as TestReports["webhookTelegramLive"],
    webhookTelegramAckLive: webhookTelegramAckLive as TestReports["webhookTelegramAckLive"],
    telegramOperatorUndoE2e: telegramOperatorUndoE2e as TestReports["telegramOperatorUndoE2e"],
    telegramSocGate: telegramSocGate as TestReports["telegramSocGate"],
    bansTelegramOps: bansTelegramOps as TestReports["bansTelegramOps"],
    edgeProtectionGate: edgeProtectionGate as TestReports["edgeProtectionGate"],
    intelBanDb: intelBanDb as TestReports["intelBanDb"],
    grafanaParityGate: grafanaParityGate as TestReports["grafanaParityGate"],
    websitePreviewGate: websitePreviewGate as TestReports["websitePreviewGate"],
    enterpriseEscalationGate: enterpriseEscalationGate as TestReports["enterpriseEscalationGate"],
    vmHostPrepGate: vmHostPrepGate as TestReports["vmHostPrepGate"],
    docsConsistencyGate: docsConsistencyGate as TestReports["docsConsistencyGate"],
    vmFleetGate: vmFleetGate as TestReports["vmFleetGate"],
    laptopExcellenceGate: laptopExcellenceGate as TestReports["laptopExcellenceGate"],
    websiteLiveGate: websiteLiveGate as TestReports["websiteLiveGate"],
    releaseReadyGate: releaseReadyGate as TestReports["releaseReadyGate"],
    demoRehearsalGate: demoRehearsalGate as TestReports["demoRehearsalGate"],
    presentationShipGate: presentationShipGate as TestReports["presentationShipGate"],
    demoVideoGate: demoVideoGate as TestReports["demoVideoGate"],
    githubShipGate: githubShipGate as TestReports["githubShipGate"],
    laptopCoreGate: laptopCoreGate as TestReports["laptopCoreGate"],
    morningOperatorGate: morningOperatorGate as TestReports["morningOperatorGate"],
    authLog: authLog as TestReports["authLog"],
    siemExport: siemExport as TestReports["siemExport"],
    honeypotFeed: honeypotFeed as TestReports["honeypotFeed"],
    l7ProbeProd: l7ProbeProd as TestReports["l7ProbeProd"],
    crowdsecBouncer: crowdsecBouncer as TestReports["crowdsecBouncer"],
    taxiiFeed: taxiiFeed as TestReports["taxiiFeed"],
    parserFuzz: parserFuzz as TestReports["parserFuzz"],
    banPolicyAudit: banPolicyAudit as TestReports["banPolicyAudit"],
    distRiskProof: distRiskProof as TestReports["distRiskProof"],
    lineageIncident: lineageIncident as TestReports["lineageIncident"],
    wasm: wasm as TestReports["wasm"],
    fleetMultiNode: fleetMultiNode as TestReports["fleetMultiNode"],
    fleetOfflineGate: fleetOfflineGate as TestReports["fleetOfflineGate"],
    grafanaProvision: grafanaProvision as TestReports["grafanaProvision"],
    copilotOllama: copilotOllama as TestReports["copilotOllama"],
    marketplaceSignedApi: marketplaceSignedApi as TestReports["marketplaceSignedApi"],
    complianceExport: complianceExport as TestReports["complianceExport"],
    vpsXdp: vpsXdp as TestReports["vpsXdp"],
    arm64Build: arm64Build as TestReports["arm64Build"],
    prodStack: prodStack as TestReports["prodStack"],
    phase100Fast: phase100Fast as TestReports["phase100Fast"],
    k8sAdmission: k8sAdmission as TestReports["k8sAdmission"],
    k8sKind: k8sKind as TestReports["k8sKind"],
    meshEtcdDocker: meshEtcdDocker as TestReports["meshEtcdDocker"],
    meshEtcdLive: meshEtcdLive as TestReports["meshEtcdLive"],
  };

  const evaluated = evaluateValidationTests(reports, locale);

  const proofRaw = await readJson("competitive-proof.json");
  const proofTests =
    proofRaw &&
    typeof proofRaw === "object" &&
    Array.isArray((proofRaw as { validationTests?: unknown }).validationTests)
      ? (proofRaw as { validationTests: unknown[] }).validationTests
      : null;
  const proofExpected = proofTests?.length ?? null;
  const proofTestIds =
    proofTests?.map((t) => String((t as { id?: string }).id ?? "")).filter(Boolean) ?? null;

  const aligned =
    proofTests && proofTests.length > 0
      ? alignTestsToProof(evaluated, proofTests as { id?: string }[], locale)
      : evaluated;
  const tests = enrichGateTestDocs(aligned, locale);

  const passed = tests.filter((t) => t.status === "pass").length;
  const failed = tests.filter((t) => t.status === "fail").length;
  const warned = tests.filter((t) => t.status === "warn").length;
  const pending = tests.filter((t) => t.status === "pending").length;

  return NextResponse.json({
    available: tests.length > 0,
    tests,
    summary: { total: tests.length, passed, failed, warned, pending },
    proof_expected: proofExpected,
    proof_test_ids: proofTestIds,
    parity_ok: proofExpected == null || tests.length === proofExpected,
    hint:
      tests.length === 0
        ? "Run: STABILITY=1 bash scripts/full_proof_pack.sh"
        : null,
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
