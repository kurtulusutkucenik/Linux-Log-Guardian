// Full-page bilingual copy (TR base / EN). Turkic locales use TR, others EN.
// Numeric / technical data (chart series, shell commands) is reused from
// content.ts so only human-readable prose is translated here.

import {
  PIPELINE,
  MARQUEE_ITEMS,
  SELECTED,
  VS,
  CHARTS,
  EVIDENCE,
  HONEST,
  LAYERS,
  CONTACT,
  SETUP,
  type LineSeries,
  type SetupStep,
} from "@/lib/content";
import type { Locale } from "./locales";

type FooterLink = { label: string; href: string };
type FooterCol = { title: string; links: FooterLink[] };

export type PageCopy = {
  marquee: string[];
  pipeline: {
    eyebrow: string;
    title: string;
    sub: string;
    note: string;
    steps: { n: string; label: string; hint: string }[];
  };
  selected: {
    eyebrow: string;
    title: string;
    lead: string;
    prev: string;
    next: string;
    cards: { tag: string; kicker: string; title: string; body: string; chips: string[] }[];
  };
  vs: {
    eyebrow: string;
    title: string;
    sub: string;
    advTitle: string;
    advLead: string;
    advantages: { k: string; v: string }[];
    cols: string[];
    groups: { label: string; honest: boolean; winners: number[]; rows: string[][] }[];
    note: string;
    legend: string;
  };
  charts: {
    eyebrow: string;
    title: string;
    sub: string;
    honestBadge: string;
    targetLabel: string;
    profile: { title: string; hint: string; categories: string[]; yMax: number; series: LineSeries[] };
    latency: { title: string; hint: string; labels: string[]; yMax: number; unit: string; target: number; series: LineSeries[] };
    soak: { title: string; hint: string; labels: string[]; yMax: number; unit: string; series: LineSeries[] };
    fp: { title: string; hint: string; labels: string[]; yMax: number; unit: string; series: LineSeries[] };
    eps: { title: string; hint: string; labels: string[]; yMax: number; unit: string; honest: boolean; series: LineSeries[] };
    recall: { title: string; hint: string; labels: string[]; yMax: number; unit: string; series: LineSeries[] };
  };
  proof: {
    eyebrow: string;
    testsSuffix: string;
    passedSuffix: string;
    body: string;
    bodyMatrix: string;
    ctaAll: string;
    ctaPdf: string;
    statLabels: string[];
    badges: string[];
  };
  honest: {
    eyebrow: string;
    title: string;
    items: string[];
    layersEyebrow: string;
    layersTitle: string;
    layers: { tag: string; body: string }[];
    layersNote: string;
  };
  setup: {
    eyebrow: string;
    title: string;
    sub: string;
    intro: string;
    requirementsTitle: string;
    requirements: string[];
    dashboardBadge: string;
    paths: {
      id: string;
      title: string;
      badge: string;
      note: string;
      steps: SetupStep[];
    }[];
    common: { title: string; steps: SetupStep[] };
    dashboard: { title: string; note: string; steps: SetupStep[] };
    tip: string;
  };
  evidence: {
    eyebrow: string;
    title: string;
    note: string;
    files: string[];
    update: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    body: string;
    ctaEmail: string;
    ctaGithub: string;
    email: string;
    github: string;
  };
  footer: {
    desc: string;
    soak: string;
    columns: FooterCol[];
    copyPrefix: string;
    copySuffix: string;
    licenseHref: string;
  };
  tests: {
    eyebrow: string;
    title: string;
    intro: string;
    allPassed: string;
    summary: string;
    passedWord: string;
    warnWord: string;
    failWord: string;
    ctaPdf: string;
    filterAll: string;
    filterGate: string;
    filterProof: string;
    gateHeading: string;
    proofHeading: string;
    statusPass: string;
    statusWarn: string;
    statusFail: string;
    statusPending: string;
  };
};

const MIT_HREF =
  "https://github.com/kurtulusutkucenik/Linux-Log-Guardian?tab=MIT-1-ov-file";

/* ----------------------------- TURKISH (base) ----------------------------- */

const CO_TR: PageCopy = {
  marquee: MARQUEE_ITEMS,
  pipeline: {
    eyebrow: PIPELINE.eyebrow,
    title: PIPELINE.title,
    sub: PIPELINE.sub,
    note: PIPELINE.note,
    steps: PIPELINE.steps.map((s) => ({ n: s.n, label: s.label, hint: s.hint })),
  },
  selected: {
    eyebrow: SELECTED.eyebrow,
    title: SELECTED.title,
    lead: SELECTED.lead,
    prev: "Önceki kanıt",
    next: "Sonraki kanıt",
    cards: SELECTED.cards.map((c) => ({ tag: c.tag, kicker: c.kicker, title: c.title, body: c.body, chips: c.chips })),
  },
  vs: {
    eyebrow: VS.eyebrow,
    title: VS.title,
    sub: VS.sub,
    advTitle: VS.advTitle,
    advLead: VS.advLead,
    advantages: VS.advantages,
    cols: VS.cols,
    groups: VS.groups.map((g) => ({ label: g.label, honest: g.honest, winners: g.winners, rows: g.rows })),
    note: VS.note,
    legend: "Kırmızı = o satırda üstün olan",
  },
  charts: {
    eyebrow: CHARTS.eyebrow,
    title: CHARTS.title,
    sub: CHARTS.sub,
    honestBadge: "dürüst sınır",
    targetLabel: "Hedef",
    profile: CHARTS.profile,
    latency: CHARTS.latency,
    soak: CHARTS.soak,
    fp: CHARTS.fp,
    eps: CHARTS.eps,
    recall: CHARTS.recall,
  },
  proof: {
    eyebrow: "//:Proof · Ölçülmüş kanıt",
    testsSuffix: "otomatik doğrulama testi.",
    passedSuffix: "geçti.",
    body:
      "Slayt değil, tekrar üretilebilir kanıt. OWASP CRS parity, false positive kapıları, ban gecikmesi bench'leri, corpus recall ve 72 saatlik soak — hepsi ölçülmüş, otomatik ve halka açık test matrisinde görünür.",
    bodyMatrix: "ile birebir aynı matris.",
    ctaAll: "Tüm testleri gör",
    ctaPdf: "Kanıt PDF",
    statLabels: ["Toplam test", "Geçti", "Soak PASS", "Ban pipeline E2E"],
    badges: [
      "OWASP CRS parity %100",
      "72h soak PASS",
      "API fail-closed",
      "false positive %0.2",
      "SRI + CSP hardened",
      "MIT açık kaynak",
    ],
  },
  honest: {
    eyebrow: HONEST.eyebrow,
    title: HONEST.title,
    items: HONEST.items,
    layersEyebrow: "//:Layers",
    layersTitle: "Katmanlar",
    layers: LAYERS,
    layersNote:
      "XDR, Wasm marketplace ve LLM Copilot uzun vadeli opsiyonel katmanlardır — Core tek başına üretimde kullanılabilir.",
  },
  setup: {
    eyebrow: SETUP.eyebrow,
    title: SETUP.title,
    sub: SETUP.sub,
    intro: SETUP.intro,
    requirementsTitle: "Gereksinimler",
    requirements: SETUP.requirements,
    dashboardBadge: "Pro · opsiyonel",
    paths: SETUP.paths,
    common: SETUP.common,
    dashboard: SETUP.dashboard,
    tip: SETUP.tip,
  },
  evidence: {
    eyebrow: EVIDENCE.eyebrow,
    title: EVIDENCE.title,
    note: EVIDENCE.note,
    files: EVIDENCE.files,
    update: "Güncelle: bash scripts/sync_evidence_pack.sh",
  },
  contact: {
    eyebrow: CONTACT.eyebrow,
    title: CONTACT.title,
    body: CONTACT.body,
    ctaEmail: "E-posta gönder",
    ctaGithub: "GitHub kaynak",
    email: CONTACT.email,
    github: CONTACT.github,
  },
  footer: {
    desc:
      "nginx access log → WAF/CRS → kernel ban. Tek zincir, self-hosted, MIT lisanslı. Türkiye'de geliştirildi.",
    soak: "72h soak PASS · 0 fail",
    columns: [
      {
        title: "Ürün",
        links: [
          { label: "3 Paket birleşimi", href: "/paketler" },
          { label: "Pipeline", href: "#pipeline" },
          { label: "Sayısal değerler", href: "#sayilar" },
          { label: "Rakiplerle kıyas", href: "#rakipler" },
          { label: "Kanıt paketi", href: "#kanit" },
        ],
      },
      {
        title: "Geliştirici",
        links: [
          { label: "Kurulum rehberi", href: "#kurulum" },
          { label: "Testler", href: "/testler" },
          { label: "Kanıt PDF", href: "/evidence/competitive-proof.pdf" },
          { label: "Changelog", href: "https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases" },
          { label: "GitHub", href: "https://github.com/kurtulusutkucenik/Linux-Log-Guardian" },
        ],
      },
      {
        title: "Proje",
        links: [
          { label: "Hakkında", href: "#iletisim" },
          { label: "İletişim", href: "#iletisim" },
          { label: "Katkı (PR)", href: "https://github.com/kurtulusutkucenik/Linux-Log-Guardian" },
          { label: "MIT Lisans", href: MIT_HREF },
        ],
      },
    ],
    copyPrefix: "Linux Log Guardian · Türk yapımı",
    copySuffix: "açık kaynak",
    licenseHref: MIT_HREF,
  },
  tests: {
    eyebrow: "//:Proof · Test Matrisi",
    title: "Doğrulama testleri",
    intro:
      "Dashboard ile aynı otomatik test matrisi — kurulum kapıları, CRS parity, FP, ban gecikmesi, corpus recall ve 72h soak. Tümü ölçülmüş, tekrar üretilebilir.",
    allPassed: "Tüm testler geçti",
    summary: "Test özeti",
    passedWord: "test geçti",
    warnWord: "uyarı",
    failWord: "kaldı",
    ctaPdf: "Kanıt PDF",
    filterAll: "Tümü",
    filterGate: "Kurulum & güvenlik kapıları",
    filterProof: "Rekabet & güvenlik kanıtı",
    gateHeading: "Kurulum ve güvenlik kapıları",
    proofHeading: "Rekabet ve güvenlik kanıtı",
    statusPass: "GEÇTİ",
    statusWarn: "UYARI",
    statusFail: "KALDI",
    statusPending: "BEKLİYOR",
  },
};

/* -------------------------------- ENGLISH -------------------------------- */

const SELECTED_BODIES_EN = [
  "Single chain: nginx log → OWASP CRS → ~17 ms kernel ban. Production in ~15 minutes.",
  "Fleet, SOC timeline, dashboards — an optional layer on your own server after install.",
  "75 automated tests, competitive PDF, 72h soak — the same matrix as dashboard /tests.",
  "Tenant-labeled Prometheus metrics, dashboards and alert rules — self-hosted observability.",
  "Multi-node fleet: agent sync, etcd mesh policy and targeted command dispatch — from one panel.",
  "TAXII/STIX threat feed + Telegram SOC: alert, ban and one-click 'ack' — live operator flow.",
  "XDP filter + execve/lineage uprobes — kernel-level packet drop and syscall tracing. On laptops, --no-xdp with ipset is enough.",
  "Distributed scanner detection: same JA3 fingerprint + different IP cluster, 100% recall — 80 IP live test.",
  "Attack tree, lineage probe, syscall uprobe — long-term optional layer; attack chain and covert channel detection.",
  "Custom rule plugins via a Wasm runtime — marketplace model, extend without touching Core.",
  "JSON event_type stream — SIEM export proof to Splunk/Elastic/Vector targets (siem-export-report.json).",
  "Tarpit server + trap watcher — slow the attacker and honeypot signal; deception layer.",
];

const VS_ROWS_EN_0: string[][] = [
  ["Log → WAF → kernel ban", "Single chain", "Ban only", "Piecemeal", "WAF separate"],
  ["OWASP CRS parity", "100% (121 rules)", "—", "—", "Reference (100%)"],
  ["Real attack recall", "100% (1K+10K)", "—", "—", "100%"],
  ["Distributed / JA3 cluster ban", "100% (80 IP)", "—", "Signal-based", "—"],
  ["nginx inline consult", "PASS", "—", "—", "Separate module"],
  ["L7 application protection", "WAF + consult + eBPF", "—", "—", "CRS inline"],
  ["Kernel / eBPF (XDP) ban", "ipset + XDP", "iptables", "iptables/nft", "—"],
  ["False positive", "0.2% (measured)", "High", "Medium", "CRS-dependent"],
  ["Ban latency", "~17 ms", "sec–min", "sec", "Separate integration"],
  ["Short stability (5 min)", "PASS (0 fail)", "—", "—", "—"],
  ["72h soak", "PASS (864/0)", "—", "—", "—"],
  ["Evidence pack PDF+JSON", "Automatic (14 files)", "None", "Partial", "Module by module"],
  ["Automated test matrix", "75 tests", "—", "Partial", "—"],
  ["SOC timeline / dashboard", "Yes (:8443)", "—", "Console", "—"],
  ["Telegram ops + ack", "Yes (one-click)", "—", "Partial", "—"],
  ["Setup time", "~15 min", "minutes", "minutes", "hours (tuning)"],
];

const VS_ROWS_EN_1: string[][] = [
  ["Inline regex EPS", "~5,357 EPS (log replay)", "—", "—", "~14,300 EPS inline"],
  ["Block the first request instantly", "Reactive (log line)", "Reactive", "Partly", "Inline (instant)"],
  ["Volumetric L3/L4 scrub", "None — CDN recommended", "None", "None", "None"],
  ["Community signal network", "Self-hosted", "—", "Yes (global)", "—"],
  ["Edge / Cloud WAF", "Origin layer", "—", "Bouncer", "Proxy mode"],
  ["Managed cloud / SaaS", "None (self-hosted)", "None", "Yes (console)", "—"],
];

const SETUP_PATHS_EN: PageCopy["setup"]["paths"] = [
  {
    id: "A",
    title: "Fresh server — .deb package",
    badge: "recommended",
    note:
      "No build required. The package ships the binary, systemd units, rules and scripts. Upgrade-safe: an existing /etc/log-guardian/rules.conf is preserved. Get it from GitHub Releases (log-guardian_*_amd64.deb) or build with bash scripts/build_deb.sh → dist/.",
    steps: SETUP.paths[0].steps.map((s, i) => ({
      ...s,
      title: ["Dependencies", "Install the package", "First run and API security"][i],
      description: [
        "On first install, add the Debian package dependencies. If nginx is missing it can be added in the same command.",
        "If dpkg -i reports a dependency error, run apt-get install -f. The postinst step auto-creates the log-guardian user, permissions, systemd units and a default rules.conf.",
        "Prepares the nginx log format, FP trust and API security (token, fail-closed) in one go. The scripts ship inside the package (/usr/local/share/log-guardian/scripts/).",
      ][i],
    })),
  },
  {
    id: "B",
    title: "Source code — build and install",
    badge: "developer",
    note:
      "Clone the GitHub repo and build. Ideal for development, customization and full source review. install.sh sets up systemd units, rules and the nginx log format.",
    steps: SETUP.paths[1].steps.map((s, i) => ({
      ...s,
      title: ["Source and build", "First run and token sync"][i],
      description: [
        "Clone the repo, build with all cores and run the main install script.",
        "Brings services up and prepares the API token sync and dashboard connection.",
      ][i],
    })),
  },
];

const SETUP_COMMON_EN: PageCopy["setup"]["common"] = {
  title: "Common steps (after A or B)",
  steps: SETUP.common.steps.map((s, i) => ({
    ...s,
    title: [
      "Nginx log format",
      "Health and status check",
      "Metrics and first ban test",
      "VirtualBox / no XDP (laptop & VM)",
    ][i],
    description: [
      "The log_guardian log format is required so the WAF can read the request body and X-Forwarded-For. Setup usually applies it automatically; verify in STRICT mode.",
      "Check daemon IPC, service status and BPF features. Green gate: you should see FAIL: 0 at the end of post_install_verify.",
      "Check Prometheus metrics; watch the counters rise after traffic. You can inject an attack line and verify the ban in ipset.",
      "On environments without eBPF/XDP, --no-xdp with an ipset-based ban is enough. If a service dependency fails, the repair script is a single command.",
    ][i],
  })),
};

const SETUP_DASHBOARD_EN: PageCopy["setup"]["dashboard"] = {
  title: "Pro dashboard — after install (optional)",
  note:
    "The dashboard does not run on this landing site but on your own machine. The prod stack is served via Caddy + Docker at https://localhost:8443.",
  steps: SETUP.dashboard.steps.map((s, i) => ({
    ...s,
    title: ["Start the prod stack", "SSH tunnel for a remote VPS"][i],
    description: [
      "Builds and brings up the dashboard on your own server. Login: admin / DASHBOARD_ADMIN_PASSWORD from .env.",
      "To view the dashboard securely without exposing it to the internet, set up an SSH tunnel; harden the server first.",
    ][i],
  })),
};

const CO_EN: PageCopy = {
  marquee: [
    "nginx log → WAF → kernel ban",
    "75 automated tests",
    "72h soak PASS",
    "~17 ms kernel ban",
    "false positive 0.2%",
    "real attack recall 100%",
    "OWASP CRS parity 100%",
    "MIT · Turkey",
    "self-hosted · no vendor lock-in",
  ],
  pipeline: {
    eyebrow: "//:Pipeline",
    title: "Single chain: from log to kernel ban",
    sub: "~17 ms from an nginx access log line to ipset ban — rivals have piecemeal architecture.",
    note: "XDR, Wasm marketplace and LLM Copilot are long-term optional layers — Core is production-ready on its own.",
    steps: [
      { n: "1", label: "nginx access log", hint: "writable access log, log_guardian format" },
      { n: "2", label: "Parser + normalize", hint: "URI, method, XFF, body — one schema" },
      { n: "3", label: "CRS / WAF engine", hint: "OWASP CRS, PCRE2 JIT, schema/BOLA" },
      { n: "4", label: "Ban pipeline", hint: "policy + tenant + FP trust decision" },
      { n: "5", label: "ipset / XDP kernel", hint: "~17 ms kernel ban" },
      { n: "6", label: "Metrics + dashboard", hint: "Prometheus tenant + SOC timeline" },
    ],
  },
  selected: {
    eyebrow: "//:Selected",
    title: "Selected proof",
    lead: "Core · Pro · Proof — measurable results in a single chain.",
    prev: "Previous proof",
    next: "Next proof",
    cards: SELECTED.cards.map((c, i) => ({
      tag: c.tag,
      kicker: c.kicker,
      title: c.title,
      body: SELECTED_BODIES_EN[i],
      chips: c.chips,
    })),
  },
  vs: {
    eyebrow: "//:Vs",
    title: "Compared with rivals",
    sub: "Measured proof — Fail2ban / CrowdSec / ModSecurity architecture notes. The winner in each row is marked red.",
    advTitle: "The advantages we give you",
    advLead:
      "Fail2ban only bans, ModSecurity WAF is a separate module, CrowdSec needs a piecemeal stack. Log Guardian merges these three jobs in one chain — with measured proof.",
    advantages: [
      { k: "One install, one chain", v: "You don't install and integrate Fail2ban + ModSecurity + CrowdSec separately. nginx log → WAF/CRS → kernel ban in one product, ~15 min setup." },
      { k: "~17 ms kernel ban", v: "Median ~17 ms from log line to ipset/XDP ban. Fail2ban/CrowdSec stay in seconds–minutes; proven with 5 measured samples." },
      { k: "100% recall + 100% CRS parity", v: "121 OWASP CRS rules, 100% real-attack recall on a 1500-line corpus and full parity with ModSec — at 0.2% false positive." },
      { k: "Distributed attack coverage", v: "JA3 cluster detection + per-IP ban — 100% on an 80-IP live test. Fail2ban is single-IP; CrowdSec needs a separate signal network." },
      { k: "Transparent, reproducible proof", v: "75 automated tests + a 14-file PDF/JSON evidence pack + 72h soak (864 samples, 0 errors). Rivals have no automatic proof or it's fragmented." },
      { k: "Self-hosted · MIT · made in Turkey", v: "Your data stays with you, no vendor lock-in, fully open source. SOC timeline, Prometheus metrics and Telegram ops in one panel (:8443)." },
    ],
    cols: ["Metric", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    groups: [
      { label: "Strengths (measured)", honest: false, winners: VS.groups[0].winners, rows: VS_ROWS_EN_0 },
      { label: "Honest limits", honest: true, winners: VS.groups[1].winners, rows: VS_ROWS_EN_1 },
    ],
    note:
      "Honest limit: in some areas rivals are clearly better (red cells). ModSec + CRS leads in inline throughput (~14,300 EPS, measured) and instant first-request blocking; CrowdSec is strong in its distributed community signal network and managed SaaS console. Our strength is single-chain integration + ~17 ms ban speed + transparent, reproducible proof.",
    legend: "Red = the winner in that row",
  },
  charts: {
    eyebrow: "//:Charts",
    title: "Compared in charts",
    sub: "Derived from measured proof (competitive-proof.json, bench-vs-modsec.json, fp-report.json, bench-ban-latency.json). Our line is phosphor turquoise.",
    honestBadge: "honest limit",
    targetLabel: "Target",
    profile: {
      ...CHARTS.profile,
      title: "Performance profile (9 axes)",
      hint: "Higher = better · 0–100 normalized · Log Guardian turquoise line",
      categories: ["Single chain", "Recall", "Low FP", "Ban speed", "Proof", "Throughput", "Distributed", "Docs", "Setup"],
    },
    latency: {
      ...CHARTS.latency,
      title: "Ban latency — measurement samples",
      hint: "Lower = better · 5 samples (bench-ban-latency.json) · target 75 ms",
    },
    soak: {
      ...CHARTS.soak,
      title: "72h soak — service uptime",
      hint: "Higher = better · 864 samples · 0 errors",
    },
    fp: {
      ...CHARTS.fp,
      title: "False positive comparison",
      hint: "Lower = better · % · LG measured, rivals architectural note",
    },
    eps: {
      ...CHARTS.eps,
      title: "Throughput (EPS) — same corpus",
      hint: "Higher = better · bench-vs-modsec.json · honest limit",
    },
    recall: {
      ...CHARTS.recall,
      title: "Attack recall — by category",
      hint: "Higher = better · corpus · %",
      labels: ["SQLi", "XSS", "RCE", "LFI", "Bot", "Distributed"],
    },
  },
  proof: {
    eyebrow: "//:Proof · Measured evidence",
    testsSuffix: "automated verification tests.",
    passedSuffix: "passed.",
    body:
      "Not slides, reproducible proof. OWASP CRS parity, false-positive gates, ban-latency benchmarks, corpus recall and a 72-hour soak — all measured, automated and visible in a public test matrix.",
    bodyMatrix: "exactly the same matrix.",
    ctaAll: "See all tests",
    ctaPdf: "Proof PDF",
    statLabels: ["Total tests", "Passed", "Soak PASS", "Ban pipeline E2E"],
    badges: [
      "OWASP CRS parity 100%",
      "72h soak PASS",
      "API fail-closed",
      "false positive 0.2%",
      "SRI + CSP hardened",
      "MIT open source",
    ],
  },
  honest: {
    eyebrow: "//:Honest",
    title: "Honest limits",
    items: [
      "Reactive architecture — the first request may pass until the log line drops; we're not at inline ModSec speed.",
      "We don't absorb L3/L4 DDoS — we sit behind a CDN.",
      "Distributed botnet — per-IP ban; no CrowdSec signal network.",
      "Does: log → CRS/WAF → ~17 ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.",
    ],
    layersEyebrow: "//:Layers",
    layersTitle: "Layers",
    layers: [
      { tag: "Core", body: "log → WAF → ipset ban (~15 min)" },
      { tag: "Pro", body: "eBPF daemon, dashboard, metrics, fleet" },
      { tag: "Optional", body: "XDR, Wasm marketplace, LLM Copilot" },
    ],
    layersNote:
      "XDR, Wasm marketplace and LLM Copilot are long-term optional layers — Core is production-ready on its own.",
  },
  setup: {
    eyebrow: "//:Setup",
    title: "Setup guide (detailed)",
    sub: "Core setup from scratch on Ubuntu/Debian (~15 min) — command by command.",
    intro:
      "Source: GitHub — Linux-Log-Guardian. Two ways: a prebuilt .deb package (recommended) or build from source. It also works without eBPF/XDP on laptops/VMs (ipset-based ban). The steps below are for a production server; each command's expected output is included.",
    requirementsTitle: "Requirements",
    requirements: [
      "Ubuntu 22.04 / 24.04 or Debian 12 (amd64)",
      "nginx + writable access log (log_guardian format)",
      "Root or sudo (systemd, ipset, /etc/log-guardian)",
      "~200 MB disk, 128 MB RAM (Core); Docker for Pro",
      "Optional Pro: 5.10+ kernel for eBPF/XDP, Docker (dashboard/metrics)",
    ],
    dashboardBadge: "Pro · optional",
    paths: SETUP_PATHS_EN,
    common: SETUP_COMMON_EN,
    dashboard: SETUP_DASHBOARD_EN,
    tip:
      "Tip: for JWT and the dashboard password use bash scripts/laptop_jwt_setup.sh. 3-minute demo: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Docs: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
  },
  evidence: {
    eyebrow: "//:Evidence",
    title: "Evidence pack",
    note: "Gates: laptop_sprint_gate.sh · 1h soak (laptop) · 72h soak (VM) PASS",
    files: EVIDENCE.files,
    update: "Update: bash scripts/sync_evidence_pack.sh",
  },
  contact: {
    eyebrow: "//:Contact",
    title: "Contact & contribute",
    body:
      "Write for questions, collaboration or contributions. Bug reports and pull requests are welcome in the open-source spirit.",
    ctaEmail: "Send email",
    ctaGithub: "GitHub source",
    email: CONTACT.email,
    github: CONTACT.github,
  },
  footer: {
    desc:
      "nginx access log → WAF/CRS → kernel ban. Single chain, self-hosted, MIT-licensed. Built in Turkey.",
    soak: "72h soak PASS · 0 fail",
    columns: [
      {
        title: "Product",
        links: [
          { label: "3-in-1 merge", href: "/paketler" },
          { label: "Pipeline", href: "#pipeline" },
          { label: "Numerical values", href: "#sayilar" },
          { label: "Compare rivals", href: "#rakipler" },
          { label: "Evidence pack", href: "#kanit" },
        ],
      },
      {
        title: "Developer",
        links: [
          { label: "Setup guide", href: "#kurulum" },
          { label: "Tests", href: "/tests" },
          { label: "Proof PDF", href: "/evidence/competitive-proof.pdf" },
          { label: "Changelog", href: "https://github.com/kurtulusutkucenik/Linux-Log-Guardian/releases" },
          { label: "GitHub", href: "https://github.com/kurtulusutkucenik/Linux-Log-Guardian" },
        ],
      },
      {
        title: "Project",
        links: [
          { label: "About", href: "#iletisim" },
          { label: "Contact", href: "#iletisim" },
          { label: "Contribute (PR)", href: "https://github.com/kurtulusutkucenik/Linux-Log-Guardian" },
          { label: "MIT License", href: MIT_HREF },
        ],
      },
    ],
    copyPrefix: "Linux Log Guardian · Made in Turkey",
    copySuffix: "open source",
    licenseHref: MIT_HREF,
  },
  tests: {
    eyebrow: "//:Proof · Test Matrix",
    title: "Verification tests",
    intro:
      "The same automated test matrix as the dashboard — install gates, CRS parity, FP, ban latency, corpus recall and 72h soak. All measured and reproducible.",
    allPassed: "All tests passed",
    summary: "Test summary",
    passedWord: "tests passed",
    warnWord: "warnings",
    failWord: "failed",
    ctaPdf: "Proof PDF",
    filterAll: "All",
    filterGate: "Install & security gates",
    filterProof: "Competitive & security proof",
    gateHeading: "Install and security gates",
    proofHeading: "Competitive and security proof",
    statusPass: "PASS",
    statusWarn: "WARN",
    statusFail: "FAIL",
    statusPending: "PENDING",
  },
};

/* ------------------- Per-locale heading/label overrides ------------------- */
// Base for every non-Turkish locale is English (so no Turkish leaks through);
// these overrides put the high-visibility headings/labels into each language.

type SectionOverride = {
  pipelineTitle?: string; pipelineSub?: string;
  selectedTitle?: string; selectedLead?: string;
  vsTitle?: string; vsSub?: string; vsAdvTitle?: string;
  chartsTitle?: string; chartsSub?: string;
  proofTests?: string; proofPassed?: string; proofCtaAll?: string; proofCtaPdf?: string;
  honestTitle?: string; layersTitle?: string;
  setupTitle?: string; setupSub?: string; reqTitle?: string;
  evidenceTitle?: string;
  contactTitle?: string; ctaEmail?: string; ctaGithub?: string;
  colProduct?: string; colDev?: string; colProject?: string; copySuffix?: string;
};

const SECTION_OVERRIDES: Partial<Record<Locale, SectionOverride>> = {
  de: {
    pipelineTitle: "Eine Kette: vom Log zum Kernel-Ban",
    pipelineSub: "~17 ms von der nginx-Access-Log-Zeile bis zum ipset-Ban — Konkurrenten haben eine stückweise Architektur.",
    selectedTitle: "Ausgewählte Nachweise",
    selectedLead: "Core · Pro · Proof — messbare Ergebnisse in einer Kette.",
    vsTitle: "Vergleich mit Konkurrenten",
    vsSub: "Gemessener Nachweis — Architekturnotizen zu Fail2ban / CrowdSec / ModSecurity. Der Sieger jeder Zeile ist rot markiert.",
    vsAdvTitle: "Die Vorteile, die wir Ihnen bieten",
    chartsTitle: "Vergleich in Diagrammen",
    chartsSub: "Aus gemessenem Nachweis abgeleitet. Unsere Linie ist türkis.",
    proofTests: "automatische Prüftests.", proofPassed: "bestanden.",
    proofCtaAll: "Alle Tests ansehen", proofCtaPdf: "Nachweis-PDF",
    honestTitle: "Ehrliche Grenzen", layersTitle: "Schichten",
    setupTitle: "Installationsanleitung (detailliert)",
    setupSub: "Core-Installation von Grund auf unter Ubuntu/Debian (~15 Min) — Befehl für Befehl.",
    reqTitle: "Voraussetzungen", evidenceTitle: "Nachweispaket",
    contactTitle: "Kontakt & Mitwirken", ctaEmail: "E-Mail senden", ctaGithub: "GitHub-Quelle",
    colProduct: "Produkt", colDev: "Entwickler", colProject: "Projekt", copySuffix: "Open Source",
  },
  fr: {
    pipelineTitle: "Une seule chaîne : du log au ban noyau",
    pipelineSub: "~17 ms de la ligne de log d'accès nginx au ban ipset — les rivaux ont une architecture fragmentée.",
    selectedTitle: "Preuves sélectionnées",
    selectedLead: "Core · Pro · Proof — des résultats mesurables en une seule chaîne.",
    vsTitle: "Comparaison avec les rivaux",
    vsSub: "Preuve mesurée — notes d'architecture Fail2ban / CrowdSec / ModSecurity. Le gagnant de chaque ligne est en rouge.",
    vsAdvTitle: "Les avantages que nous vous offrons",
    chartsTitle: "Comparaison en graphiques",
    chartsSub: "Dérivé de preuves mesurées. Notre courbe est turquoise.",
    proofTests: "tests de vérification automatiques.", proofPassed: "réussis.",
    proofCtaAll: "Voir tous les tests", proofCtaPdf: "PDF de preuve",
    honestTitle: "Limites honnêtes", layersTitle: "Couches",
    setupTitle: "Guide d'installation (détaillé)",
    setupSub: "Installation Core à partir de zéro sur Ubuntu/Debian (~15 min) — commande par commande.",
    reqTitle: "Prérequis", evidenceTitle: "Pack de preuves",
    contactTitle: "Contact & contribution", ctaEmail: "Envoyer un e-mail", ctaGithub: "Source GitHub",
    colProduct: "Produit", colDev: "Développeur", colProject: "Projet", copySuffix: "open source",
  },
  es: {
    pipelineTitle: "Una sola cadena: del log al ban de kernel",
    pipelineSub: "~17 ms desde la línea de log de acceso de nginx hasta el ban de ipset — los rivales tienen arquitectura fragmentada.",
    selectedTitle: "Pruebas seleccionadas",
    selectedLead: "Core · Pro · Proof — resultados medibles en una sola cadena.",
    vsTitle: "Comparación con rivales",
    vsSub: "Prueba medida — notas de arquitectura de Fail2ban / CrowdSec / ModSecurity. El ganador de cada fila está en rojo.",
    vsAdvTitle: "Las ventajas que te ofrecemos",
    chartsTitle: "Comparación en gráficos",
    chartsSub: "Derivado de pruebas medidas. Nuestra línea es turquesa.",
    proofTests: "pruebas de verificación automáticas.", proofPassed: "superadas.",
    proofCtaAll: "Ver todas las pruebas", proofCtaPdf: "PDF de prueba",
    honestTitle: "Límites honestos", layersTitle: "Capas",
    setupTitle: "Guía de instalación (detallada)",
    setupSub: "Instalación de Core desde cero en Ubuntu/Debian (~15 min) — comando a comando.",
    reqTitle: "Requisitos", evidenceTitle: "Paquete de pruebas",
    contactTitle: "Contacto y contribución", ctaEmail: "Enviar correo", ctaGithub: "Código GitHub",
    colProduct: "Producto", colDev: "Desarrollador", colProject: "Proyecto", copySuffix: "código abierto",
  },
  ru: {
    pipelineTitle: "Одна цепочка: от лога до бана в ядре",
    pipelineSub: "~17 мс от строки access-лога nginx до бана ipset — у конкурентов фрагментарная архитектура.",
    selectedTitle: "Избранные доказательства",
    selectedLead: "Core · Pro · Proof — измеримые результаты в одной цепочке.",
    vsTitle: "Сравнение с конкурентами",
    vsSub: "Измеренное доказательство — заметки по архитектуре Fail2ban / CrowdSec / ModSecurity. Победитель в каждой строке отмечен красным.",
    vsAdvTitle: "Преимущества, которые мы даём",
    chartsTitle: "Сравнение в графиках",
    chartsSub: "Выведено из измеренных доказательств. Наша линия — бирюзовая.",
    proofTests: "автоматических проверочных тестов.", proofPassed: "пройдено.",
    proofCtaAll: "Показать все тесты", proofCtaPdf: "PDF-доказательство",
    honestTitle: "Честные границы", layersTitle: "Слои",
    setupTitle: "Руководство по установке (подробно)",
    setupSub: "Установка Core с нуля на Ubuntu/Debian (~15 мин) — команда за командой.",
    reqTitle: "Требования", evidenceTitle: "Пакет доказательств",
    contactTitle: "Контакты и вклад", ctaEmail: "Отправить письмо", ctaGithub: "Исходники GitHub",
    colProduct: "Продукт", colDev: "Разработчику", colProject: "Проект", copySuffix: "открытый код",
  },
  pt: {
    pipelineTitle: "Uma só cadeia: do log ao ban de kernel",
    pipelineSub: "~17 ms da linha de log de acesso do nginx ao ban de ipset — os rivais têm arquitetura fragmentada.",
    selectedTitle: "Provas selecionadas",
    selectedLead: "Core · Pro · Proof — resultados mensuráveis numa só cadeia.",
    vsTitle: "Comparação com rivais",
    vsSub: "Prova medida — notas de arquitetura de Fail2ban / CrowdSec / ModSecurity. O vencedor de cada linha está a vermelho.",
    vsAdvTitle: "As vantagens que oferecemos",
    chartsTitle: "Comparação em gráficos",
    chartsSub: "Derivado de provas medidas. A nossa linha é turquesa.",
    proofTests: "testes de verificação automáticos.", proofPassed: "aprovados.",
    proofCtaAll: "Ver todos os testes", proofCtaPdf: "PDF de prova",
    honestTitle: "Limites honestos", layersTitle: "Camadas",
    setupTitle: "Guia de instalação (detalhado)",
    setupSub: "Instalação do Core do zero em Ubuntu/Debian (~15 min) — comando a comando.",
    reqTitle: "Requisitos", evidenceTitle: "Pacote de provas",
    contactTitle: "Contacto e contribuição", ctaEmail: "Enviar e-mail", ctaGithub: "Código GitHub",
    colProduct: "Produto", colDev: "Programador", colProject: "Projeto", copySuffix: "código aberto",
  },
  nl: {
    pipelineTitle: "Eén keten: van log naar kernel-ban",
    pipelineSub: "~17 ms van de nginx-accesslogregel tot de ipset-ban — concurrenten hebben een versnipperde architectuur.",
    selectedTitle: "Geselecteerde bewijzen",
    selectedLead: "Core · Pro · Proof — meetbare resultaten in één keten.",
    vsTitle: "Vergelijking met concurrenten",
    vsSub: "Gemeten bewijs — architectuurnotities Fail2ban / CrowdSec / ModSecurity. De winnaar per rij is rood.",
    vsAdvTitle: "De voordelen die wij bieden",
    chartsTitle: "Vergelijking in grafieken",
    chartsSub: "Afgeleid van gemeten bewijs. Onze lijn is turquoise.",
    proofTests: "automatische verificatietests.", proofPassed: "geslaagd.",
    proofCtaAll: "Alle tests bekijken", proofCtaPdf: "Bewijs-PDF",
    honestTitle: "Eerlijke grenzen", layersTitle: "Lagen",
    setupTitle: "Installatiegids (gedetailleerd)",
    setupSub: "Core vanaf nul installeren op Ubuntu/Debian (~15 min) — commando voor commando.",
    reqTitle: "Vereisten", evidenceTitle: "Bewijspakket",
    contactTitle: "Contact & bijdragen", ctaEmail: "E-mail sturen", ctaGithub: "GitHub-broncode",
    colProduct: "Product", colDev: "Ontwikkelaar", colProject: "Project", copySuffix: "open source",
  },
  zh: {
    pipelineTitle: "单一链路：从日志到内核封禁",
    pipelineSub: "从 nginx 访问日志行到 ipset 封禁约 17 毫秒——竞品架构零散。",
    selectedTitle: "精选证据",
    selectedLead: "Core · Pro · Proof——单一链路中的可衡量结果。",
    vsTitle: "与竞品对比",
    vsSub: "实测证据——Fail2ban / CrowdSec / ModSecurity 架构说明。每行的优胜者以红色标出。",
    vsAdvTitle: "我们为你带来的优势",
    chartsTitle: "图表对比",
    chartsSub: "源自实测证据。我们的曲线为青绿色。",
    proofTests: "项自动化验证测试。", proofPassed: "通过。",
    proofCtaAll: "查看全部测试", proofCtaPdf: "证据 PDF",
    honestTitle: "诚实边界", layersTitle: "层级",
    setupTitle: "安装指南（详细）",
    setupSub: "在 Ubuntu/Debian 上从零安装 Core（约15分钟）——逐条命令。",
    reqTitle: "环境要求", evidenceTitle: "证据包",
    contactTitle: "联系与贡献", ctaEmail: "发送邮件", ctaGithub: "GitHub 源码",
    colProduct: "产品", colDev: "开发者", colProject: "项目", copySuffix: "开源",
  },
  ja: {
    pipelineTitle: "単一チェーン：ログからカーネルBANまで",
    pipelineSub: "nginx アクセスログの行から ipset BAN まで約17ms——競合は断片的なアーキテクチャ。",
    selectedTitle: "厳選された証拠",
    selectedLead: "Core · Pro · Proof——単一チェーンでの測定可能な結果。",
    vsTitle: "競合との比較",
    vsSub: "測定済みの証拠——Fail2ban / CrowdSec / ModSecurity のアーキテクチャ注記。各行の勝者は赤で表示。",
    vsAdvTitle: "私たちが提供する利点",
    chartsTitle: "グラフで比較",
    chartsSub: "測定済みの証拠から導出。私たちの線はターコイズ。",
    proofTests: "件の自動検証テスト。", proofPassed: "合格。",
    proofCtaAll: "すべてのテストを見る", proofCtaPdf: "証拠PDF",
    honestTitle: "正直な限界", layersTitle: "レイヤー",
    setupTitle: "セットアップガイド（詳細）",
    setupSub: "Ubuntu/Debian にゼロから Core を導入（約15分）——コマンドごとに。",
    reqTitle: "要件", evidenceTitle: "証拠パッケージ",
    contactTitle: "連絡と貢献", ctaEmail: "メール送信", ctaGithub: "GitHub ソース",
    colProduct: "製品", colDev: "開発者", colProject: "プロジェクト", copySuffix: "オープンソース",
  },
  ko: {
    pipelineTitle: "단일 체인: 로그에서 커널 밴까지",
    pipelineSub: "nginx 액세스 로그 줄에서 ipset 밴까지 약 17ms — 경쟁사는 조각난 아키텍처.",
    selectedTitle: "선별된 증거",
    selectedLead: "Core · Pro · Proof — 단일 체인의 측정 가능한 결과.",
    vsTitle: "경쟁사와 비교",
    vsSub: "측정된 증거 — Fail2ban / CrowdSec / ModSecurity 아키텍처 참고. 각 행의 승자는 빨간색.",
    vsAdvTitle: "우리가 제공하는 이점",
    chartsTitle: "차트로 비교",
    chartsSub: "측정된 증거에서 도출. 우리 선은 청록색.",
    proofTests: "개의 자동 검증 테스트.", proofPassed: "통과.",
    proofCtaAll: "모든 테스트 보기", proofCtaPdf: "증거 PDF",
    honestTitle: "정직한 한계", layersTitle: "레이어",
    setupTitle: "설치 가이드 (상세)",
    setupSub: "Ubuntu/Debian에서 Core를 처음부터 설치 (~15분) — 명령 단위로.",
    reqTitle: "요구 사항", evidenceTitle: "증거 패키지",
    contactTitle: "연락 및 기여", ctaEmail: "이메일 보내기", ctaGithub: "GitHub 소스",
    colProduct: "제품", colDev: "개발자", colProject: "프로젝트", copySuffix: "오픈소스",
  },
  ar: {
    pipelineTitle: "سلسلة واحدة: من السجل إلى الحظر على مستوى النواة",
    pipelineSub: "نحو 17 مللي ثانية من سطر سجل وصول nginx إلى حظر ipset — المنافسون بنيتهم مجزّأة.",
    selectedTitle: "أدلة مختارة",
    selectedLead: "Core · Pro · Proof — نتائج قابلة للقياس في سلسلة واحدة.",
    vsTitle: "مقارنة بالمنافسين",
    vsSub: "دليل مقاس — ملاحظات معمارية عن Fail2ban / CrowdSec / ModSecurity. الفائز في كل صف بالأحمر.",
    vsAdvTitle: "المزايا التي نقدّمها لك",
    chartsTitle: "مقارنة بالرسوم البيانية",
    chartsSub: "مشتق من أدلة مقاسة. خطّنا فيروزي.",
    proofTests: "اختبار تحقق آلي.", proofPassed: "ناجحة.",
    proofCtaAll: "عرض كل الاختبارات", proofCtaPdf: "PDF الدليل",
    honestTitle: "حدود صادقة", layersTitle: "الطبقات",
    setupTitle: "دليل التثبيت (مفصّل)",
    setupSub: "تثبيت Core من الصفر على Ubuntu/Debian (نحو 15 دقيقة) — أمراً بأمر.",
    reqTitle: "المتطلبات", evidenceTitle: "حزمة الأدلة",
    contactTitle: "التواصل والمساهمة", ctaEmail: "إرسال بريد", ctaGithub: "مصدر GitHub",
    colProduct: "المنتج", colDev: "المطوّر", colProject: "المشروع", copySuffix: "مفتوح المصدر",
  },
  az: {
    pipelineTitle: "Tək zəncir: logdan kernel bana",
    pipelineSub: "nginx giriş log sətirindən ipset bana ~17 ms — rəqiblərdə parçalı memarlıq.",
    selectedTitle: "Seçilmiş sübutlar",
    selectedLead: "Core · Pro · Proof — tək zəncirdə ölçülə bilən nəticələr.",
    vsTitle: "Rəqiblərlə müqayisə",
    vsSub: "Ölçülmüş sübut — Fail2ban / CrowdSec / ModSecurity memarlıq qeydləri. Hər sətirdə üstün olan qırmızı ilə işarələnib.",
    vsAdvTitle: "Sizə verdiyimiz üstünlüklər",
    chartsTitle: "Qrafiklərlə müqayisə",
    chartsSub: "Ölçülmüş sübutdan törədilib. Bizim xətt firuzəyidir.",
    proofTests: "avtomatik doğrulama testi.", proofPassed: "keçdi.",
    proofCtaAll: "Bütün testlərə bax", proofCtaPdf: "Sübut PDF",
    honestTitle: "Dürüst hədlər", layersTitle: "Qatlar",
    setupTitle: "Quraşdırma bələdçisi (ətraflı)",
    setupSub: "Ubuntu/Debian üzərində sıfırdan Core quraşdırması (~15 dəq) — addım-addım.",
    reqTitle: "Tələblər", evidenceTitle: "Sübut paketi",
    contactTitle: "Əlaqə və töhfə", ctaEmail: "E-poçt göndər", ctaGithub: "GitHub mənbə",
    colProduct: "Məhsul", colDev: "Tərtibatçı", colProject: "Layihə", copySuffix: "açıq mənbə",
  },
  kk: {
    pipelineTitle: "Бір тізбек: логтан kernel банға",
    pipelineSub: "nginx кіру журналы жолынан ipset банға ~17 мс — бәсекелестерде бөлшек архитектура.",
    selectedTitle: "Таңдаулы дәлелдер",
    selectedLead: "Core · Pro · Proof — бір тізбекте өлшенетін нәтижелер.",
    vsTitle: "Бәсекелестермен салыстыру",
    vsSub: "Өлшенген дәлел — Fail2ban / CrowdSec / ModSecurity архитектура ескертпелері. Әр жолдағы үздік қызылмен белгіленген.",
    vsAdvTitle: "Сізге беретін артықшылықтарымыз",
    chartsTitle: "Графиктермен салыстыру",
    chartsSub: "Өлшенген дәлелден алынған. Біздің сызық — көгілдір.",
    proofTests: "автоматты тексеру тесті.", proofPassed: "өтті.",
    proofCtaAll: "Барлық тесттерді көру", proofCtaPdf: "Дәлел PDF",
    honestTitle: "Адал шектер", layersTitle: "Қабаттар",
    setupTitle: "Орнату нұсқаулығы (толық)",
    setupSub: "Ubuntu/Debian-де Core-ды нөлден орнату (~15 мин) — қадам-қадам.",
    reqTitle: "Талаптар", evidenceTitle: "Дәлел пакеті",
    contactTitle: "Байланыс және үлес", ctaEmail: "Хат жіберу", ctaGithub: "GitHub бастапқы коды",
    colProduct: "Өнім", colDev: "Әзірлеуші", colProject: "Жоба", copySuffix: "ашық бастапқы код",
  },
  uz: {
    pipelineTitle: "Yagona zanjir: logdan kernel banga",
    pipelineSub: "nginx kirish logi qatoridan ipset banga ~17 ms — raqiblarda bo'lak arxitektura.",
    selectedTitle: "Tanlangan dalillar",
    selectedLead: "Core · Pro · Proof — yagona zanjirda o'lchanadigan natijalar.",
    vsTitle: "Raqiblar bilan taqqoslash",
    vsSub: "O'lchangan dalil — Fail2ban / CrowdSec / ModSecurity arxitektura eslatmalari. Har qatordagi g'olib qizil bilan belgilangan.",
    vsAdvTitle: "Sizga beradigan afzalliklarimiz",
    chartsTitle: "Grafiklarda taqqoslash",
    chartsSub: "O'lchangan dalildan olingan. Bizning chiziq — feruza rang.",
    proofTests: "avtomatik tekshiruv testi.", proofPassed: "o'tdi.",
    proofCtaAll: "Barcha testlarni ko'rish", proofCtaPdf: "Dalil PDF",
    honestTitle: "Halol chegaralar", layersTitle: "Qatlamlar",
    setupTitle: "O'rnatish qo'llanmasi (batafsil)",
    setupSub: "Ubuntu/Debian'da Core'ni noldan o'rnatish (~15 daq) — qadam-baqadam.",
    reqTitle: "Talablar", evidenceTitle: "Dalil to'plami",
    contactTitle: "Aloqa va hissa", ctaEmail: "E-pochta yuborish", ctaGithub: "GitHub manba",
    colProduct: "Mahsulot", colDev: "Ishlab chiquvchi", colProject: "Loyiha", copySuffix: "ochiq manba",
  },
  ky: {
    pipelineTitle: "Бирдиктүү чынжыр: логдон kernel банга",
    pipelineSub: "nginx кирүү логу сабынан ipset банга ~17 мс — атаандаштарда бөлүк архитектура.",
    selectedTitle: "Тандалган далилдер",
    selectedLead: "Core · Pro · Proof — бир чынжырда өлчөнгөн натыйжалар.",
    vsTitle: "Атаандаштар менен салыштыруу",
    vsSub: "Өлчөнгөн далил — Fail2ban / CrowdSec / ModSecurity архитектура эскертүүлөрү. Ар сапта мыктысы кызыл менен белгиленген.",
    vsAdvTitle: "Сизге берген артыкчылыктарыбыз",
    chartsTitle: "Графиктер менен салыштыруу",
    chartsSub: "Өлчөнгөн далилден алынган. Биздин сызык — көгүлтүр.",
    proofTests: "автоматтык текшерүү тести.", proofPassed: "өттү.",
    proofCtaAll: "Бардык тесттерди көрүү", proofCtaPdf: "Далил PDF",
    honestTitle: "Чынчыл чектер", layersTitle: "Катмарлар",
    setupTitle: "Орнотуу колдонмосу (толук)",
    setupSub: "Ubuntu/Debian'да Core'ду нөлдөн орнотуу (~15 мүн) — кадам-кадам.",
    reqTitle: "Талаптар", evidenceTitle: "Далил топтому",
    contactTitle: "Байланыш жана салым", ctaEmail: "Кат жөнөтүү", ctaGithub: "GitHub булагы",
    colProduct: "Продукт", colDev: "Иштеп чыгуучу", colProject: "Долбоор", copySuffix: "ачык булак",
  },
  tk: {
    pipelineTitle: "Ýeke zynjyr: logdan kernel bana",
    pipelineSub: "nginx giriş logy setirinden ipset bana ~17 ms — bäsdeşlerde bölek arhitektura.",
    selectedTitle: "Saýlanan subutnamalar",
    selectedLead: "Core · Pro · Proof — ýeke zynjyrda ölçäp bolýan netijeler.",
    vsTitle: "Bäsdeşler bilen deňeşdirme",
    vsSub: "Ölçelen subutnama — Fail2ban / CrowdSec / ModSecurity arhitektura bellikleri. Her setirde öňdäki gyzyl bilen bellenen.",
    vsAdvTitle: "Size berýän artykmaçlyklarymyz",
    chartsTitle: "Grafikler bilen deňeşdirme",
    chartsSub: "Ölçelen subutnamadan alnan. Biziň çyzyk — firuza.",
    proofTests: "awtomatik barlag testi.", proofPassed: "geçdi.",
    proofCtaAll: "Ähli testleri gör", proofCtaPdf: "Subutnama PDF",
    honestTitle: "Dogruçyl çäkler", layersTitle: "Gatlaklar",
    setupTitle: "Gurnama gollanmasy (giňişleýin)",
    setupSub: "Ubuntu/Debian-da Core-y noldan gurnamak (~15 min) — ädim-ädim.",
    reqTitle: "Talaplar", evidenceTitle: "Subutnama paketi",
    contactTitle: "Habarlaşmak we goşant", ctaEmail: "E-poçta ibermek", ctaGithub: "GitHub çeşme",
    colProduct: "Önüm", colDev: "Işläp düzüji", colProject: "Taslama", copySuffix: "açyk çeşme",
  },
  crh: {
    pipelineTitle: "Tek zıncır: logdan kernel banğa",
    pipelineSub: "nginx kirim logu satırından ipset banğa ~17 ms — raqiplerde parça mimarlıq.",
    selectedTitle: "Saylanğan deliller",
    selectedLead: "Core · Pro · Proof — tek zıncırda ölçele bilgen neticeler.",
    vsTitle: "Raqiplernen qıyaslav",
    vsSub: "Ölçengen delil — Fail2ban / CrowdSec / ModSecurity mimarlıq notları. Er satırda üstün olğan qırmızı ilen belgilengen.",
    vsAdvTitle: "Size bergen üstünliklerimiz",
    chartsTitle: "Grafiklernen qıyaslav",
    chartsSub: "Ölçengen delilden alınğan. Bizim sızıq — firuze.",
    proofTests: "avtomatik teşkeriş testi.", proofPassed: "keçti.",
    proofCtaAll: "Bütün testlerni köster", proofCtaPdf: "Delil PDF",
    honestTitle: "Doğru sıñırlar", layersTitle: "Qatlar",
    setupTitle: "Qurulım qılavuzı (tafsilâtlı)",
    setupSub: "Ubuntu/Debian üzerinde sıfırdan Core qurulımı (~15 daq) — adım-adım.",
    reqTitle: "Talaplar", evidenceTitle: "Delil paketi",
    contactTitle: "Alâqa ve qatqı", ctaEmail: "E-mail yiber", ctaGithub: "GitHub menba",
    colProduct: "Mahsul", colDev: "Işlep çıqaruvcı", colProject: "Proyekt", copySuffix: "açıq menba",
  },
  gag: {
    pipelineTitle: "Tek zincir: logdan kernel bana",
    pipelineSub: "nginx giriş logu satırından ipset bana ~17 ms — rakiplärdä parça mimarlık.",
    selectedTitle: "Seçili deliller",
    selectedLead: "Core · Pro · Proof — tek zincirdä ölçülebilän sonuçlar.",
    vsTitle: "Rakiplärlän karşılaştırma",
    vsSub: "Ölçülü delil — Fail2ban / CrowdSec / ModSecurity mimarlık notları. Her satırda üstün olan kırmızıylan işaretli.",
    vsAdvTitle: "Sizä verdiimiz faydalar",
    chartsTitle: "Grafiklärlän karşılaştırma",
    chartsSub: "Ölçülü delildän çıkarıldı. Bizim çizgi — firuza.",
    proofTests: "avtomatik kontrol testi.", proofPassed: "geçti.",
    proofCtaAll: "Hepsi testleri gör", proofCtaPdf: "Delil PDF",
    honestTitle: "Dooru sınırlar", layersTitle: "Katlar",
    setupTitle: "Kurma kılavuzu (detaylı)",
    setupSub: "Ubuntu/Debian üstündä sıfırdan Core kurma (~15 dak) — adım-adım.",
    reqTitle: "Lääzımnıklar", evidenceTitle: "Delil paketi",
    contactTitle: "İlişki hem katkı", ctaEmail: "E-mail yolla", ctaGithub: "GitHub kaynaa",
    colProduct: "Ürün", colDev: "Geliştirici", colProject: "Proekt", copySuffix: "açık kaynak",
  },
  tt: {
    pipelineTitle: "Бер чылбыр: логтан kernel банга",
    pipelineSub: "nginx керү журналы юлыннан ipset банга ~17 мс — көндәшләрдә өлешле архитектура.",
    selectedTitle: "Сайланган дәлилләр",
    selectedLead: "Core · Pro · Proof — бер чылбырда үлчәнә торган нәтиҗәләр.",
    vsTitle: "Көндәшләр белән чагыштыру",
    vsSub: "Үлчәнгән дәлил — Fail2ban / CrowdSec / ModSecurity архитектура искәрмәләре. Һәр юлда өстен булганы кызыл белән билгеләнгән.",
    vsAdvTitle: "Сезгә биргән өстенлекләребез",
    chartsTitle: "Графиклар белән чагыштыру",
    chartsSub: "Үлчәнгән дәлилдән алынган. Безнең сызык — фирүзә.",
    proofTests: "автоматик тикшерү тесты.", proofPassed: "узды.",
    proofCtaAll: "Барлык тестларны күрү", proofCtaPdf: "Дәлил PDF",
    honestTitle: "Намуслы чикләр", layersTitle: "Катламнар",
    setupTitle: "Урнаштыру кулланмасы (тулы)",
    setupSub: "Ubuntu/Debian'да Core'ны нульдән урнаштыру (~15 мин) — адымлап.",
    reqTitle: "Таләпләр", evidenceTitle: "Дәлил пакеты",
    contactTitle: "Элемтә һәм өлеш", ctaEmail: "Хат җибәрү", ctaGithub: "GitHub чыганагы",
    colProduct: "Продукт", colDev: "Эшләүче", colProject: "Проект", copySuffix: "ачык чыганак",
  },
  ba: {
    pipelineTitle: "Бер сылбыр: логтан kernel банға",
    pipelineSub: "nginx инеү журналы юлынан ipset банға ~17 мс — көндәштәрҙә өлөшлө архитектура.",
    selectedTitle: "Һайланған дәлилдәр",
    selectedLead: "Core · Pro · Proof — бер сылбырҙа үлсәнә торған һөҙөмтәләр.",
    vsTitle: "Көндәштәр менән сағыштырыу",
    vsSub: "Үлсәнгән дәлил — Fail2ban / CrowdSec / ModSecurity архитектура иҫкәрмәләре. Һәр юлда өҫтөн булғаны ҡыҙыл менән билдәләнгән.",
    vsAdvTitle: "Һеҙгә биргән өҫтөнлөктәребеҙ",
    chartsTitle: "Графиктар менән сағыштырыу",
    chartsSub: "Үлсәнгән дәлилдән алынған. Беҙҙең һыҙыҡ — фирүзә.",
    proofTests: "автоматик тикшереү тесы.", proofPassed: "үтте.",
    proofCtaAll: "Бөтә тестарҙы ҡарау", proofCtaPdf: "Дәлил PDF",
    honestTitle: "Намыҫлы сиктәр", layersTitle: "Ҡатламдар",
    setupTitle: "Урынлаштырыу ҡулланмаһы (тулы)",
    setupSub: "Ubuntu/Debian'да Core'ды нулдән урынлаштырыу (~15 мин) — аҙымлап.",
    reqTitle: "Талаптар", evidenceTitle: "Дәлил пакеты",
    contactTitle: "Бәйләнеш һәм өлөш", ctaEmail: "Хат ебәреү", ctaGithub: "GitHub сығанағы",
    colProduct: "Продукт", colDev: "Эшләүсе", colProject: "Проект", copySuffix: "асыҡ сығанаҡ",
  },
  cv: {
    pipelineTitle: "Пӗр сӑнчӑр: логран kernel бан патне",
    pipelineSub: "nginx кӗрӳ журналӗ йӗркинчен ipset бана ~17 мс — конкурентсенче пайланнӑ архитектура.",
    selectedTitle: "Суйласа илнӗ кӑтартусем",
    selectedLead: "Core · Pro · Proof — пӗр сӑнчӑрта виҫме пулакан результатсем.",
    vsTitle: "Конкурентсемпе танлаштарни",
    vsSub: "Виҫнӗ кӑтарту — Fail2ban / CrowdSec / ModSecurity архитектура асӑрхаттарӑвӗсем. Кашни йӗркере ҫӗнтерекенни хӗрлӗпе паллӑ тунӑ.",
    vsAdvTitle: "Сире паракан пайдасем",
    chartsTitle: "Графиксемпе танлаштарни",
    chartsSub: "Виҫнӗ кӑтартуран илнӗ. Пирӗн линия — фирӳза.",
    proofTests: "автомат тӗрӗслев тесчӗ.", proofPassed: "иртнӗ.",
    proofCtaAll: "Пур тестсене пӑх", proofCtaPdf: "Кӑтарту PDF",
    honestTitle: "Тӳрӗ чикӗсем", layersTitle: "Сийсем",
    setupTitle: "Вырнаҫтару кӑтартӑвӗ (тӗплӗ)",
    setupSub: "Ubuntu/Debian ҫинче Core-а нульран вырнаҫтарни (~15 мин) — утӑмӑн-утӑмӑн.",
    reqTitle: "Кирлӗлӗхсем", evidenceTitle: "Кӑтарту пакечӗ",
    contactTitle: "Ҫыхӑну тата хутшӑну", ctaEmail: "Ҫыру яр", ctaGithub: "GitHub çӑлкуҫӗ",
    colProduct: "Продукт", colDev: "Аталантаракан", colProject: "Проект", copySuffix: "уҫӑ ҫӑлкуҫ",
  },
  ug: {
    pipelineTitle: "بىرلا زەنجىر: خاتىرىدىن يادرو چەكلىشىگىچە",
    pipelineSub: "nginx كىرىش خاتىرىسى قۇرىدىن ipset چەكلەشكىچە ~17 مىللىسېكۇنت — رەقىبلەردە پارچە قۇرۇلما.",
    selectedTitle: "تاللانغان ئىسپاتلار",
    selectedLead: "Core · Pro · Proof — بىرلا زەنجىردە ئۆلچىگىلى بولىدىغان نەتىجىلەر.",
    vsTitle: "رەقىبلەر بىلەن سېلىشتۇرۇش",
    vsSub: "ئۆلچەنگەن ئىسپات — Fail2ban / CrowdSec / ModSecurity قۇرۇلما ئىزاھاتى. ھەر قۇردا ئۈستۈن بولغىنى قىزىل بىلەن بەلگىلەنگەن.",
    vsAdvTitle: "سىزگە بەرگەن ئارتۇقچىلىقلىرىمىز",
    chartsTitle: "دىئاگراممىلار بىلەن سېلىشتۇرۇش",
    chartsSub: "ئۆلچەنگەن ئىسپاتتىن ئېلىنغان. بىزنىڭ سىزىق — كۆك يېشىل.",
    proofTests: "ئاپتوماتىك دەلىللەش سىنىقى.", proofPassed: "ئۆتتى.",
    proofCtaAll: "بارلىق سىناقلارنى كۆرۈش", proofCtaPdf: "ئىسپات PDF",
    honestTitle: "سەمىمىي چەكلەر", layersTitle: "قاتلاملار",
    setupTitle: "ئورنىتىش قوللانمىسى (تەپسىلىي)",
    setupSub: "Ubuntu/Debian دا Core نى نۆلدىن ئورنىتىش (~15 مىنۇت) — قەدەممۇقەدەم.",
    reqTitle: "تەلەپلەر", evidenceTitle: "ئىسپات بولىقى",
    contactTitle: "ئالاقە ۋە تۆھپە", ctaEmail: "ئېلخەت ئەۋەتىش", ctaGithub: "GitHub مەنبە",
    colProduct: "مەھسۇلات", colDev: "ئىجادىيەتچى", colProject: "تۈر", copySuffix: "ئوچۇق مەنبە",
  },
  sah: {
    pipelineTitle: "Биир сиэп: логтан kernel бан диэки",
    pipelineSub: "nginx киирии сурунаал строкатыттан ipset бан диэки ~17 мс — күрэхтэһээччилэргэ аҥаардас архитектура.",
    selectedTitle: "Талыллыбыт туоһулар",
    selectedLead: "Core · Pro · Proof — биир сиэпкэ кээмэйдэнэр түмүктэр.",
    vsTitle: "Күрэхтэһээччилэри тэҥнээһин",
    vsSub: "Кээмэйдэммит туоһу — Fail2ban / CrowdSec / ModSecurity архитектура бэлиэтэ. Хас строкаҕа кыайааччы кыһыл өҥүнэн бэлиэтэммит.",
    vsAdvTitle: "Эһиэхэ биэрэр туһабыт",
    chartsTitle: "Графиктарынан тэҥнээһин",
    chartsSub: "Кээмэйдэммит туоһуттан ылыллыбыт. Биһиги линиябыт — фирүза.",
    proofTests: "автомат бэрэбиэркэ тиэһэ.", proofPassed: "ааста.",
    proofCtaAll: "Бары тиэстэри көр", proofCtaPdf: "Туоһу PDF",
    honestTitle: "Кырдьык кыраныыс", layersTitle: "Слойдар",
    setupTitle: "Олохтооһун көрдөрөр (сиһилии)",
    setupSub: "Ubuntu/Debian үрдүгэр Core-у нуультан олохтооһун (~15 мүн) — хардыытан хардыы.",
    reqTitle: "Ирдэбиллэр", evidenceTitle: "Туоһу пакета",
    contactTitle: "Ситим уонна кыттыы", ctaEmail: "Сурук ыыт", ctaGithub: "GitHub төрдө",
    colProduct: "Продукт", colDev: "Оҥорооччу", colProject: "Проект", copySuffix: "аһаҕас төрүт",
  },
};

/* ------------------------- Per-locale BODY overrides ---------------------- */
// Full prose translation of the high-visibility body text. Any field left
// undefined falls back to the English base (CO_EN).

type BodyOverride = {
  pipelineNote?: string;
  selectedBodies?: string[]; // 12
  advLead?: string;
  advantages?: { k: string; v: string }[]; // 6
  vsNote?: string;
  vsLegend?: string;
  honestItems?: string[]; // 4
  layersBodies?: string[]; // 3
  layersNote?: string;
  setupIntro?: string;
  setupTip?: string;
  contactBody?: string;
  footerDesc?: string;
  footerSoak?: string;
  proofBody?: string;
};

const BODY_OVERRIDES: Partial<Record<Locale, BodyOverride>> = {
  de: {
    pipelineNote:
      "XDR, Wasm-Marktplatz und LLM-Copilot sind langfristige optionale Schichten — Core ist allein produktionsreif.",
    selectedBodies: [
      "Eine Kette: nginx-Log → OWASP CRS → ~17 ms Kernel-Ban. Produktion in ~15 Minuten.",
      "Flotte, SOC-Timeline, Dashboards — eine optionale Schicht auf Ihrem eigenen Server nach der Installation.",
      "75 automatische Tests, Vergleichs-PDF, 72h-Soak — dieselbe Matrix wie dashboard /tests.",
      "Tenant-markierte Prometheus-Metriken, Dashboards und Alarmregeln — self-hosted Observability.",
      "Multi-Node-Flotte: Agent-Sync, etcd-Mesh-Policy und gezielter Befehlsversand — aus einem Panel.",
      "TAXII/STIX-Threat-Feed + Telegram-SOC: Alarm, Ban und Ein-Klick-'ack' — Live-Betreiber-Flow.",
      "XDP-Filter + execve/lineage-uprobes — Paket-Drop auf Kernel-Ebene und Syscall-Tracing. Auf Laptops genügt --no-xdp mit ipset.",
      "Erkennung verteilter Scanner: gleicher JA3-Fingerprint + anderer IP-Cluster, 100% Recall — Live-Test mit 80 IPs.",
      "Angriffsbaum, Lineage-Probe, Syscall-uprobe — langfristige optionale Schicht; Erkennung von Angriffsketten und verdeckten Kanälen.",
      "Eigene Regel-Plugins über eine Wasm-Runtime — Marktplatz-Modell, erweitern ohne den Core zu berühren.",
      "JSON-event_type-Stream — SIEM-Export-Nachweis für Splunk/Elastic/Vector (siem-export-report.json).",
      "Tarpit-Server + Trap-Watcher — den Angreifer verlangsamen und Honeypot-Signal; Deception-Schicht.",
    ],
    advLead:
      "Fail2ban bannt nur, ModSecurity-WAF ist ein separates Modul, CrowdSec braucht einen stückweisen Stack. Log Guardian vereint diese drei Aufgaben in einer Kette — mit gemessenem Nachweis.",
    advantages: [
      { k: "Eine Installation, eine Kette", v: "Sie installieren und integrieren Fail2ban + ModSecurity + CrowdSec nicht separat. nginx-Log → WAF/CRS → Kernel-Ban in einem Produkt, ~15 Min Setup." },
      { k: "~17 ms Kernel-Ban", v: "Median ~17 ms von der Logzeile bis zum ipset/XDP-Ban. Fail2ban/CrowdSec bleiben im Sekunden-Minuten-Bereich; belegt mit 5 gemessenen Proben." },
      { k: "100% Recall + 100% CRS-Parität", v: "121 OWASP-CRS-Regeln, 100% Recall echter Angriffe auf einem 1500-Zeilen-Korpus und volle Parität mit ModSec — bei 0,2% False Positives." },
      { k: "Abdeckung verteilter Angriffe", v: "JA3-Cluster-Erkennung + Ban pro IP — 100% in einem Live-Test mit 80 IPs. Fail2ban ist Einzel-IP; CrowdSec braucht ein separates Signalnetz." },
      { k: "Transparenter, reproduzierbarer Nachweis", v: "75 automatische Tests + ein 14-Dateien-Nachweispaket + 72h-Soak (864 Proben, 0 Fehler). Rivalen haben keinen automatischen Nachweis oder er ist fragmentiert." },
      { k: "Self-hosted · MIT · aus der Türkei", v: "Ihre Daten bleiben bei Ihnen, kein Vendor-Lock-in, voll Open Source. SOC-Timeline, Prometheus-Metriken und Telegram-Betrieb in einem Panel (:8443)." },
    ],
    vsNote:
      "Ehrliche Grenze: In manchen Bereichen sind Rivalen klar besser (rote Zellen). ModSec + CRS führt beim Inline-Durchsatz (~14.300 EPS, gemessen) und beim sofortigen Blockieren der ersten Anfrage; CrowdSec ist stark bei seinem verteilten Community-Signalnetz und der Managed-SaaS-Konsole. Unsere Stärke ist die Einketten-Integration + ~17 ms Ban-Tempo + transparenter, reproduzierbarer Nachweis.",
    vsLegend: "Rot = der Sieger in dieser Zeile",
    honestItems: [
      "Reaktive Architektur — die erste Anfrage kann durchgehen, bis die Logzeile fällt; wir erreichen nicht die Inline-Geschwindigkeit von ModSec.",
      "Wir absorbieren kein L3/L4-DDoS — wir sitzen hinter einem CDN.",
      "Verteiltes Botnetz — Ban pro IP; kein CrowdSec-Signalnetz.",
      "Leistet: Log → CRS/WAF → ~17 ms Kernel-Ban, Nachweis-PDF, Telegram-Betrieb, MIT self-hosted.",
    ],
    layersBodies: [
      "Log → WAF → ipset-Ban (~15 Min)",
      "eBPF-Daemon, Dashboard, Metriken, Flotte",
      "XDR, Wasm-Marktplatz, LLM-Copilot",
    ],
    layersNote:
      "XDR, Wasm-Marktplatz und LLM-Copilot sind langfristige optionale Schichten — Core ist allein produktionsreif.",
    setupIntro:
      "Quelle: GitHub — Linux-Log-Guardian. Zwei Wege: ein vorgefertigtes .deb-Paket (empfohlen) oder Bau aus dem Quellcode. Es läuft auch ohne eBPF/XDP auf Laptops/VMs (ipset-basierter Ban). Die folgenden Schritte gelten für einen Produktionsserver; die erwartete Ausgabe jedes Befehls ist enthalten.",
    setupTip:
      "Tipp: Für JWT und das Dashboard-Passwort nutzen Sie bash scripts/laptop_jwt_setup.sh. 3-Minuten-Demo: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Docs: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Schreiben Sie bei Fragen, für Zusammenarbeit oder Beiträge. Bug-Reports und Pull Requests sind im Open-Source-Geist willkommen.",
    footerDesc:
      "nginx-Access-Log → WAF/CRS → Kernel-Ban. Eine Kette, self-hosted, MIT-lizenziert. In der Türkei entwickelt.",
    footerSoak: "72h-Soak PASS · 0 Fehler",
    proofBody:
      "Keine Folien, reproduzierbarer Nachweis. OWASP-CRS-Parität, False-Positive-Gates, Ban-Latenz-Benchmarks, Korpus-Recall und ein 72-Stunden-Soak — alles gemessen, automatisiert und in einer öffentlichen Testmatrix sichtbar.",
  },
  fr: {
    pipelineNote:
      "XDR, la marketplace Wasm et le Copilot LLM sont des couches optionnelles à long terme — Core est prêt pour la production à lui seul.",
    selectedBodies: [
      "Une seule chaîne : log nginx → OWASP CRS → ban noyau ~17 ms. En production en ~15 minutes.",
      "Flotte, timeline SOC, tableaux de bord — une couche optionnelle sur votre propre serveur après l'installation.",
      "75 tests automatiques, PDF comparatif, soak 72h — la même matrice que dashboard /tests.",
      "Métriques Prometheus par tenant, tableaux de bord et règles d'alerte — observabilité auto-hébergée.",
      "Flotte multi-nœuds : sync d'agents, politique etcd mesh et envoi de commandes ciblé — depuis un seul panneau.",
      "Flux de menaces TAXII/STIX + SOC Telegram : alerte, ban et 'ack' en un clic — flux opérateur en direct.",
      "Filtre XDP + uprobes execve/lineage — drop de paquets au niveau noyau et traçage des syscalls. Sur portable, --no-xdp avec ipset suffit.",
      "Détection de scanners distribués : même empreinte JA3 + cluster d'IP différent, 100% de rappel — test en direct sur 80 IP.",
      "Arbre d'attaque, sonde de lignage, uprobe syscall — couche optionnelle à long terme ; détection de chaîne d'attaque et de canaux cachés.",
      "Plugins de règles personnalisés via un runtime Wasm — modèle marketplace, étendre sans toucher au Core.",
      "Flux JSON event_type — preuve d'export SIEM vers Splunk/Elastic/Vector (siem-export-report.json).",
      "Serveur tarpit + trap watcher — ralentir l'attaquant et signal honeypot ; couche de leurre.",
    ],
    advLead:
      "Fail2ban ne fait que bannir, le WAF ModSecurity est un module séparé, CrowdSec exige une pile fragmentée. Log Guardian réunit ces trois tâches en une seule chaîne — avec preuve mesurée.",
    advantages: [
      { k: "Une installation, une chaîne", v: "Vous n'installez et n'intégrez pas Fail2ban + ModSecurity + CrowdSec séparément. log nginx → WAF/CRS → ban noyau en un seul produit, ~15 min d'installation." },
      { k: "Ban noyau ~17 ms", v: "Médiane ~17 ms de la ligne de log au ban ipset/XDP. Fail2ban/CrowdSec restent à l'échelle secondes–minutes ; prouvé avec 5 échantillons mesurés." },
      { k: "100% de rappel + 100% de parité CRS", v: "121 règles OWASP CRS, 100% de rappel d'attaques réelles sur un corpus de 1500 lignes et parité complète avec ModSec — à 0,2% de faux positifs." },
      { k: "Couverture des attaques distribuées", v: "Détection de cluster JA3 + ban par IP — 100% sur un test en direct de 80 IP. Fail2ban est mono-IP ; CrowdSec exige un réseau de signaux séparé." },
      { k: "Preuve transparente et reproductible", v: "75 tests automatiques + un pack de preuves de 14 fichiers + soak 72h (864 échantillons, 0 erreur). Les rivaux n'ont pas de preuve automatique ou elle est fragmentée." },
      { k: "Auto-hébergé · MIT · conçu en Turquie", v: "Vos données restent chez vous, aucun verrouillage fournisseur, entièrement open source. Timeline SOC, métriques Prometheus et exploitation Telegram dans un seul panneau (:8443)." },
    ],
    vsNote:
      "Limite honnête : dans certains domaines, les rivaux sont clairement meilleurs (cellules rouges). ModSec + CRS mène en débit inline (~14 300 EPS, mesuré) et en blocage instantané de la première requête ; CrowdSec est fort sur son réseau de signaux communautaire distribué et sa console SaaS managée. Notre force : l'intégration en une chaîne + la vitesse de ban ~17 ms + une preuve transparente et reproductible.",
    vsLegend: "Rouge = le gagnant de cette ligne",
    honestItems: [
      "Architecture réactive — la première requête peut passer jusqu'à la chute de la ligne de log ; nous n'atteignons pas la vitesse inline de ModSec.",
      "Nous n'absorbons pas les DDoS L3/L4 — nous sommes derrière un CDN.",
      "Botnet distribué — ban par IP ; pas de réseau de signaux CrowdSec.",
      "Fait : log → CRS/WAF → ban noyau ~17 ms, PDF de preuve, exploitation Telegram, MIT auto-hébergé.",
    ],
    layersBodies: [
      "log → WAF → ban ipset (~15 min)",
      "démon eBPF, tableau de bord, métriques, flotte",
      "XDR, marketplace Wasm, Copilot LLM",
    ],
    layersNote:
      "XDR, la marketplace Wasm et le Copilot LLM sont des couches optionnelles à long terme — Core est prêt pour la production à lui seul.",
    setupIntro:
      "Source : GitHub — Linux-Log-Guardian. Deux voies : un paquet .deb préconstruit (recommandé) ou la compilation depuis les sources. Fonctionne aussi sans eBPF/XDP sur portables/VM (ban basé sur ipset). Les étapes ci-dessous concernent un serveur de production ; la sortie attendue de chaque commande est incluse.",
    setupTip:
      "Astuce : pour le JWT et le mot de passe du tableau de bord, utilisez bash scripts/laptop_jwt_setup.sh. Démo 3 minutes : SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Docs : docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Écrivez pour toute question, collaboration ou contribution. Les rapports de bug et les pull requests sont les bienvenus dans l'esprit open source.",
    footerDesc:
      "log d'accès nginx → WAF/CRS → ban noyau. Chaîne unique, auto-hébergé, sous licence MIT. Conçu en Turquie.",
    footerSoak: "soak 72h PASS · 0 échec",
    proofBody:
      "Pas des diapositives, une preuve reproductible. Parité OWASP CRS, gates de faux positifs, benchmarks de latence de ban, rappel de corpus et un soak de 72 heures — tout mesuré, automatisé et visible dans une matrice de tests publique.",
  },
  es: {
    pipelineNote:
      "XDR, el marketplace Wasm y el Copilot LLM son capas opcionales a largo plazo — Core está listo para producción por sí solo.",
    selectedBodies: [
      "Una sola cadena: log de nginx → OWASP CRS → ban de kernel ~17 ms. En producción en ~15 minutos.",
      "Flota, timeline SOC, paneles — una capa opcional en tu propio servidor tras la instalación.",
      "75 pruebas automáticas, PDF comparativo, soak 72h — la misma matriz que dashboard /tests.",
      "Métricas Prometheus por tenant, paneles y reglas de alerta — observabilidad autoalojada.",
      "Flota multinodo: sync de agentes, política etcd mesh y envío de comandos dirigido — desde un solo panel.",
      "Feed de amenazas TAXII/STIX + SOC Telegram: alerta, ban y 'ack' con un clic — flujo de operador en vivo.",
      "Filtro XDP + uprobes execve/lineage — drop de paquetes a nivel de kernel y traza de syscalls. En portátiles, --no-xdp con ipset basta.",
      "Detección de escáneres distribuidos: misma huella JA3 + clúster de IP distinto, 100% de recall — prueba en vivo con 80 IP.",
      "Árbol de ataque, sonda de linaje, uprobe de syscall — capa opcional a largo plazo; detección de cadena de ataque y canales encubiertos.",
      "Plugins de reglas personalizados vía un runtime Wasm — modelo marketplace, ampliar sin tocar el Core.",
      "Stream JSON event_type — prueba de export SIEM a Splunk/Elastic/Vector (siem-export-report.json).",
      "Servidor tarpit + trap watcher — ralentizar al atacante y señal honeypot; capa de engaño.",
    ],
    advLead:
      "Fail2ban solo banea, el WAF ModSecurity es un módulo aparte, CrowdSec necesita un stack fragmentado. Log Guardian une estas tres tareas en una sola cadena — con prueba medida.",
    advantages: [
      { k: "Una instalación, una cadena", v: "No instalas ni integras Fail2ban + ModSecurity + CrowdSec por separado. log de nginx → WAF/CRS → ban de kernel en un solo producto, ~15 min de instalación." },
      { k: "Ban de kernel ~17 ms", v: "Mediana ~17 ms desde la línea de log al ban de ipset/XDP. Fail2ban/CrowdSec se quedan en segundos–minutos; probado con 5 muestras medidas." },
      { k: "100% de recall + 100% de paridad CRS", v: "121 reglas OWASP CRS, 100% de recall de ataques reales en un corpus de 1500 líneas y paridad total con ModSec — con 0,2% de falsos positivos." },
      { k: "Cobertura de ataques distribuidos", v: "Detección de clúster JA3 + ban por IP — 100% en una prueba en vivo de 80 IP. Fail2ban es de una sola IP; CrowdSec necesita una red de señales aparte." },
      { k: "Prueba transparente y reproducible", v: "75 pruebas automáticas + un pack de evidencias de 14 archivos + soak 72h (864 muestras, 0 errores). Los rivales no tienen prueba automática o está fragmentada." },
      { k: "Autoalojado · MIT · hecho en Turquía", v: "Tus datos se quedan contigo, sin bloqueo de proveedor, totalmente open source. Timeline SOC, métricas Prometheus y operación Telegram en un solo panel (:8443)." },
    ],
    vsNote:
      "Límite honesto: en algunas áreas los rivales son claramente mejores (celdas rojas). ModSec + CRS lidera en throughput inline (~14.300 EPS, medido) y en bloqueo instantáneo de la primera petición; CrowdSec es fuerte en su red de señales comunitaria distribuida y su consola SaaS gestionada. Nuestra fuerza es la integración en una cadena + velocidad de ban ~17 ms + prueba transparente y reproducible.",
    vsLegend: "Rojo = el ganador de esa fila",
    honestItems: [
      "Arquitectura reactiva — la primera petición puede pasar hasta que caiga la línea de log; no llegamos a la velocidad inline de ModSec.",
      "No absorbemos DDoS L3/L4 — estamos detrás de un CDN.",
      "Botnet distribuida — ban por IP; sin red de señales de CrowdSec.",
      "Hace: log → CRS/WAF → ban de kernel ~17 ms, PDF de prueba, operación Telegram, MIT autoalojado.",
    ],
    layersBodies: [
      "log → WAF → ban ipset (~15 min)",
      "demonio eBPF, panel, métricas, flota",
      "XDR, marketplace Wasm, Copilot LLM",
    ],
    layersNote:
      "XDR, el marketplace Wasm y el Copilot LLM son capas opcionales a largo plazo — Core está listo para producción por sí solo.",
    setupIntro:
      "Fuente: GitHub — Linux-Log-Guardian. Dos vías: un paquete .deb precompilado (recomendado) o compilar desde el código. También funciona sin eBPF/XDP en portátiles/VM (ban basado en ipset). Los pasos siguientes son para un servidor de producción; se incluye la salida esperada de cada comando.",
    setupTip:
      "Consejo: para el JWT y la contraseña del panel usa bash scripts/laptop_jwt_setup.sh. Demo de 3 minutos: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Docs: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Escribe para preguntas, colaboración o contribuciones. Los reportes de errores y los pull requests son bienvenidos en el espíritu open source.",
    footerDesc:
      "log de acceso de nginx → WAF/CRS → ban de kernel. Cadena única, autoalojado, con licencia MIT. Hecho en Turquía.",
    footerSoak: "soak 72h PASS · 0 fallos",
    proofBody:
      "No diapositivas, prueba reproducible. Paridad OWASP CRS, gates de falsos positivos, benchmarks de latencia de ban, recall de corpus y un soak de 72 horas — todo medido, automatizado y visible en una matriz de pruebas pública.",
  },
  ru: {
    pipelineNote:
      "XDR, маркетплейс Wasm и LLM Copilot — долгосрочные опциональные слои; Core сам по себе готов к продакшену.",
    selectedBodies: [
      "Одна цепочка: лог nginx → OWASP CRS → бан в ядре ~17 мс. В продакшене за ~15 минут.",
      "Флот, SOC-таймлайн, дашборды — опциональный слой на вашем сервере после установки.",
      "75 автотестов, сравнительный PDF, 72-часовой soak — та же матрица, что dashboard /tests.",
      "Метрики Prometheus с меткой tenant, дашборды и правила алертов — self-hosted наблюдаемость.",
      "Многоузловой флот: синхронизация агентов, политика etcd mesh и адресная отправка команд — из одной панели.",
      "Фид угроз TAXII/STIX + SOC в Telegram: алерт, бан и 'ack' в один клик — живой поток оператора.",
      "XDP-фильтр + uprobes execve/lineage — сброс пакетов на уровне ядра и трассировка syscall. На ноутбуках достаточно --no-xdp с ipset.",
      "Обнаружение распределённых сканеров: одинаковый отпечаток JA3 + другой кластер IP, 100% recall — живой тест на 80 IP.",
      "Дерево атаки, зонд происхождения, uprobe syscall — долгосрочный опциональный слой; обнаружение цепочки атаки и скрытых каналов.",
      "Пользовательские плагины правил через рантайм Wasm — модель маркетплейса, расширение без правки Core.",
      "Поток JSON event_type — доказательство экспорта в SIEM (Splunk/Elastic/Vector, siem-export-report.json).",
      "Tarpit-сервер + trap watcher — замедлить атакующего и сигнал honeypot; слой обмана.",
    ],
    advLead:
      "Fail2ban только банит, WAF ModSecurity — отдельный модуль, CrowdSec требует фрагментарного стека. Log Guardian объединяет эти три задачи в одну цепочку — с измеренным доказательством.",
    advantages: [
      { k: "Одна установка, одна цепочка", v: "Вы не ставите и не интегрируете Fail2ban + ModSecurity + CrowdSec по отдельности. лог nginx → WAF/CRS → бан в ядре в одном продукте, установка ~15 мин." },
      { k: "Бан в ядре ~17 мс", v: "Медиана ~17 мс от строки лога до бана ipset/XDP. Fail2ban/CrowdSec остаются в секундах–минутах; подтверждено 5 измеренными образцами." },
      { k: "100% recall + 100% паритет CRS", v: "121 правило OWASP CRS, 100% recall реальных атак на корпусе из 1500 строк и полный паритет с ModSec — при 0,2% ложных срабатываний." },
      { k: "Покрытие распределённых атак", v: "Обнаружение кластера JA3 + бан по IP — 100% в живом тесте на 80 IP. Fail2ban работает по одному IP; CrowdSec требует отдельной сети сигналов." },
      { k: "Прозрачное, воспроизводимое доказательство", v: "75 автотестов + пакет доказательств из 14 файлов + 72-часовой soak (864 образца, 0 ошибок). У конкурентов нет автоматического доказательства или оно фрагментарно." },
      { k: "Self-hosted · MIT · сделано в Турции", v: "Ваши данные остаются у вас, без привязки к вендору, полностью открытый код. SOC-таймлайн, метрики Prometheus и управление через Telegram в одной панели (:8443)." },
    ],
    vsNote:
      "Честная граница: в некоторых областях конкуренты явно лучше (красные ячейки). ModSec + CRS впереди по inline-пропускной способности (~14 300 EPS, измерено) и мгновенной блокировке первого запроса; CrowdSec силён распределённой сетью сигналов сообщества и управляемой SaaS-консолью. Наша сила — интеграция в одну цепочку + скорость бана ~17 мс + прозрачное, воспроизводимое доказательство.",
    vsLegend: "Красный = победитель в этой строке",
    honestItems: [
      "Реактивная архитектура — первый запрос может пройти, пока не упадёт строка лога; мы не на inline-скорости ModSec.",
      "Мы не поглощаем L3/L4 DDoS — мы стоим за CDN.",
      "Распределённый ботнет — бан по IP; без сети сигналов CrowdSec.",
      "Делает: лог → CRS/WAF → бан в ядре ~17 мс, PDF-доказательство, управление Telegram, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → бан ipset (~15 мин)",
      "eBPF-демон, дашборд, метрики, флот",
      "XDR, маркетплейс Wasm, LLM Copilot",
    ],
    layersNote:
      "XDR, маркетплейс Wasm и LLM Copilot — долгосрочные опциональные слои; Core сам по себе готов к продакшену.",
    setupIntro:
      "Источник: GitHub — Linux-Log-Guardian. Два пути: готовый пакет .deb (рекомендуется) или сборка из исходников. Работает и без eBPF/XDP на ноутбуках/ВМ (бан на основе ipset). Шаги ниже — для продакшен-сервера; для каждой команды указан ожидаемый вывод.",
    setupTip:
      "Совет: для JWT и пароля дашборда используйте bash scripts/laptop_jwt_setup.sh. Демо на 3 минуты: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Документация: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Пишите по вопросам, для сотрудничества или вклада. Сообщения об ошибках и pull request приветствуются в духе открытого кода.",
    footerDesc:
      "access-лог nginx → WAF/CRS → бан в ядре. Одна цепочка, self-hosted, лицензия MIT. Разработано в Турции.",
    footerSoak: "72ч soak PASS · 0 сбоев",
    proofBody:
      "Не слайды, а воспроизводимое доказательство. Паритет OWASP CRS, гейты ложных срабатываний, бенчмарки задержки бана, recall корпуса и 72-часовой soak — всё измерено, автоматизировано и видно в публичной матрице тестов.",
  },
  pt: {
    pipelineNote:
      "XDR, o marketplace Wasm e o Copilot LLM são camadas opcionais de longo prazo — o Core está pronto para produção por si só.",
    selectedBodies: [
      "Uma só cadeia: log do nginx → OWASP CRS → ban de kernel ~17 ms. Em produção em ~15 minutos.",
      "Frota, timeline SOC, painéis — uma camada opcional no seu próprio servidor após a instalação.",
      "75 testes automáticos, PDF comparativo, soak 72h — a mesma matriz que dashboard /tests.",
      "Métricas Prometheus por tenant, painéis e regras de alerta — observabilidade self-hosted.",
      "Frota multi-nó: sync de agentes, política etcd mesh e envio de comandos direcionado — a partir de um painel.",
      "Feed de ameaças TAXII/STIX + SOC Telegram: alerta, ban e 'ack' com um clique — fluxo de operador ao vivo.",
      "Filtro XDP + uprobes execve/lineage — drop de pacotes ao nível do kernel e rastreio de syscalls. Em portáteis, --no-xdp com ipset basta.",
      "Deteção de scanners distribuídos: mesma impressão JA3 + cluster de IP diferente, 100% de recall — teste ao vivo com 80 IP.",
      "Árvore de ataque, sonda de linhagem, uprobe de syscall — camada opcional de longo prazo; deteção de cadeia de ataque e canais encobertos.",
      "Plugins de regras personalizados via um runtime Wasm — modelo marketplace, estender sem tocar no Core.",
      "Stream JSON event_type — prova de export SIEM para Splunk/Elastic/Vector (siem-export-report.json).",
      "Servidor tarpit + trap watcher — abrandar o atacante e sinal honeypot; camada de deceção.",
    ],
    advLead:
      "O Fail2ban só bane, o WAF ModSecurity é um módulo à parte, o CrowdSec precisa de um stack fragmentado. O Log Guardian junta estas três tarefas numa só cadeia — com prova medida.",
    advantages: [
      { k: "Uma instalação, uma cadeia", v: "Não instala nem integra Fail2ban + ModSecurity + CrowdSec separadamente. log do nginx → WAF/CRS → ban de kernel num só produto, ~15 min de instalação." },
      { k: "Ban de kernel ~17 ms", v: "Mediana ~17 ms da linha de log ao ban ipset/XDP. Fail2ban/CrowdSec ficam na escala de segundos–minutos; comprovado com 5 amostras medidas." },
      { k: "100% de recall + 100% de paridade CRS", v: "121 regras OWASP CRS, 100% de recall de ataques reais num corpus de 1500 linhas e paridade total com o ModSec — a 0,2% de falsos positivos." },
      { k: "Cobertura de ataques distribuídos", v: "Deteção de cluster JA3 + ban por IP — 100% num teste ao vivo de 80 IP. O Fail2ban é de IP único; o CrowdSec precisa de uma rede de sinais à parte." },
      { k: "Prova transparente e reproduzível", v: "75 testes automáticos + um pacote de provas de 14 ficheiros + soak 72h (864 amostras, 0 erros). Os rivais não têm prova automática ou é fragmentada." },
      { k: "Self-hosted · MIT · feito na Turquia", v: "Os seus dados ficam consigo, sem lock-in de fornecedor, totalmente open source. Timeline SOC, métricas Prometheus e operação Telegram num só painel (:8443)." },
    ],
    vsNote:
      "Limite honesto: em algumas áreas os rivais são claramente melhores (células vermelhas). ModSec + CRS lidera no throughput inline (~14.300 EPS, medido) e no bloqueio instantâneo do primeiro pedido; o CrowdSec é forte na sua rede de sinais comunitária distribuída e na consola SaaS gerida. A nossa força é a integração numa cadeia + velocidade de ban ~17 ms + prova transparente e reproduzível.",
    vsLegend: "Vermelho = o vencedor dessa linha",
    honestItems: [
      "Arquitetura reativa — o primeiro pedido pode passar até a linha de log cair; não estamos à velocidade inline do ModSec.",
      "Não absorvemos DDoS L3/L4 — ficamos atrás de um CDN.",
      "Botnet distribuída — ban por IP; sem rede de sinais do CrowdSec.",
      "Faz: log → CRS/WAF → ban de kernel ~17 ms, PDF de prova, operação Telegram, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ban ipset (~15 min)",
      "daemon eBPF, painel, métricas, frota",
      "XDR, marketplace Wasm, Copilot LLM",
    ],
    layersNote:
      "XDR, o marketplace Wasm e o Copilot LLM são camadas opcionais de longo prazo — o Core está pronto para produção por si só.",
    setupIntro:
      "Fonte: GitHub — Linux-Log-Guardian. Duas vias: um pacote .deb pré-compilado (recomendado) ou compilar a partir do código. Também funciona sem eBPF/XDP em portáteis/VM (ban baseado em ipset). Os passos abaixo são para um servidor de produção; a saída esperada de cada comando está incluída.",
    setupTip:
      "Dica: para o JWT e a palavra-passe do painel use bash scripts/laptop_jwt_setup.sh. Demo de 3 minutos: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Docs: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Escreva para perguntas, colaboração ou contribuições. Relatórios de bugs e pull requests são bem-vindos no espírito open source.",
    footerDesc:
      "log de acesso do nginx → WAF/CRS → ban de kernel. Cadeia única, self-hosted, licença MIT. Feito na Turquia.",
    footerSoak: "soak 72h PASS · 0 falhas",
    proofBody:
      "Não são slides, é prova reproduzível. Paridade OWASP CRS, gates de falsos positivos, benchmarks de latência de ban, recall de corpus e um soak de 72 horas — tudo medido, automatizado e visível numa matriz de testes pública.",
  },
  nl: {
    pipelineNote:
      "XDR, de Wasm-marketplace en LLM-Copilot zijn optionele lagen op lange termijn — Core is op zichzelf productieklaar.",
    selectedBodies: [
      "Eén keten: nginx-log → OWASP CRS → kernel-ban ~17 ms. In productie in ~15 minuten.",
      "Fleet, SOC-timeline, dashboards — een optionele laag op je eigen server na installatie.",
      "75 automatische tests, vergelijkings-PDF, 72h-soak — dezelfde matrix als dashboard /tests.",
      "Prometheus-metrics met tenant-label, dashboards en alertregels — self-hosted observability.",
      "Multi-node fleet: agent-sync, etcd-mesh-policy en gerichte commando's — vanuit één paneel.",
      "TAXII/STIX-threatfeed + Telegram-SOC: alert, ban en één-klik 'ack' — live operator-flow.",
      "XDP-filter + execve/lineage-uprobes — pakket-drop op kernelniveau en syscall-tracing. Op laptops volstaat --no-xdp met ipset.",
      "Detectie van gedistribueerde scanners: dezelfde JA3-vingerafdruk + ander IP-cluster, 100% recall — live test met 80 IP's.",
      "Aanvalsboom, lineage-probe, syscall-uprobe — optionele laag op lange termijn; detectie van aanvalsketen en verborgen kanalen.",
      "Eigen regel-plugins via een Wasm-runtime — marketplace-model, uitbreiden zonder de Core aan te raken.",
      "JSON-event_type-stream — SIEM-export-bewijs naar Splunk/Elastic/Vector (siem-export-report.json).",
      "Tarpit-server + trap-watcher — de aanvaller vertragen en honeypot-signaal; deception-laag.",
    ],
    advLead:
      "Fail2ban bant alleen, de ModSecurity-WAF is een aparte module, CrowdSec vraagt een versnipperde stack. Log Guardian voegt deze drie taken samen in één keten — met gemeten bewijs.",
    advantages: [
      { k: "Eén installatie, één keten", v: "Je installeert en integreert Fail2ban + ModSecurity + CrowdSec niet apart. nginx-log → WAF/CRS → kernel-ban in één product, ~15 min installatie." },
      { k: "Kernel-ban ~17 ms", v: "Mediaan ~17 ms van logregel tot ipset/XDP-ban. Fail2ban/CrowdSec blijven op seconden–minuten; bewezen met 5 gemeten monsters." },
      { k: "100% recall + 100% CRS-pariteit", v: "121 OWASP-CRS-regels, 100% recall van echte aanvallen op een corpus van 1500 regels en volledige pariteit met ModSec — bij 0,2% false positives." },
      { k: "Dekking van gedistribueerde aanvallen", v: "JA3-clusterdetectie + ban per IP — 100% in een live test met 80 IP's. Fail2ban is per enkel IP; CrowdSec vraagt een apart signaalnetwerk." },
      { k: "Transparant, reproduceerbaar bewijs", v: "75 automatische tests + een bewijspakket van 14 bestanden + 72h-soak (864 monsters, 0 fouten). Concurrenten hebben geen automatisch bewijs of het is versnipperd." },
      { k: "Self-hosted · MIT · gemaakt in Turkije", v: "Je data blijft bij jou, geen vendor lock-in, volledig open source. SOC-timeline, Prometheus-metrics en Telegram-beheer in één paneel (:8443)." },
    ],
    vsNote:
      "Eerlijke grens: op sommige vlakken zijn concurrenten duidelijk beter (rode cellen). ModSec + CRS leidt in inline-doorvoer (~14.300 EPS, gemeten) en in het direct blokkeren van het eerste verzoek; CrowdSec is sterk in zijn gedistribueerde community-signaalnetwerk en beheerde SaaS-console. Onze kracht is de integratie in één keten + ban-snelheid ~17 ms + transparant, reproduceerbaar bewijs.",
    vsLegend: "Rood = de winnaar in die rij",
    honestItems: [
      "Reactieve architectuur — het eerste verzoek kan door tot de logregel valt; we halen niet de inline-snelheid van ModSec.",
      "We absorberen geen L3/L4-DDoS — we zitten achter een CDN.",
      "Gedistribueerd botnet — ban per IP; geen CrowdSec-signaalnetwerk.",
      "Doet: log → CRS/WAF → kernel-ban ~17 ms, bewijs-PDF, Telegram-beheer, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset-ban (~15 min)",
      "eBPF-daemon, dashboard, metrics, fleet",
      "XDR, Wasm-marketplace, LLM-Copilot",
    ],
    layersNote:
      "XDR, de Wasm-marketplace en LLM-Copilot zijn optionele lagen op lange termijn — Core is op zichzelf productieklaar.",
    setupIntro:
      "Bron: GitHub — Linux-Log-Guardian. Twee wegen: een kant-en-klaar .deb-pakket (aanbevolen) of bouwen vanuit de broncode. Werkt ook zonder eBPF/XDP op laptops/VM's (ipset-gebaseerde ban). De stappen hieronder zijn voor een productieserver; de verwachte uitvoer van elk commando is opgenomen.",
    setupTip:
      "Tip: gebruik voor JWT en het dashboard-wachtwoord bash scripts/laptop_jwt_setup.sh. Demo van 3 minuten: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Docs: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Schrijf voor vragen, samenwerking of bijdragen. Bugrapporten en pull requests zijn welkom in de open-sourcegeest.",
    footerDesc:
      "nginx-accesslog → WAF/CRS → kernel-ban. Eén keten, self-hosted, MIT-gelicentieerd. Gemaakt in Turkije.",
    footerSoak: "72h-soak PASS · 0 fouten",
    proofBody:
      "Geen slides, reproduceerbaar bewijs. OWASP-CRS-pariteit, false-positive-gates, ban-latency-benchmarks, corpus-recall en een 72-uurs soak — alles gemeten, geautomatiseerd en zichtbaar in een openbare testmatrix.",
  },
  zh: {
    pipelineNote:
      "XDR、Wasm 市场和 LLM Copilot 是长期可选层——Core 本身即可用于生产。",
    selectedBodies: [
      "单一链路：nginx 日志 → OWASP CRS → 约 17 毫秒内核封禁。约 15 分钟即可投产。",
      "机群、SOC 时间线、仪表盘——安装后在你自己服务器上的可选层。",
      "75 项自动化测试、竞品对比 PDF、72 小时 soak——与 dashboard /tests 相同的矩阵。",
      "带 tenant 标签的 Prometheus 指标、仪表盘和告警规则——自托管可观测性。",
      "多节点机群：代理同步、etcd mesh 策略和定向命令下发——统一面板操作。",
      "TAXII/STIX 威胁情报 + Telegram SOC：告警、封禁和一键 'ack'——实时运维流程。",
      "XDP 过滤 + execve/lineage uprobe——内核级丢包与系统调用追踪。笔记本上用 --no-xdp 配 ipset 即可。",
      "分布式扫描器检测：相同 JA3 指纹 + 不同 IP 集群，100% 召回——80 IP 实测。",
      "攻击树、溯源探针、syscall uprobe——长期可选层；攻击链与隐蔽通道检测。",
      "通过 Wasm 运行时的自定义规则插件——市场模式，无需改动 Core 即可扩展。",
      "JSON event_type 流——向 Splunk/Elastic/Vector 的 SIEM 导出证据（siem-export-report.json）。",
      "Tarpit 服务器 + 陷阱监视器——拖慢攻击者并提供蜜罐信号；欺骗层。",
    ],
    advLead:
      "Fail2ban 只做封禁，ModSecurity WAF 是独立模块，CrowdSec 需要零散的技术栈。Log Guardian 将这三项工作合并到一条链路中——并附实测证据。",
    advantages: [
      { k: "一次安装，一条链路", v: "无需分别安装和集成 Fail2ban + ModSecurity + CrowdSec。nginx 日志 → WAF/CRS → 内核封禁，一个产品，约 15 分钟安装。" },
      { k: "约 17 毫秒内核封禁", v: "从日志行到 ipset/XDP 封禁中位数约 17 毫秒。Fail2ban/CrowdSec 停留在秒—分钟级；由 5 个实测样本证明。" },
      { k: "100% 召回 + 100% CRS 对等", v: "121 条 OWASP CRS 规则，在 1500 行语料上对真实攻击 100% 召回，与 ModSec 完全对等——误报率 0.2%。" },
      { k: "覆盖分布式攻击", v: "JA3 集群检测 + 按 IP 封禁——80 IP 实测 100%。Fail2ban 是单 IP；CrowdSec 需要独立的信号网络。" },
      { k: "透明、可复现的证据", v: "75 项自动化测试 + 14 个文件的证据包 + 72 小时 soak（864 样本，0 错误）。竞品没有自动化证据或证据零散。" },
      { k: "自托管 · MIT · 土耳其制造", v: "数据留在你手中，无供应商锁定，完全开源。SOC 时间线、Prometheus 指标和 Telegram 运维统一在一个面板（:8443）。" },
    ],
    vsNote:
      "诚实边界：在某些方面竞品明显更强（红色单元格）。ModSec + CRS 在内联吞吐（约 14,300 EPS，实测）和瞬时拦截首个请求上领先；CrowdSec 在其分布式社区信号网络和托管 SaaS 控制台上强大。我们的优势是单链路集成 + 约 17 毫秒封禁速度 + 透明可复现的证据。",
    vsLegend: "红色 = 该行的优胜者",
    honestItems: [
      "反应式架构——在日志行落下前首个请求可能通过；我们达不到 ModSec 的内联速度。",
      "我们不吸收 L3/L4 DDoS——我们位于 CDN 之后。",
      "分布式僵尸网络——按 IP 封禁；没有 CrowdSec 信号网络。",
      "能做：日志 → CRS/WAF → 约 17 毫秒内核封禁、证据 PDF、Telegram 运维、MIT 自托管。",
    ],
    layersBodies: [
      "日志 → WAF → ipset 封禁（约 15 分钟）",
      "eBPF 守护进程、仪表盘、指标、机群",
      "XDR、Wasm 市场、LLM Copilot",
    ],
    layersNote:
      "XDR、Wasm 市场和 LLM Copilot 是长期可选层——Core 本身即可用于生产。",
    setupIntro:
      "来源：GitHub — Linux-Log-Guardian。两种方式：预构建的 .deb 包（推荐）或从源码构建。在笔记本/虚拟机上不用 eBPF/XDP 也能运行（基于 ipset 封禁）。以下步骤针对生产服务器；每条命令都附有预期输出。",
    setupTip:
      "提示：JWT 和仪表盘密码请用 bash scripts/laptop_jwt_setup.sh。3 分钟演示：SKIP_WEBHOOK=1 bash scripts/demo_3min.sh。文档：docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md。",
    contactBody:
      "如有问题、合作或贡献欢迎来信。本着开源精神，欢迎提交 bug 报告和 pull request。",
    footerDesc:
      "nginx 访问日志 → WAF/CRS → 内核封禁。单一链路，自托管，MIT 许可。土耳其制造。",
    footerSoak: "72 小时 soak 通过 · 0 失败",
    proofBody:
      "不是幻灯片，而是可复现的证据。OWASP CRS 对等、误报门槛、封禁延迟基准、语料召回和 72 小时 soak——全部实测、自动化并在公开测试矩阵中可见。",
  },
  ja: {
    pipelineNote:
      "XDR、Wasm マーケットプレイス、LLM Copilot は長期的なオプション層です——Core 単体で本番運用が可能です。",
    selectedBodies: [
      "単一チェーン：nginx ログ → OWASP CRS → 約17msのカーネルBAN。約15分で本番投入。",
      "フリート、SOC タイムライン、ダッシュボード——導入後、自前サーバー上のオプション層。",
      "75件の自動テスト、比較PDF、72時間ソーク——dashboard /tests と同じマトリクス。",
      "テナント別ラベルの Prometheus メトリクス、ダッシュボード、アラートルール——セルフホストの可観測性。",
      "マルチノードのフリート：エージェント同期、etcd メッシュポリシー、対象を絞ったコマンド配信——一つのパネルから。",
      "TAXII/STIX 脅威フィード + Telegram SOC：アラート、BAN、ワンクリック 'ack'——ライブの運用フロー。",
      "XDP フィルタ + execve/lineage uprobe——カーネルレベルのパケット破棄と syscall トレース。ノートPCでは --no-xdp と ipset で十分。",
      "分散スキャナー検知：同一 JA3 フィンガープリント + 異なる IP クラスタ、リコール100%——80 IP のライブテスト。",
      "攻撃ツリー、系譜プローブ、syscall uprobe——長期的なオプション層；攻撃チェーンと隠れチャネルの検知。",
      "Wasm ランタイム経由のカスタムルールプラグイン——マーケットプレイス方式、Core に触れず拡張。",
      "JSON event_type ストリーム——Splunk/Elastic/Vector への SIEM エクスポート証拠（siem-export-report.json）。",
      "Tarpit サーバー + トラップウォッチャー——攻撃者を遅延させハニーポット信号を得る；デセプション層。",
    ],
    advLead:
      "Fail2ban は BAN のみ、ModSecurity WAF は別モジュール、CrowdSec は断片的なスタックを要します。Log Guardian はこの3つの仕事を1本のチェーンに統合します——実測の証拠付きで。",
    advantages: [
      { k: "一度の導入、一本のチェーン", v: "Fail2ban + ModSecurity + CrowdSec を個別に導入・統合する必要はありません。nginx ログ → WAF/CRS → カーネルBAN が1製品で、約15分の導入。" },
      { k: "約17msのカーネルBAN", v: "ログ行から ipset/XDP BAN まで中央値 約17ms。Fail2ban/CrowdSec は秒〜分単位；5件の実測サンプルで証明。" },
      { k: "リコール100% + CRS 100%整合", v: "121件の OWASP CRS ルール、1500行コーパスで実攻撃リコール100%、ModSec と完全整合——誤検知0.2%。" },
      { k: "分散攻撃のカバー", v: "JA3 クラスタ検知 + IP ごとの BAN——80 IP のライブテストで100%。Fail2ban は単一IP；CrowdSec は別の信号ネットワークが必要。" },
      { k: "透明で再現可能な証拠", v: "75件の自動テスト + 14ファイルの証拠パック + 72時間ソーク（864サンプル、0エラー）。競合は自動証拠が無いか断片的。" },
      { k: "セルフホスト · MIT · トルコ製", v: "データは手元に残り、ベンダーロックインなし、完全オープンソース。SOC タイムライン、Prometheus メトリクス、Telegram 運用が一つのパネル（:8443）に。" },
    ],
    vsNote:
      "正直な限界：一部の領域では競合が明らかに優れています（赤いセル）。ModSec + CRS はインラインスループット（約14,300 EPS、実測）と最初のリクエストの即時ブロックで先行；CrowdSec は分散コミュニティ信号ネットワークとマネージド SaaS コンソールが強力。私たちの強みは単一チェーン統合 + 約17msのBAN速度 + 透明で再現可能な証拠。",
    vsLegend: "赤 = その行の勝者",
    honestItems: [
      "リアクティブなアーキテクチャ——ログ行が落ちるまで最初のリクエストは通り得ます；ModSec のインライン速度には及びません。",
      "L3/L4 DDoS は吸収しません——CDN の背後に置きます。",
      "分散ボットネット——IP ごとの BAN；CrowdSec の信号ネットワークはありません。",
      "できること：ログ → CRS/WAF → 約17msのカーネルBAN、証拠PDF、Telegram 運用、MIT セルフホスト。",
    ],
    layersBodies: [
      "ログ → WAF → ipset BAN（約15分）",
      "eBPF デーモン、ダッシュボード、メトリクス、フリート",
      "XDR、Wasm マーケットプレイス、LLM Copilot",
    ],
    layersNote:
      "XDR、Wasm マーケットプレイス、LLM Copilot は長期的なオプション層です——Core 単体で本番運用が可能です。",
    setupIntro:
      "ソース：GitHub — Linux-Log-Guardian。2つの方法：ビルド済み .deb パッケージ（推奨）か、ソースからのビルド。ノートPC/VM では eBPF/XDP なし（ipset ベースの BAN）でも動作します。以下の手順は本番サーバー向けで、各コマンドの期待される出力を含みます。",
    setupTip:
      "ヒント：JWT とダッシュボードのパスワードは bash scripts/laptop_jwt_setup.sh を使用。3分デモ：SKIP_WEBHOOK=1 bash scripts/demo_3min.sh。ドキュメント：docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md。",
    contactBody:
      "質問、協業、貢献はお気軽にご連絡ください。オープンソースの精神でバグ報告と Pull Request を歓迎します。",
    footerDesc:
      "nginx アクセスログ → WAF/CRS → カーネルBAN。単一チェーン、セルフホスト、MIT ライセンス。トルコ製。",
    footerSoak: "72時間ソーク PASS · 0 失敗",
    proofBody:
      "スライドではなく、再現可能な証拠。OWASP CRS 整合、誤検知ゲート、BAN レイテンシのベンチマーク、コーパスリコール、72時間ソーク——すべて実測・自動化され、公開テストマトリクスで確認できます。",
  },
  ko: {
    pipelineNote:
      "XDR, Wasm 마켓플레이스, LLM Copilot은 장기 선택 계층입니다 — Core 자체로 프로덕션 준비가 되어 있습니다.",
    selectedBodies: [
      "단일 체인: nginx 로그 → OWASP CRS → 약 17ms 커널 밴. 약 15분 만에 프로덕션.",
      "플릿, SOC 타임라인, 대시보드 — 설치 후 자체 서버에서의 선택 계층.",
      "75개 자동 테스트, 비교 PDF, 72시간 soak — dashboard /tests와 동일한 매트릭스.",
      "tenant 라벨이 붙은 Prometheus 메트릭, 대시보드, 알림 규칙 — 셀프호스팅 관측성.",
      "멀티노드 플릿: 에이전트 동기화, etcd mesh 정책, 대상 지정 명령 전송 — 하나의 패널에서.",
      "TAXII/STIX 위협 피드 + Telegram SOC: 알림, 밴, 원클릭 'ack' — 실시간 운영 플로우.",
      "XDP 필터 + execve/lineage uprobe — 커널 수준 패킷 드롭과 syscall 추적. 노트북에서는 --no-xdp와 ipset이면 충분.",
      "분산 스캐너 탐지: 동일 JA3 지문 + 다른 IP 클러스터, 100% 재현율 — 80 IP 실시간 테스트.",
      "공격 트리, 계보 프로브, syscall uprobe — 장기 선택 계층; 공격 체인과 은닉 채널 탐지.",
      "Wasm 런타임을 통한 사용자 정의 규칙 플러그인 — 마켓플레이스 모델, Core를 건드리지 않고 확장.",
      "JSON event_type 스트림 — Splunk/Elastic/Vector로의 SIEM 내보내기 증거(siem-export-report.json).",
      "Tarpit 서버 + 트랩 워처 — 공격자를 지연시키고 허니팟 신호 제공; 기만 계층.",
    ],
    advLead:
      "Fail2ban은 밴만 하고, ModSecurity WAF는 별도 모듈이며, CrowdSec은 조각난 스택이 필요합니다. Log Guardian은 이 세 가지 작업을 하나의 체인으로 통합합니다 — 측정된 증거와 함께.",
    advantages: [
      { k: "한 번 설치, 하나의 체인", v: "Fail2ban + ModSecurity + CrowdSec을 따로 설치·통합하지 않습니다. nginx 로그 → WAF/CRS → 커널 밴을 한 제품으로, 약 15분 설치." },
      { k: "약 17ms 커널 밴", v: "로그 라인에서 ipset/XDP 밴까지 중앙값 약 17ms. Fail2ban/CrowdSec은 초~분 단위; 5개 측정 샘플로 입증." },
      { k: "100% 재현율 + 100% CRS 동등성", v: "121개 OWASP CRS 규칙, 1500줄 코퍼스에서 실제 공격 100% 재현율, ModSec과 완전 동등 — 오탐 0.2%." },
      { k: "분산 공격 커버리지", v: "JA3 클러스터 탐지 + IP별 밴 — 80 IP 실시간 테스트에서 100%. Fail2ban은 단일 IP; CrowdSec은 별도 신호 네트워크가 필요." },
      { k: "투명하고 재현 가능한 증거", v: "75개 자동 테스트 + 14개 파일 증거 팩 + 72시간 soak(864 샘플, 0 오류). 경쟁사는 자동 증거가 없거나 조각나 있음." },
      { k: "셀프호스팅 · MIT · 튀르키예 제작", v: "데이터는 당신에게 남고, 벤더 종속 없음, 완전 오픈소스. SOC 타임라인, Prometheus 메트릭, Telegram 운영을 하나의 패널(:8443)에." },
    ],
    vsNote:
      "정직한 한계: 일부 영역에서는 경쟁사가 분명히 더 낫습니다(빨간 셀). ModSec + CRS는 인라인 처리량(약 14,300 EPS, 측정)과 첫 요청 즉시 차단에서 앞서고, CrowdSec은 분산 커뮤니티 신호 네트워크와 관리형 SaaS 콘솔에서 강합니다. 우리의 강점은 단일 체인 통합 + 약 17ms 밴 속도 + 투명하고 재현 가능한 증거.",
    vsLegend: "빨강 = 해당 행의 승자",
    honestItems: [
      "반응형 아키텍처 — 로그 라인이 떨어질 때까지 첫 요청은 통과할 수 있음; ModSec의 인라인 속도에는 미치지 못함.",
      "L3/L4 DDoS는 흡수하지 않음 — CDN 뒤에 위치.",
      "분산 봇넷 — IP별 밴; CrowdSec 신호 네트워크 없음.",
      "수행: 로그 → CRS/WAF → 약 17ms 커널 밴, 증거 PDF, Telegram 운영, MIT 셀프호스팅.",
    ],
    layersBodies: [
      "로그 → WAF → ipset 밴(약 15분)",
      "eBPF 데몬, 대시보드, 메트릭, 플릿",
      "XDR, Wasm 마켓플레이스, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm 마켓플레이스, LLM Copilot은 장기 선택 계층입니다 — Core 자체로 프로덕션 준비가 되어 있습니다.",
    setupIntro:
      "출처: GitHub — Linux-Log-Guardian. 두 가지 방법: 사전 빌드된 .deb 패키지(권장) 또는 소스에서 빌드. 노트북/VM에서는 eBPF/XDP 없이도(ipset 기반 밴) 동작합니다. 아래 단계는 프로덕션 서버용이며, 각 명령의 예상 출력이 포함되어 있습니다.",
    setupTip:
      "팁: JWT와 대시보드 비밀번호는 bash scripts/laptop_jwt_setup.sh를 사용하세요. 3분 데모: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. 문서: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "질문, 협업, 기여는 언제든 연락 주세요. 오픈소스 정신으로 버그 리포트와 풀 리퀘스트를 환영합니다.",
    footerDesc:
      "nginx 액세스 로그 → WAF/CRS → 커널 밴. 단일 체인, 셀프호스팅, MIT 라이선스. 튀르키예 제작.",
    footerSoak: "72시간 soak PASS · 0 실패",
    proofBody:
      "슬라이드가 아니라 재현 가능한 증거. OWASP CRS 동등성, 오탐 게이트, 밴 지연 벤치마크, 코퍼스 재현율, 72시간 soak — 모두 측정·자동화되어 공개 테스트 매트릭스에서 확인 가능.",
  },
  ar: {
    pipelineNote:
      "XDR وسوق Wasm ومساعد LLM طبقات اختيارية طويلة المدى — أما Core فجاهز للإنتاج بمفرده.",
    selectedBodies: [
      "سلسلة واحدة: سجل nginx ← OWASP CRS ← حظر على مستوى النواة نحو 17 مللي ثانية. في الإنتاج خلال نحو 15 دقيقة.",
      "أسطول، خط زمني SOC، لوحات — طبقة اختيارية على خادمك بعد التثبيت.",
      "75 اختباراً آلياً، PDF مقارن، soak لمدة 72 ساعة — نفس المصفوفة كما في dashboard /tests.",
      "مقاييس Prometheus موسومة بالمستأجر، لوحات وقواعد تنبيه — رصد ذاتي الاستضافة.",
      "أسطول متعدد العقد: مزامنة الوكلاء، سياسة etcd mesh وإرسال أوامر موجّه — من لوحة واحدة.",
      "تغذية تهديدات TAXII/STIX + SOC عبر Telegram: تنبيه وحظر و'ack' بنقرة واحدة — تدفق تشغيل حي.",
      "مرشّح XDP + uprobes لـ execve/lineage — إسقاط حزم على مستوى النواة وتتبّع syscall. على الحواسيب المحمولة يكفي --no-xdp مع ipset.",
      "كشف الماسحات الموزّعة: نفس بصمة JA3 + عنقود IP مختلف، استرجاع 100% — اختبار حي على 80 IP.",
      "شجرة هجوم، مسبار نسب، uprobe لـ syscall — طبقة اختيارية طويلة المدى؛ كشف سلسلة الهجوم والقنوات المخفية.",
      "إضافات قواعد مخصّصة عبر بيئة تشغيل Wasm — نموذج سوق، توسيع دون المساس بـ Core.",
      "دفق JSON event_type — دليل تصدير SIEM إلى Splunk/Elastic/Vector (siem-export-report.json).",
      "خادم tarpit + مراقب فخاخ — إبطاء المهاجم وإشارة مصيدة عسل؛ طبقة خداع.",
    ],
    advLead:
      "Fail2ban يحظر فقط، وModSecurity WAF وحدة منفصلة، وCrowdSec يتطلّب حزمة مجزّأة. يدمج Log Guardian هذه المهام الثلاث في سلسلة واحدة — مع دليل مقاس.",
    advantages: [
      { k: "تثبيت واحد، سلسلة واحدة", v: "لا تثبّت وتدمج Fail2ban + ModSecurity + CrowdSec بشكل منفصل. سجل nginx ← WAF/CRS ← حظر على مستوى النواة في منتج واحد، تثبيت نحو 15 دقيقة." },
      { k: "حظر على مستوى النواة نحو 17 مللي ثانية", v: "الوسيط نحو 17 مللي ثانية من سطر السجل إلى حظر ipset/XDP. يبقى Fail2ban/CrowdSec بمقياس ثوانٍ–دقائق؛ مثبت بخمس عينات مقاسة." },
      { k: "استرجاع 100% + تكافؤ CRS 100%", v: "121 قاعدة OWASP CRS، استرجاع 100% للهجمات الحقيقية على مجموعة من 1500 سطر وتكافؤ كامل مع ModSec — عند إيجابيات كاذبة 0.2%." },
      { k: "تغطية الهجمات الموزّعة", v: "كشف عنقود JA3 + حظر لكل IP — 100% في اختبار حي على 80 IP. Fail2ban أحادي الـ IP؛ وCrowdSec يتطلّب شبكة إشارات منفصلة." },
      { k: "دليل شفّاف قابل لإعادة الإنتاج", v: "75 اختباراً آلياً + حزمة أدلة من 14 ملفاً + soak لمدة 72 ساعة (864 عينة، 0 خطأ). المنافسون بلا دليل آلي أو دليلهم مجزّأ." },
      { k: "ذاتي الاستضافة · MIT · صُنع في تركيا", v: "بياناتك تبقى لديك، بلا احتكار مورّد، مفتوح المصدر بالكامل. خط زمني SOC ومقاييس Prometheus وتشغيل Telegram في لوحة واحدة (:8443)." },
    ],
    vsNote:
      "حدّ صادق: في بعض المجالات المنافسون أفضل بوضوح (الخلايا الحمراء). يتصدّر ModSec + CRS في الإنتاجية المضمّنة (نحو 14,300 EPS، مقاسة) وفي الحظر الفوري لأول طلب؛ وCrowdSec قوي في شبكة إشارات المجتمع الموزّعة وكونسول SaaS المُدار. قوّتنا هي التكامل في سلسلة واحدة + سرعة حظر نحو 17 مللي ثانية + دليل شفّاف قابل لإعادة الإنتاج.",
    vsLegend: "الأحمر = الفائز في ذلك الصف",
    honestItems: [
      "بنية تفاعلية — قد يمرّ الطلب الأول حتى يسقط سطر السجل؛ لسنا بسرعة ModSec المضمّنة.",
      "لا نمتصّ هجمات DDoS من نوع L3/L4 — نجلس خلف CDN.",
      "شبكة روبوتات موزّعة — حظر لكل IP؛ بلا شبكة إشارات CrowdSec.",
      "يفعل: سجل ← CRS/WAF ← حظر على مستوى النواة نحو 17 مللي ثانية، PDF دليل، تشغيل Telegram، MIT ذاتي الاستضافة.",
    ],
    layersBodies: [
      "سجل ← WAF ← حظر ipset (نحو 15 دقيقة)",
      "خفيّ eBPF، لوحة، مقاييس، أسطول",
      "XDR، سوق Wasm، مساعد LLM",
    ],
    layersNote:
      "XDR وسوق Wasm ومساعد LLM طبقات اختيارية طويلة المدى — أما Core فجاهز للإنتاج بمفرده.",
    setupIntro:
      "المصدر: GitHub — Linux-Log-Guardian. طريقتان: حزمة .deb جاهزة (موصى بها) أو البناء من المصدر. يعمل أيضاً دون eBPF/XDP على الحواسيب المحمولة/الأجهزة الافتراضية (حظر قائم على ipset). الخطوات أدناه لخادم إنتاج؛ ومُدرَج الخرج المتوقّع لكل أمر.",
    setupTip:
      "نصيحة: لـ JWT وكلمة مرور اللوحة استخدم bash scripts/laptop_jwt_setup.sh. عرض 3 دقائق: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. الوثائق: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "راسلنا للأسئلة أو التعاون أو المساهمة. تقارير الأخطاء وطلبات السحب مرحّب بها بروح المصدر المفتوح.",
    footerDesc:
      "سجل وصول nginx ← WAF/CRS ← حظر على مستوى النواة. سلسلة واحدة، ذاتي الاستضافة، برخصة MIT. صُنع في تركيا.",
    footerSoak: "soak 72 ساعة PASS · 0 فشل",
    proofBody:
      "ليست شرائح، بل دليل قابل لإعادة الإنتاج. تكافؤ OWASP CRS، بوابات الإيجابيات الكاذبة، مقاييس زمن الحظر، استرجاع المجموعة وsoak لمدة 72 ساعة — كله مقاس وآلي وظاهر في مصفوفة اختبارات عامة.",
  },
  az: {
    pipelineNote:
      "XDR, Wasm marketi və LLM Copilot uzunmüddətli opsional qatlardır — Core tək başına istehsala hazırdır.",
    selectedBodies: [
      "Tək zəncir: nginx logu → OWASP CRS → ~17 ms kernel ban. ~15 dəqiqəyə istehsalda.",
      "Filo, SOC zaman xətti, panellər — quraşdırmadan sonra öz serverinizdə opsional qat.",
      "75 avtomatik test, müqayisə PDF-i, 72 saat soak — dashboard /tests ilə eyni matris.",
      "Tenant etiketli Prometheus metrikləri, panellər və alert qaydaları — self-hosted müşahidə.",
      "Çoxdüyünlü filo: agent sinxronizasiyası, etcd mesh siyasəti və hədəfli əmr göndərmə — bir paneldən.",
      "TAXII/STIX təhlükə lenti + Telegram SOC: alert, ban və bir kliklə 'ack' — canlı operator axını.",
      "XDP filtri + execve/lineage uprobe-ları — kernel səviyyəsində paket atma və syscall izləmə. Noutbuklarda --no-xdp və ipset kifayətdir.",
      "Paylanmış skaner aşkarlanması: eyni JA3 izi + fərqli IP klasteri, 100% recall — 80 IP canlı test.",
      "Hücum ağacı, mənşə probu, syscall uprobe — uzunmüddətli opsional qat; hücum zəncirinin və gizli kanalların aşkarlanması.",
      "Wasm runtime vasitəsilə xüsusi qayda plaginləri — market modeli, Core-a toxunmadan genişləndirin.",
      "JSON event_type axını — Splunk/Elastic/Vector hədəflərinə SIEM ixracı sübutu (siem-export-report.json).",
      "Tarpit server + tələ izləyici — hücumçunu yavaşladın və honeypot siqnalı; aldatma qatı.",
    ],
    advLead:
      "Fail2ban yalnız banlayır, ModSecurity WAF ayrıca moduldur, CrowdSec parçalı stek tələb edir. Log Guardian bu üç işi bir zəncirdə birləşdirir — ölçülmüş sübutla.",
    advantages: [
      { k: "Bir quraşdırma, bir zəncir", v: "Fail2ban + ModSecurity + CrowdSec-i ayrıca quraşdırıb inteqrasiya etmirsiniz. nginx logu → WAF/CRS → kernel ban tək məhsulda, ~15 dəq quraşdırma." },
      { k: "~17 ms kernel ban", v: "Log sətrindən ipset/XDP bana median ~17 ms. Fail2ban/CrowdSec saniyə–dəqiqə səviyyəsində qalır; 5 ölçülmüş nümunə ilə sübut olunub." },
      { k: "100% recall + 100% CRS pariteti", v: "121 OWASP CRS qaydası, 1500 sətirlik korpusda real hücum recall 100% və ModSec ilə tam paritet — 0.2% yanlış pozitivdə." },
      { k: "Paylanmış hücum əhatəsi", v: "JA3 klaster aşkarlanması + IP başına ban — 80 IP canlı testdə 100%. Fail2ban tək IP-lidir; CrowdSec ayrıca siqnal şəbəkəsi tələb edir." },
      { k: "Şəffaf, təkrar istehsal edilə bilən sübut", v: "75 avtomatik test + 14 fayllıq sübut paketi + 72 saat soak (864 nümunə, 0 xəta). Rəqiblərdə avtomatik sübut yoxdur və ya parçalıdır." },
      { k: "Self-hosted · MIT · Türkiyə istehsalı", v: "Məlumatınız sizdə qalır, vendor asılılığı yoxdur, tam açıq mənbə. SOC zaman xətti, Prometheus metrikləri və Telegram idarəetməsi bir paneldə (:8443)." },
    ],
    vsNote:
      "Dürüst hədd: bəzi sahələrdə rəqiblər açıq şəkildə daha yaxşıdır (qırmızı xanalar). ModSec + CRS inline ötürmə qabiliyyətində (~14.300 EPS, ölçülmüş) və ilk sorğunun ani bloklanmasında öndədir; CrowdSec paylanmış icma siqnal şəbəkəsində və idarə olunan SaaS konsolunda güclüdür. Bizim gücümüz tək zəncir inteqrasiyası + ~17 ms ban sürəti + şəffaf, təkrar istehsal edilə bilən sübutdur.",
    vsLegend: "Qırmızı = həmin sətirdə qalib",
    honestItems: [
      "Reaktiv memarlıq — log sətri düşənə qədər ilk sorğu keçə bilər; ModSec-in inline sürətində deyilik.",
      "L3/L4 DDoS-u udmuruq — CDN arxasında dayanırıq.",
      "Paylanmış botnet — IP başına ban; CrowdSec siqnal şəbəkəsi yoxdur.",
      "Edir: log → CRS/WAF → ~17 ms kernel ban, sübut PDF-i, Telegram idarəetmə, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset ban (~15 dəq)",
      "eBPF demonu, panel, metriklər, filo",
      "XDR, Wasm marketi, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm marketi və LLM Copilot uzunmüddətli opsional qatlardır — Core tək başına istehsala hazırdır.",
    setupIntro:
      "Mənbə: GitHub — Linux-Log-Guardian. İki yol: hazır .deb paketi (tövsiyə olunur) və ya mənbədən qurma. eBPF/XDP olmadan noutbuk/VM-lərdə də işləyir (ipset əsaslı ban). Aşağıdakı addımlar istehsal serveri üçündür; hər əmrin gözlənilən çıxışı daxildir.",
    setupTip:
      "Məsləhət: JWT və panel parolu üçün bash scripts/laptop_jwt_setup.sh istifadə edin. 3 dəqiqəlik demo: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Sənədlər: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Suallar, əməkdaşlıq və ya töhfə üçün yazın. Açıq mənbə ruhunda baq hesabatları və pull request-lər xoş qarşılanır.",
    footerDesc:
      "nginx giriş logu → WAF/CRS → kernel ban. Tək zəncir, self-hosted, MIT lisenziyalı. Türkiyədə hazırlanıb.",
    footerSoak: "72 saat soak PASS · 0 xəta",
    proofBody:
      "Slayd deyil, təkrar istehsal edilə bilən sübut. OWASP CRS pariteti, yanlış pozitiv qapıları, ban gecikməsi bençmarkları, korpus recall və 72 saatlıq soak — hamısı ölçülmüş, avtomatik və açıq test matrisində görünür.",
  },
  kk: {
    pipelineNote:
      "XDR, Wasm маркеті және LLM Copilot — ұзақ мерзімді қосымша қабаттар; Core өздігінен өнімге дайын.",
    selectedBodies: [
      "Бір тізбек: nginx логы → OWASP CRS → ~17 мс kernel ban. ~15 минутта өнімде.",
      "Флот, SOC уақыт сызығы, панельдер — орнатудан кейін өз серверіңіздегі қосымша қабат.",
      "75 автоматты тест, салыстыру PDF, 72 сағат soak — dashboard /tests-пен бірдей матрица.",
      "Tenant белгісі бар Prometheus метрикалары, панельдер және ескерту ережелері — self-hosted бақылау.",
      "Көпторапты флот: агент синхрондау, etcd mesh саясаты және бағытталған команда жіберу — бір панельден.",
      "TAXII/STIX қауіп таспасы + Telegram SOC: ескерту, ban және бір рет басып 'ack' — тікелей оператор ағыны.",
      "XDP сүзгісі + execve/lineage uprobe — ядро деңгейінде пакет тастау және syscall трассировкасы. Ноутбуктерде --no-xdp пен ipset жеткілікті.",
      "Таратылған сканерлерді анықтау: бірдей JA3 таңбасы + басқа IP кластері, 100% recall — 80 IP тікелей тест.",
      "Шабуыл ағашы, шығу тегі зонды, syscall uprobe — ұзақ мерзімді қосымша қабат; шабуыл тізбегі мен жасырын арналарды анықтау.",
      "Wasm runtime арқылы арнайы ереже плагиндері — маркет моделі, Core-ды өзгертпей кеңейту.",
      "JSON event_type ағыны — Splunk/Elastic/Vector-ге SIEM экспорты дәлелі (siem-export-report.json).",
      "Tarpit сервер + тұзақ бақылаушы — шабуылдаушыны баяулату және honeypot сигналы; алдау қабаты.",
    ],
    advLead:
      "Fail2ban тек бан салады, ModSecurity WAF бөлек модуль, CrowdSec бөлшек стек қажет етеді. Log Guardian осы үш жұмысты бір тізбекте біріктіреді — өлшенген дәлелмен.",
    advantages: [
      { k: "Бір орнату, бір тізбек", v: "Fail2ban + ModSecurity + CrowdSec-ті бөлек орнатып, біріктірмейсіз. nginx логы → WAF/CRS → kernel ban бір өнімде, ~15 мин орнату." },
      { k: "~17 мс kernel ban", v: "Лог жолынан ipset/XDP банға медиана ~17 мс. Fail2ban/CrowdSec секунд–минут деңгейінде қалады; 5 өлшенген үлгімен дәлелденген." },
      { k: "100% recall + 100% CRS паритеті", v: "121 OWASP CRS ережесі, 1500 жолдық корпуста нақты шабуыл recall 100% және ModSec-пен толық паритет — 0.2% жалған позитивте." },
      { k: "Таратылған шабуылды қамту", v: "JA3 кластерін анықтау + IP бойынша бан — 80 IP тікелей тесте 100%. Fail2ban жалғыз IP-лік; CrowdSec бөлек сигнал желісін қажет етеді." },
      { k: "Ашық, қайта жаңғыртылатын дәлел", v: "75 автоматты тест + 14 файлдық дәлел пакеті + 72 сағат soak (864 үлгі, 0 қате). Бәсекелестерде автоматты дәлел жоқ немесе бөлшектелген." },
      { k: "Self-hosted · MIT · Түркияда жасалған", v: "Деректеріңіз сізде қалады, вендорға тәуелділік жоқ, толық ашық код. SOC уақыт сызығы, Prometheus метрикалары және Telegram басқаруы бір панельде (:8443)." },
    ],
    vsNote:
      "Адал шек: кейбір салаларда бәсекелестер анық жақсырақ (қызыл ұяшықтар). ModSec + CRS inline өткізу қабілетінде (~14 300 EPS, өлшенген) және бірінші сұранысты лезде бұғаттауда алда; CrowdSec таратылған қауымдастық сигнал желісінде және басқарылатын SaaS консолінде мықты. Біздің күшіміз — бір тізбек интеграциясы + ~17 мс бан жылдамдығы + ашық, қайта жаңғыртылатын дәлел.",
    vsLegend: "Қызыл = сол жолдағы жеңімпаз",
    honestItems: [
      "Реактивті архитектура — лог жолы түскенше бірінші сұраныс өтуі мүмкін; біз ModSec-тің inline жылдамдығында емеспіз.",
      "L3/L4 DDoS-ты сіңірмейміз — CDN артында тұрамыз.",
      "Таратылған ботнет — IP бойынша бан; CrowdSec сигнал желісі жоқ.",
      "Істейді: лог → CRS/WAF → ~17 мс kernel ban, дәлел PDF, Telegram басқару, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset бан (~15 мин)",
      "eBPF демоны, панель, метрикалар, флот",
      "XDR, Wasm маркеті, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm маркеті және LLM Copilot — ұзақ мерзімді қосымша қабаттар; Core өздігінен өнімге дайын.",
    setupIntro:
      "Дереккөз: GitHub — Linux-Log-Guardian. Екі жол: дайын .deb пакеті (ұсынылады) немесе бастапқы кодтан құрастыру. Ноутбук/ВМ-де eBPF/XDP-сіз де жұмыс істейді (ipset негізді бан). Төмендегі қадамдар өнім сервері үшін; әр команданың күтілетін шығысы қоса берілген.",
    setupTip:
      "Кеңес: JWT және панель құпиясөзі үшін bash scripts/laptop_jwt_setup.sh қолданыңыз. 3 минуттық демо: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Құжаттар: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Сұрақтар, ынтымақтастық немесе үлес қосу үшін жазыңыз. Ашық код рухында қате туралы есептер мен pull request-тер қарсы алынады.",
    footerDesc:
      "nginx кіру логы → WAF/CRS → kernel ban. Бір тізбек, self-hosted, MIT лицензиясы. Түркияда жасалған.",
    footerSoak: "72 сағат soak PASS · 0 қате",
    proofBody:
      "Слайд емес, қайта жаңғыртылатын дәлел. OWASP CRS паритеті, жалған позитив қақпалары, бан кідірісі бенчмарктары, корпус recall және 72 сағаттық soak — бәрі өлшенген, автоматтандырылған және ашық тест матрицасында көрінеді.",
  },
  uz: {
    pipelineNote:
      "XDR, Wasm marketi va LLM Copilot — uzoq muddatli ixtiyoriy qatlamlar; Core o'zi ishlab chiqarishga tayyor.",
    selectedBodies: [
      "Yagona zanjir: nginx logi → OWASP CRS → ~17 ms kernel ban. ~15 daqiqada ishlab chiqarishda.",
      "Flot, SOC vaqt chizig'i, panellar — o'rnatishdan keyin o'z serveringizdagi ixtiyoriy qatlam.",
      "75 avtomatik test, taqqoslash PDF, 72 soat soak — dashboard /tests bilan bir xil matritsa.",
      "Tenant yorlig'li Prometheus metrikalar, panellar va alert qoidalari — self-hosted kuzatuv.",
      "Ko'p tugunli flot: agent sinxronizatsiyasi, etcd mesh siyosati va maqsadli buyruq yuborish — bitta paneldan.",
      "TAXII/STIX tahdid tasmasi + Telegram SOC: alert, ban va bir bosishda 'ack' — jonli operator oqimi.",
      "XDP filtri + execve/lineage uprobe'lar — yadro darajasida paket tashlash va syscall kuzatuvi. Noutbuklarda --no-xdp va ipset yetarli.",
      "Taqsimlangan skanerlarni aniqlash: bir xil JA3 izi + boshqa IP klaster, 100% recall — 80 IP jonli test.",
      "Hujum daraxti, kelib chiqish zondi, syscall uprobe — uzoq muddatli ixtiyoriy qatlam; hujum zanjiri va yashirin kanallarni aniqlash.",
      "Wasm runtime orqali maxsus qoida plaginlari — market modeli, Core'ga tegmasdan kengaytirish.",
      "JSON event_type oqimi — Splunk/Elastic/Vector'ga SIEM eksporti dalili (siem-export-report.json).",
      "Tarpit server + tuzoq kuzatuvchi — hujumchini sekinlashtirish va honeypot signali; aldash qatlami.",
    ],
    advLead:
      "Fail2ban faqat ban qiladi, ModSecurity WAF alohida modul, CrowdSec bo'lak stek talab qiladi. Log Guardian bu uch ishni bitta zanjirda birlashtiradi — o'lchangan dalil bilan.",
    advantages: [
      { k: "Bitta o'rnatish, bitta zanjir", v: "Fail2ban + ModSecurity + CrowdSec'ni alohida o'rnatib, integratsiya qilmaysiz. nginx logi → WAF/CRS → kernel ban bitta mahsulotda, ~15 daq o'rnatish." },
      { k: "~17 ms kernel ban", v: "Log qatoridan ipset/XDP banga median ~17 ms. Fail2ban/CrowdSec soniya–daqiqa darajasida qoladi; 5 o'lchangan namuna bilan isbotlangan." },
      { k: "100% recall + 100% CRS pariteti", v: "121 OWASP CRS qoidasi, 1500 qatorli korpusda haqiqiy hujum recall 100% va ModSec bilan to'liq paritet — 0.2% noto'g'ri pozitivda." },
      { k: "Taqsimlangan hujum qamrovi", v: "JA3 klaster aniqlash + IP bo'yicha ban — 80 IP jonli testda 100%. Fail2ban yagona IP'li; CrowdSec alohida signal tarmog'ini talab qiladi." },
      { k: "Shaffof, qayta ishlab chiqariladigan dalil", v: "75 avtomatik test + 14 fayllik dalil to'plami + 72 soat soak (864 namuna, 0 xato). Raqiblarda avtomatik dalil yo'q yoki bo'lak-bo'lak." },
      { k: "Self-hosted · MIT · Turkiyada ishlab chiqilgan", v: "Ma'lumotingiz sizda qoladi, vendor qaramligi yo'q, to'liq ochiq kod. SOC vaqt chizig'i, Prometheus metrikalari va Telegram boshqaruvi bitta panelda (:8443)." },
    ],
    vsNote:
      "Halol chegara: ba'zi sohalarda raqiblar aniq yaxshiroq (qizil kataklar). ModSec + CRS inline o'tkazuvchanlikda (~14 300 EPS, o'lchangan) va birinchi so'rovni bir zumda bloklashda oldinda; CrowdSec taqsimlangan hamjamiyat signal tarmog'ida va boshqariladigan SaaS konsolida kuchli. Bizning kuchimiz — yagona zanjir integratsiyasi + ~17 ms ban tezligi + shaffof, qayta ishlab chiqariladigan dalil.",
    vsLegend: "Qizil = shu qatordagi g'olib",
    honestItems: [
      "Reaktiv arxitektura — log qatori tushguncha birinchi so'rov o'tishi mumkin; biz ModSec'ning inline tezligida emasmiz.",
      "L3/L4 DDoS'ni yutmaymiz — CDN orqasida turamiz.",
      "Taqsimlangan botnet — IP bo'yicha ban; CrowdSec signal tarmog'i yo'q.",
      "Qiladi: log → CRS/WAF → ~17 ms kernel ban, dalil PDF, Telegram boshqaruvi, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset ban (~15 daq)",
      "eBPF demoni, panel, metrikalar, flot",
      "XDR, Wasm marketi, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm marketi va LLM Copilot — uzoq muddatli ixtiyoriy qatlamlar; Core o'zi ishlab chiqarishga tayyor.",
    setupIntro:
      "Manba: GitHub — Linux-Log-Guardian. Ikki yo'l: tayyor .deb paket (tavsiya etiladi) yoki manbadan qurish. Noutbuk/VM'larda eBPF/XDP'siz ham ishlaydi (ipset asosidagi ban). Quyidagi qadamlar ishlab chiqarish serveri uchun; har bir buyruqning kutilgan chiqishi kiritilgan.",
    setupTip:
      "Maslahat: JWT va panel paroli uchun bash scripts/laptop_jwt_setup.sh'dan foydalaning. 3 daqiqalik demo: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Hujjatlar: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Savollar, hamkorlik yoki hissa uchun yozing. Ochiq kod ruhida xato hisobotlari va pull request'lar xush kelibsiz.",
    footerDesc:
      "nginx kirish logi → WAF/CRS → kernel ban. Yagona zanjir, self-hosted, MIT litsenziyali. Turkiyada ishlab chiqilgan.",
    footerSoak: "72 soat soak PASS · 0 xato",
    proofBody:
      "Slayd emas, qayta ishlab chiqariladigan dalil. OWASP CRS pariteti, noto'g'ri pozitiv darvozalari, ban kechikishi benchmarklari, korpus recall va 72 soatlik soak — hammasi o'lchangan, avtomatlashtirilgan va ochiq test matritsasida ko'rinadi.",
  },
  ky: {
    pipelineNote:
      "XDR, Wasm маркети жана LLM Copilot — узак мөөнөттүү кошумча катмарлар; Core өзү өндүрүшкө даяр.",
    selectedBodies: [
      "Бирдиктүү чынжыр: nginx логу → OWASP CRS → ~17 мс kernel ban. ~15 мүнөттө өндүрүштө.",
      "Флот, SOC убакыт сызыгы, панелдер — орнотуудан кийин өз серверыңыздагы кошумча катмар.",
      "75 автоматтык тест, салыштыруу PDF, 72 саат soak — dashboard /tests менен бирдей матрица.",
      "Tenant белгиси бар Prometheus метрикалары, панелдер жана эскертүү эрежелери — self-hosted байкоо.",
      "Көп түйүндүү флот: агент синхрондоо, etcd mesh саясаты жана багытталган команда жөнөтүү — бир панелден.",
      "TAXII/STIX коркунуч тасмасы + Telegram SOC: эскертүү, ban жана бир басып 'ack' — түз оператор агымы.",
      "XDP чыпкасы + execve/lineage uprobe'дор — ядро деңгээлинде пакет таштоо жана syscall трассировкасы. Ноутбуктарда --no-xdp менен ipset жетиштүү.",
      "Бөлүштүрүлгөн сканерлерди аныктоо: бирдей JA3 изи + башка IP кластери, 100% recall — 80 IP түз тест.",
      "Чабуул дарагы, келип чыгуу зонду, syscall uprobe — узак мөөнөттүү кошумча катмар; чабуул чынжырын жана жашыруун каналдарды аныктоо.",
      "Wasm runtime аркылуу атайын эреже плагиндери — маркет модели, Core'го тийбей кеңейтүү.",
      "JSON event_type агымы — Splunk/Elastic/Vector'го SIEM экспорту далили (siem-export-report.json).",
      "Tarpit сервер + тузак байкоочу — чабуулчуну жайлатуу жана honeypot сигналы; алдоо катмары.",
    ],
    advLead:
      "Fail2ban бир гана ban салат, ModSecurity WAF өзүнчө модуль, CrowdSec бөлүк стек талап кылат. Log Guardian бул үч ишти бир чынжырда бириктирет — өлчөнгөн далил менен.",
    advantages: [
      { k: "Бир орнотуу, бир чынжыр", v: "Fail2ban + ModSecurity + CrowdSec'ти өзүнчө орнотуп, интеграциялабайсыз. nginx логу → WAF/CRS → kernel ban бир продуктта, ~15 мүн орнотуу." },
      { k: "~17 мс kernel ban", v: "Лог сабынан ipset/XDP банга медиана ~17 мс. Fail2ban/CrowdSec секунд–мүнөт деңгээлинде калат; 5 өлчөнгөн үлгү менен далилденген." },
      { k: "100% recall + 100% CRS паритети", v: "121 OWASP CRS эрежеси, 1500 саптык корпуста чыныгы чабуул recall 100% жана ModSec менен толук паритет — 0.2% жалган позитивде." },
      { k: "Бөлүштүрүлгөн чабуулду камтуу", v: "JA3 кластерин аныктоо + IP боюнча ban — 80 IP түз тестте 100%. Fail2ban жалгыз IP'лик; CrowdSec өзүнчө сигнал тармагын талап кылат." },
      { k: "Ачык, кайра чыгарылуучу далил", v: "75 автоматтык тест + 14 файлдык далил топтому + 72 саат soak (864 үлгү, 0 ката). Атаандаштарда автоматтык далил жок же бөлүк-бөлүк." },
      { k: "Self-hosted · MIT · Түркияда жасалган", v: "Маалыматыңыз сизде калат, вендорго көз карандылык жок, толук ачык код. SOC убакыт сызыгы, Prometheus метрикалары жана Telegram башкаруусу бир панелде (:8443)." },
    ],
    vsNote:
      "Чынчыл чек: кээ бир тармактарда атаандаштар ачык жакшыраак (кызыл уячалар). ModSec + CRS inline өткөрүү жөндөмдүүлүгүндө (~14 300 EPS, өлчөнгөн) жана биринчи сурамды заматта бөгөттөөдө алдыда; CrowdSec бөлүштүрүлгөн коомдук сигнал тармагында жана башкарылуучу SaaS консолунда күчтүү. Биздин күчүбүз — бир чынжыр интеграциясы + ~17 мс ban ылдамдыгы + ачык, кайра чыгарылуучу далил.",
    vsLegend: "Кызыл = ошол саптагы жеңүүчү",
    honestItems: [
      "Реактивдүү архитектура — лог сабы түшкөнгө чейин биринчи сурам өтүшү мүмкүн; биз ModSec'тин inline ылдамдыгында эмеспиз.",
      "L3/L4 DDoS'ту сиңирбейбиз — CDN артында турабыз.",
      "Бөлүштүрүлгөн ботнет — IP боюнча ban; CrowdSec сигнал тармагы жок.",
      "Кылат: лог → CRS/WAF → ~17 мс kernel ban, далил PDF, Telegram башкаруу, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset ban (~15 мүн)",
      "eBPF демону, панель, метрикалар, флот",
      "XDR, Wasm маркети, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm маркети жана LLM Copilot — узак мөөнөттүү кошумча катмарлар; Core өзү өндүрүшкө даяр.",
    setupIntro:
      "Булак: GitHub — Linux-Log-Guardian. Эки жол: даяр .deb пакети (сунушталат) же булактан куруу. Ноутбук/ВМ'де eBPF/XDP'сиз да иштейт (ipset негизиндеги ban). Төмөнкү кадамдар өндүрүш сервери үчүн; ар бир команданын күтүлгөн чыгуусу камтылган.",
    setupTip:
      "Кеңеш: JWT жана панель сырсөзү үчүн bash scripts/laptop_jwt_setup.sh колдонуңуз. 3 мүнөттүк демо: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Документтер: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Суроолор, кызматташтык же салым үчүн жазыңыз. Ачык код рухунда ката жөнүндө билдирүүлөр жана pull request'тер кубаттуу тосулат.",
    footerDesc:
      "nginx кирүү логу → WAF/CRS → kernel ban. Бирдиктүү чынжыр, self-hosted, MIT лицензиясы. Түркияда жасалган.",
    footerSoak: "72 саат soak PASS · 0 ката",
    proofBody:
      "Слайд эмес, кайра чыгарылуучу далил. OWASP CRS паритети, жалган позитив дарбазалары, ban кечигүү бенчмарктары, корпус recall жана 72 сааттык soak — баары өлчөнгөн, автоматташтырылган жана ачык тест матрицасында көрүнөт.",
  },
  tk: {
    pipelineNote:
      "XDR, Wasm marketi we LLM Copilot uzak möhletli goşmaça gatlaklardyr — Core ýeke özi önümçilige taýýar.",
    selectedBodies: [
      "Ýeke zynjyr: nginx logy → OWASP CRS → ~17 ms kernel ban. ~15 minutda önümçilikde.",
      "Flot, SOC wagt çyzygy, panellar — gurnamadan soň öz serweriňizdäki goşmaça gatlak.",
      "75 awtomatik test, deňeşdirme PDF, 72 sagat soak — dashboard /tests bilen birmeňzeş matrisa.",
      "Tenant belgili Prometheus metrikalary, panellar we duýduryş düzgünleri — self-hosted gözegçilik.",
      "Köp düwünli flot: agent sinhronizasiýasy, etcd mesh syýasaty we niýetlenen buýruk ibermek — bir panelden.",
      "TAXII/STIX howp lentasy + Telegram SOC: duýduryş, ban we bir gezek basyp 'ack' — göni operator akymy.",
      "XDP süzgüji + execve/lineage uprobe'lar — ýadro derejesinde paket taşlamak we syscall yzarlamak. Noutbuklarda --no-xdp bilen ipset ýeterlik.",
      "Paýlanan skanerleri ýüze çykarmak: birmeňzeş JA3 yzy + başga IP klaster, 100% recall — 80 IP göni test.",
      "Hüjüm agajy, gelip çykyş zondy, syscall uprobe — uzak möhletli goşmaça gatlak; hüjüm zynjyryny we gizlin kanallary ýüze çykarmak.",
      "Wasm runtime arkaly ýörite düzgün pluginleri — market modeli, Core'a degmän giňeltmek.",
      "JSON event_type akymy — Splunk/Elastic/Vector'a SIEM eksporty subutnamasy (siem-export-report.json).",
      "Tarpit serwer + duzak gözegçisi — hüjümçini haýalladyp honeypot signaly; aldaw gatlagy.",
    ],
    advLead:
      "Fail2ban diňe ban edýär, ModSecurity WAF aýratyn modul, CrowdSec bölek stek talap edýär. Log Guardian bu üç işi bir zynjyrda birleşdirýär — ölçelen subutnama bilen.",
    advantages: [
      { k: "Bir gurnama, bir zynjyr", v: "Fail2ban + ModSecurity + CrowdSec-i aýratyn gurnap, birleşdirmeýärsiňiz. nginx logy → WAF/CRS → kernel ban bir önümde, ~15 min gurnama." },
      { k: "~17 ms kernel ban", v: "Log setirinden ipset/XDP bana mediana ~17 ms. Fail2ban/CrowdSec sekunt–minut derejesinde galýar; 5 ölçelen nusga bilen subut edildi." },
      { k: "100% recall + 100% CRS pariteti", v: "121 OWASP CRS düzgüni, 1500 setirli korpusda hakyky hüjüm recall 100% we ModSec bilen doly paritet — 0.2% ýalňyş pozitiwde." },
      { k: "Paýlanan hüjümi gurşap almak", v: "JA3 klaster ýüze çykarmak + IP boýunça ban — 80 IP göni testde 100%. Fail2ban ýeke IP'li; CrowdSec aýratyn signal ulgamyny talap edýär." },
      { k: "Aýdyň, gaýtadan öndürilýän subutnama", v: "75 awtomatik test + 14 faýlly subutnama paketi + 72 sagat soak (864 nusga, 0 ýalňyşlyk). Bäsdeşlerde awtomatik subutnama ýok ýa-da bölek-bölek." },
      { k: "Self-hosted · MIT · Türkiýede öndürilen", v: "Maglumatyňyz sizde galýar, wendor garaşlylygy ýok, doly açyk kod. SOC wagt çyzygy, Prometheus metrikalary we Telegram dolandyryşy bir panelde (:8443)." },
    ],
    vsNote:
      "Dogruçyl çäk: käbir ugurlarda bäsdeşler aýdyň has gowy (gyzyl öýjükler). ModSec + CRS inline geçirijilikde (~14 300 EPS, ölçelen) we ilkinji soragy derrew bloklamakda öňde; CrowdSec paýlanan jemgyýet signal ulgamynda we dolandyrylýan SaaS konsolynda güýçli. Biziň güýjümiz — ýeke zynjyr integrasiýasy + ~17 ms ban tizligi + aýdyň, gaýtadan öndürilýän subutnama.",
    vsLegend: "Gyzyl = şol setirdäki ýeňiji",
    honestItems: [
      "Reaktiw arhitektura — log setiri düşýänçä ilkinji sorag geçip biler; biz ModSec-iň inline tizliginde däl.",
      "L3/L4 DDoS-y siňdirmeýäris — CDN arkasynda durýarys.",
      "Paýlanan botnet — IP boýunça ban; CrowdSec signal ulgamy ýok.",
      "Edýär: log → CRS/WAF → ~17 ms kernel ban, subutnama PDF, Telegram dolandyryş, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset ban (~15 min)",
      "eBPF demony, panel, metrikalar, flot",
      "XDR, Wasm marketi, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm marketi we LLM Copilot uzak möhletli goşmaça gatlaklardyr — Core ýeke özi önümçilige taýýar.",
    setupIntro:
      "Çeşme: GitHub — Linux-Log-Guardian. Iki ýol: taýýar .deb paket (maslahat berilýär) ýa-da çeşmeden gurmak. Noutbuk/VM-larda eBPF/XDP-syz hem işleýär (ipset esasly ban). Aşakdaky ädimler önümçilik serweri üçin; her buýrugyň garaşylýan çykyşy goşulýar.",
    setupTip:
      "Maslahat: JWT we panel paroly üçin bash scripts/laptop_jwt_setup.sh ulanyň. 3 minutlyk demo: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Resminamalar: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Soraglar, hyzmatdaşlyk ýa-da goşant üçin ýazyň. Açyk kod ruhunda hata habarlary we pull request'ler hoş garşylanýar.",
    footerDesc:
      "nginx giriş logy → WAF/CRS → kernel ban. Ýeke zynjyr, self-hosted, MIT ygtyýarnamaly. Türkiýede öndürilen.",
    footerSoak: "72 sagat soak PASS · 0 näsazlyk",
    proofBody:
      "Slaýd däl, gaýtadan öndürilýän subutnama. OWASP CRS pariteti, ýalňyş pozitiw derwezeleri, ban gijikdirmesi benchmarklary, korpus recall we 72 sagatlyk soak — hemmesi ölçelen, awtomatik we açyk test matrisasynda görünýär.",
  },
  tt: {
    pipelineNote:
      "XDR, Wasm маркеты һәм LLM Copilot — озын сроклы өстәмә катламнар; Core үзе генә җитештерүгә әзер.",
    selectedBodies: [
      "Бер чылбыр: nginx логы → OWASP CRS → ~17 мс kernel ban. ~15 минутта җитештерүдә.",
      "Флот, SOC вакыт сызыгы, панельләр — урнаштыргач үз сервереңдәге өстәмә катлам.",
      "75 автоматик тест, чагыштыру PDF, 72 сәгать soak — dashboard /tests белән бердәй матрица.",
      "Tenant билгеле Prometheus метрикалары, панельләр һәм искәртү кагыйдәләре — self-hosted күзәтү.",
      "Күп төенле флот: агент синхронлау, etcd mesh сәясәте һәм максатчан команда җибәрү — бер панельдән.",
      "TAXII/STIX куркыныч тасмасы + Telegram SOC: искәртү, ban һәм бер басып 'ack' — туры оператор агымы.",
      "XDP фильтры + execve/lineage uprobe'лар — ядро дәрәҗәсендә пакет ташлау һәм syscall эзләү. Ноутбукларда --no-xdp белән ipset җитә.",
      "Таратылган сканерларны ачыклау: бердәй JA3 эзе + башка IP кластеры, 100% recall — 80 IP туры тест.",
      "Һөҗүм агачы, чыгыш зонды, syscall uprobe — озын сроклы өстәмә катлам; һөҗүм чылбырын һәм яшерен каналларны ачыклау.",
      "Wasm runtime аша махсус кагыйдә плагиннары — маркет модель, Core'га кагылмыйча киңәйтү.",
      "JSON event_type агымы — Splunk/Elastic/Vector'га SIEM экспорты дәлиле (siem-export-report.json).",
      "Tarpit сервер + капкын күзәтче — һөҗүмчене акрынайту һәм honeypot сигналы; алдау катламы.",
    ],
    advLead:
      "Fail2ban бары тик ban сала, ModSecurity WAF аерым модуль, CrowdSec өлешле стек таләп итә. Log Guardian бу өч эшне бер чылбырда берләштерә — үлчәнгән дәлил белән.",
    advantages: [
      { k: "Бер урнаштыру, бер чылбыр", v: "Fail2ban + ModSecurity + CrowdSec'ны аерым урнаштырып, берләштермисез. nginx логы → WAF/CRS → kernel ban бер продуктта, ~15 мин урнаштыру." },
      { k: "~17 мс kernel ban", v: "Лог юлыннан ipset/XDP банга медиана ~17 мс. Fail2ban/CrowdSec секунд–минут дәрәҗәсендә кала; 5 үлчәнгән үрнәк белән расланган." },
      { k: "100% recall + 100% CRS паритеты", v: "121 OWASP CRS кагыйдәсе, 1500 юллык корпуста чын һөҗүм recall 100% һәм ModSec белән тулы паритет — 0.2% ялган позитивта." },
      { k: "Таратылган һөҗүмне каплау", v: "JA3 кластерын ачыклау + IP буенча ban — 80 IP туры тестта 100%. Fail2ban ялгыз IP'лы; CrowdSec аерым сигнал челтәрен таләп итә." },
      { k: "Ачык, кабат җитештерелә торган дәлил", v: "75 автоматик тест + 14 файллы дәлил пакеты + 72 сәгать soak (864 үрнәк, 0 хата). Көндәшләрдә автоматик дәлил юк яки өлешле." },
      { k: "Self-hosted · MIT · Төркиядә ясалган", v: "Мәгълүматыгыз сездә кала, вендорга бәйлелек юк, тулысынча ачык код. SOC вакыт сызыгы, Prometheus метрикалары һәм Telegram идарәсе бер панельдә (:8443)." },
    ],
    vsNote:
      "Намуслы чик: кайбер өлкәләрдә көндәшләр ачык яхшырак (кызыл күзәнәкләр). ModSec + CRS inline үткәрүчәнлектә (~14 300 EPS, үлчәнгән) һәм беренче соравны шунда ук блоклауда алда; CrowdSec таратылган җәмгыять сигнал челтәрендә һәм идарә ителә торган SaaS консолендә көчле. Безнең көч — бер чылбыр интеграциясе + ~17 мс ban тизлеге + ачык, кабат җитештерелә торган дәлил.",
    vsLegend: "Кызыл = шул юлдагы җиңүче",
    honestItems: [
      "Реактив архитектура — лог юлы төшкәнче беренче сорау үтә ала; без ModSec'ның inline тизлегендә түгел.",
      "L3/L4 DDoS'ны сеңдермибез — CDN артында торабыз.",
      "Таратылган ботнет — IP буенча ban; CrowdSec сигнал челтәре юк.",
      "Эшли: лог → CRS/WAF → ~17 мс kernel ban, дәлил PDF, Telegram идарә, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset ban (~15 мин)",
      "eBPF демоны, панель, метрикалар, флот",
      "XDR, Wasm маркеты, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm маркеты һәм LLM Copilot — озын сроклы өстәмә катламнар; Core үзе генә җитештерүгә әзер.",
    setupIntro:
      "Чыганак: GitHub — Linux-Log-Guardian. Ике юл: әзер .deb пакеты (тәкъдим ителә) яки чыганактан җыю. Ноутбук/ВМ'да eBPF/XDP'сыз да эшли (ipset нигезле ban). Түбәндәге адымнар җитештерү сервере өчен; һәр команданың көтелгән чыгышы кертелгән.",
    setupTip:
      "Киңәш: JWT һәм панель серсүзе өчен bash scripts/laptop_jwt_setup.sh кулланыгыз. 3 минутлык демо: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Документлар: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Сораулар, хезмәттәшлек яки өлеш кертү өчен языгыз. Ачык код рухында хата хәбәрләре һәм pull request'лар рәхим итеп кабул ителә.",
    footerDesc:
      "nginx керү логы → WAF/CRS → kernel ban. Бер чылбыр, self-hosted, MIT лицензияле. Төркиядә ясалган.",
    footerSoak: "72 сәгать soak PASS · 0 хата",
    proofBody:
      "Слайд түгел, кабат җитештерелә торган дәлил. OWASP CRS паритеты, ялган позитив капкалары, ban тоткарлыгы бенчмарклары, корпус recall һәм 72 сәгатьлек soak — барысы да үлчәнгән, автоматлаштырылган һәм ачык тест матрицасында күренә.",
  },
  ba: {
    pipelineNote:
      "XDR, Wasm маркеты һәм LLM Copilot — оҙаҡ мөҙҙәтле өҫтәмә ҡатламдар; Core үҙе генә етештереүгә әҙер.",
    selectedBodies: [
      "Бер сылбыр: nginx логы → OWASP CRS → ~17 мс kernel ban. ~15 минутта етештереүҙә.",
      "Флот, SOC ваҡыт һыҙығы, панелдәр — урынлаштырғас үҙ серверыңдағы өҫтәмә ҡатлам.",
      "75 автоматик тест, сағыштырыу PDF, 72 сәғәт soak — dashboard /tests менән бердәй матрица.",
      "Tenant билдәле Prometheus метрикалары, панелдәр һәм иҫкәртеү ҡағиҙәләре — self-hosted күҙәтеү.",
      "Күп төйөнлө флот: агент синхронлау, etcd mesh сәйәсәте һәм маҡсатлы команда ебәреү — бер панелдән.",
      "TAXII/STIX ҡурҡыныс таҫмаһы + Telegram SOC: иҫкәртеү, ban һәм бер баҫып 'ack' — тура оператор ағымы.",
      "XDP фильтры + execve/lineage uprobe'лар — ядро кимәлендә пакет ташлау һәм syscall эҙләү. Ноутбуктарҙа --no-xdp менән ipset етә.",
      "Таратылған сканерҙарҙы асыҡлау: бердәй JA3 эҙе + башҡа IP кластеры, 100% recall — 80 IP тура тест.",
      "Һөжүм ағасы, сығыш зонды, syscall uprobe — оҙаҡ мөҙҙәтле өҫтәмә ҡатлам; һөжүм сылбырын һәм йәшерен каналдарҙы асыҡлау.",
      "Wasm runtime аша махсус ҡағиҙә плагиндары — маркет модель, Core'ға ҡағылмайынса киңәйтеү.",
      "JSON event_type ағымы — Splunk/Elastic/Vector'ға SIEM экспорты дәлиле (siem-export-report.json).",
      "Tarpit сервер + ҡапҡын күҙәтсе — һөжүмсене яйлатыу һәм honeypot сигналы; алдау ҡатламы.",
    ],
    advLead:
      "Fail2ban бары тик ban һала, ModSecurity WAF айырым модуль, CrowdSec өлөшлө стек талап итә. Log Guardian был өс эште бер сылбырҙа берләштерә — үлсәнгән дәлил менән.",
    advantages: [
      { k: "Бер урынлаштырыу, бер сылбыр", v: "Fail2ban + ModSecurity + CrowdSec'ты айырым урынлаштырып, берләштермәйһегеҙ. nginx логы → WAF/CRS → kernel ban бер продуктта, ~15 мин урынлаштырыу." },
      { k: "~17 мс kernel ban", v: "Лог юлынан ipset/XDP банға медиана ~17 мс. Fail2ban/CrowdSec секунд–минут кимәлендә ҡала; 5 үлсәнгән өлгө менән раҫланған." },
      { k: "100% recall + 100% CRS паритеты", v: "121 OWASP CRS ҡағиҙәһе, 1500 юллыҡ корпуста ысын һөжүм recall 100% һәм ModSec менән тулы паритет — 0.2% ялған позитивта." },
      { k: "Таратылған һөжүмде ҡаплау", v: "JA3 кластерын асыҡлау + IP буйынса ban — 80 IP тура тестта 100%. Fail2ban яңғыҙ IP'лы; CrowdSec айырым сигнал селтәрен талап итә." },
      { k: "Асыҡ, ҡабат етештерелә торған дәлил", v: "75 автоматик тест + 14 файллы дәлил пакеты + 72 сәғәт soak (864 өлгө, 0 хата). Көндәштәрҙә автоматик дәлил юҡ йәки өлөшлө." },
      { k: "Self-hosted · MIT · Төркиәлә яһалған", v: "Мәғлүмәтегеҙ һеҙҙә ҡала, вендорға бәйлелек юҡ, тулыһынса асыҡ код. SOC ваҡыт һыҙығы, Prometheus метрикалары һәм Telegram идараһы бер панелдә (:8443)." },
    ],
    vsNote:
      "Намыҫлы сик: ҡайһы бер өлкәләрҙә көндәштәр асыҡ яҡшыраҡ (ҡыҙыл күҙәнәктәр). ModSec + CRS inline үткәреүсәнлектә (~14 300 EPS, үлсәнгән) һәм беренсе һорауҙы шунда уҡ блоклауҙа алда; CrowdSec таратылған йәмғиәт сигнал селтәрендә һәм идара ителгән SaaS консолендә көслө. Беҙҙең көс — бер сылбыр интеграцияһы + ~17 мс ban тиҙлеге + асыҡ, ҡабат етештерелә торған дәлил.",
    vsLegend: "Ҡыҙыл = шул юлдағы еңеүсе",
    honestItems: [
      "Реактив архитектура — лог юлы төшкәнсе беренсе һорау үтә ала; беҙ ModSec'тың inline тиҙлегендә түгел.",
      "L3/L4 DDoS'ты һеңдермәйбеҙ — CDN артында торабыҙ.",
      "Таратылған ботнет — IP буйынса ban; CrowdSec сигнал селтәре юҡ.",
      "Эшләй: лог → CRS/WAF → ~17 мс kernel ban, дәлил PDF, Telegram идара, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset ban (~15 мин)",
      "eBPF демоны, панель, метрикалар, флот",
      "XDR, Wasm маркеты, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm маркеты һәм LLM Copilot — оҙаҡ мөҙҙәтле өҫтәмә ҡатламдар; Core үҙе генә етештереүгә әҙер.",
    setupIntro:
      "Сығанаҡ: GitHub — Linux-Log-Guardian. Ике юл: әҙер .deb пакеты (тәҡдим ителә) йәки сығанаҡтан йыйыу. Ноутбук/ВМ'ла eBPF/XDP'һыҙ ҙа эшләй (ipset нигеҙле ban). Түбәндәге аҙымдар етештереү сервере өсөн; һәр команданың көтөлгән сығышы индерелгән.",
    setupTip:
      "Кәңәш: JWT һәм панель серһүҙе өсөн bash scripts/laptop_jwt_setup.sh ҡулланығыҙ. 3 минутлыҡ демо: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Документтар: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Һорауҙар, хеҙмәттәшлек йәки өлөш индереү өсөн яҙығыҙ. Асыҡ код рухында хата хәбәрҙәре һәм pull request'тар рәхим итеп ҡабул ителә.",
    footerDesc:
      "nginx инеү логы → WAF/CRS → kernel ban. Бер сылбыр, self-hosted, MIT лицензиялы. Төркиәлә яһалған.",
    footerSoak: "72 сәғәт soak PASS · 0 хата",
    proofBody:
      "Слайд түгел, ҡабат етештерелә торған дәлил. OWASP CRS паритеты, ялған позитив ҡапҡалары, ban тотҡарлығы бенчмарктары, корпус recall һәм 72 сәғәтлек soak — барыһы ла үлсәнгән, автоматлаштырылған һәм асыҡ тест матрицаһында күренә.",
  },
  cv: {
    pipelineNote:
      "XDR, Wasm маркечӗ тата LLM Copilot — вӑрӑм вӑхӑтлӑ хушма сийсем; Core хӑй тӗллӗн продакшена хатӗр.",
    selectedBodies: [
      "Пӗр сӑнчӑр: nginx логӗ → OWASP CRS → ~17 мс kernel бан. ~15 минутра продакшенра.",
      "Флот, SOC вӑхӑт линийӗ, панельсем — вырнаҫтарнӑ хыҫҫӑн хӑвӑн серверунти хушма сий.",
      "75 автомат тест, танлаштару PDF, 72 сехет soak — dashboard /tests пекех матрица.",
      "Tenant паллӑллӑ Prometheus метрикисем, панельсем тата асӑрхаттару правилисем — self-hosted сӑнав.",
      "Нумай тӗвӗллӗ флот: агент синхронлани, etcd mesh политики тата тӗллевлӗ команда яни — пӗр панельрен.",
      "TAXII/STIX хӑрушлӑх ленти + Telegram SOC: асӑрхаттару, бан тата пӗр пусса 'ack' — чӗрӗ оператор юхӑмӗ.",
      "XDP фильтрӗ + execve/lineage uprobe-сем — ядро шайӗнче пакет пӑрахни тата syscall йӗрлени. Ноутбуксем ҫинче --no-xdp тата ipset ҫитет.",
      "Сарӑлнӑ сканерсене тупни: пӗр евӗр JA3 йӗрӗ + урӑх IP кластерӗ, 100% recall — 80 IP чӗрӗ тест.",
      "Тапӑну йывӑҫҫи, тӗпчев зончӗ, syscall uprobe — вӑрӑм вӑхӑтлӑ хушма сий; тапӑну сӑнчӑрне тата пытанчӑк каналсене тупни.",
      "Wasm runtime урлӑ ятарлӑ правило плагинӗсем — маркет модель, Core-а тӗкӗнмесӗр анлӑлатни.",
      "JSON event_type юхӑмӗ — Splunk/Elastic/Vector валли SIEM экспорт кӑтартӑвӗ (siem-export-report.json).",
      "Tarpit сервер + тапӑ сӑнавҫи — тапӑнакана вӑрахлатни тата honeypot сигналӗ; улталу сийӗ.",
    ],
    advLead:
      "Fail2ban тӳрех бан ҫеҫ тӑвать, ModSecurity WAF уйрӑм модуль, CrowdSec татӑк-татӑк стек ыйтать. Log Guardian ку виҫӗ ӗҫе пӗр сӑнчӑрта пӗрлештерет — виҫнӗ кӑтартупа.",
    advantages: [
      { k: "Пӗр вырнаҫтару, пӗр сӑнчӑр", v: "Fail2ban + ModSecurity + CrowdSec-а уйрӑммӑн вырнаҫтарса пӗрлештерместӗр. nginx логӗ → WAF/CRS → kernel бан пӗр продуктра, ~15 мин вырнаҫтару." },
      { k: "~17 мс kernel бан", v: "Лог йӗркинчен ipset/XDP бана медиана ~17 мс. Fail2ban/CrowdSec ҫекунт–минут шайӗнче юлаҫҫӗ; 5 виҫнӗ тӗслӗхпе ҫирӗплетнӗ." },
      { k: "100% recall + 100% CRS паритечӗ", v: "121 OWASP CRS правили, 1500 йӗркеллӗ корпусра чӑн тапӑну recall 100% тата ModSec-па тулли паритет — 0.2% суя позитивра." },
      { k: "Сарӑлнӑ тапӑнӑва хуплани", v: "JA3 кластерне тупни + IP тӑрӑх бан — 80 IP чӗрӗ тестра 100%. Fail2ban пӗр IP-лӑ; CrowdSec уйрӑм сигнал тетелне ыйтать." },
      { k: "Уҫӑ, тепӗр хут тӑвакан кӑтарту", v: "75 автомат тест + 14 файллӑ кӑтарту пакечӗ + 72 сехет soak (864 тӗслӗх, 0 йӑнӑш). Конкурентсен автомат кӑтарту ҫук е татӑк-татӑк." },
      { k: "Self-hosted · MIT · Турцире тунӑ", v: "Сирӗн даннӑйсем сирӗнте юлаҫҫӗ, вендора ҫыхӑнни ҫук, пӗтӗмпех уҫӑ код. SOC вӑхӑт линийӗ, Prometheus метрикисем тата Telegram майлашӑвӗ пӗр панельре (:8443)." },
    ],
    vsNote:
      "Тӳрӗ чикӗ: хӑш-пӗр енре конкурентсем уҫҫӑнах лайӑхрах (хӗрлӗ клеткӑсем). ModSec + CRS inline виҫерен (~14 300 EPS, виҫнӗ) тата пӗрремӗш ыйтӑва самантрах пӳлнинче мала тухать; CrowdSec сарӑлнӑ обществӑ сигнал тетелӗнче тата майлаштарнӑ SaaS консольте вӑйлӑ. Пирӗн вӑй — пӗр сӑнчӑр интеграцийӗ + ~17 мс бан хӑвӑртлӑхӗ + уҫӑ, тепӗр хут тӑвакан кӑтарту.",
    vsLegend: "Хӗрлӗ = ҫав йӗркери ҫӗнтерекен",
    honestItems: [
      "Реактивлӑ архитектура — лог йӗрки ӳкиччен пӗрремӗш ыйту иртме пултарать; эпир ModSec inline хӑвӑртлӑхӗнче мар.",
      "L3/L4 DDoS-а ҫӑтмастпӑр — CDN хыҫӗнче тӑратпӑр.",
      "Сарӑлнӑ ботнет — IP тӑрӑх бан; CrowdSec сигнал тетелӗ ҫук.",
      "Тӑвать: лог → CRS/WAF → ~17 мс kernel бан, кӑтарту PDF, Telegram майлашу, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset бан (~15 мин)",
      "eBPF демонӗ, панель, метрикисем, флот",
      "XDR, Wasm маркечӗ, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm маркечӗ тата LLM Copilot — вӑрӑм вӑхӑтлӑ хушма сийсем; Core хӑй тӗллӗн продакшена хатӗр.",
    setupIntro:
      "Ҫӑлкуҫ: GitHub — Linux-Log-Guardian. Икӗ ҫул: хатӗр .deb пакет (сӗнетпӗр) е ҫӑлкуҫран пуҫтарни. Ноутбук/ВМ ҫинче eBPF/XDP-сӗр те ӗҫлет (ipset никӗслӗ бан). Аялти утӑмсем продакшен сервер валли; кашни команда кӗтнӗ кӑларӑм кӗртнӗ.",
    setupTip:
      "Канаш: JWT тата панель паролӗ валли bash scripts/laptop_jwt_setup.sh усӑ курӑр. 3 минутлӑ демо: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Документсем: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Ыйтусем, пӗрле ӗҫлени е хутшӑну валли ҫырӑр. Уҫӑ код кӑмӑлӗпе йӑнӑш хыпарӗсене тата pull request-сене хапӑл тӑватпӑр.",
    footerDesc:
      "nginx кӗрӳ логӗ → WAF/CRS → kernel бан. Пӗр сӑнчӑр, self-hosted, MIT лицензиллӗ. Турцире тунӑ.",
    footerSoak: "72 сехет soak PASS · 0 йӑнӑш",
    proofBody:
      "Слайд мар, тепӗр хут тӑвакан кӑтарту. OWASP CRS паритечӗ, суя позитив хапхисем, бан кӗтӗвӗн бенчмаркӗсем, корпус recall тата 72 сехетлӗ soak — пурте виҫнӗ, автоматланӑ тата уҫӑ тест матрицинче курӑнать.",
  },
  crh: {
    pipelineNote:
      "XDR, Wasm marketi ve LLM Copilot uzun vadeli qoşımca qatlardır — Core tek başına istihsalge azır.",
    selectedBodies: [
      "Tek zıncır: nginx logu → OWASP CRS → ~17 ms kernel ban. ~15 daqiqada istihsalde.",
      "Filo, SOC vaqıt sızığı, pan'eller — qurulımdan soñ öz serverıñızdaki qoşımca qat.",
      "75 avtomatik test, qıyaslav PDF, 72 saat soak — dashboard /tests ile aynı matritsa.",
      "Tenant belgili Prometheus metrikaları, pan'eller ve tenbih qaideleri — self-hosted közetüv.",
      "Çoq tügünli filo: agent sinhronlav, etcd mesh siyaseti ve maqsatlı buyruq yiberüv — bir pan'elden.",
      "TAXII/STIX qorqu lentası + Telegram SOC: tenbih, ban ve bir basıp 'ack' — canlı operator aqımı.",
      "XDP süzgüçi + execve/lineage uprobe'ları — kernel seviyesinde paket taşlav ve syscall izlev. Noutbuklarda --no-xdp ve ipset yeter.",
      "Dağıtıq skanerlerni tapuv: aynı JA3 izi + başqa IP klaster, 100% recall — 80 IP canlı test.",
      "Hücum terekası, menşe zondı, syscall uprobe — uzun vadeli qoşımca qat; hücum zıncırını ve gizli kanallarnı tapuv.",
      "Wasm runtime vastasınen mahsus qaide pluginleri — market model, Core'ge tiymeyip kenişletüv.",
      "JSON event_type aqımı — Splunk/Elastic/Vector'ge SIEM eksport delili (siem-export-report.json).",
      "Tarpit server + tuzaq közetici — hücumcını yavaşlatuv ve honeypot signalı; aldatuv qatı.",
    ],
    advLead:
      "Fail2ban tek ban yapa, ModSecurity WAF ayrı modul, CrowdSec parça-parça stek ister. Log Guardian bu üç işni tek zıncırda birleştire — ölçengen delilnen.",
    advantages: [
      { k: "Bir qurulım, bir zıncır", v: "Fail2ban + ModSecurity + CrowdSec'ni ayrı qurup birleştirmeysiñiz. nginx logu → WAF/CRS → kernel ban tek mahsulda, ~15 daq qurulım." },
      { k: "~17 ms kernel ban", v: "Log satırından ipset/XDP banğa mediana ~17 ms. Fail2ban/CrowdSec saniye–daqiqa seviyesinde qala; 5 ölçengen örneknen isbatlanğan." },
      { k: "100% recall + 100% CRS pariteti", v: "121 OWASP CRS qaidesi, 1500 satırlıq korpusta kerçek hücum recall 100% ve ModSec ile tam paritet — 0.2% yañlış pozitivde." },
      { k: "Dağıtıq hücumnı qaplav", v: "JA3 klaster tapuv + IP başına ban — 80 IP canlı testte 100%. Fail2ban tek IP'li; CrowdSec ayrı signal ağını ister." },
      { k: "Şeffaf, tekrar tüzülgen delil", v: "75 avtomatik test + 14 fayllı delil paketi + 72 saat soak (864 örnek, 0 hata). Raqiplerde avtomatik delil yoq ya da parça-parça." },
      { k: "Self-hosted · MIT · Türkiyede yapılğan", v: "Malümatıñız sizde qala, vendor bağlılığı yoq, tamamen açıq kod. SOC vaqıt sızığı, Prometheus metrikaları ve Telegram idaresi bir pan'elde (:8443)." },
    ],
    vsNote:
      "Doğru sıñır: bazı sahalarda raqipler açıq şekilde daha yahşı (qırmızı hüceyreler). ModSec + CRS inline keçirüvde (~14 300 EPS, ölçengen) ve ilk sorağını hemen bloklavda ögde; CrowdSec dağıtıq cemaat signal ağında ve idare etilgen SaaS konsolunda küçlü. Bizim küç — tek zıncır integratsiyası + ~17 ms ban tezligi + şeffaf, tekrar tüzülgen delil.",
    vsLegend: "Qırmızı = o satırdaki ğalip",
    honestItems: [
      "Reaktiv mimarlıq — log satırı tüşkence ilk soravnıñ keçüvi mümkün; biz ModSec'niñ inline tezliginde degilmiz.",
      "L3/L4 DDoS'nı yutmaymız — CDN artında turamız.",
      "Dağıtıq botnet — IP başına ban; CrowdSec signal ağı yoq.",
      "Yapa: log → CRS/WAF → ~17 ms kernel ban, delil PDF, Telegram idare, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset ban (~15 daq)",
      "eBPF demonı, pan'el, metrikalar, filo",
      "XDR, Wasm marketi, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm marketi ve LLM Copilot uzun vadeli qoşımca qatlardır — Core tek başına istihsalge azır.",
    setupIntro:
      "Menba: GitHub — Linux-Log-Guardian. Eki yol: azır .deb paket (tevsiye etile) ya da menbadan tüzmek. Noutbuk/VM'lerde eBPF/XDP'siz de çalışa (ipset esaslı ban). Aşağıdaki adımlar istihsal serveri içün; er buyruqnıñ beklengen çıqışı kirsetilgen.",
    setupTip:
      "Tevsiye: JWT ve pan'el parolı içün bash scripts/laptop_jwt_setup.sh qullanıñız. 3 daqiqalıq demo: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Vesiqalar: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Sorular, işbirligi ya da qatqı içün yazıñız. Açıq kod ruhunda hata bildirimleri ve pull request'ler hoş körüle.",
    footerDesc:
      "nginx kirim logu → WAF/CRS → kernel ban. Tek zıncır, self-hosted, MIT litsenziyalı. Türkiyede yapılğan.",
    footerSoak: "72 saat soak PASS · 0 hata",
    proofBody:
      "Slayd degil, tekrar tüzülgen delil. OWASP CRS pariteti, yañlış pozitiv qapıları, ban keçikmesi benchmarkları, korpus recall ve 72 saatlıq soak — episi ölçengen, avtomatlaştırılğan ve açıq test matritsasında körüne.",
  },
  gag: {
    pipelineNote:
      "XDR, Wasm marketi hem LLM Copilot uzun vadeli seçili katlar — Core tek başına üretimä hazır.",
    selectedBodies: [
      "Tek zincir: nginx logu → OWASP CRS → ~17 ms kernel ban. ~15 dakikada üretimdä.",
      "Filo, SOC zaman çizgisi, panellär — kurmadan sora kendi serverindä seçili kat.",
      "75 avtomatik test, karşılaştırma PDF, 72 saat soak — dashboard /tests ilä aynı matritsa.",
      "Tenant nişanlı Prometheus metrikaları, panellär hem sesletmäk kuralları — self-hosted gözlemäk.",
      "Çok dügümlü filo: agent sinhronlaması, etcd mesh politikası hem nişanlı komut yollaması — bir paneldän.",
      "TAXII/STIX korku lentası + Telegram SOC: sesletmäk, ban hem bir basmaklan 'ack' — canlı operator akışı.",
      "XDP süzgeci + execve/lineage uprobe'ları — kernel kertindä paket atmak hem syscall izlemäk. Laptoplarda --no-xdp ilä ipset yetär.",
      "Daalı skannerleri bulmak: aynı JA3 izi + başka IP klaster, 100% recall — 80 IP canlı test.",
      "Saldırı aacı, kök zondu, syscall uprobe — uzun vadeli seçili kat; saldırı zincirini hem gizli kanalları bulmak.",
      "Wasm runtime aracılıınnan özel kural pluginneri — market model, Core'a diimeyeräk genişletmäk.",
      "JSON event_type akışı — Splunk/Elastic/Vector'a SIEM eksport delili (siem-export-report.json).",
      "Tarpit server + kapan gözleyicisi — saldıranı yavaşlatmak hem honeypot sinyalı; aldatmak katı.",
    ],
    advLead:
      "Fail2ban salt ban yapêr, ModSecurity WAF ayırı modül, CrowdSec parça-parça stek ister. Log Guardian bu üç işi tek zincirdä birleştirer — ölçülü delillän.",
    advantages: [
      { k: "Bir kurma, bir zincir", v: "Fail2ban + ModSecurity + CrowdSec'i ayırı kurup birleştirmeersiniz. nginx logu → WAF/CRS → kernel ban tek üründä, ~15 dak kurma." },
      { k: "~17 ms kernel ban", v: "Log satırından ipset/XDP bana mediana ~17 ms. Fail2ban/CrowdSec saniye–dakika kertindä kalêr; 5 ölçülü örneklän ispatlandı." },
      { k: "100% recall + 100% CRS pariteti", v: "121 OWASP CRS kuralı, 1500 satırlık korpusta gerçek saldırı recall 100% hem ModSec ilä tam paritet — 0.2% yalancı pozitivdä." },
      { k: "Daalı saldırıyı kaplamak", v: "JA3 klaster bulması + IP başına ban — 80 IP canlı testtä 100%. Fail2ban tek IP'li; CrowdSec ayırı sinyal aa ister." },
      { k: "Açık, tekrar yapılabilän delil", v: "75 avtomatik test + 14 dosyalı delil paketi + 72 saat soak (864 örnek, 0 hata). Rakiplerdä avtomatik delil yok osaydı parça-parça." },
      { k: "Self-hosted · MIT · Türkiyedä yapıldı", v: "Bilgileriniz sizdä kalêr, vendor baalantısı yok, bütünnä açık kod. SOC zaman çizgisi, Prometheus metrikaları hem Telegram işlemesi bir paneldä (:8443)." },
    ],
    vsNote:
      "Dooru sınır: kimi alannarda rakiplär açık şekildä taa islää (kırmızı üücüklär). ModSec + CRS inline geçirmektä (~14 300 EPS, ölçülü) hem ilk isteyi hemen bloklamakta önnärdä; CrowdSec daalı cümnä sinyal aandä hem işlenän SaaS konsolundä küvetli. Bizim küvet — tek zincir integratsiyası + ~17 ms ban hızı + açık, tekrar yapılabilän delil.",
    vsLegend: "Kırmızı = o satırdaki kazanan",
    honestItems: [
      "Reaktiv mimarlık — log satırı düşenädäk ilk isteyin geçmesi olabilir; biz ModSec'in inline hızındä diiliz.",
      "L3/L4 DDoS'u yutmeeriz — CDN ardında dururuz.",
      "Daalı botnet — IP başına ban; CrowdSec sinyal aa yok.",
      "Yapêr: log → CRS/WAF → ~17 ms kernel ban, delil PDF, Telegram işlemäk, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset ban (~15 dak)",
      "eBPF demonu, panel, metrikalar, filo",
      "XDR, Wasm marketi, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm marketi hem LLM Copilot uzun vadeli seçili katlar — Core tek başına üretimä hazır.",
    setupIntro:
      "Kaynak: GitHub — Linux-Log-Guardian. İki yol: hazır .deb paket (salık veriler) osaydı kaynaktan kurmak. Laptop/VM'lerdä eBPF/XDP'siz da çalışêr (ipset temelli ban). Aşaadaki adımnar üretim serveri için; her komudun beklenän çıkışı katıldı.",
    setupTip:
      "Salık: JWT hem panel parolu için bash scripts/laptop_jwt_setup.sh kullanın. 3 dakikalık demo: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Dokumentlär: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Sorular, işbirlii osaydı katkı için yazın. Açık kod ruhundä hata bildirmeleri hem pull request'lär hoş karşılanêr.",
    footerDesc:
      "nginx giriş logu → WAF/CRS → kernel ban. Tek zincir, self-hosted, MIT litsenziyalı. Türkiyedä yapıldı.",
    footerSoak: "72 saat soak PASS · 0 hata",
    proofBody:
      "Slayd diil, tekrar yapılabilän delil. OWASP CRS pariteti, yalancı pozitiv kapıları, ban gecikmesi benchmarkları, korpus recall hem 72 saatlık soak — hepsi ölçülü, avtomatlaştırıldı hem açık test matritsasında görüner.",
  },
  ug: {
    pipelineNote:
      "XDR، Wasm بازىرى ۋە LLM Copilot ئۇزۇن مۇددەتلىك تاللانما قاتلاملار — Core ئۆزىلا ئىشلەپچىقىرىشقا تەييار.",
    selectedBodies: [
      "بىرلا زەنجىر: nginx خاتىرىسى → OWASP CRS → ~17 مىللىسېكۇنت يادرو چەكلىشى. ~15 مىنۇتتا ئىشلەپچىقىرىشتا.",
      "فلوت، SOC ۋاقىت سىزىقى، تاختىلار — ئورناتقاندىن كېيىن ئۆز مۇلازىمېتىرىڭىزدىكى تاللانما قاتلام.",
      "75 ئاپتوماتىك سىناق، سېلىشتۇرۇش PDF، 72 سائەت soak — dashboard /tests بىلەن ئوخشاش ماترىتسا.",
      "Tenant بەلگىسى بار Prometheus مېترىكىلىرى، تاختىلار ۋە ئاگاھلاندۇرۇش قائىدىلىرى — self-hosted كۆزىتىش.",
      "كۆپ تۈگۈنلۈك فلوت: ئاگېنت ماسلاشتۇرۇش، etcd mesh سىياسىتى ۋە نىشانلىق بۇيرۇق ئەۋەتىش — بىرلا تاختىدىن.",
      "TAXII/STIX خەتەر لېنتىسى + Telegram SOC: ئاگاھلاندۇرۇش، چەكلەش ۋە بىر بېسىپ 'ack' — جانلىق مەشغۇلات ئېقىمى.",
      "XDP سۈزگۈچ + execve/lineage uprobe لىرى — يادرو دەرىجىسىدە بولاق تاشلاش ۋە syscall ئىزلاش. يان كومپيۇتېرلاردا --no-xdp بىلەن ipset يېتەرلىك.",
      "تارقاق سكاننېرلارنى بايقاش: ئوخشاش JA3 ئىزى + باشقا IP توپلىمى، 100% recall — 80 IP جانلىق سىناق.",
      "ھۇجۇم دەرىخى، مەنبە زوندى، syscall uprobe — ئۇزۇن مۇددەتلىك تاللانما قاتلام؛ ھۇجۇم زەنجىرى ۋە يوشۇرۇن قاناللارنى بايقاش.",
      "Wasm runtime ئارقىلىق ئالاھىدە قائىدە قىستۇرمىلىرى — بازار مودېلى، Core غا تەگمەي كېڭەيتىش.",
      "JSON event_type ئېقىمى — Splunk/Elastic/Vector غا SIEM چىقىرىش ئىسپاتى (siem-export-report.json).",
      "Tarpit مۇلازىمېتىر + تۇزاق كۆزەتكۈچ — ھۇجۇمچىنى ئاستىلىتىش ۋە honeypot سىگنالى؛ ئالداش قاتلىمى.",
    ],
    advLead:
      "Fail2ban پەقەت چەكلەيدۇ، ModSecurity WAF ئايرىم مودۇل، CrowdSec پارچە-پارچە سىتاك تەلەپ قىلىدۇ. Log Guardian بۇ ئۈچ ئىشنى بىرلا زەنجىرگە بىرلەشتۈرىدۇ — ئۆلچەنگەن ئىسپات بىلەن.",
    advantages: [
      { k: "بىر ئورنىتىش، بىر زەنجىر", v: "Fail2ban + ModSecurity + CrowdSec نى ئايرىم ئورنىتىپ بىرلەشتۈرمەيسىز. nginx خاتىرىسى → WAF/CRS → يادرو چەكلىشى بىر مەھسۇلاتتا، ~15 مىنۇت ئورنىتىش." },
      { k: "~17 مىللىسېكۇنت يادرو چەكلىشى", v: "خاتىرە قۇرىدىن ipset/XDP چەكلەشكە ئوتتۇرا قىممەت ~17 مىللىسېكۇنت. Fail2ban/CrowdSec سېكۇنت–مىنۇت دەرىجىسىدە قالىدۇ؛ 5 ئۆلچەنگەن نەمۇنە بىلەن ئىسپاتلانغان." },
      { k: "100% recall + 100% CRS تەڭپۇڭلۇقى", v: "121 OWASP CRS قائىدىسى، 1500 قۇرلۇق كورپۇستا ھەقىقىي ھۇجۇم recall 100% ۋە ModSec بىلەن تولۇق تەڭپۇڭلۇق — 0.2% يالغان مۇسبەتتە." },
      { k: "تارقاق ھۇجۇمنى قاپلاش", v: "JA3 توپلام بايقاش + IP بويىچە چەكلەش — 80 IP جانلىق سىناقتا 100%. Fail2ban يەككە IP لىق؛ CrowdSec ئايرىم سىگنال تورى تەلەپ قىلىدۇ." },
      { k: "ئوچۇق، قايتا ياسىغىلى بولىدىغان ئىسپات", v: "75 ئاپتوماتىك سىناق + 14 ھۆججەتلىك ئىسپات بولىقى + 72 سائەت soak (864 نەمۇنە، 0 خاتالىق). رەقىبلەردە ئاپتوماتىك ئىسپات يوق ياكى پارچە-پارچە." },
      { k: "Self-hosted · MIT · تۈركىيەدە ياسالغان", v: "سانلىق مەلۇماتىڭىز سىزدە قالىدۇ، ساتقۇچىغا باغلىنىش يوق، تولۇق ئوچۇق كود. SOC ۋاقىت سىزىقى، Prometheus مېترىكىلىرى ۋە Telegram باشقۇرۇشى بىر تاختىدا (:8443)." },
    ],
    vsNote:
      "سەمىمىي چەك: بەزى ساھەلەردە رەقىبلەر ئېنىق ياخشىراق (قىزىل كاتەكچىلەر). ModSec + CRS inline ئۆتكۈزۈش ئىقتىدارىدا (~14 300 EPS، ئۆلچەنگەن) ۋە تۇنجى ئىلتىماسنى دەرھال توسۇشتا ئالدىدا؛ CrowdSec تارقاق جەمئىيەت سىگنال تورىدا ۋە باشقۇرۇلىدىغان SaaS كونسولىدا كۈچلۈك. بىزنىڭ كۈچىمىز — بىرلا زەنجىر بىرلەشتۈرۈش + ~17 مىللىسېكۇنت چەكلەش سۈرئىتى + ئوچۇق، قايتا ياسىغىلى بولىدىغان ئىسپات.",
    vsLegend: "قىزىل = شۇ قۇردىكى غالىب",
    honestItems: [
      "ئىنكاسچان قۇرۇلما — خاتىرە قۇرى چۈشكۈچە تۇنجى ئىلتىماس ئۆتۈپ كېتىشى مۇمكىن؛ بىز ModSec نىڭ inline سۈرئىتىدە ئەمەس.",
      "L3/L4 DDoS نى سىڭدۈرمەيمىز — CDN ئارقىسىدا تۇرىمىز.",
      "تارقاق botnet — IP بويىچە چەكلەش؛ CrowdSec سىگنال تورى يوق.",
      "قىلىدۇ: خاتىرە → CRS/WAF → ~17 مىللىسېكۇنت يادرو چەكلىشى، ئىسپات PDF، Telegram باشقۇرۇش، MIT self-hosted.",
    ],
    layersBodies: [
      "خاتىرە → WAF → ipset چەكلەش (~15 مىنۇت)",
      "eBPF دېمونى، تاختا، مېترىكىلار، فلوت",
      "XDR، Wasm بازىرى، LLM Copilot",
    ],
    layersNote:
      "XDR، Wasm بازىرى ۋە LLM Copilot ئۇزۇن مۇددەتلىك تاللانما قاتلاملار — Core ئۆزىلا ئىشلەپچىقىرىشقا تەييار.",
    setupIntro:
      "مەنبە: GitHub — Linux-Log-Guardian. ئىككى يول: تەييار .deb بولىقى (تەۋسىيە قىلىنىدۇ) ياكى مەنبەدىن ياساش. يان كومپيۇتېر/VM لاردا eBPF/XDP سىز مۇ ئىشلەيدۇ (ipset ئاساسلىق چەكلەش). تۆۋەندىكى قەدەملەر ئىشلەپچىقىرىش مۇلازىمېتىرى ئۈچۈن؛ ھەر بۇيرۇقنىڭ كۈتۈلگەن چىقىرىشى قوشۇلغان.",
    setupTip:
      "تەۋسىيە: JWT ۋە تاختا مەخپىي نومۇرى ئۈچۈن bash scripts/laptop_jwt_setup.sh ئىشلىتىڭ. 3 مىنۇتلۇق دېمو: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. ھۆججەتلەر: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "سوئال، ھەمكارلىق ياكى تۆھپە ئۈچۈن يېزىڭ. ئوچۇق كود روھىدا كەمتۈك مەلۇماتلىرى ۋە pull request لار قارشى ئېلىنىدۇ.",
    footerDesc:
      "nginx كىرىش خاتىرىسى → WAF/CRS → يادرو چەكلىشى. بىرلا زەنجىر، self-hosted، MIT ئىجازەتنامىلىك. تۈركىيەدە ياسالغان.",
    footerSoak: "72 سائەت soak PASS · 0 مەغلۇبىيەت",
    proofBody:
      "سلايت ئەمەس، قايتا ياسىغىلى بولىدىغان ئىسپات. OWASP CRS تەڭپۇڭلۇقى، يالغان مۇسبەت دەرۋازىلىرى، چەكلەش كېچىكىشى benchmark لىرى، كورپۇس recall ۋە 72 سائەتلىك soak — ھەممىسى ئۆلچەنگەن، ئاپتوماتلاشتۇرۇلغان ۋە ئوچۇق سىناق ماترىتسىسىدا كۆرۈنىدۇ.",
  },
  sah: {
    pipelineNote:
      "XDR, Wasm маркета уонна LLM Copilot — уһун болдьохтоох талыллар слойдар; Core бэйэтэ продакшеҥҥа бэлэм.",
    selectedBodies: [
      "Биир сиэп: nginx лога → OWASP CRS → ~17 мс kernel бан. ~15 мүнүөтэ продакшеҥҥа.",
      "Флот, SOC кэм линията, панеллэр — олохтообутуҥ кэнниттэн бэйэҥ серверыҥ талыллар слоя.",
      "75 автомат тест, тэҥнээһин PDF, 72 чаас soak — dashboard /tests кытта биир матрица.",
      "Tenant бэлиэлээх Prometheus метриктэрэ, панеллэр уонна сэрэтии быраабылалара — self-hosted кэтээһин.",
      "Элбэх түмүктээх флот: агент синхронизацията, etcd mesh политиката уонна ыҥаарыллыбыт команда ыытыы — биир панельтэн.",
      "TAXII/STIX кутталлаах лента + Telegram SOC: сэрэтии, бан уонна биир баттаан 'ack' — тыыннаах оператор сүрүгэ.",
      "XDP фильтр + execve/lineage uprobe-лар — ядро таһымыгар пакет быраҕыы уонна syscall кэтээһин. Ноутбуктарга --no-xdp кытта ipset тиийэр.",
      "Тарҕаммыт сканердары булуу: биир JA3 бэлиэ + атын IP кластер, 100% recall — 80 IP тыыннаах тест.",
      "Саба түһүү мас, төрдүн зонда, syscall uprobe — уһун болдьохтоох талыллар слой; саба түһүү сиэбин уонна кистэлэҥ каналлары булуу.",
      "Wasm runtime нөҥүө анаан быраабыла плагиннара — маркет модель, Core-у тыыппакка кэҥэтии.",
      "JSON event_type сүрүгэ — Splunk/Elastic/Vector диэки SIEM экспорт туоһута (siem-export-report.json).",
      "Tarpit сервер + куорҕал кэтээччи — саба түһээччини хааҥнатыы уонна honeypot сигнала; албыннааһын слоя.",
    ],
    advLead:
      "Fail2ban эрэ бан оҥорор, ModSecurity WAF туспа модуль, CrowdSec аҥаардас стеги ирдиир. Log Guardian бу үс үлэни биир сиэпкэ холбуур — кээмэйдэммит туоһунан.",
    advantages: [
      { k: "Биир олохтооһун, биир сиэп", v: "Fail2ban + ModSecurity + CrowdSec-ы туспа олохтоон холбообоккун. nginx лога → WAF/CRS → kernel бан биир бородууксуйаҕа, ~15 мүн олохтооһун." },
      { k: "~17 мс kernel бан", v: "Лог строкатыттан ipset/XDP баҥҥа медиана ~17 мс. Fail2ban/CrowdSec сөкүүндэ–мүнүөтэ таһымыгар хаалаллар; 5 кээмэйдэммит холобурунан дакаастаммыт." },
      { k: "100% recall + 100% CRS паритета", v: "121 OWASP CRS быраабылата, 1500 строкалаах корпуска чахчы саба түһүү recall 100% уонна ModSec кытта толору паритет — 0.2% сымыйа позитивга." },
      { k: "Тарҕаммыт саба түһүүнү хабыы", v: "JA3 кластеры булуу + IP аайы бан — 80 IP тыыннаах тескэ 100%. Fail2ban биир IP-лаах; CrowdSec туспа сигнал ситимин ирдиир." },
      { k: "Ыраас, хат оҥоһуллар туоһу", v: "75 автомат тест + 14 файллаах туоһу пакета + 72 чаас soak (864 холобур, 0 алҕас). Күрэхтэһээччилэргэ автомат туоһу суох эбэтэр аҥаардас." },
      { k: "Self-hosted · MIT · Турцияҕа оҥоһуллубут", v: "Дааннайдарыҥ эйиэхэ хаалаллар, вендорга сыһыаны суох, толору аһаҕас код. SOC кэм линията, Prometheus метриктэрэ уонна Telegram салайыыта биир панельга (:8443)." },
    ],
    vsNote:
      "Кырдьык кыраныыс: сорох эйгэлэргэ күрэхтэһээччилэр биллэрдик ордуктар (кыһыл клеткалар). ModSec + CRS inline ааһарыгар (~14 300 EPS, кээмэйдэммит) уонна маҥнайгы көрдөһүүнү тута хаайарыгар инники; CrowdSec тарҕаммыт общество сигнал ситимигэр уонна салайыллар SaaS консолугар күүстээх. Биһиги күүспүт — биир сиэп интеграцията + ~17 мс бан түргэнэ + ыраас, хат оҥоһуллар туоһу.",
    vsLegend: "Кыһыл = ол строкаҕа кыайааччы",
    honestItems: [
      "Реактивнай архитектура — лог строката түһүөр диэри маҥнайгы көрдөһүү ааһыан сөп; биһиги ModSec inline түргэнигэр буолбатахпыт.",
      "L3/L4 DDoS-у ыҥырбаппыт — CDN кэннигэр турабыт.",
      "Тарҕаммыт ботнет — IP аайы бан; CrowdSec сигнал ситимэ суох.",
      "Оҥорор: лог → CRS/WAF → ~17 мс kernel бан, туоһу PDF, Telegram салайыы, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset бан (~15 мүн)",
      "eBPF демон, панель, метриктэр, флот",
      "XDR, Wasm маркета, LLM Copilot",
    ],
    layersNote:
      "XDR, Wasm маркета уонна LLM Copilot — уһун болдьохтоох талыллар слойдар; Core бэйэтэ продакшеҥҥа бэлэм.",
    setupIntro:
      "Төрүт: GitHub — Linux-Log-Guardian. Икки суол: бэлэм .deb пакета (сүбэлэнэр) эбэтэр төрүттэн туттарыы. Ноутбук/ВМ-га eBPF/XDP-та суох да үлэлиир (ipset олохтоох бан). Аллараа хардыылар продакшен сервер туһугар; хас команда күүтүллэр таһаарыыта киллэриллибит.",
    setupTip:
      "Сүбэ: JWT уонна панель пароля туһугар bash scripts/laptop_jwt_setup.sh туттун. 3 мүнүөтэ демо: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Докумуоннар: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
    contactBody:
      "Ыйытыылар, бииргэ үлэ эбэтэр кыттыы туһугар суруй. Аһаҕас код тыынынан алҕас туһунан иһитиннэрии уонна pull request-тэр көрсүһүннэ.",
    footerDesc:
      "nginx киирии лога → WAF/CRS → kernel бан. Биир сиэп, self-hosted, MIT лицензиялаах. Турцияҕа оҥоһуллубут.",
    footerSoak: "72 чаас soak PASS · 0 алҕас",
    proofBody:
      "Слайд буолбатах, хат оҥоһуллар туоһу. OWASP CRS паритета, сымыйа позитив ааннара, бан хойутааһын бенчмарктара, корпус recall уонна 72 чаастаах soak — бары кээмэйдэммит, автоматтаммыт уонна аһаҕас тест матрицатыгар көстөр.",
  },
};

// Product display name transliterated for non-Latin scripts (user request).
const NAMES: Partial<Record<Locale, string>> = {
  ru: "Линукс Лог Гардиан",
  kk: "Линукс Лог Гардиан",
  ky: "Линукс Лог Гардиан",
  tt: "Линукс Лог Гардиан",
  ba: "Линукс Лог Гардиан",
  cv: "Линукс Лог Гардиан",
  sah: "Линукс Лог Гардиан",
  ja: "リナックス・ログ・ガーディアン",
  ko: "리눅스 로그 가디언",
  ar: "لينكس لوغ غارديان",
  ug: "لىنۇكس لوگ گارديان",
};

export function brandName(locale: Locale): string {
  return NAMES[locale] ?? "Linux Log Guardian";
}

function applySection(base: PageCopy, o: SectionOverride): PageCopy {
  return {
    ...base,
    pipeline: { ...base.pipeline, title: o.pipelineTitle ?? base.pipeline.title, sub: o.pipelineSub ?? base.pipeline.sub },
    selected: { ...base.selected, title: o.selectedTitle ?? base.selected.title, lead: o.selectedLead ?? base.selected.lead },
    vs: { ...base.vs, title: o.vsTitle ?? base.vs.title, sub: o.vsSub ?? base.vs.sub, advTitle: o.vsAdvTitle ?? base.vs.advTitle },
    charts: { ...base.charts, title: o.chartsTitle ?? base.charts.title, sub: o.chartsSub ?? base.charts.sub },
    proof: {
      ...base.proof,
      testsSuffix: o.proofTests ?? base.proof.testsSuffix,
      passedSuffix: o.proofPassed ?? base.proof.passedSuffix,
      ctaAll: o.proofCtaAll ?? base.proof.ctaAll,
      ctaPdf: o.proofCtaPdf ?? base.proof.ctaPdf,
    },
    honest: { ...base.honest, title: o.honestTitle ?? base.honest.title, layersTitle: o.layersTitle ?? base.honest.layersTitle },
    setup: { ...base.setup, title: o.setupTitle ?? base.setup.title, sub: o.setupSub ?? base.setup.sub, requirementsTitle: o.reqTitle ?? base.setup.requirementsTitle },
    evidence: { ...base.evidence, title: o.evidenceTitle ?? base.evidence.title },
    contact: { ...base.contact, title: o.contactTitle ?? base.contact.title, ctaEmail: o.ctaEmail ?? base.contact.ctaEmail, ctaGithub: o.ctaGithub ?? base.contact.ctaGithub },
    footer: {
      ...base.footer,
      columns: base.footer.columns.map((c, i) => ({
        ...c,
        title: [o.colProduct, o.colDev, o.colProject][i] ?? c.title,
      })),
      copySuffix: o.copySuffix ?? base.footer.copySuffix,
    },
  };
}

function applyBody(base: PageCopy, b: BodyOverride): PageCopy {
  return {
    ...base,
    pipeline: { ...base.pipeline, note: b.pipelineNote ?? base.pipeline.note },
    selected: {
      ...base.selected,
      cards: base.selected.cards.map((c, i) => ({
        ...c,
        body: b.selectedBodies?.[i] ?? c.body,
      })),
    },
    vs: {
      ...base.vs,
      advLead: b.advLead ?? base.vs.advLead,
      advantages: b.advantages ?? base.vs.advantages,
      note: b.vsNote ?? base.vs.note,
      legend: b.vsLegend ?? base.vs.legend,
    },
    honest: {
      ...base.honest,
      items: b.honestItems ?? base.honest.items,
      layers: base.honest.layers.map((l, i) => ({
        ...l,
        body: b.layersBodies?.[i] ?? l.body,
      })),
      layersNote: b.layersNote ?? base.honest.layersNote,
    },
    setup: {
      ...base.setup,
      intro: b.setupIntro ?? base.setup.intro,
      tip: b.setupTip ?? base.setup.tip,
    },
    contact: { ...base.contact, body: b.contactBody ?? base.contact.body },
    footer: {
      ...base.footer,
      desc: b.footerDesc ?? base.footer.desc,
      soak: b.footerSoak ?? base.footer.soak,
    },
    proof: { ...base.proof, body: b.proofBody ?? base.proof.body },
  };
}

export function getCopy(locale: Locale): PageCopy {
  if (locale === "tr") return CO_TR;
  if (locale === "en") return CO_EN;
  const o = SECTION_OVERRIDES[locale];
  let copy = o ? applySection(CO_EN, o) : CO_EN;
  const b = BODY_OVERRIDES[locale];
  if (b) copy = applyBody(copy, b);
  return copy;
}
