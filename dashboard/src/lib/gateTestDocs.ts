import type { ValidationTestResult } from "./validationTests";

const REPO_DOCS =
  "https://github.com/kurtulusutkucenik/Linux-Log-Guardian/blob/main/docs";

type GateDoc = {
  href: string;
  labelTr: string;
  labelEn: string;
};

/** Gate / operatör testleri → repo runbook (ban hattına dokunmaz). */
const GATE_TEST_DOCS: Record<string, GateDoc> = {
  "morning-operator-gate": {
    href: `${REPO_DOCS}/LAPTOP_OPS.md#gate-deep-linkleri`,
    labelTr: "LAPTOP_OPS — sabah gate",
    labelEn: "LAPTOP_OPS — morning gate",
  },
  "laptop-core-gate": {
    href: `${REPO_DOCS}/LAPTOP_OPS.md#gate-deep-linkleri`,
    labelTr: "LAPTOP_OPS — laptop core",
    labelEn: "LAPTOP_OPS — laptop core",
  },
  "edge-protection-gate": {
    href: `${REPO_DOCS}/EDGE_PROTECTION.md`,
    labelTr: "EDGE_PROTECTION",
    labelEn: "EDGE_PROTECTION",
  },
  "intel-ban-db": {
    href: `${REPO_DOCS}/EDGE_PROTECTION.md`,
    labelTr: "EDGE_PROTECTION — ban DB TTL",
    labelEn: "EDGE_PROTECTION — ban DB TTL",
  },
  "telegram-soc-gate": {
    href: `${REPO_DOCS}/HOSTING_RUNBOOK_TR.md`,
    labelTr: "HOSTING_RUNBOOK — Telegram SOC",
    labelEn: "HOSTING_RUNBOOK — Telegram SOC",
  },
  "webhook-route-proof": {
    href: `${REPO_DOCS}/WEBHOOK_SETUP.md`,
    labelTr: "WEBHOOK_SETUP — queue / route",
    labelEn: "WEBHOOK_SETUP — queue / route",
  },
  "webhook-telegram-live": {
    href: `${REPO_DOCS}/WEBHOOK_SETUP.md`,
    labelTr: "WEBHOOK_SETUP",
    labelEn: "WEBHOOK_SETUP",
  },
  "webhook-telegram-ack-live": {
    href: `${REPO_DOCS}/WEBHOOK_SETUP.md`,
    labelTr: "WEBHOOK_SETUP",
    labelEn: "WEBHOOK_SETUP",
  },
  "bans-telegram-ops": {
    href: `${REPO_DOCS}/HOSTING_RUNBOOK_TR.md`,
    labelTr: "HOSTING_RUNBOOK — /bans Telegram",
    labelEn: "HOSTING_RUNBOOK — /bans Telegram",
  },
  "nginx-hybrid": {
    href: `${REPO_DOCS}/EDGE_PROTECTION.md`,
    labelTr: "EDGE_PROTECTION — nginx hybrid",
    labelEn: "EDGE_PROTECTION — nginx hybrid",
  },
  "ipv6-ban-e2e": {
    href: `${REPO_DOCS}/VPS_SETUP.md`,
    labelTr: "VPS_SETUP — IPv6 ban",
    labelEn: "VPS_SETUP — IPv6 ban",
  },
  "crowdsec-bouncer": {
    href: `${REPO_DOCS}/CROWDSEC_INTEGRATION.md`,
    labelTr: "CROWDSEC_INTEGRATION",
    labelEn: "CROWDSEC_INTEGRATION",
  },
  "website-preview-gate": {
    href: `${REPO_DOCS}/LAPTOP_OPS.md#gate-deep-linkleri`,
    labelTr: "LAPTOP_OPS — site preview",
    labelEn: "LAPTOP_OPS — site preview",
  },
  "website-live-gate": {
    href: `${REPO_DOCS}/WEBSITE_DEPLOY.md`,
    labelTr: "WEBSITE_DEPLOY",
    labelEn: "WEBSITE_DEPLOY",
  },
  "presentation-ship-gate": {
    href: `${REPO_DOCS}/LAPTOP_OPS.md#gate-deep-linkleri`,
    labelTr: "LAPTOP_OPS — sunum gate",
    labelEn: "LAPTOP_OPS — presentation gate",
  },
  "enterprise-escalation-gate": {
    href: `${REPO_DOCS}/ENTERPRISE_ESCALATION.md`,
    labelTr: "ENTERPRISE_ESCALATION",
    labelEn: "ENTERPRISE_ESCALATION",
  },
  "vm-fleet-gate": {
    href: `${REPO_DOCS}/ENTERPRISE_SUPPORT.md`,
    labelTr: "ENTERPRISE_SUPPORT — filo",
    labelEn: "ENTERPRISE_SUPPORT — fleet",
  },
  "fleet-multi-node": {
    href: `${REPO_DOCS}/ENTERPRISE_SUPPORT.md`,
    labelTr: "ENTERPRISE_SUPPORT — filo e2e",
    labelEn: "ENTERPRISE_SUPPORT — fleet e2e",
  },
  "laptop-excellence-gate": {
    href: `${REPO_DOCS}/LAPTOP_OPS.md`,
    labelTr: "LAPTOP_OPS",
    labelEn: "LAPTOP_OPS",
  },
  "release-ready-gate": {
    href: `${REPO_DOCS}/LAPTOP_OPS.md`,
    labelTr: "LAPTOP_OPS — release",
    labelEn: "LAPTOP_OPS — release",
  },
  "github-ship-gate": {
    href: `${REPO_DOCS}/LAPTOP_OPS.md`,
    labelTr: "LAPTOP_OPS — GitHub ship",
    labelEn: "LAPTOP_OPS — GitHub ship",
  },
  "grafana-parity-gate": {
    href: `${REPO_DOCS}/GRAFANA_SETUP.md`,
    labelTr: "GRAFANA_SETUP",
    labelEn: "GRAFANA_SETUP",
  },
  "demo-rehearsal-gate": {
    href: `${REPO_DOCS}/LAPTOP_OPS.md`,
    labelTr: "LAPTOP_OPS — demo prova",
    labelEn: "LAPTOP_OPS — demo rehearsal",
  },
};

export function webhookSetupDocHref(): string {
  return `${REPO_DOCS}/WEBHOOK_SETUP.md`;
}

export function enrichGateTestDocs(
  tests: ValidationTestResult[],
  locale: "tr" | "en" = "tr",
): ValidationTestResult[] {
  return tests.map((test) => {
    const doc = GATE_TEST_DOCS[test.id];
    if (!doc) return test;
    return {
      ...test,
      docHref: doc.href,
      docLabel: locale === "en" ? doc.labelEn : doc.labelTr,
    };
  });
}
