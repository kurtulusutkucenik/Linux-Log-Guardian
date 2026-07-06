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
import { SHARE_TESTS_TG } from "@/lib/shareUrls";
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
    ctaFullPack: string;
    fullPackCmd: string;
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
    fullPackCmd: string;
    demoCmd: string;
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
    researcherBanner: string;
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
    ctaFullPack: "Tam kanıt paketi",
    fullPackCmd: "STABILITY=1 bash scripts/full_proof_pack.sh",
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
    layersTitle: "Sürümler",
    layers: LAYERS,
    layersNote:
      "Pro ve Pro Plus koruma seviyesini değiştirmez; yalnızca görünürlük ve entegrasyon kanıtı ekler. XDR, Wasm ve LLM Copilot Pro Plus'ın uzun vadeli opsiyonel roadmap'idir — Core tek başına üretimde kullanılabilir.",
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
    fullPackCmd: EVIDENCE.fullPackCmd,
    demoCmd: EVIDENCE.demoCmd,
    files: EVIDENCE.files,
    update: "Güncelle: STABILITY=1 bash scripts/full_proof_pack.sh",
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
          { label: "Telegram paylaşım", href: SHARE_TESTS_TG },
          { label: "security.txt", href: "/.well-known/security.txt" },
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
    researcherBanner:
      "Güvenlik araştırmacısı notu: Bu site e-ticaret veya WooCommerce değil. /products.json, /wp-json/, /api/item yok — 79 otomatik doğrulama testi burada.",
  },
};

/* -------------------------------- ENGLISH -------------------------------- */

const SELECTED_BODIES_EN = [
  "Single chain: nginx log → OWASP CRS → ~20 ms kernel ban. Production in ~15 minutes.",
  "Fleet, SOC timeline, dashboards — an optional layer on your own server after install.",
  "79 automated tests, competitive PDF, 72h soak — the same matrix as dashboard /tests.",
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
  ["WAF/CRS throughput (same corpus)", "280,373 EPS (16.93×)", "—", "—", "16,560 EPS"],
  ["OWASP CRS parity", "100% (121 rules)", "—", "—", "Reference (100%)"],
  ["Real attack recall", "100% (23 cat, 1K+10K)", "—", "—", "100%"],
  ["Distributed / JA3 cluster ban", "100% (80 IP)", "—", "Signal-based", "—"],
  ["nginx inline consult", "PASS", "—", "—", "Separate module"],
  ["L7 application protection", "WAF + consult + eBPF", "—", "—", "CRS inline"],
  ["Kernel / eBPF (XDP) ban", "ipset + XDP", "iptables", "iptables/nft", "—"],
  ["False positive", "0.2% (measured)", "High", "Medium", "CRS-dependent"],
  ["Ban latency", "~20 ms", "sec–min", "sec", "Separate integration"],
  ["Short stability (5 min)", "PASS (0 fail)", "—", "—", "—"],
  ["72h soak", "PASS (864/0)", "—", "—", "—"],
  ["Evidence pack PDF+JSON", "Automatic (14 files)", "None", "Partial", "Module by module"],
  ["Automated test matrix", "79 tests", "—", "Partial", "—"],
  ["SOC timeline / dashboard", "Yes (:8443)", "—", "Console", "—"],
  ["Telegram ops + ack", "Yes (one-click)", "—", "Partial", "—"],
  ["Setup time", "~15 min", "minutes", "minutes", "hours (tuning)"],
];

const VS_ROWS_EN_1: string[][] = [
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
    "79 automated tests",
    "72h soak PASS",
    "~20 ms kernel ban",
    "false positive 0.2%",
    "real attack recall 100%",
    "OWASP CRS parity 100%",
    "MIT · Turkey",
    "self-hosted · no vendor lock-in",
  ],
  pipeline: {
    eyebrow: "//:Pipeline",
    title: "Single chain: from log to kernel ban",
    sub: "~20 ms from an nginx access log line to ipset ban — rivals have piecemeal architecture.",
    note: "XDR, Wasm marketplace and LLM Copilot are long-term optional layers — Core is production-ready on its own.",
    steps: [
      { n: "1", label: "nginx access log", hint: "writable access log, log_guardian format" },
      { n: "2", label: "Parser + normalize", hint: "URI, method, XFF, body — one schema" },
      { n: "3", label: "CRS / WAF engine", hint: "OWASP CRS, PCRE2 JIT, schema/BOLA" },
      { n: "4", label: "Ban pipeline", hint: "policy + tenant + FP trust decision" },
      { n: "5", label: "ipset / XDP kernel", hint: "~20 ms kernel ban" },
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
      { k: "~20 ms kernel ban", v: "Median ~20 ms from log line to ipset/XDP ban. Fail2ban/CrowdSec stay in seconds–minutes; proven with 21 measured samples." },
      { k: "280,373 EPS · 16.93× ModSec", v: "On the same corpus with the same 121 OWASP CRS patterns (PCRE2 JIT), WAF/CRS throughput is 280,373 EPS — 16.93× faster than ModSec's 16,560 EPS. Measured and reproducible (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS parity", v: "121 OWASP CRS rules, 100% real-attack recall on a 1500-line corpus and full parity with ModSec — at 0.2% false positive." },
      { k: "Distributed attack coverage", v: "JA3 cluster detection + per-IP ban — 100% on an 80-IP live test. Fail2ban is single-IP; CrowdSec needs a separate signal network." },
      { k: "Transparent, reproducible proof", v: "79 automated tests + a 14-file PDF/JSON evidence pack + 72h soak (864 samples, 0 errors). Rivals have no automatic proof or it's fragmented." },
      { k: "Self-hosted · MIT · made in Turkey", v: "Your data stays with you, no vendor lock-in, fully open source. SOC timeline, Prometheus metrics and Telegram ops in one panel (:8443)." },
    ],
    cols: ["Metric", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    groups: [
      { label: "Strengths (measured)", honest: false, winners: VS.groups[0].winners, rows: VS_ROWS_EN_0 },
      { label: "Honest limits", honest: true, winners: VS.groups[1].winners, rows: VS_ROWS_EN_1 },
    ],
    note:
      "Honest limit: in some areas rivals are clearly better (red cells). ModSec + CRS blocks the first request inline instantly (we're reactive — the first request may pass until the log line drops); CrowdSec is strong in its distributed community signal network and managed SaaS console. In return, on the same corpus with the same 121 CRS patterns our WAF/CRS throughput is 280,373 EPS — 16.93× ModSec's 16,560 EPS (bench-vs-modsec.json).",
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
      hint: "Higher = better · 0–100 normalized · Throughput: bench-vs-modsec.json EPS ratio (280k vs 16.5k) — LG not scored 100",
      categories: ["Single chain", "Recall", "Low FP", "Ban speed", "Proof", "Throughput", "Distributed", "Docs", "Setup"],
    },
    latency: {
      ...CHARTS.latency,
      title: "Ban latency — measurement samples",
      hint: "Lower = better · 21 samples (bench-ban-latency.json) · target 75 ms",
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
      title: "WAF/CRS throughput (EPS) — same corpus",
      hint: "Higher = better · bench-vs-modsec.json · same 121 CRS patterns, PCRE2 JIT · 16.93× ModSec",
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
    ctaFullPack: "Full proof pack",
    fullPackCmd: "STABILITY=1 bash scripts/full_proof_pack.sh",
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
      "Reactive architecture — the first request may pass until the log line drops; ModSec blocks the first request inline while we're reactive.",
      "We don't replace Cloudflare or commercial WAF — last defense at origin behind CDN.",
      "We don't absorb L3/L4 DDoS — CDN + nginx rate limit first, then Log Guardian.",
      "CrowdSec is complementary, not a rival — Guardian + CrowdSec LAPI signal → ban API.",
      "Distributed botnet — per-IP ban; optional CrowdSec community signal layer.",
      "Does: log → CRS/WAF → ~20 ms kernel ban, proof PDF, Telegram ops, MIT self-hosted.",
    ],
    layersEyebrow: "//:Layers",
    layersTitle: "Editions",
    layers: [
      { tag: "Core", body: "log → WAF → ipset ban (~15 min)" },
      { tag: "Pro", body: "eBPF daemon, dashboard, metrics, fleet" },
      { tag: "Pro Plus", body: "K8s/Helm proof (kind), fleet showcase, optional Wasm/mesh (XDR/Copilot roadmap)" },
    ],
    layersNote:
      "Pro and Pro Plus do not change the protection level; they only add visibility and integration proof. XDR, Wasm and LLM Copilot are Pro Plus's long-term optional roadmap — Core is production-ready on its own.",
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
    note: "One command: STABILITY=1 bash scripts/full_proof_pack.sh → PDF + release-pack.zip + data-room.zip",
    fullPackCmd: EVIDENCE.fullPackCmd,
    demoCmd: EVIDENCE.demoCmd,
    files: EVIDENCE.files,
    update: "Update: STABILITY=1 bash scripts/full_proof_pack.sh",
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
          { label: "Telegram share", href: SHARE_TESTS_TG },
          { label: "security.txt", href: "/.well-known/security.txt" },
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
    researcherBanner:
      "Security researcher note: This is not a shop or WooCommerce site. No /products.json, /wp-json/, or /api/item — the 79-gate verification matrix lives here.",
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
    pipelineSub: "~20 ms von der nginx-Access-Log-Zeile bis zum ipset-Ban — Konkurrenten haben eine stückweise Architektur.",
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
    pipelineSub: "~20 ms de la ligne de log d'accès nginx au ban ipset — les rivaux ont une architecture fragmentée.",
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
    pipelineSub: "~20 ms desde la línea de log de acceso de nginx hasta el ban de ipset — los rivales tienen arquitectura fragmentada.",
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
    pipelineSub: "~20 мс от строки access-лога nginx до бана ipset — у конкурентов фрагментарная архитектура.",
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
    pipelineSub: "~20 ms da linha de log de acesso do nginx ao ban de ipset — os rivais têm arquitetura fragmentada.",
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
    pipelineSub: "~20 ms van de nginx-accesslogregel tot de ipset-ban — concurrenten hebben een versnipperde architectuur.",
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
    pipelineSub: "从 nginx 访问日志行到 ipset 封禁约 20 毫秒——竞品架构零散。",
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
    pipelineSub: "nginx アクセスログの行から ipset BAN まで約20ms——競合は断片的なアーキテクチャ。",
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
    pipelineSub: "nginx 액세스 로그 줄에서 ipset 밴까지 약 20ms — 경쟁사는 조각난 아키텍처.",
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
    pipelineSub: "nginx giriş log sətirindən ipset bana ~20 ms — rəqiblərdə parçalı memarlıq.",
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
    pipelineSub: "nginx кіру журналы жолынан ipset банға ~20 мс — бәсекелестерде бөлшек архитектура.",
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
    pipelineSub: "nginx kirish logi qatoridan ipset banga ~20 ms — raqiblarda bo'lak arxitektura.",
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
    pipelineSub: "nginx кирүү логу сабынан ipset банга ~20 мс — атаандаштарда бөлүк архитектура.",
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
    pipelineSub: "nginx giriş logy setirinden ipset bana ~20 ms — bäsdeşlerde bölek arhitektura.",
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
    pipelineSub: "nginx kirim logu satırından ipset banğa ~20 ms — raqiplerde parça mimarlıq.",
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
    pipelineSub: "nginx giriş logu satırından ipset bana ~20 ms — rakiplärdä parça mimarlık.",
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
    pipelineSub: "nginx керү журналы юлыннан ipset банга ~20 мс — көндәшләрдә өлешле архитектура.",
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
    pipelineSub: "nginx инеү журналы юлынан ipset банға ~20 мс — көндәштәрҙә өлөшлө архитектура.",
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
    pipelineSub: "nginx кӗрӳ журналӗ йӗркинчен ipset бана ~20 мс — конкурентсенче пайланнӑ архитектура.",
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
    pipelineSub: "nginx كىرىش خاتىرىسى قۇرىدىن ipset چەكلەشكىچە ~20 مىللىسېكۇنت — رەقىبلەردە پارچە قۇرۇلما.",
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
    pipelineSub: "nginx киирии сурунаал строкатыттан ipset бан диэки ~20 мс — күрэхтэһээччилэргэ аҥаардас архитектура.",
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

type SetupStepText = { t: string; d: string };
type SetupL10n = {
  pathTitles: [string, string];
  pathBadges: [string, string];
  pathNotes: [string, string];
  pathSteps: [SetupStepText[], SetupStepText[]]; // A: 3 steps, B: 2 steps
  commonTitle: string;
  commonSteps: SetupStepText[]; // 4
  dashboardTitle: string;
  dashboardBadge: string;
  dashboardNote: string;
  dashboardSteps: SetupStepText[]; // 2
};

type BodyOverride = {
  pipelineNote?: string;
  selectedBodies?: string[]; // 12
  advLead?: string;
  advantages?: { k: string; v: string }[]; // 7
  vsNote?: string;
  vsLegend?: string;
  vsCols?: string[]; // 5 (product names stay, first cell translates)
  vsGroupLabels?: [string, string];
  vsRows0?: string[][]; // 17 rows
  vsRows1?: string[][]; // 6 rows
  requirements?: string[]; // 5
  setup?: SetupL10n;
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
      "Eine Kette: nginx-Log → OWASP CRS → ~20 ms Kernel-Ban. Produktion in ~15 Minuten.",
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
      { k: "~20 ms Kernel-Ban", v: "Median ~20 ms von der Logzeile bis zum ipset/XDP-Ban. Fail2ban/CrowdSec bleiben im Sekunden-Minuten-Bereich; belegt mit 21 gemessenen Proben." },
      { k: "280.373 EPS · 16,93× ModSec", v: "Auf demselben Korpus mit denselben 121 OWASP-CRS-Patterns (PCRE2 JIT) liegt der WAF/CRS-Durchsatz bei 280.373 EPS — 16,93× schneller als ModSecs 16.560 EPS. Gemessen und reproduzierbar (bench-vs-modsec.json)." },
      { k: "100% Recall + 100% CRS-Parität", v: "121 OWASP-CRS-Regeln, 100% Recall echter Angriffe auf einem 1500-Zeilen-Korpus und volle Parität mit ModSec — bei 0,2% False Positives." },
      { k: "Abdeckung verteilter Angriffe", v: "JA3-Cluster-Erkennung + Ban pro IP — 100% in einem Live-Test mit 80 IPs. Fail2ban ist Einzel-IP; CrowdSec braucht ein separates Signalnetz." },
      { k: "Transparenter, reproduzierbarer Nachweis", v: "75 automatische Tests + ein 14-Dateien-Nachweispaket + 72h-Soak (864 Proben, 0 Fehler). Rivalen haben keinen automatischen Nachweis oder er ist fragmentiert." },
      { k: "Self-hosted · MIT · aus der Türkei", v: "Ihre Daten bleiben bei Ihnen, kein Vendor-Lock-in, voll Open Source. SOC-Timeline, Prometheus-Metriken und Telegram-Betrieb in einem Panel (:8443)." },
    ],
    vsNote:
      "Ehrliche Grenze: In manchen Bereichen sind Rivalen klar besser (rote Zellen). ModSec + CRS führt beim sofortigen Blockieren der ersten Anfrage; CrowdSec ist stark bei seinem verteilten Community-Signalnetz und der Managed-SaaS-Konsole. Im Gegenzug liegt unser WAF/CRS-Durchsatz auf demselben Korpus mit denselben 121 CRS-Patterns bei 280.373 EPS — 16,93× ModSecs 16.560 EPS (bench-vs-modsec.json).",
    vsLegend: "Rot = der Sieger in dieser Zeile",
    honestItems: [
      "Reaktive Architektur — die erste Anfrage kann durchgehen, bis die Logzeile fällt; wir erreichen nicht die Inline-Geschwindigkeit von ModSec.",
      "Wir absorbieren kein L3/L4-DDoS — wir sitzen hinter einem CDN.",
      "Verteiltes Botnetz — Ban pro IP; kein CrowdSec-Signalnetz.",
      "Leistet: Log → CRS/WAF → ~20 ms Kernel-Ban, Nachweis-PDF, Telegram-Betrieb, MIT self-hosted.",
    ],
    layersBodies: [
      "Log → WAF → ipset-Ban (~15 Min)",
      "eBPF-Daemon, Dashboard, Metriken, Flotte",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Metrik", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Stärken (gemessen)", "Ehrliche Grenzen"],
    vsRows0: [
      ["Log → WAF → Kernel-Ban", "Eine Kette", "Nur Ban", "Stückweise", "WAF separat"],
      ["WAF/CRS-Durchsatz (gleicher Korpus)", "280.373 EPS (16,93×)", "—", "—", "16.560 EPS"],
      ["OWASP-CRS-Parität", "100% (121 Regeln)", "—", "—", "Referenz (100%)"],
      ["Recall echter Angriffe", "100% (1K+10K)", "—", "—", "100%"],
      ["Verteilter / JA3-Cluster-Ban", "100% (80 IP)", "—", "Signalbasiert", "—"],
      ["nginx-Inline-Consult", "PASS", "—", "—", "Separates Modul"],
      ["L7-Anwendungsschutz", "WAF + Consult + eBPF", "—", "—", "CRS inline"],
      ["Kernel / eBPF (XDP) Ban", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["False Positive", "0,2% (gemessen)", "Hoch", "Mittel", "CRS-abhängig"],
      ["Ban-Latenz", "~20 ms", "Sek–Min", "Sek", "Separate Integration"],
      ["Kurze Stabilität (5 Min)", "PASS (0 Fehler)", "—", "—", "—"],
      ["72h-Soak", "PASS (864/0)", "—", "—", "—"],
      ["Nachweispaket PDF+JSON", "Automatisch (14 Dateien)", "Keines", "Teilweise", "Modul für Modul"],
      ["Automatische Testmatrix", "75 Tests", "—", "Teilweise", "—"],
      ["SOC-Timeline / Dashboard", "Ja (:8443)", "—", "Konsole", "—"],
      ["Telegram-Betrieb + Ack", "Ja (Ein-Klick)", "—", "Teilweise", "—"],
      ["Einrichtungszeit", "~15 Min", "Minuten", "Minuten", "Stunden (Tuning)"],
    ],
    vsRows1: [
      ["Erste Anfrage sofort blocken", "Reaktiv (Logzeile)", "Reaktiv", "Teilweise", "Inline (sofort)"],
      ["Volumetrisches L3/L4-Scrubbing", "Keines — CDN empfohlen", "Keines", "Keines", "Keines"],
      ["Community-Signalnetz", "Self-hosted", "—", "Ja (global)", "—"],
      ["Edge / Cloud-WAF", "Origin-Schicht", "—", "Bouncer", "Proxy-Modus"],
      ["Managed Cloud / SaaS", "Keines (self-hosted)", "Keines", "Ja (Konsole)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 oder Debian 12 (amd64)",
      "nginx + beschreibbares Access-Log (log_guardian-Format)",
      "Root oder sudo (systemd, ipset, /etc/log-guardian)",
      "~200 MB Disk, 128 MB RAM (Core); Docker für Pro",
      "Optional Pro: Kernel 5.10+ für eBPF/XDP, Docker (Dashboard/Metriken)",
    ],
    setup: {
      pathTitles: ["Frischer Server — .deb-Paket", "Quellcode — bauen und installieren"],
      pathBadges: ["empfohlen", "Entwickler"],
      pathNotes: [
        "Kein Bauen nötig. Das Paket liefert die Binary, systemd-Units, Regeln und Skripte. Upgrade-sicher: eine vorhandene /etc/log-guardian/rules.conf bleibt erhalten. Von GitHub Releases (log-guardian_*_amd64.deb) oder mit bash scripts/build_deb.sh → dist/.",
        "Klonen Sie das GitHub-Repo und bauen Sie. Ideal für Entwicklung, Anpassung und vollständige Quellcode-Prüfung. install.sh richtet systemd-Units, Regeln und das nginx-Log-Format ein.",
      ],
      pathSteps: [
        [
          { t: "Abhängigkeiten", d: "Fügen Sie bei der Erstinstallation die Debian-Paketabhängigkeiten hinzu. Fehlt nginx, kann es im selben Befehl ergänzt werden." },
          { t: "Paket installieren", d: "Meldet dpkg -i einen Abhängigkeitsfehler, führen Sie apt-get install -f aus. Der postinst-Schritt legt den log-guardian-Benutzer, Rechte, systemd-Units und eine Standard-rules.conf automatisch an." },
          { t: "Erster Start und API-Sicherheit", d: "Bereitet nginx-Log-Format, FP-Trust und API-Sicherheit (Token, fail-closed) in einem Rutsch vor. Die Skripte liegen im Paket (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Quelle und Bauen", d: "Klonen Sie das Repo, bauen Sie mit allen Kernen und führen Sie das Haupt-Installationsskript aus." },
          { t: "Erster Start und Token-Sync", d: "Startet die Dienste und bereitet den API-Token-Sync und die Dashboard-Verbindung vor." },
        ],
      ],
      commonTitle: "Gemeinsame Schritte (nach A oder B)",
      commonSteps: [
        { t: "Nginx-Log-Format", d: "Das log_guardian-Log-Format ist nötig, damit die WAF den Request-Body und X-Forwarded-For lesen kann. Setup wendet es meist automatisch an; im STRICT-Modus prüfen." },
        { t: "Gesundheits- und Statusprüfung", d: "Prüfen Sie Daemon-IPC, Dienststatus und BPF-Features. Grünes Gate: Am Ende von post_install_verify sollte FAIL: 0 stehen." },
        { t: "Metriken und erster Ban-Test", d: "Prüfen Sie Prometheus-Metriken; beobachten Sie, wie die Zähler nach Traffic steigen. Sie können eine Angriffszeile einspeisen und den Ban in ipset verifizieren." },
        { t: "VirtualBox / ohne XDP (Laptop & VM)", d: "In Umgebungen ohne eBPF/XDP genügt --no-xdp mit einem ipset-basierten Ban. Scheitert eine Dienstabhängigkeit, ist das Reparaturskript ein einziger Befehl." },
      ],
      dashboardTitle: "Pro-Dashboard — nach der Installation (optional)",
      dashboardBadge: "Pro · optional",
      dashboardNote: "Das Dashboard läuft nicht auf dieser Landing-Seite, sondern auf Ihrem eigenen Rechner. Der Prod-Stack wird via Caddy + Docker unter https://localhost:8443 bereitgestellt.",
      dashboardSteps: [
        { t: "Prod-Stack starten", d: "Baut und startet das Dashboard auf Ihrem eigenen Server. Login: admin / DASHBOARD_ADMIN_PASSWORD aus .env." },
        { t: "SSH-Tunnel für einen entfernten VPS", d: "Um das Dashboard sicher zu sehen, ohne es dem Internet auszusetzen, richten Sie einen SSH-Tunnel ein; härten Sie zuerst den Server." },
      ],
    },
  },
  fr: {
    pipelineNote:
      "XDR, la marketplace Wasm et le Copilot LLM sont des couches optionnelles à long terme — Core est prêt pour la production à lui seul.",
    selectedBodies: [
      "Une seule chaîne : log nginx → OWASP CRS → ban noyau ~20 ms. En production en ~15 minutes.",
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
      { k: "Ban noyau ~20 ms", v: "Médiane ~20 ms de la ligne de log au ban ipset/XDP. Fail2ban/CrowdSec restent à l'échelle secondes–minutes ; prouvé avec 21 échantillons mesurés." },
      { k: "280 373 EPS · 16,93× ModSec", v: "Sur le même corpus avec les mêmes 121 patterns OWASP CRS (PCRE2 JIT), le débit WAF/CRS atteint 280 373 EPS — 16,93× plus rapide que les 16 560 EPS de ModSec. Mesuré et reproductible (bench-vs-modsec.json)." },
      { k: "100% de rappel + 100% de parité CRS", v: "121 règles OWASP CRS, 100% de rappel d'attaques réelles sur un corpus de 1500 lignes et parité complète avec ModSec — à 0,2% de faux positifs." },
      { k: "Couverture des attaques distribuées", v: "Détection de cluster JA3 + ban par IP — 100% sur un test en direct de 80 IP. Fail2ban est mono-IP ; CrowdSec exige un réseau de signaux séparé." },
      { k: "Preuve transparente et reproductible", v: "75 tests automatiques + un pack de preuves de 14 fichiers + soak 72h (864 échantillons, 0 erreur). Les rivaux n'ont pas de preuve automatique ou elle est fragmentée." },
      { k: "Auto-hébergé · MIT · conçu en Turquie", v: "Vos données restent chez vous, aucun verrouillage fournisseur, entièrement open source. Timeline SOC, métriques Prometheus et exploitation Telegram dans un seul panneau (:8443)." },
    ],
    vsNote:
      "Limite honnête : dans certains domaines, les rivaux sont clairement meilleurs (cellules rouges). ModSec + CRS mène en blocage instantané de la première requête ; CrowdSec est fort sur son réseau de signaux communautaire distribué et sa console SaaS managée. En contrepartie, sur le même corpus avec les mêmes 121 patterns CRS, notre débit WAF/CRS atteint 280 373 EPS — 16,93× les 16 560 EPS de ModSec (bench-vs-modsec.json).",
    vsLegend: "Rouge = le gagnant de cette ligne",
    honestItems: [
      "Architecture réactive — la première requête peut passer jusqu'à la chute de la ligne de log ; nous n'atteignons pas la vitesse inline de ModSec.",
      "Nous n'absorbons pas les DDoS L3/L4 — nous sommes derrière un CDN.",
      "Botnet distribué — ban par IP ; pas de réseau de signaux CrowdSec.",
      "Fait : log → CRS/WAF → ban noyau ~20 ms, PDF de preuve, exploitation Telegram, MIT auto-hébergé.",
    ],
    layersBodies: [
      "log → WAF → ban ipset (~15 min)",
      "démon eBPF, tableau de bord, métriques, flotte",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Métrique", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Points forts (mesurés)", "Limites honnêtes"],
    vsRows0: [
      ["Log → WAF → ban noyau", "Chaîne unique", "Ban seul", "Fragmenté", "WAF séparé"],
      ["Débit WAF/CRS (même corpus)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["Parité OWASP CRS", "100% (121 règles)", "—", "—", "Référence (100%)"],
      ["Rappel d'attaques réelles", "100% (1K+10K)", "—", "—", "100%"],
      ["Ban distribué / cluster JA3", "100% (80 IP)", "—", "Basé signal", "—"],
      ["Consult inline nginx", "PASS", "—", "—", "Module séparé"],
      ["Protection applicative L7", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Ban noyau / eBPF (XDP)", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Faux positif", "0,2% (mesuré)", "Élevé", "Moyen", "Selon CRS"],
      ["Latence de ban", "~20 ms", "sec–min", "sec", "Intégration séparée"],
      ["Stabilité courte (5 min)", "PASS (0 échec)", "—", "—", "—"],
      ["Soak 72h", "PASS (864/0)", "—", "—", "—"],
      ["Pack de preuves PDF+JSON", "Automatique (14 fichiers)", "Aucun", "Partiel", "Module par module"],
      ["Matrice de tests auto", "75 tests", "—", "Partiel", "—"],
      ["Timeline SOC / tableau de bord", "Oui (:8443)", "—", "Console", "—"],
      ["Ops Telegram + ack", "Oui (un clic)", "—", "Partiel", "—"],
      ["Temps d'installation", "~15 min", "minutes", "minutes", "heures (réglage)"],
    ],
    vsRows1: [
      ["Bloquer la 1re requête instantanément", "Réactif (ligne de log)", "Réactif", "En partie", "Inline (instantané)"],
      ["Scrubbing volumétrique L3/L4", "Aucun — CDN recommandé", "Aucun", "Aucun", "Aucun"],
      ["Réseau de signaux communautaire", "Auto-hébergé", "—", "Oui (global)", "—"],
      ["Edge / WAF Cloud", "Couche origine", "—", "Bouncer", "Mode proxy"],
      ["Cloud géré / SaaS", "Aucun (auto-hébergé)", "Aucun", "Oui (console)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 ou Debian 12 (amd64)",
      "nginx + log d'accès inscriptible (format log_guardian)",
      "Root ou sudo (systemd, ipset, /etc/log-guardian)",
      "~200 Mo disque, 128 Mo RAM (Core) ; Docker pour Pro",
      "Pro optionnel : noyau 5.10+ pour eBPF/XDP, Docker (tableau de bord/métriques)",
    ],
    setup: {
      pathTitles: ["Serveur neuf — paquet .deb", "Code source — compiler et installer"],
      pathBadges: ["recommandé", "développeur"],
      pathNotes: [
        "Aucune compilation requise. Le paquet fournit le binaire, les units systemd, les règles et les scripts. Sûr à la mise à jour : un /etc/log-guardian/rules.conf existant est préservé. Depuis GitHub Releases (log-guardian_*_amd64.deb) ou via bash scripts/build_deb.sh → dist/.",
        "Clonez le dépôt GitHub et compilez. Idéal pour le développement, la personnalisation et la revue complète des sources. install.sh met en place les units systemd, les règles et le format de log nginx.",
      ],
      pathSteps: [
        [
          { t: "Dépendances", d: "À la première installation, ajoutez les dépendances du paquet Debian. Si nginx manque, il peut être ajouté dans la même commande." },
          { t: "Installer le paquet", d: "Si dpkg -i signale une erreur de dépendance, lancez apt-get install -f. L'étape postinst crée automatiquement l'utilisateur log-guardian, les permissions, les units systemd et un rules.conf par défaut." },
          { t: "Premier lancement et sécurité API", d: "Prépare le format de log nginx, le FP trust et la sécurité API (token, fail-closed) en une fois. Les scripts sont livrés dans le paquet (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Source et compilation", d: "Clonez le dépôt, compilez avec tous les cœurs et lancez le script d'installation principal." },
          { t: "Premier lancement et sync du token", d: "Démarre les services et prépare la synchronisation du token API et la connexion au tableau de bord." },
        ],
      ],
      commonTitle: "Étapes communes (après A ou B)",
      commonSteps: [
        { t: "Format de log nginx", d: "Le format de log log_guardian est requis pour que le WAF lise le corps de la requête et X-Forwarded-For. Le setup l'applique généralement automatiquement ; vérifiez en mode STRICT." },
        { t: "Vérification santé et statut", d: "Vérifiez l'IPC du daemon, le statut du service et les fonctions BPF. Gate vert : vous devez voir FAIL: 0 à la fin de post_install_verify." },
        { t: "Métriques et premier test de ban", d: "Vérifiez les métriques Prometheus ; observez les compteurs monter après le trafic. Vous pouvez injecter une ligne d'attaque et vérifier le ban dans ipset." },
        { t: "VirtualBox / sans XDP (portable & VM)", d: "Sur les environnements sans eBPF/XDP, --no-xdp avec un ban basé sur ipset suffit. Si une dépendance de service échoue, le script de réparation est une seule commande." },
      ],
      dashboardTitle: "Tableau de bord Pro — après l'installation (optionnel)",
      dashboardBadge: "Pro · optionnel",
      dashboardNote: "Le tableau de bord ne tourne pas sur ce site de présentation mais sur votre propre machine. La pile prod est servie via Caddy + Docker sur https://localhost:8443.",
      dashboardSteps: [
        { t: "Démarrer la pile prod", d: "Compile et démarre le tableau de bord sur votre propre serveur. Connexion : admin / DASHBOARD_ADMIN_PASSWORD depuis .env." },
        { t: "Tunnel SSH pour un VPS distant", d: "Pour voir le tableau de bord en sécurité sans l'exposer à Internet, mettez en place un tunnel SSH ; durcissez d'abord le serveur." },
      ],
    },
  },
  es: {
    pipelineNote:
      "XDR, el marketplace Wasm y el Copilot LLM son capas opcionales a largo plazo — Core está listo para producción por sí solo.",
    selectedBodies: [
      "Una sola cadena: log de nginx → OWASP CRS → ban de kernel ~20 ms. En producción en ~15 minutos.",
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
      { k: "Ban de kernel ~20 ms", v: "Mediana ~20 ms desde la línea de log al ban de ipset/XDP. Fail2ban/CrowdSec se quedan en segundos–minutos; probado con 21 muestras medidas." },
      { k: "280.373 EPS · 16,93× ModSec", v: "En el mismo corpus con los mismos 121 patrones OWASP CRS (PCRE2 JIT), el rendimiento WAF/CRS es de 280.373 EPS — 16,93× más rápido que los 16.560 EPS de ModSec. Medido y reproducible (bench-vs-modsec.json)." },
      { k: "100% de recall + 100% de paridad CRS", v: "121 reglas OWASP CRS, 100% de recall de ataques reales en un corpus de 1500 líneas y paridad total con ModSec — con 0,2% de falsos positivos." },
      { k: "Cobertura de ataques distribuidos", v: "Detección de clúster JA3 + ban por IP — 100% en una prueba en vivo de 80 IP. Fail2ban es de una sola IP; CrowdSec necesita una red de señales aparte." },
      { k: "Prueba transparente y reproducible", v: "75 pruebas automáticas + un pack de evidencias de 14 archivos + soak 72h (864 muestras, 0 errores). Los rivales no tienen prueba automática o está fragmentada." },
      { k: "Autoalojado · MIT · hecho en Turquía", v: "Tus datos se quedan contigo, sin bloqueo de proveedor, totalmente open source. Timeline SOC, métricas Prometheus y operación Telegram en un solo panel (:8443)." },
    ],
    vsNote:
      "Límite honesto: en algunas áreas los rivales son claramente mejores (celdas rojas). ModSec + CRS lidera en bloqueo instantáneo de la primera petición; CrowdSec es fuerte en su red de señales comunitaria distribuida y su consola SaaS gestionada. A cambio, en el mismo corpus con los mismos 121 patrones CRS, nuestro rendimiento WAF/CRS es de 280.373 EPS — 16,93× los 16.560 EPS de ModSec (bench-vs-modsec.json).",
    vsLegend: "Rojo = el ganador de esa fila",
    honestItems: [
      "Arquitectura reactiva — la primera petición puede pasar hasta que caiga la línea de log; no llegamos a la velocidad inline de ModSec.",
      "No absorbemos DDoS L3/L4 — estamos detrás de un CDN.",
      "Botnet distribuida — ban por IP; sin red de señales de CrowdSec.",
      "Hace: log → CRS/WAF → ban de kernel ~20 ms, PDF de prueba, operación Telegram, MIT autoalojado.",
    ],
    layersBodies: [
      "log → WAF → ban ipset (~15 min)",
      "demonio eBPF, panel, métricas, flota",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Métrica", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Fortalezas (medidas)", "Límites honestos"],
    vsRows0: [
      ["Log → WAF → ban de kernel", "Cadena única", "Solo ban", "Fragmentado", "WAF aparte"],
      ["Rendimiento WAF/CRS (mismo corpus)", "280.373 EPS (16,93×)", "—", "—", "16.560 EPS"],
      ["Paridad OWASP CRS", "100% (121 reglas)", "—", "—", "Referencia (100%)"],
      ["Recall de ataques reales", "100% (1K+10K)", "—", "—", "100%"],
      ["Ban distribuido / clúster JA3", "100% (80 IP)", "—", "Basado en señal", "—"],
      ["Consult inline de nginx", "PASS", "—", "—", "Módulo aparte"],
      ["Protección de aplicación L7", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Ban de kernel / eBPF (XDP)", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Falso positivo", "0,2% (medido)", "Alto", "Medio", "Según CRS"],
      ["Latencia de ban", "~20 ms", "seg–min", "seg", "Integración aparte"],
      ["Estabilidad corta (5 min)", "PASS (0 fallos)", "—", "—", "—"],
      ["Soak 72h", "PASS (864/0)", "—", "—", "—"],
      ["Pack de evidencias PDF+JSON", "Automático (14 archivos)", "Ninguno", "Parcial", "Módulo por módulo"],
      ["Matriz de pruebas auto", "75 pruebas", "—", "Parcial", "—"],
      ["Timeline SOC / panel", "Sí (:8443)", "—", "Consola", "—"],
      ["Ops Telegram + ack", "Sí (un clic)", "—", "Parcial", "—"],
      ["Tiempo de instalación", "~15 min", "minutos", "minutos", "horas (ajuste)"],
    ],
    vsRows1: [
      ["Bloquear la 1ª petición al instante", "Reactivo (línea de log)", "Reactivo", "En parte", "Inline (instantáneo)"],
      ["Scrubbing volumétrico L3/L4", "Ninguno — se recomienda CDN", "Ninguno", "Ninguno", "Ninguno"],
      ["Red de señales comunitaria", "Autoalojado", "—", "Sí (global)", "—"],
      ["Edge / WAF Cloud", "Capa de origen", "—", "Bouncer", "Modo proxy"],
      ["Cloud gestionado / SaaS", "Ninguno (autoalojado)", "Ninguno", "Sí (consola)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 o Debian 12 (amd64)",
      "nginx + log de acceso escribible (formato log_guardian)",
      "Root o sudo (systemd, ipset, /etc/log-guardian)",
      "~200 MB disco, 128 MB RAM (Core); Docker para Pro",
      "Pro opcional: kernel 5.10+ para eBPF/XDP, Docker (panel/métricas)",
    ],
    setup: {
      pathTitles: ["Servidor nuevo — paquete .deb", "Código fuente — compilar e instalar"],
      pathBadges: ["recomendado", "desarrollador"],
      pathNotes: [
        "Sin compilación. El paquete incluye el binario, las units systemd, las reglas y los scripts. Seguro para actualizar: un /etc/log-guardian/rules.conf existente se conserva. Desde GitHub Releases (log-guardian_*_amd64.deb) o con bash scripts/build_deb.sh → dist/.",
        "Clona el repo de GitHub y compila. Ideal para desarrollo, personalización y revisión completa del código. install.sh configura las units systemd, las reglas y el formato de log de nginx.",
      ],
      pathSteps: [
        [
          { t: "Dependencias", d: "En la primera instalación, añade las dependencias del paquete Debian. Si falta nginx, se puede añadir en el mismo comando." },
          { t: "Instalar el paquete", d: "Si dpkg -i reporta un error de dependencias, ejecuta apt-get install -f. El paso postinst crea automáticamente el usuario log-guardian, los permisos, las units systemd y un rules.conf por defecto." },
          { t: "Primer arranque y seguridad API", d: "Prepara el formato de log de nginx, el FP trust y la seguridad API (token, fail-closed) de una vez. Los scripts vienen en el paquete (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Fuente y compilación", d: "Clona el repo, compila con todos los núcleos y ejecuta el script de instalación principal." },
          { t: "Primer arranque y sync del token", d: "Levanta los servicios y prepara la sincronización del token API y la conexión al panel." },
        ],
      ],
      commonTitle: "Pasos comunes (después de A o B)",
      commonSteps: [
        { t: "Formato de log de nginx", d: "El formato de log log_guardian es necesario para que el WAF lea el cuerpo de la petición y X-Forwarded-For. El setup suele aplicarlo automáticamente; verifica en modo STRICT." },
        { t: "Comprobación de salud y estado", d: "Comprueba el IPC del daemon, el estado del servicio y las funciones BPF. Gate verde: deberías ver FAIL: 0 al final de post_install_verify." },
        { t: "Métricas y primer test de ban", d: "Comprueba las métricas Prometheus; observa cómo suben los contadores tras el tráfico. Puedes inyectar una línea de ataque y verificar el ban en ipset." },
        { t: "VirtualBox / sin XDP (portátil y VM)", d: "En entornos sin eBPF/XDP, --no-xdp con un ban basado en ipset es suficiente. Si falla una dependencia de servicio, el script de reparación es un solo comando." },
      ],
      dashboardTitle: "Panel Pro — tras la instalación (opcional)",
      dashboardBadge: "Pro · opcional",
      dashboardNote: "El panel no corre en este sitio de presentación sino en tu propia máquina. La pila prod se sirve vía Caddy + Docker en https://localhost:8443.",
      dashboardSteps: [
        { t: "Arrancar la pila prod", d: "Compila y levanta el panel en tu propio servidor. Acceso: admin / DASHBOARD_ADMIN_PASSWORD de .env." },
        { t: "Túnel SSH para un VPS remoto", d: "Para ver el panel de forma segura sin exponerlo a internet, configura un túnel SSH; endurece el servidor primero." },
      ],
    },
  },
  ru: {
    pipelineNote:
      "XDR, маркетплейс Wasm и LLM Copilot — долгосрочные опциональные слои; Core сам по себе готов к продакшену.",
    selectedBodies: [
      "Одна цепочка: лог nginx → OWASP CRS → бан в ядре ~20 мс. В продакшене за ~15 минут.",
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
      { k: "Бан в ядре ~20 мс", v: "Медиана ~20 мс от строки лога до бана ipset/XDP. Fail2ban/CrowdSec остаются в секундах–минутах; подтверждено 21 измеренными образцами." },
      { k: "280 373 EPS · 16,93× ModSec", v: "На том же корпусе и тех же 121 паттернах OWASP CRS (PCRE2 JIT) пропускная способность WAF/CRS — 280 373 EPS, в 16,93× быстрее, чем 16 560 EPS у ModSec. Измерено и воспроизводимо (bench-vs-modsec.json)." },
      { k: "100% recall + 100% паритет CRS", v: "121 правило OWASP CRS, 100% recall реальных атак на корпусе из 1500 строк и полный паритет с ModSec — при 0,2% ложных срабатываний." },
      { k: "Покрытие распределённых атак", v: "Обнаружение кластера JA3 + бан по IP — 100% в живом тесте на 80 IP. Fail2ban работает по одному IP; CrowdSec требует отдельной сети сигналов." },
      { k: "Прозрачное, воспроизводимое доказательство", v: "75 автотестов + пакет доказательств из 14 файлов + 72-часовой soak (864 образца, 0 ошибок). У конкурентов нет автоматического доказательства или оно фрагментарно." },
      { k: "Self-hosted · MIT · сделано в Турции", v: "Ваши данные остаются у вас, без привязки к вендору, полностью открытый код. SOC-таймлайн, метрики Prometheus и управление через Telegram в одной панели (:8443)." },
    ],
    vsNote:
      "Честная граница: в некоторых областях конкуренты явно лучше (красные ячейки). ModSec + CRS впереди по мгновенной блокировке первого запроса; CrowdSec силён распределённой сетью сигналов сообщества и управляемой SaaS-консолью. В ответ на том же корпусе и тех же 121 паттернах CRS наша пропускная способность WAF/CRS — 280 373 EPS, в 16,93× быстрее 16 560 EPS у ModSec (bench-vs-modsec.json).",
    vsLegend: "Красный = победитель в этой строке",
    honestItems: [
      "Реактивная архитектура — первый запрос может пройти, пока не упадёт строка лога; мы не на inline-скорости ModSec.",
      "Мы не поглощаем L3/L4 DDoS — мы стоим за CDN.",
      "Распределённый ботнет — бан по IP; без сети сигналов CrowdSec.",
      "Делает: лог → CRS/WAF → бан в ядре ~20 мс, PDF-доказательство, управление Telegram, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → бан ipset (~15 мин)",
      "eBPF-демон, дашборд, метрики, флот",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Метрика", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Сильные стороны (измерено)", "Честные границы"],
    vsRows0: [
      ["Лог → WAF → бан в ядре", "Одна цепочка", "Только бан", "Фрагментарно", "WAF отдельно"],
      ["Пропускная способность WAF/CRS (тот же корпус)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["Паритет OWASP CRS", "100% (121 правило)", "—", "—", "Эталон (100%)"],
      ["Recall реальных атак", "100% (1K+10K)", "—", "—", "100%"],
      ["Распределённый / бан JA3-кластера", "100% (80 IP)", "—", "По сигналу", "—"],
      ["Inline-consult nginx", "PASS", "—", "—", "Отдельный модуль"],
      ["Защита приложений L7", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Бан в ядре / eBPF (XDP)", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Ложное срабатывание", "0,2% (измерено)", "Высокое", "Среднее", "Зависит от CRS"],
      ["Задержка бана", "~20 мс", "сек–мин", "сек", "Отдельная интеграция"],
      ["Короткая стабильность (5 мин)", "PASS (0 сбоев)", "—", "—", "—"],
      ["72ч soak", "PASS (864/0)", "—", "—", "—"],
      ["Пакет доказательств PDF+JSON", "Автоматически (14 файлов)", "Нет", "Частично", "Модуль за модулем"],
      ["Автоматическая матрица тестов", "75 тестов", "—", "Частично", "—"],
      ["SOC-таймлайн / дашборд", "Да (:8443)", "—", "Консоль", "—"],
      ["Управление Telegram + ack", "Да (один клик)", "—", "Частично", "—"],
      ["Время установки", "~15 мин", "минуты", "минуты", "часы (тюнинг)"],
    ],
    vsRows1: [
      ["Мгновенно блокировать 1-й запрос", "Реактивно (строка лога)", "Реактивно", "Частично", "Inline (мгновенно)"],
      ["Объёмная очистка L3/L4", "Нет — рекомендуется CDN", "Нет", "Нет", "Нет"],
      ["Сеть сигналов сообщества", "Self-hosted", "—", "Да (глобально)", "—"],
      ["Edge / облачный WAF", "Слой origin", "—", "Bouncer", "Режим прокси"],
      ["Управляемое облако / SaaS", "Нет (self-hosted)", "Нет", "Да (консоль)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 или Debian 12 (amd64)",
      "nginx + записываемый access-лог (формат log_guardian)",
      "Root или sudo (systemd, ipset, /etc/log-guardian)",
      "~200 МБ диск, 128 МБ RAM (Core); Docker для Pro",
      "Опционально Pro: ядро 5.10+ для eBPF/XDP, Docker (дашборд/метрики)",
    ],
    setup: {
      pathTitles: ["Новый сервер — пакет .deb", "Исходный код — сборка и установка"],
      pathBadges: ["рекомендуется", "разработчик"],
      pathNotes: [
        "Сборка не нужна. Пакет содержит бинарь, systemd-юниты, правила и скрипты. Безопасно при обновлении: существующий /etc/log-guardian/rules.conf сохраняется. Из GitHub Releases (log-guardian_*_amd64.deb) или через bash scripts/build_deb.sh → dist/.",
        "Клонируйте репозиторий GitHub и соберите. Идеально для разработки, кастомизации и полного аудита кода. install.sh настраивает systemd-юниты, правила и формат лога nginx.",
      ],
      pathSteps: [
        [
          { t: "Зависимости", d: "При первой установке добавьте зависимости пакета Debian. Если nginx отсутствует, его можно добавить той же командой." },
          { t: "Установить пакет", d: "Если dpkg -i сообщает об ошибке зависимостей, запустите apt-get install -f. Шаг postinst автоматически создаёт пользователя log-guardian, права, systemd-юниты и rules.conf по умолчанию." },
          { t: "Первый запуск и безопасность API", d: "Готовит формат лога nginx, FP trust и безопасность API (токен, fail-closed) за один раз. Скрипты идут внутри пакета (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Исходники и сборка", d: "Клонируйте репозиторий, соберите на всех ядрах и запустите основной скрипт установки." },
          { t: "Первый запуск и sync токена", d: "Поднимает сервисы и готовит синхронизацию API-токена и подключение к дашборду." },
        ],
      ],
      commonTitle: "Общие шаги (после A или B)",
      commonSteps: [
        { t: "Формат лога nginx", d: "Формат лога log_guardian нужен, чтобы WAF читал тело запроса и X-Forwarded-For. Setup обычно применяет его автоматически; проверьте в режиме STRICT." },
        { t: "Проверка здоровья и статуса", d: "Проверьте IPC демона, статус сервиса и функции BPF. Зелёный гейт: в конце post_install_verify должно быть FAIL: 0." },
        { t: "Метрики и первый тест бана", d: "Проверьте метрики Prometheus; наблюдайте рост счётчиков после трафика. Можно внедрить строку атаки и проверить бан в ipset." },
        { t: "VirtualBox / без XDP (ноутбук и ВМ)", d: "В средах без eBPF/XDP достаточно --no-xdp с баном на основе ipset. Если зависимость сервиса падает, скрипт починки — одна команда." },
      ],
      dashboardTitle: "Pro-дашборд — после установки (опционально)",
      dashboardBadge: "Pro · опционально",
      dashboardNote: "Дашборд работает не на этом лендинге, а на вашей собственной машине. Prod-стек обслуживается через Caddy + Docker по адресу https://localhost:8443.",
      dashboardSteps: [
        { t: "Запустить prod-стек", d: "Собирает и поднимает дашборд на вашем сервере. Вход: admin / DASHBOARD_ADMIN_PASSWORD из .env." },
        { t: "SSH-туннель для удалённого VPS", d: "Чтобы безопасно смотреть дашборд, не открывая его в интернет, настройте SSH-туннель; сначала укрепите сервер." },
      ],
    },
  },
  pt: {
    pipelineNote:
      "XDR, o marketplace Wasm e o Copilot LLM são camadas opcionais de longo prazo — o Core está pronto para produção por si só.",
    selectedBodies: [
      "Uma só cadeia: log do nginx → OWASP CRS → ban de kernel ~20 ms. Em produção em ~15 minutos.",
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
      { k: "Ban de kernel ~20 ms", v: "Mediana ~20 ms da linha de log ao ban ipset/XDP. Fail2ban/CrowdSec ficam na escala de segundos–minutos; comprovado com 21 amostras medidas." },
      { k: "280.373 EPS · 16,93× ModSec", v: "No mesmo corpus com os mesmos 121 padrões OWASP CRS (PCRE2 JIT), o throughput WAF/CRS é de 280.373 EPS — 16,93× mais rápido que os 16.560 EPS do ModSec. Medido e reproduzível (bench-vs-modsec.json)." },
      { k: "100% de recall + 100% de paridade CRS", v: "121 regras OWASP CRS, 100% de recall de ataques reais num corpus de 1500 linhas e paridade total com o ModSec — a 0,2% de falsos positivos." },
      { k: "Cobertura de ataques distribuídos", v: "Deteção de cluster JA3 + ban por IP — 100% num teste ao vivo de 80 IP. O Fail2ban é de IP único; o CrowdSec precisa de uma rede de sinais à parte." },
      { k: "Prova transparente e reproduzível", v: "75 testes automáticos + um pacote de provas de 14 ficheiros + soak 72h (864 amostras, 0 erros). Os rivais não têm prova automática ou é fragmentada." },
      { k: "Self-hosted · MIT · feito na Turquia", v: "Os seus dados ficam consigo, sem lock-in de fornecedor, totalmente open source. Timeline SOC, métricas Prometheus e operação Telegram num só painel (:8443)." },
    ],
    vsNote:
      "Limite honesto: em algumas áreas os rivais são claramente melhores (células vermelhas). ModSec + CRS lidera no bloqueio instantâneo do primeiro pedido; o CrowdSec é forte na sua rede de sinais comunitária distribuída e na consola SaaS gerida. Em contrapartida, no mesmo corpus com os mesmos 121 padrões CRS, o nosso throughput WAF/CRS é de 280.373 EPS — 16,93× os 16.560 EPS do ModSec (bench-vs-modsec.json).",
    vsLegend: "Vermelho = o vencedor dessa linha",
    honestItems: [
      "Arquitetura reativa — o primeiro pedido pode passar até a linha de log cair; não estamos à velocidade inline do ModSec.",
      "Não absorvemos DDoS L3/L4 — ficamos atrás de um CDN.",
      "Botnet distribuída — ban por IP; sem rede de sinais do CrowdSec.",
      "Faz: log → CRS/WAF → ban de kernel ~20 ms, PDF de prova, operação Telegram, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ban ipset (~15 min)",
      "daemon eBPF, painel, métricas, frota",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Métrica", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Pontos fortes (medidos)", "Limites honestos"],
    vsRows0: [
      ["Log → WAF → ban de kernel", "Cadeia única", "Só ban", "Fragmentado", "WAF à parte"],
      ["Throughput WAF/CRS (mesmo corpus)", "280.373 EPS (16,93×)", "—", "—", "16.560 EPS"],
      ["Paridade OWASP CRS", "100% (121 regras)", "—", "—", "Referência (100%)"],
      ["Recall de ataques reais", "100% (1K+10K)", "—", "—", "100%"],
      ["Ban distribuído / cluster JA3", "100% (80 IP)", "—", "Baseado em sinal", "—"],
      ["Consult inline do nginx", "PASS", "—", "—", "Módulo à parte"],
      ["Proteção de aplicação L7", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Ban de kernel / eBPF (XDP)", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Falso positivo", "0,2% (medido)", "Alto", "Médio", "Depende do CRS"],
      ["Latência de ban", "~20 ms", "seg–min", "seg", "Integração à parte"],
      ["Estabilidade curta (5 min)", "PASS (0 falhas)", "—", "—", "—"],
      ["Soak 72h", "PASS (864/0)", "—", "—", "—"],
      ["Pacote de evidências PDF+JSON", "Automático (14 ficheiros)", "Nenhum", "Parcial", "Módulo a módulo"],
      ["Matriz de testes automática", "75 testes", "—", "Parcial", "—"],
      ["Timeline SOC / painel", "Sim (:8443)", "—", "Consola", "—"],
      ["Ops Telegram + ack", "Sim (um clique)", "—", "Parcial", "—"],
      ["Tempo de instalação", "~15 min", "minutos", "minutos", "horas (ajuste)"],
    ],
    vsRows1: [
      ["Bloquear o 1º pedido instantaneamente", "Reativo (linha de log)", "Reativo", "Em parte", "Inline (instantâneo)"],
      ["Scrubbing volumétrico L3/L4", "Nenhum — CDN recomendado", "Nenhum", "Nenhum", "Nenhum"],
      ["Rede de sinais da comunidade", "Auto-hospedado", "—", "Sim (global)", "—"],
      ["Edge / WAF Cloud", "Camada de origem", "—", "Bouncer", "Modo proxy"],
      ["Cloud gerida / SaaS", "Nenhum (auto-hospedado)", "Nenhum", "Sim (consola)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 ou Debian 12 (amd64)",
      "nginx + log de acesso gravável (formato log_guardian)",
      "Root ou sudo (systemd, ipset, /etc/log-guardian)",
      "~200 MB disco, 128 MB RAM (Core); Docker para Pro",
      "Pro opcional: kernel 5.10+ para eBPF/XDP, Docker (painel/métricas)",
    ],
    setup: {
      pathTitles: ["Servidor novo — pacote .deb", "Código-fonte — compilar e instalar"],
      pathBadges: ["recomendado", "programador"],
      pathNotes: [
        "Sem compilação. O pacote traz o binário, as units systemd, as regras e os scripts. Seguro na atualização: um /etc/log-guardian/rules.conf existente é preservado. Via GitHub Releases (log-guardian_*_amd64.deb) ou com bash scripts/build_deb.sh → dist/.",
        "Clone o repo do GitHub e compile. Ideal para desenvolvimento, personalização e revisão completa do código. install.sh configura as units systemd, as regras e o formato de log do nginx.",
      ],
      pathSteps: [
        [
          { t: "Dependências", d: "Na primeira instalação, adicione as dependências do pacote Debian. Se faltar o nginx, pode ser adicionado no mesmo comando." },
          { t: "Instalar o pacote", d: "Se o dpkg -i reportar erro de dependências, execute apt-get install -f. O passo postinst cria automaticamente o utilizador log-guardian, as permissões, as units systemd e um rules.conf padrão." },
          { t: "Primeiro arranque e segurança da API", d: "Prepara o formato de log do nginx, o FP trust e a segurança da API (token, fail-closed) de uma vez. Os scripts vêm no pacote (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Fonte e compilação", d: "Clone o repo, compile com todos os núcleos e execute o script de instalação principal." },
          { t: "Primeiro arranque e sync do token", d: "Sobe os serviços e prepara a sincronização do token da API e a ligação ao painel." },
        ],
      ],
      commonTitle: "Passos comuns (após A ou B)",
      commonSteps: [
        { t: "Formato de log do nginx", d: "O formato de log log_guardian é necessário para que o WAF leia o corpo do pedido e o X-Forwarded-For. O setup normalmente aplica-o automaticamente; verifique no modo STRICT." },
        { t: "Verificação de saúde e estado", d: "Verifique o IPC do daemon, o estado do serviço e as funções BPF. Gate verde: deve ver FAIL: 0 no fim do post_install_verify." },
        { t: "Métricas e primeiro teste de ban", d: "Verifique as métricas Prometheus; observe os contadores a subir após o tráfego. Pode injetar uma linha de ataque e verificar o ban no ipset." },
        { t: "VirtualBox / sem XDP (portátil e VM)", d: "Em ambientes sem eBPF/XDP, --no-xdp com um ban baseado em ipset basta. Se uma dependência de serviço falhar, o script de reparação é um único comando." },
      ],
      dashboardTitle: "Painel Pro — após a instalação (opcional)",
      dashboardBadge: "Pro · opcional",
      dashboardNote: "O painel não corre neste site de apresentação, mas na sua própria máquina. A stack de produção é servida via Caddy + Docker em https://localhost:8443.",
      dashboardSteps: [
        { t: "Iniciar a stack de produção", d: "Compila e sobe o painel no seu próprio servidor. Login: admin / DASHBOARD_ADMIN_PASSWORD do .env." },
        { t: "Túnel SSH para um VPS remoto", d: "Para ver o painel em segurança sem o expor à internet, configure um túnel SSH; endureça o servidor primeiro." },
      ],
    },
  },
  nl: {
    pipelineNote:
      "XDR, de Wasm-marketplace en LLM-Copilot zijn optionele lagen op lange termijn — Core is op zichzelf productieklaar.",
    selectedBodies: [
      "Eén keten: nginx-log → OWASP CRS → kernel-ban ~20 ms. In productie in ~15 minuten.",
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
      { k: "Kernel-ban ~20 ms", v: "Mediaan ~20 ms van logregel tot ipset/XDP-ban. Fail2ban/CrowdSec blijven op seconden–minuten; bewezen met 21 gemeten monsters." },
      { k: "280.373 EPS · 16,93× ModSec", v: "Op dezelfde corpus met dezelfde 121 OWASP CRS-patronen (PCRE2 JIT) is de WAF/CRS-doorvoer 280.373 EPS — 16,93× sneller dan de 16.560 EPS van ModSec. Gemeten en reproduceerbaar (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS-pariteit", v: "121 OWASP-CRS-regels, 100% recall van echte aanvallen op een corpus van 1500 regels en volledige pariteit met ModSec — bij 0,2% false positives." },
      { k: "Dekking van gedistribueerde aanvallen", v: "JA3-clusterdetectie + ban per IP — 100% in een live test met 80 IP's. Fail2ban is per enkel IP; CrowdSec vraagt een apart signaalnetwerk." },
      { k: "Transparant, reproduceerbaar bewijs", v: "75 automatische tests + een bewijspakket van 14 bestanden + 72h-soak (864 monsters, 0 fouten). Concurrenten hebben geen automatisch bewijs of het is versnipperd." },
      { k: "Self-hosted · MIT · gemaakt in Turkije", v: "Je data blijft bij jou, geen vendor lock-in, volledig open source. SOC-timeline, Prometheus-metrics en Telegram-beheer in één paneel (:8443)." },
    ],
    vsNote:
      "Eerlijke grens: op sommige vlakken zijn concurrenten duidelijk beter (rode cellen). ModSec + CRS leidt in het direct blokkeren van het eerste verzoek; CrowdSec is sterk in zijn gedistribueerde community-signaalnetwerk en beheerde SaaS-console. Daartegenover staat dat onze WAF/CRS-doorvoer op dezelfde corpus met dezelfde 121 CRS-patronen 280.373 EPS is — 16,93× de 16.560 EPS van ModSec (bench-vs-modsec.json).",
    vsLegend: "Rood = de winnaar in die rij",
    honestItems: [
      "Reactieve architectuur — het eerste verzoek kan door tot de logregel valt; we halen niet de inline-snelheid van ModSec.",
      "We absorberen geen L3/L4-DDoS — we zitten achter een CDN.",
      "Gedistribueerd botnet — ban per IP; geen CrowdSec-signaalnetwerk.",
      "Doet: log → CRS/WAF → kernel-ban ~20 ms, bewijs-PDF, Telegram-beheer, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset-ban (~15 min)",
      "eBPF-daemon, dashboard, metrics, fleet",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Metriek", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Sterke punten (gemeten)", "Eerlijke grenzen"],
    vsRows0: [
      ["Log → WAF → kernel-ban", "Eén keten", "Alleen ban", "Stukje bij beetje", "WAF apart"],
      ["WAF/CRS-doorvoer (zelfde corpus)", "280.373 EPS (16,93×)", "—", "—", "16.560 EPS"],
      ["OWASP-CRS-pariteit", "100% (121 regels)", "—", "—", "Referentie (100%)"],
      ["Recall echte aanvallen", "100% (1K+10K)", "—", "—", "100%"],
      ["Gedistribueerde / JA3-cluster-ban", "100% (80 IP)", "—", "Signaalgebaseerd", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Aparte module"],
      ["L7-applicatiebescherming", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Kernel / eBPF (XDP) ban", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["False positive", "0,2% (gemeten)", "Hoog", "Gemiddeld", "CRS-afhankelijk"],
      ["Ban-latency", "~20 ms", "sec–min", "sec", "Aparte integratie"],
      ["Korte stabiliteit (5 min)", "PASS (0 fouten)", "—", "—", "—"],
      ["72u soak", "PASS (864/0)", "—", "—", "—"],
      ["Bewijspakket PDF+JSON", "Automatisch (14 bestanden)", "Geen", "Gedeeltelijk", "Module voor module"],
      ["Automatische testmatrix", "75 tests", "—", "Gedeeltelijk", "—"],
      ["SOC-tijdlijn / dashboard", "Ja (:8443)", "—", "Console", "—"],
      ["Telegram-ops + ack", "Ja (één klik)", "—", "Gedeeltelijk", "—"],
      ["Installatietijd", "~15 min", "minuten", "minuten", "uren (tuning)"],
    ],
    vsRows1: [
      ["Eerste verzoek direct blokkeren", "Reactief (logregel)", "Reactief", "Deels", "Inline (direct)"],
      ["Volumetrische L3/L4-scrubbing", "Geen — CDN aanbevolen", "Geen", "Geen", "Geen"],
      ["Community-signaalnetwerk", "Zelf gehost", "—", "Ja (globaal)", "—"],
      ["Edge / Cloud-WAF", "Origin-laag", "—", "Bouncer", "Proxymodus"],
      ["Beheerde cloud / SaaS", "Geen (zelf gehost)", "Geen", "Ja (console)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 of Debian 12 (amd64)",
      "nginx + beschrijfbaar access-log (log_guardian-formaat)",
      "Root of sudo (systemd, ipset, /etc/log-guardian)",
      "~200 MB schijf, 128 MB RAM (Core); Docker voor Pro",
      "Optioneel Pro: kernel 5.10+ voor eBPF/XDP, Docker (dashboard/metrics)",
    ],
    setup: {
      pathTitles: ["Verse server — .deb-pakket", "Broncode — bouwen en installeren"],
      pathBadges: ["aanbevolen", "ontwikkelaar"],
      pathNotes: [
        "Geen build nodig. Het pakket levert de binary, systemd-units, regels en scripts. Upgrade-veilig: een bestaande /etc/log-guardian/rules.conf blijft behouden. Via GitHub Releases (log-guardian_*_amd64.deb) of met bash scripts/build_deb.sh → dist/.",
        "Kloon de GitHub-repo en bouw. Ideaal voor ontwikkeling, aanpassing en volledige broncode-review. install.sh zet de systemd-units, regels en het nginx-logformaat op.",
      ],
      pathSteps: [
        [
          { t: "Afhankelijkheden", d: "Voeg bij de eerste installatie de Debian-pakketafhankelijkheden toe. Ontbreekt nginx, dan kan het in hetzelfde commando worden toegevoegd." },
          { t: "Pakket installeren", d: "Meldt dpkg -i een afhankelijkheidsfout, voer dan apt-get install -f uit. De postinst-stap maakt automatisch de log-guardian-gebruiker, rechten, systemd-units en een standaard rules.conf aan." },
          { t: "Eerste start en API-beveiliging", d: "Bereidt het nginx-logformaat, FP-trust en API-beveiliging (token, fail-closed) in één keer voor. De scripts zitten in het pakket (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Bron en build", d: "Kloon de repo, bouw met alle cores en voer het hoofd-installatiescript uit." },
          { t: "Eerste start en token-sync", d: "Zet de services aan en bereidt de API-token-sync en dashboardverbinding voor." },
        ],
      ],
      commonTitle: "Gemeenschappelijke stappen (na A of B)",
      commonSteps: [
        { t: "Nginx-logformaat", d: "Het log_guardian-logformaat is nodig zodat de WAF de request-body en X-Forwarded-For kan lezen. Setup past het meestal automatisch toe; controleer in STRICT-modus." },
        { t: "Gezondheids- en statuscontrole", d: "Controleer daemon-IPC, servicestatus en BPF-functies. Groene gate: aan het eind van post_install_verify hoort FAIL: 0 te staan." },
        { t: "Metrics en eerste ban-test", d: "Controleer Prometheus-metrics; kijk hoe de tellers stijgen na verkeer. Je kunt een aanvalsregel injecteren en de ban in ipset verifiëren." },
        { t: "VirtualBox / zonder XDP (laptop & VM)", d: "In omgevingen zonder eBPF/XDP volstaat --no-xdp met een ipset-gebaseerde ban. Faalt een serviceafhankelijkheid, dan is het reparatiescript één commando." },
      ],
      dashboardTitle: "Pro-dashboard — na installatie (optioneel)",
      dashboardBadge: "Pro · optioneel",
      dashboardNote: "Het dashboard draait niet op deze landingssite maar op je eigen machine. De prod-stack wordt via Caddy + Docker geserveerd op https://localhost:8443.",
      dashboardSteps: [
        { t: "Prod-stack starten", d: "Bouwt en start het dashboard op je eigen server. Login: admin / DASHBOARD_ADMIN_PASSWORD uit .env." },
        { t: "SSH-tunnel voor een externe VPS", d: "Om het dashboard veilig te bekijken zonder het aan internet bloot te stellen, zet een SSH-tunnel op; hard eerst de server." },
      ],
    },
  },
  zh: {
    pipelineNote:
      "XDR、Wasm 市场和 LLM Copilot 是长期可选层——Core 本身即可用于生产。",
    selectedBodies: [
      "单一链路：nginx 日志 → OWASP CRS → 约 20 毫秒内核封禁。约 15 分钟即可投产。",
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
      { k: "约 20 毫秒内核封禁", v: "从日志行到 ipset/XDP 封禁中位数约 20 毫秒。Fail2ban/CrowdSec 停留在秒—分钟级；由 21 个实测样本证明。" },
      { k: "280,373 EPS · 16.93× ModSec", v: "在相同语料、相同 121 条 OWASP CRS 规则（PCRE2 JIT）下，WAF/CRS 吞吐量为 280,373 EPS——比 ModSec 的 16,560 EPS 快 16.93 倍。已测量且可复现（bench-vs-modsec.json）。" },
      { k: "100% 召回 + 100% CRS 对等", v: "121 条 OWASP CRS 规则，在 1500 行语料上对真实攻击 100% 召回，与 ModSec 完全对等——误报率 0.2%。" },
      { k: "覆盖分布式攻击", v: "JA3 集群检测 + 按 IP 封禁——80 IP 实测 100%。Fail2ban 是单 IP；CrowdSec 需要独立的信号网络。" },
      { k: "透明、可复现的证据", v: "75 项自动化测试 + 14 个文件的证据包 + 72 小时 soak（864 样本，0 错误）。竞品没有自动化证据或证据零散。" },
      { k: "自托管 · MIT · 土耳其制造", v: "数据留在你手中，无供应商锁定，完全开源。SOC 时间线、Prometheus 指标和 Telegram 运维统一在一个面板（:8443）。" },
    ],
    vsNote:
      "诚实边界：在某些方面竞品明显更强（红色单元格）。ModSec + CRS 在瞬时拦截首个请求上领先；CrowdSec 在其分布式社区信号网络和托管 SaaS 控制台上强大。作为回报，在相同语料、相同 121 条 CRS 规则下，我们的 WAF/CRS 吞吐量为 280,373 EPS——是 ModSec 的 16,560 EPS 的 16.93 倍（bench-vs-modsec.json）。",
    vsLegend: "红色 = 该行的优胜者",
    honestItems: [
      "反应式架构——在日志行落下前首个请求可能通过；我们达不到 ModSec 的内联速度。",
      "我们不吸收 L3/L4 DDoS——我们位于 CDN 之后。",
      "分布式僵尸网络——按 IP 封禁；没有 CrowdSec 信号网络。",
      "能做：日志 → CRS/WAF → 约 20 毫秒内核封禁、证据 PDF、Telegram 运维、MIT 自托管。",
    ],
    layersBodies: [
      "日志 → WAF → ipset 封禁（约 15 分钟）",
      "eBPF 守护进程、仪表盘、指标、机群",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["指标", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["优势（实测）", "诚实的边界"],
    vsRows0: [
      ["日志 → WAF → 内核封禁", "单一链路", "仅封禁", "零散拼接", "WAF 分离"],
      ["WAF/CRS 吞吐量（相同语料）", "280,373 EPS (16.93×)", "—", "—", "16,560 EPS"],
      ["OWASP CRS 对等", "100%（121 条规则）", "—", "—", "参考（100%）"],
      ["真实攻击召回", "100%（1K+10K）", "—", "—", "100%"],
      ["分布式 / JA3 集群封禁", "100%（80 IP）", "—", "基于信号", "—"],
      ["nginx 内联咨询", "PASS", "—", "—", "独立模块"],
      ["L7 应用防护", "WAF + 咨询 + eBPF", "—", "—", "CRS 内联"],
      ["内核 / eBPF (XDP) 封禁", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["误报", "0.2%（实测）", "高", "中", "取决于 CRS"],
      ["封禁延迟", "~20 毫秒", "秒–分", "秒", "独立集成"],
      ["短时稳定性（5 分钟）", "PASS（0 失败）", "—", "—", "—"],
      ["72 小时 soak", "PASS（864/0）", "—", "—", "—"],
      ["证据包 PDF+JSON", "自动（14 个文件）", "无", "部分", "逐模块"],
      ["自动测试矩阵", "75 项测试", "—", "部分", "—"],
      ["SOC 时间线 / 仪表板", "是（:8443）", "—", "控制台", "—"],
      ["Telegram 运维 + 确认", "是（一键）", "—", "部分", "—"],
      ["安装时间", "~15 分钟", "分钟", "分钟", "小时（调优）"],
    ],
    vsRows1: [
      ["瞬时拦截首个请求", "被动（日志行）", "被动", "部分", "内联（瞬时）"],
      ["体量型 L3/L4 清洗", "无 — 建议 CDN", "无", "无", "无"],
      ["社区信号网络", "自托管", "—", "是（全球）", "—"],
      ["边缘 / 云 WAF", "源站层", "—", "Bouncer", "代理模式"],
      ["托管云 / SaaS", "无（自托管）", "无", "是（控制台）", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 或 Debian 12（amd64）",
      "nginx + 可写访问日志（log_guardian 格式）",
      "Root 或 sudo（systemd、ipset、/etc/log-guardian）",
      "~200 MB 磁盘、128 MB 内存（Core）；Pro 需 Docker",
      "可选 Pro：eBPF/XDP 需 5.10+ 内核，Docker（仪表板/指标）",
    ],
    setup: {
      pathTitles: ["全新服务器 — .deb 包", "源代码 — 编译与安装"],
      pathBadges: ["推荐", "开发者"],
      pathNotes: [
        "无需编译。软件包自带二进制、systemd 单元、规则和脚本。升级安全：现有的 /etc/log-guardian/rules.conf 会被保留。可从 GitHub Releases（log-guardian_*_amd64.deb）获取或用 bash scripts/build_deb.sh → dist/ 构建。",
        "克隆 GitHub 仓库并编译。适合开发、定制与完整源码审查。install.sh 会配置 systemd 单元、规则和 nginx 日志格式。",
      ],
      pathSteps: [
        [
          { t: "依赖项", d: "首次安装时添加 Debian 包依赖。若缺少 nginx，可在同一命令中一并添加。" },
          { t: "安装软件包", d: "若 dpkg -i 报依赖错误，运行 apt-get install -f。postinst 步骤会自动创建 log-guardian 用户、权限、systemd 单元和默认 rules.conf。" },
          { t: "首次运行与 API 安全", d: "一次性准备好 nginx 日志格式、FP trust 和 API 安全（令牌、fail-closed）。脚本随包提供（/usr/local/share/log-guardian/scripts/）。" },
        ],
        [
          { t: "源码与编译", d: "克隆仓库，使用全部核心编译并运行主安装脚本。" },
          { t: "首次运行与令牌同步", d: "启动服务并准备 API 令牌同步和仪表板连接。" },
        ],
      ],
      commonTitle: "通用步骤（A 或 B 之后）",
      commonSteps: [
        { t: "Nginx 日志格式", d: "需要 log_guardian 日志格式，WAF 才能读取请求体和 X-Forwarded-For。安装通常会自动应用；在 STRICT 模式下验证。" },
        { t: "健康与状态检查", d: "检查守护进程 IPC、服务状态和 BPF 功能。绿色关卡：post_install_verify 结尾应显示 FAIL: 0。" },
        { t: "指标与首次封禁测试", d: "检查 Prometheus 指标；观察计数器在流量后上升。可注入一条攻击日志并在 ipset 中验证封禁。" },
        { t: "VirtualBox / 无 XDP（笔记本与虚拟机）", d: "在无 eBPF/XDP 的环境中，--no-xdp 配合基于 ipset 的封禁即可。若某个服务依赖失败，修复脚本只需一条命令。" },
      ],
      dashboardTitle: "Pro 仪表板 — 安装后（可选）",
      dashboardBadge: "Pro · 可选",
      dashboardNote: "仪表板不在此展示站运行，而在你自己的机器上。生产栈通过 Caddy + Docker 在 https://localhost:8443 提供服务。",
      dashboardSteps: [
        { t: "启动生产栈", d: "在你自己的服务器上编译并启动仪表板。登录：admin / .env 中的 DASHBOARD_ADMIN_PASSWORD。" },
        { t: "远程 VPS 的 SSH 隧道", d: "为安全查看仪表板而不暴露到互联网，请配置 SSH 隧道；先加固服务器。" },
      ],
    },
  },
  ja: {
    pipelineNote:
      "XDR、Wasm マーケットプレイス、LLM Copilot は長期的なオプション層です——Core 単体で本番運用が可能です。",
    selectedBodies: [
      "単一チェーン：nginx ログ → OWASP CRS → 約20msのカーネルBAN。約15分で本番投入。",
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
      { k: "約20msのカーネルBAN", v: "ログ行から ipset/XDP BAN まで中央値 約20ms。Fail2ban/CrowdSec は秒〜分単位；21件の実測サンプルで証明。" },
      { k: "280,373 EPS · 16.93× ModSec", v: "同一コーパス・同一の 121 個の OWASP CRS パターン（PCRE2 JIT）で、WAF/CRS スループットは 280,373 EPS — ModSec の 16,560 EPS より 16.93 倍高速。計測済みで再現可能（bench-vs-modsec.json）。" },
      { k: "リコール100% + CRS 100%整合", v: "121件の OWASP CRS ルール、1500行コーパスで実攻撃リコール100%、ModSec と完全整合——誤検知0.2%。" },
      { k: "分散攻撃のカバー", v: "JA3 クラスタ検知 + IP ごとの BAN——80 IP のライブテストで100%。Fail2ban は単一IP；CrowdSec は別の信号ネットワークが必要。" },
      { k: "透明で再現可能な証拠", v: "75件の自動テスト + 14ファイルの証拠パック + 72時間ソーク（864サンプル、0エラー）。競合は自動証拠が無いか断片的。" },
      { k: "セルフホスト · MIT · トルコ製", v: "データは手元に残り、ベンダーロックインなし、完全オープンソース。SOC タイムライン、Prometheus メトリクス、Telegram 運用が一つのパネル（:8443）に。" },
    ],
    vsNote:
      "正直な限界：一部の領域では競合が明らかに優れています（赤いセル）。ModSec + CRS は最初のリクエストの即時ブロックで先行；CrowdSec は分散コミュニティ信号ネットワークとマネージド SaaS コンソールが強力。その代わり、同一コーパス・同一の 121 個の CRS パターンで、私たちの WAF/CRS スループットは 280,373 EPS — ModSec の 16,560 EPS の 16.93 倍です（bench-vs-modsec.json）。",
    vsLegend: "赤 = その行の勝者",
    honestItems: [
      "リアクティブなアーキテクチャ——ログ行が落ちるまで最初のリクエストは通り得ます；ModSec のインライン速度には及びません。",
      "L3/L4 DDoS は吸収しません——CDN の背後に置きます。",
      "分散ボットネット——IP ごとの BAN；CrowdSec の信号ネットワークはありません。",
      "できること：ログ → CRS/WAF → 約20msのカーネルBAN、証拠PDF、Telegram 運用、MIT セルフホスト。",
    ],
    layersBodies: [
      "ログ → WAF → ipset BAN（約15分）",
      "eBPF デーモン、ダッシュボード、メトリクス、フリート",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["指標", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["強み（実測）", "正直な限界"],
    vsRows0: [
      ["ログ → WAF → カーネル BAN", "単一チェーン", "BAN のみ", "断片的", "WAF は別"],
      ["WAF/CRS スループット（同一コーパス）", "280,373 EPS (16.93×)", "—", "—", "16,560 EPS"],
      ["OWASP CRS 整合", "100%（121 ルール）", "—", "—", "基準（100%）"],
      ["実攻撃のリコール", "100%（1K+10K）", "—", "—", "100%"],
      ["分散 / JA3 クラスタ BAN", "100%（80 IP）", "—", "シグナルベース", "—"],
      ["nginx インライン consult", "PASS", "—", "—", "別モジュール"],
      ["L7 アプリ保護", "WAF + consult + eBPF", "—", "—", "CRS インライン"],
      ["カーネル / eBPF (XDP) BAN", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["誤検知", "0.2%（実測）", "高", "中", "CRS 依存"],
      ["BAN レイテンシ", "~20 ms", "秒〜分", "秒", "別統合"],
      ["短時間安定性（5 分）", "PASS（失敗 0）", "—", "—", "—"],
      ["72 時間ソーク", "PASS（864/0）", "—", "—", "—"],
      ["証拠パック PDF+JSON", "自動（14 ファイル）", "なし", "部分的", "モジュールごと"],
      ["自動テストマトリクス", "75 テスト", "—", "部分的", "—"],
      ["SOC タイムライン / ダッシュボード", "あり（:8443）", "—", "コンソール", "—"],
      ["Telegram 運用 + ack", "あり（ワンクリック）", "—", "部分的", "—"],
      ["セットアップ時間", "~15 分", "分", "分", "時間（チューニング）"],
    ],
    vsRows1: [
      ["最初のリクエストを即座にブロック", "リアクティブ（ログ行）", "リアクティブ", "一部", "インライン（即時）"],
      ["ボリューム型 L3/L4 スクラブ", "なし — CDN 推奨", "なし", "なし", "なし"],
      ["コミュニティシグナル網", "セルフホスト", "—", "あり（グローバル）", "—"],
      ["エッジ / クラウド WAF", "オリジン層", "—", "Bouncer", "プロキシモード"],
      ["マネージドクラウド / SaaS", "なし（セルフホスト）", "なし", "あり（コンソール）", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 または Debian 12（amd64）",
      "nginx + 書き込み可能なアクセスログ（log_guardian 形式）",
      "Root または sudo（systemd、ipset、/etc/log-guardian）",
      "~200 MB ディスク、128 MB RAM（Core）; Pro には Docker",
      "任意 Pro: eBPF/XDP に 5.10+ カーネル、Docker（ダッシュボード/メトリクス）",
    ],
    setup: {
      pathTitles: ["新規サーバー — .deb パッケージ", "ソースコード — ビルドとインストール"],
      pathBadges: ["推奨", "開発者"],
      pathNotes: [
        "ビルド不要。パッケージにはバイナリ、systemd ユニット、ルール、スクリプトが同梱。アップグレード安全: 既存の /etc/log-guardian/rules.conf は保持されます。GitHub Releases（log-guardian_*_amd64.deb）から取得するか bash scripts/build_deb.sh → dist/ でビルド。",
        "GitHub リポジトリをクローンしてビルド。開発、カスタマイズ、完全なソースレビューに最適。install.sh が systemd ユニット、ルール、nginx ログ形式を設定します。",
      ],
      pathSteps: [
        [
          { t: "依存関係", d: "初回インストール時に Debian パッケージの依存関係を追加します。nginx がなければ同じコマンドで追加できます。" },
          { t: "パッケージをインストール", d: "dpkg -i が依存エラーを出したら apt-get install -f を実行。postinst 手順が log-guardian ユーザー、権限、systemd ユニット、デフォルトの rules.conf を自動作成します。" },
          { t: "初回起動と API セキュリティ", d: "nginx ログ形式、FP trust、API セキュリティ（トークン、fail-closed）を一括で準備。スクリプトはパッケージ内（/usr/local/share/log-guardian/scripts/）にあります。" },
        ],
        [
          { t: "ソースとビルド", d: "リポジトリをクローンし、全コアでビルドしてメインのインストールスクリプトを実行します。" },
          { t: "初回起動とトークン同期", d: "サービスを起動し、API トークン同期とダッシュボード接続を準備します。" },
        ],
      ],
      commonTitle: "共通手順（A または B の後）",
      commonSteps: [
        { t: "Nginx ログ形式", d: "WAF がリクエストボディと X-Forwarded-For を読むには log_guardian ログ形式が必要です。セットアップは通常自動適用します; STRICT モードで確認してください。" },
        { t: "ヘルスと状態確認", d: "デーモン IPC、サービス状態、BPF 機能を確認。緑のゲート: post_install_verify の最後に FAIL: 0 が表示されるはずです。" },
        { t: "メトリクスと初回 BAN テスト", d: "Prometheus メトリクスを確認; トラフィック後にカウンターが上がるのを観察。攻撃行を注入して ipset で BAN を検証できます。" },
        { t: "VirtualBox / XDP なし（ノート PC と VM）", d: "eBPF/XDP のない環境では ipset ベースの BAN と --no-xdp で十分。サービス依存が失敗した場合、修復スクリプトは 1 コマンドです。" },
      ],
      dashboardTitle: "Pro ダッシュボード — インストール後（任意）",
      dashboardBadge: "Pro · 任意",
      dashboardNote: "ダッシュボードはこのランディングサイトではなく、あなた自身のマシンで動作します。本番スタックは Caddy + Docker 経由で https://localhost:8443 で提供されます。",
      dashboardSteps: [
        { t: "本番スタックを起動", d: "あなた自身のサーバーでダッシュボードをビルドして起動。ログイン: admin / .env の DASHBOARD_ADMIN_PASSWORD。" },
        { t: "リモート VPS 用 SSH トンネル", d: "インターネットに晒さず安全にダッシュボードを見るには SSH トンネルを設定; まずサーバーをハードニングします。" },
      ],
    },
  },
  ko: {
    pipelineNote:
      "XDR, Wasm 마켓플레이스, LLM Copilot은 장기 선택 계층입니다 — Core 자체로 프로덕션 준비가 되어 있습니다.",
    selectedBodies: [
      "단일 체인: nginx 로그 → OWASP CRS → 약 20ms 커널 밴. 약 15분 만에 프로덕션.",
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
      { k: "약 20ms 커널 밴", v: "로그 라인에서 ipset/XDP 밴까지 중앙값 약 20ms. Fail2ban/CrowdSec은 초~분 단위; 21개 측정 샘플로 입증." },
      { k: "280,373 EPS · 16.93× ModSec", v: "동일 코퍼스와 동일한 121개 OWASP CRS 패턴(PCRE2 JIT)에서 WAF/CRS 처리량은 280,373 EPS로, ModSec의 16,560 EPS보다 16.93배 빠릅니다. 측정되고 재현 가능합니다(bench-vs-modsec.json)." },
      { k: "100% 재현율 + 100% CRS 동등성", v: "121개 OWASP CRS 규칙, 1500줄 코퍼스에서 실제 공격 100% 재현율, ModSec과 완전 동등 — 오탐 0.2%." },
      { k: "분산 공격 커버리지", v: "JA3 클러스터 탐지 + IP별 밴 — 80 IP 실시간 테스트에서 100%. Fail2ban은 단일 IP; CrowdSec은 별도 신호 네트워크가 필요." },
      { k: "투명하고 재현 가능한 증거", v: "75개 자동 테스트 + 14개 파일 증거 팩 + 72시간 soak(864 샘플, 0 오류). 경쟁사는 자동 증거가 없거나 조각나 있음." },
      { k: "셀프호스팅 · MIT · 튀르키예 제작", v: "데이터는 당신에게 남고, 벤더 종속 없음, 완전 오픈소스. SOC 타임라인, Prometheus 메트릭, Telegram 운영을 하나의 패널(:8443)에." },
    ],
    vsNote:
      "정직한 한계: 일부 영역에서는 경쟁사가 분명히 더 낫습니다(빨간 셀). ModSec + CRS는 첫 요청 즉시 차단에서 앞서고, CrowdSec은 분산 커뮤니티 신호 네트워크와 관리형 SaaS 콘솔에서 강합니다. 그 대신 동일 코퍼스와 동일한 121개 CRS 패턴에서 우리의 WAF/CRS 처리량은 280,373 EPS로, ModSec의 16,560 EPS보다 16.93배 빠릅니다(bench-vs-modsec.json).",
    vsLegend: "빨강 = 해당 행의 승자",
    honestItems: [
      "반응형 아키텍처 — 로그 라인이 떨어질 때까지 첫 요청은 통과할 수 있음; ModSec의 인라인 속도에는 미치지 못함.",
      "L3/L4 DDoS는 흡수하지 않음 — CDN 뒤에 위치.",
      "분산 봇넷 — IP별 밴; CrowdSec 신호 네트워크 없음.",
      "수행: 로그 → CRS/WAF → 약 20ms 커널 밴, 증거 PDF, Telegram 운영, MIT 셀프호스팅.",
    ],
    layersBodies: [
      "로그 → WAF → ipset 밴(약 15분)",
      "eBPF 데몬, 대시보드, 메트릭, 플릿",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["지표", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["강점(측정됨)", "정직한 한계"],
    vsRows0: [
      ["로그 → WAF → 커널 밴", "단일 체인", "밴만", "단편적", "WAF 별도"],
      ["WAF/CRS 처리량(동일 코퍼스)", "280,373 EPS (16.93×)", "—", "—", "16,560 EPS"],
      ["OWASP CRS 동등성", "100%(121 규칙)", "—", "—", "기준(100%)"],
      ["실제 공격 재현율", "100%(1K+10K)", "—", "—", "100%"],
      ["분산 / JA3 클러스터 밴", "100%(80 IP)", "—", "신호 기반", "—"],
      ["nginx 인라인 consult", "PASS", "—", "—", "별도 모듈"],
      ["L7 애플리케이션 보호", "WAF + consult + eBPF", "—", "—", "CRS 인라인"],
      ["커널 / eBPF (XDP) 밴", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["오탐", "0.2%(측정됨)", "높음", "중간", "CRS 의존"],
      ["밴 지연", "~20 ms", "초~분", "초", "별도 통합"],
      ["짧은 안정성(5분)", "PASS(실패 0)", "—", "—", "—"],
      ["72시간 soak", "PASS(864/0)", "—", "—", "—"],
      ["증거 패키지 PDF+JSON", "자동(14개 파일)", "없음", "부분", "모듈별"],
      ["자동 테스트 매트릭스", "75개 테스트", "—", "부분", "—"],
      ["SOC 타임라인 / 대시보드", "예(:8443)", "—", "콘솔", "—"],
      ["Telegram 운영 + ack", "예(원클릭)", "—", "부분", "—"],
      ["설치 시간", "~15분", "분", "분", "시간(튜닝)"],
    ],
    vsRows1: [
      ["첫 요청을 즉시 차단", "반응형(로그 라인)", "반응형", "일부", "인라인(즉시)"],
      ["대용량 L3/L4 스크러빙", "없음 — CDN 권장", "없음", "없음", "없음"],
      ["커뮤니티 신호 네트워크", "셀프 호스팅", "—", "예(글로벌)", "—"],
      ["엣지 / 클라우드 WAF", "오리진 계층", "—", "Bouncer", "프록시 모드"],
      ["관리형 클라우드 / SaaS", "없음(셀프 호스팅)", "없음", "예(콘솔)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 또는 Debian 12(amd64)",
      "nginx + 쓰기 가능한 접근 로그(log_guardian 형식)",
      "Root 또는 sudo(systemd, ipset, /etc/log-guardian)",
      "~200 MB 디스크, 128 MB RAM(Core); Pro에는 Docker",
      "선택 Pro: eBPF/XDP에 5.10+ 커널, Docker(대시보드/메트릭)",
    ],
    setup: {
      pathTitles: ["새 서버 — .deb 패키지", "소스 코드 — 빌드 및 설치"],
      pathBadges: ["권장", "개발자"],
      pathNotes: [
        "빌드 불필요. 패키지에 바이너리, systemd 유닛, 규칙, 스크립트가 포함됩니다. 업그레이드 안전: 기존 /etc/log-guardian/rules.conf는 보존됩니다. GitHub Releases(log-guardian_*_amd64.deb)에서 받거나 bash scripts/build_deb.sh → dist/ 로 빌드하세요.",
        "GitHub 저장소를 클론하고 빌드하세요. 개발, 커스터마이징, 전체 소스 검토에 이상적. install.sh가 systemd 유닛, 규칙, nginx 로그 형식을 설정합니다.",
      ],
      pathSteps: [
        [
          { t: "의존성", d: "첫 설치 시 Debian 패키지 의존성을 추가합니다. nginx가 없으면 같은 명령으로 추가할 수 있습니다." },
          { t: "패키지 설치", d: "dpkg -i가 의존성 오류를 보고하면 apt-get install -f를 실행하세요. postinst 단계가 log-guardian 사용자, 권한, systemd 유닛, 기본 rules.conf를 자동 생성합니다." },
          { t: "첫 실행 및 API 보안", d: "nginx 로그 형식, FP trust, API 보안(토큰, fail-closed)을 한 번에 준비합니다. 스크립트는 패키지 내부(/usr/local/share/log-guardian/scripts/)에 있습니다." },
        ],
        [
          { t: "소스 및 빌드", d: "저장소를 클론하고 모든 코어로 빌드한 뒤 메인 설치 스크립트를 실행하세요." },
          { t: "첫 실행 및 토큰 동기화", d: "서비스를 올리고 API 토큰 동기화 및 대시보드 연결을 준비합니다." },
        ],
      ],
      commonTitle: "공통 단계(A 또는 B 이후)",
      commonSteps: [
        { t: "Nginx 로그 형식", d: "WAF가 요청 본문과 X-Forwarded-For를 읽으려면 log_guardian 로그 형식이 필요합니다. 설치가 보통 자동 적용합니다; STRICT 모드에서 확인하세요." },
        { t: "상태 및 헬스 체크", d: "데몬 IPC, 서비스 상태, BPF 기능을 확인하세요. 녹색 게이트: post_install_verify 끝에 FAIL: 0이 보여야 합니다." },
        { t: "메트릭 및 첫 밴 테스트", d: "Prometheus 메트릭을 확인하세요; 트래픽 후 카운터가 오르는지 관찰합니다. 공격 라인을 주입해 ipset에서 밴을 검증할 수 있습니다." },
        { t: "VirtualBox / XDP 없음(노트북 및 VM)", d: "eBPF/XDP가 없는 환경에서는 ipset 기반 밴과 함께 --no-xdp면 충분합니다. 서비스 의존성이 실패하면 복구 스크립트는 명령 하나입니다." },
      ],
      dashboardTitle: "Pro 대시보드 — 설치 후(선택)",
      dashboardBadge: "Pro · 선택",
      dashboardNote: "대시보드는 이 랜딩 사이트가 아니라 사용자 자신의 머신에서 실행됩니다. 프로덕션 스택은 Caddy + Docker를 통해 https://localhost:8443에서 제공됩니다.",
      dashboardSteps: [
        { t: "프로덕션 스택 시작", d: "사용자 자신의 서버에서 대시보드를 빌드하고 올립니다. 로그인: admin / .env의 DASHBOARD_ADMIN_PASSWORD." },
        { t: "원격 VPS용 SSH 터널", d: "대시보드를 인터넷에 노출하지 않고 안전하게 보려면 SSH 터널을 설정하세요; 먼저 서버를 하드닝합니다." },
      ],
    },
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
      { k: "280,373 EPS · 16.93× ModSec", v: "على نفس المجموعة وبنفس 121 نمط OWASP CRS (PCRE2 JIT)، يبلغ معدل معالجة WAF/CRS ‏280,373 EPS — أسرع بـ 16.93× من 16,560 EPS لدى ModSec. مقيس وقابل لإعادة الإنتاج (bench-vs-modsec.json)." },
      { k: "استرجاع 100% + تكافؤ CRS 100%", v: "121 قاعدة OWASP CRS، استرجاع 100% للهجمات الحقيقية على مجموعة من 1500 سطر وتكافؤ كامل مع ModSec — عند إيجابيات كاذبة 0.2%." },
      { k: "تغطية الهجمات الموزّعة", v: "كشف عنقود JA3 + حظر لكل IP — 100% في اختبار حي على 80 IP. Fail2ban أحادي الـ IP؛ وCrowdSec يتطلّب شبكة إشارات منفصلة." },
      { k: "دليل شفّاف قابل لإعادة الإنتاج", v: "75 اختباراً آلياً + حزمة أدلة من 14 ملفاً + soak لمدة 72 ساعة (864 عينة، 0 خطأ). المنافسون بلا دليل آلي أو دليلهم مجزّأ." },
      { k: "ذاتي الاستضافة · MIT · صُنع في تركيا", v: "بياناتك تبقى لديك، بلا احتكار مورّد، مفتوح المصدر بالكامل. خط زمني SOC ومقاييس Prometheus وتشغيل Telegram في لوحة واحدة (:8443)." },
    ],
    vsNote:
      "حدّ صادق: في بعض المجالات المنافسون أفضل بوضوح (الخلايا الحمراء). يتصدّر ModSec + CRS في الحظر الفوري لأول طلب؛ وCrowdSec قوي في شبكة إشارات المجتمع الموزّعة وكونسول SaaS المُدار. في المقابل، على نفس المجموعة وبنفس 121 نمط CRS، يبلغ معدل معالجة WAF/CRS لدينا ‏280,373 EPS — أي 16.93× من 16,560 EPS لدى ModSec (bench-vs-modsec.json).",
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
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["المقياس", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["نقاط القوة (مقاسة)", "حدود صادقة"],
    vsRows0: [
      ["سجل → WAF → حظر النواة", "سلسلة واحدة", "حظر فقط", "متجزئ", "WAF منفصل"],
      ["معدل معالجة WAF/CRS (نفس المجموعة)", "280,373 EPS (16.93×)", "—", "—", "16,560 EPS"],
      ["تكافؤ OWASP CRS", "100% (121 قاعدة)", "—", "—", "مرجع (100%)"],
      ["استرجاع الهجمات الحقيقية", "100% (1K+10K)", "—", "—", "100%"],
      ["حظر موزّع / عنقود JA3", "100% (80 IP)", "—", "قائم على الإشارة", "—"],
      ["استشارة nginx المضمّنة", "PASS", "—", "—", "وحدة منفصلة"],
      ["حماية تطبيقات L7", "WAF + استشارة + eBPF", "—", "—", "CRS مضمّن"],
      ["حظر النواة / eBPF (XDP)", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["إيجابية كاذبة", "0.2% (مقاس)", "مرتفع", "متوسط", "حسب CRS"],
      ["زمن الحظر", "~20 ms", "ثانية–دقيقة", "ثانية", "تكامل منفصل"],
      ["استقرار قصير (5 دقائق)", "PASS (0 فشل)", "—", "—", "—"],
      ["soak 72 ساعة", "PASS (864/0)", "—", "—", "—"],
      ["حزمة أدلة PDF+JSON", "تلقائي (14 ملفًا)", "لا شيء", "جزئي", "وحدة بوحدة"],
      ["مصفوفة اختبارات آلية", "75 اختبارًا", "—", "جزئي", "—"],
      ["مخطط زمني SOC / لوحة", "نعم (:8443)", "—", "طرفية", "—"],
      ["تشغيل Telegram + إقرار", "نعم (بنقرة)", "—", "جزئي", "—"],
      ["زمن التثبيت", "~15 دقيقة", "دقائق", "دقائق", "ساعات (ضبط)"],
    ],
    vsRows1: [
      ["حظر أول طلب فورًا", "تفاعلي (سطر سجل)", "تفاعلي", "جزئيًا", "مضمّن (فوري)"],
      ["تنظيف حجمي L3/L4", "لا شيء — يُنصح بـ CDN", "لا شيء", "لا شيء", "لا شيء"],
      ["شبكة إشارات مجتمعية", "استضافة ذاتية", "—", "نعم (عالمي)", "—"],
      ["Edge / WAF سحابي", "طبقة الأصل", "—", "Bouncer", "وضع الوكيل"],
      ["سحابة مُدارة / SaaS", "لا شيء (استضافة ذاتية)", "لا شيء", "نعم (طرفية)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 أو Debian 12 (amd64)",
      "nginx + سجل وصول قابل للكتابة (تنسيق log_guardian)",
      "Root أو sudo (systemd، ipset، /etc/log-guardian)",
      "~200 MB قرص، 128 MB RAM (Core); Docker لـ Pro",
      "Pro اختياري: نواة 5.10+ لـ eBPF/XDP، Docker (لوحة/مقاييس)",
    ],
    setup: {
      pathTitles: ["خادم جديد — حزمة .deb", "الكود المصدري — البناء والتثبيت"],
      pathBadges: ["موصى به", "مطوّر"],
      pathNotes: [
        "لا حاجة للبناء. تتضمن الحزمة الملف الثنائي ووحدات systemd والقواعد والسكربتات. آمنة للترقية: يُحتفظ بـ /etc/log-guardian/rules.conf الموجود. من GitHub Releases (log-guardian_*_amd64.deb) أو ابنِ عبر bash scripts/build_deb.sh → dist/.",
        "استنسخ مستودع GitHub وابنِ. مثالي للتطوير والتخصيص ومراجعة الكود الكاملة. يقوم install.sh بإعداد وحدات systemd والقواعد وتنسيق سجل nginx.",
      ],
      pathSteps: [
        [
          { t: "التبعيات", d: "عند التثبيت الأول، أضِف تبعيات حزمة Debian. إذا كان nginx مفقودًا يمكن إضافته في الأمر نفسه." },
          { t: "تثبيت الحزمة", d: "إذا أبلغ dpkg -i عن خطأ تبعيات، شغّل apt-get install -f. تنشئ خطوة postinst تلقائيًا مستخدم log-guardian والأذونات ووحدات systemd وملف rules.conf افتراضي." },
          { t: "التشغيل الأول وأمان API", d: "يُجهّز تنسيق سجل nginx وFP trust وأمان API (رمز، fail-closed) دفعة واحدة. السكربتات ضمن الحزمة (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "المصدر والبناء", d: "استنسخ المستودع، ابنِ بكل الأنوية وشغّل سكربت التثبيت الرئيسي." },
          { t: "التشغيل الأول ومزامنة الرمز", d: "يُشغّل الخدمات ويُجهّز مزامنة رمز API واتصال اللوحة." },
        ],
      ],
      commonTitle: "خطوات مشتركة (بعد A أو B)",
      commonSteps: [
        { t: "تنسيق سجل nginx", d: "تنسيق سجل log_guardian مطلوب ليقرأ WAF جسم الطلب وX-Forwarded-For. عادةً يطبّقه الإعداد تلقائيًا; تحقق في وضع STRICT." },
        { t: "فحص الصحة والحالة", d: "افحص IPC للخدمة وحالة الخدمة وميزات BPF. البوابة الخضراء: يجب أن ترى FAIL: 0 في نهاية post_install_verify." },
        { t: "المقاييس واختبار الحظر الأول", d: "افحص مقاييس Prometheus; راقب ارتفاع العدّادات بعد المرور. يمكنك حقن سطر هجوم والتحقق من الحظر في ipset." },
        { t: "VirtualBox / بدون XDP (حاسوب محمول وVM)", d: "في البيئات بدون eBPF/XDP، يكفي --no-xdp مع حظر قائم على ipset. إذا فشلت تبعية خدمة، فسكربت الإصلاح أمر واحد." },
      ],
      dashboardTitle: "لوحة Pro — بعد التثبيت (اختياري)",
      dashboardBadge: "Pro · اختياري",
      dashboardNote: "لا تعمل اللوحة على موقع الهبوط هذا بل على جهازك الخاص. تُقدَّم حزمة الإنتاج عبر Caddy + Docker على https://localhost:8443.",
      dashboardSteps: [
        { t: "تشغيل حزمة الإنتاج", d: "يبني ويُشغّل اللوحة على خادمك الخاص. الدخول: admin / DASHBOARD_ADMIN_PASSWORD من .env." },
        { t: "نفق SSH لـ VPS بعيد", d: "لعرض اللوحة بأمان دون كشفها للإنترنت، أعِدّ نفق SSH; قسِّ الخادم أولًا." },
      ],
    },
  },
  az: {
    pipelineNote:
      "XDR, Wasm marketi və LLM Copilot uzunmüddətli opsional qatlardır — Core tək başına istehsala hazırdır.",
    selectedBodies: [
      "Tək zəncir: nginx logu → OWASP CRS → ~20 ms kernel ban. ~15 dəqiqəyə istehsalda.",
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
      { k: "~20 ms kernel ban", v: "Log sətrindən ipset/XDP bana median ~20 ms. Fail2ban/CrowdSec saniyə–dəqiqə səviyyəsində qalır; 21 ölçülmüş nümunə ilə sübut olunub." },
      { k: "280.373 EPS · 16,93× ModSec", v: "Eyni korpus və eyni 121 OWASP CRS pattern (PCRE2 JIT) üzərində WAF/CRS ötürmə qabiliyyəti 280.373 EPS — ModSec-in 16.560 EPS-indən 16,93× daha sürətli. Ölçülmüş və təkrar istehsal olunandır (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS pariteti", v: "121 OWASP CRS qaydası, 1500 sətirlik korpusda real hücum recall 100% və ModSec ilə tam paritet — 0.2% yanlış pozitivdə." },
      { k: "Paylanmış hücum əhatəsi", v: "JA3 klaster aşkarlanması + IP başına ban — 80 IP canlı testdə 100%. Fail2ban tək IP-lidir; CrowdSec ayrıca siqnal şəbəkəsi tələb edir." },
      { k: "Şəffaf, təkrar istehsal edilə bilən sübut", v: "75 avtomatik test + 14 fayllıq sübut paketi + 72 saat soak (864 nümunə, 0 xəta). Rəqiblərdə avtomatik sübut yoxdur və ya parçalıdır." },
      { k: "Self-hosted · MIT · Türkiyə istehsalı", v: "Məlumatınız sizdə qalır, vendor asılılığı yoxdur, tam açıq mənbə. SOC zaman xətti, Prometheus metrikləri və Telegram idarəetməsi bir paneldə (:8443)." },
    ],
    vsNote:
      "Dürüst hədd: bəzi sahələrdə rəqiblər açıq şəkildə daha yaxşıdır (qırmızı xanalar). ModSec + CRS ilk sorğunun ani bloklanmasında öndədir; CrowdSec paylanmış icma siqnal şəbəkəsində və idarə olunan SaaS konsolunda güclüdür. Bunun müqabilində eyni korpus və eyni 121 CRS pattern üzərində WAF/CRS ötürmə qabiliyyətimiz 280.373 EPS — ModSec-in 16.560 EPS-indən 16,93× yüksəkdir (bench-vs-modsec.json).",
    vsLegend: "Qırmızı = həmin sətirdə qalib",
    honestItems: [
      "Reaktiv memarlıq — log sətri düşənə qədər ilk sorğu keçə bilər; ModSec-in inline sürətində deyilik.",
      "L3/L4 DDoS-u udmuruq — CDN arxasında dayanırıq.",
      "Paylanmış botnet — IP başına ban; CrowdSec siqnal şəbəkəsi yoxdur.",
      "Edir: log → CRS/WAF → ~20 ms kernel ban, sübut PDF-i, Telegram idarəetmə, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset ban (~15 dəq)",
      "eBPF demonu, panel, metriklər, filo",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Metrik", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Güclü tərəflər (ölçülmüş)", "Dürüst sərhədlər"],
    vsRows0: [
      ["Log → WAF → kernel ban", "Tək zəncir", "Yalnız ban", "Parça-parça", "WAF ayrı"],
      ["WAF/CRS ötürmə qabiliyyəti (eyni korpus)", "280.373 EPS (16,93×)", "—", "—", "16.560 EPS"],
      ["OWASP CRS pariteti", "100% (121 qayda)", "—", "—", "Referans (100%)"],
      ["Real hücum recall", "100% (1K+10K)", "—", "—", "100%"],
      ["Paylanmış / JA3 klaster ban", "100% (80 IP)", "—", "Siqnal əsaslı", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Ayrı modul"],
      ["L7 tətbiq qoruması", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Kernel / eBPF (XDP) ban", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Yanlış pozitiv", "0,2% (ölçülmüş)", "Yüksək", "Orta", "CRS-dən asılı"],
      ["Ban gecikməsi", "~20 ms", "san–dəq", "san", "Ayrı inteqrasiya"],
      ["Qısa sabitlik (5 dəq)", "PASS (0 uğursuzluq)", "—", "—", "—"],
      ["72s soak", "PASS (864/0)", "—", "—", "—"],
      ["Sübut paketi PDF+JSON", "Avtomatik (14 fayl)", "Yoxdur", "Qismən", "Modul-modul"],
      ["Avtomat test matrisi", "75 test", "—", "Qismən", "—"],
      ["SOC vaxt xətti / dashboard", "Bəli (:8443)", "—", "Konsol", "—"],
      ["Telegram əməliyyat + ack", "Bəli (bir klik)", "—", "Qismən", "—"],
      ["Quraşdırma vaxtı", "~15 dəq", "dəqiqə", "dəqiqə", "saat (tənzimləmə)"],
    ],
    vsRows1: [
      ["İlk sorğunu dərhal blokla", "Reaktiv (log sətri)", "Reaktiv", "Qismən", "Inline (dərhal)"],
      ["Volumetrik L3/L4 scrub", "Yoxdur — CDN tövsiyə", "Yoxdur", "Yoxdur", "Yoxdur"],
      ["İcma siqnal şəbəkəsi", "Öz-hostinq", "—", "Bəli (qlobal)", "—"],
      ["Edge / Cloud WAF", "Origin təbəqə", "—", "Bouncer", "Proksi rejimi"],
      ["İdarə olunan bulud / SaaS", "Yoxdur (öz-hostinq)", "Yoxdur", "Bəli (konsol)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 və ya Debian 12 (amd64)",
      "nginx + yazıla bilən access log (log_guardian formatı)",
      "Root və ya sudo (systemd, ipset, /etc/log-guardian)",
      "~200 MB disk, 128 MB RAM (Core); Pro üçün Docker",
      "Opsional Pro: eBPF/XDP üçün 5.10+ kernel, Docker (dashboard/metrikalar)",
    ],
    setup: {
      pathTitles: ["Təzə server — .deb paketi", "Mənbə kod — qurma və quraşdırma"],
      pathBadges: ["tövsiyə olunan", "developer"],
      pathNotes: [
        "Qurma tələb olunmur. Paket binar faylı, systemd unitləri, qaydaları və skriptləri gətirir. Yeniləməyə təhlükəsiz: mövcud /etc/log-guardian/rules.conf saxlanılır. GitHub Releases-dən (log-guardian_*_amd64.deb) və ya bash scripts/build_deb.sh → dist/ ilə qurun.",
        "GitHub repo-nu klonlayın və qurun. İnkişaf, fərdiləşdirmə və tam mənbə baxışı üçün ideal. install.sh systemd unitlərini, qaydaları və nginx log formatını qurur.",
      ],
      pathSteps: [
        [
          { t: "Asılılıqlar", d: "İlk quraşdırmada Debian paket asılılıqlarını əlavə edin. nginx yoxdursa, eyni əmrdə əlavə edilə bilər." },
          { t: "Paketi quraşdır", d: "dpkg -i asılılıq xətası bildirsə, apt-get install -f işə salın. postinst addımı log-guardian istifadəçisini, icazələri, systemd unitlərini və default rules.conf-u avtomatik yaradır." },
          { t: "İlk işə salma və API təhlükəsizliyi", d: "nginx log formatını, FP trust-u və API təhlükəsizliyini (token, fail-closed) bir dəfəyə hazırlayır. Skriptlər paketin içindədir (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Mənbə və qurma", d: "Repo-nu klonlayın, bütün nüvələrlə qurun və əsas quraşdırma skriptini işə salın." },
          { t: "İlk işə salma və token sinxronu", d: "Xidmətləri qaldırır və API token sinxronunu və dashboard bağlantısını hazırlayır." },
        ],
      ],
      commonTitle: "Ümumi addımlar (A və ya B-dən sonra)",
      commonSteps: [
        { t: "Nginx log formatı", d: "WAF-ın sorğu gövdəsini və X-Forwarded-For-u oxuması üçün log_guardian log formatı lazımdır. Setup adətən onu avtomatik tətbiq edir; STRICT rejimdə yoxlayın." },
        { t: "Sağlamlıq və status yoxlaması", d: "Daemon IPC-ni, xidmət statusunu və BPF xüsusiyyətlərini yoxlayın. Yaşıl qapı: post_install_verify sonunda FAIL: 0 görməlisiniz." },
        { t: "Metrikalar və ilk ban testi", d: "Prometheus metrikalarını yoxlayın; trafikdən sonra sayğacların qalxdığını izləyin. Hücum sətri yeridib ban-ı ipset-də yoxlaya bilərsiniz." },
        { t: "VirtualBox / XDP-siz (laptop və VM)", d: "eBPF/XDP olmayan mühitlərdə ipset əsaslı ban ilə --no-xdp kifayətdir. Xidmət asılılığı uğursuz olarsa, təmir skripti bir əmrdir." },
      ],
      dashboardTitle: "Pro dashboard — quraşdırmadan sonra (opsional)",
      dashboardBadge: "Pro · opsional",
      dashboardNote: "Dashboard bu landing saytında deyil, öz maşınınızda işləyir. Prod stack Caddy + Docker vasitəsilə https://localhost:8443 ünvanında xidmət edilir.",
      dashboardSteps: [
        { t: "Prod stack-i başlat", d: "Öz serverinizdə dashboard-u qurur və qaldırır. Giriş: admin / .env-dəki DASHBOARD_ADMIN_PASSWORD." },
        { t: "Uzaq VPS üçün SSH tunel", d: "Dashboard-u internetə açmadan təhlükəsiz görmək üçün SSH tunel qurun; əvvəlcə serveri sərtləşdirin." },
      ],
    },
  },
  kk: {
    pipelineNote:
      "XDR, Wasm маркеті және LLM Copilot — ұзақ мерзімді қосымша қабаттар; Core өздігінен өнімге дайын.",
    selectedBodies: [
      "Бір тізбек: nginx логы → OWASP CRS → ~20 мс kernel ban. ~15 минутта өнімде.",
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
      { k: "~20 мс kernel ban", v: "Лог жолынан ipset/XDP банға медиана ~20 мс. Fail2ban/CrowdSec секунд–минут деңгейінде қалады; 21 өлшенген үлгімен дәлелденген." },
      { k: "280 373 EPS · 16,93× ModSec", v: "Сол корпуста және сол 121 OWASP CRS үлгісінде (PCRE2 JIT) WAF/CRS өткізу қабілеті — 280 373 EPS, ModSec-тің 16 560 EPS-інен 16,93× жылдам. Өлшенген әрі қайта жаңғыртылатын (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS паритеті", v: "121 OWASP CRS ережесі, 1500 жолдық корпуста нақты шабуыл recall 100% және ModSec-пен толық паритет — 0.2% жалған позитивте." },
      { k: "Таратылған шабуылды қамту", v: "JA3 кластерін анықтау + IP бойынша бан — 80 IP тікелей тесте 100%. Fail2ban жалғыз IP-лік; CrowdSec бөлек сигнал желісін қажет етеді." },
      { k: "Ашық, қайта жаңғыртылатын дәлел", v: "75 автоматты тест + 14 файлдық дәлел пакеті + 72 сағат soak (864 үлгі, 0 қате). Бәсекелестерде автоматты дәлел жоқ немесе бөлшектелген." },
      { k: "Self-hosted · MIT · Түркияда жасалған", v: "Деректеріңіз сізде қалады, вендорға тәуелділік жоқ, толық ашық код. SOC уақыт сызығы, Prometheus метрикалары және Telegram басқаруы бір панельде (:8443)." },
    ],
    vsNote:
      "Адал шек: кейбір салаларда бәсекелестер анық жақсырақ (қызыл ұяшықтар). ModSec + CRS бірінші сұранысты лезде бұғаттауда алда; CrowdSec таратылған қауымдастық сигнал желісінде және басқарылатын SaaS консолінде мықты. Оның есесіне сол корпуста және сол 121 CRS үлгісінде WAF/CRS өткізу қабілетіміз — 280 373 EPS, ModSec-тің 16 560 EPS-інен 16,93× жоғары (bench-vs-modsec.json).",
    vsLegend: "Қызыл = сол жолдағы жеңімпаз",
    honestItems: [
      "Реактивті архитектура — лог жолы түскенше бірінші сұраныс өтуі мүмкін; біз ModSec-тің inline жылдамдығында емеспіз.",
      "L3/L4 DDoS-ты сіңірмейміз — CDN артында тұрамыз.",
      "Таратылған ботнет — IP бойынша бан; CrowdSec сигнал желісі жоқ.",
      "Істейді: лог → CRS/WAF → ~20 мс kernel ban, дәлел PDF, Telegram басқару, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset бан (~15 мин)",
      "eBPF демоны, панель, метрикалар, флот",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Метрика", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Күшті жақтары (өлшенген)", "Адал шектеулер"],
    vsRows0: [
      ["Лог → WAF → ядро бан", "Бір тізбек", "Тек бан", "Бөлшектеп", "WAF бөлек"],
      ["WAF/CRS өткізу қабілеті (сол корпус)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["OWASP CRS паритеті", "100% (121 ереже)", "—", "—", "Эталон (100%)"],
      ["Нақты шабуыл recall", "100% (1K+10K)", "—", "—", "100%"],
      ["Таратылған / JA3 кластер бан", "100% (80 IP)", "—", "Сигнал негізді", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Бөлек модуль"],
      ["L7 қолданба қорғауы", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Ядро / eBPF (XDP) бан", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Жалған позитив", "0,2% (өлшенген)", "Жоғары", "Орташа", "CRS-ке тәуелді"],
      ["Бан кідірісі", "~20 мс", "сек–мин", "сек", "Бөлек интеграция"],
      ["Қысқа тұрақтылық (5 мин)", "PASS (0 сәтсіздік)", "—", "—", "—"],
      ["72с soak", "PASS (864/0)", "—", "—", "—"],
      ["Дәлел пакеті PDF+JSON", "Автоматты (14 файл)", "Жоқ", "Ішінара", "Модуль-модуль"],
      ["Автомат тест матрицасы", "75 тест", "—", "Ішінара", "—"],
      ["SOC уақыт сызығы / дашборд", "Иә (:8443)", "—", "Консоль", "—"],
      ["Telegram операция + ack", "Иә (бір басу)", "—", "Ішінара", "—"],
      ["Орнату уақыты", "~15 мин", "минут", "минут", "сағат (баптау)"],
    ],
    vsRows1: [
      ["Бірінші сұрауды бірден бөгеу", "Реактивті (лог жолы)", "Реактивті", "Ішінара", "Inline (лезде)"],
      ["Көлемдік L3/L4 тазалау", "Жоқ — CDN ұсынылады", "Жоқ", "Жоқ", "Жоқ"],
      ["Қауымдастық сигнал желісі", "Өзін-өзі хостинг", "—", "Иә (жаһандық)", "—"],
      ["Edge / Cloud WAF", "Origin қабаты", "—", "Bouncer", "Прокси режимі"],
      ["Басқарылатын бұлт / SaaS", "Жоқ (өзін-өзі хостинг)", "Жоқ", "Иә (консоль)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 немесе Debian 12 (amd64)",
      "nginx + жазылатын access лог (log_guardian форматы)",
      "Root немесе sudo (systemd, ipset, /etc/log-guardian)",
      "~200 МБ диск, 128 МБ RAM (Core); Pro үшін Docker",
      "Қосымша Pro: eBPF/XDP үшін 5.10+ ядро, Docker (дашборд/метрикалар)",
    ],
    setup: {
      pathTitles: ["Жаңа сервер — .deb пакеті", "Бастапқы код — құрастыру және орнату"],
      pathBadges: ["ұсынылады", "әзірлеуші"],
      pathNotes: [
        "Құрастыру қажет емес. Пакет бинарды, systemd юниттерін, ережелер мен скрипттерді әкеледі. Жаңартуға қауіпсіз: бар /etc/log-guardian/rules.conf сақталады. GitHub Releases-тен (log-guardian_*_amd64.deb) немесе bash scripts/build_deb.sh → dist/ арқылы құрастырыңыз.",
        "GitHub репозиторийін клондап, құрастырыңыз. Әзірлеу, теңшеу және толық код тексеруі үшін тамаша. install.sh systemd юниттерін, ережелерді және nginx лог форматын орнатады.",
      ],
      pathSteps: [
        [
          { t: "Тәуелділіктер", d: "Алғашқы орнатуда Debian пакет тәуелділіктерін қосыңыз. nginx жоқ болса, оны сол әмірде қосуға болады." },
          { t: "Пакетті орнату", d: "dpkg -i тәуелділік қатесін хабарласа, apt-get install -f орындаңыз. postinst қадамы log-guardian пайдаланушысын, рұқсаттарды, systemd юниттерін және әдепкі rules.conf-ты автоматты жасайды." },
          { t: "Алғашқы іске қосу және API қауіпсіздігі", d: "nginx лог форматын, FP trust-ты және API қауіпсіздігін (токен, fail-closed) бір мезетте дайындайды. Скрипттер пакет ішінде (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Бастапқы код және құрастыру", d: "Репозиторийді клондап, барлық ядролармен құрастырыңыз және негізгі орнату скриптін орындаңыз." },
          { t: "Алғашқы іске қосу және токен синхроны", d: "Қызметтерді көтереді және API токен синхронын мен дашборд байланысын дайындайды." },
        ],
      ],
      commonTitle: "Ортақ қадамдар (A немесе B кейін)",
      commonSteps: [
        { t: "Nginx лог форматы", d: "WAF сұрау денесін және X-Forwarded-For-ды оқуы үшін log_guardian лог форматы қажет. Setup оны әдетте автоматты қолданады; STRICT режимде тексеріңіз." },
        { t: "Денсаулық және күй тексеруі", d: "Daemon IPC-ді, қызмет күйін және BPF мүмкіндіктерін тексеріңіз. Жасыл қақпа: post_install_verify соңында FAIL: 0 көруіңіз керек." },
        { t: "Метрикалар және алғашқы бан тесті", d: "Prometheus метрикаларын тексеріңіз; трафиктен кейін санауыштардың өсуін бақылаңыз. Шабуыл жолын енгізіп бан-ды ipset-те тексере аласыз." },
        { t: "VirtualBox / XDP-сіз (ноутбук және VM)", d: "eBPF/XDP жоқ орталарда ipset негізді бан мен --no-xdp жеткілікті. Қызмет тәуелділігі сәтсіз болса, жөндеу скрипті бір әмір." },
      ],
      dashboardTitle: "Pro дашборд — орнатудан кейін (қосымша)",
      dashboardBadge: "Pro · қосымша",
      dashboardNote: "Дашборд осы landing сайтта емес, өз машинаңызда жұмыс істейді. Prod стек Caddy + Docker арқылы https://localhost:8443 мекенжайында ұсынылады.",
      dashboardSteps: [
        { t: "Prod стекті іске қосу", d: "Өз серверіңізде дашбордты құрастырып көтереді. Кіру: admin / .env-тегі DASHBOARD_ADMIN_PASSWORD." },
        { t: "Қашықтағы VPS үшін SSH туннель", d: "Дашбордты интернетке ашпай қауіпсіз көру үшін SSH туннель орнатыңыз; алдымен серверді қатайтыңыз." },
      ],
    },
  },
  uz: {
    pipelineNote:
      "XDR, Wasm marketi va LLM Copilot — uzoq muddatli ixtiyoriy qatlamlar; Core o'zi ishlab chiqarishga tayyor.",
    selectedBodies: [
      "Yagona zanjir: nginx logi → OWASP CRS → ~20 ms kernel ban. ~15 daqiqada ishlab chiqarishda.",
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
      { k: "~20 ms kernel ban", v: "Log qatoridan ipset/XDP banga median ~20 ms. Fail2ban/CrowdSec soniya–daqiqa darajasida qoladi; 21 o'lchangan namuna bilan isbotlangan." },
      { k: "280 373 EPS · 16,93× ModSec", v: "Xuddi shu korpus va xuddi shu 121 OWASP CRS pattern (PCRE2 JIT) ustida WAF/CRS o'tkazuvchanligi 280 373 EPS — ModSec'ning 16 560 EPS'idan 16,93× tez. O'lchangan va qayta ishlab chiqariladigan (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS pariteti", v: "121 OWASP CRS qoidasi, 1500 qatorli korpusda haqiqiy hujum recall 100% va ModSec bilan to'liq paritet — 0.2% noto'g'ri pozitivda." },
      { k: "Taqsimlangan hujum qamrovi", v: "JA3 klaster aniqlash + IP bo'yicha ban — 80 IP jonli testda 100%. Fail2ban yagona IP'li; CrowdSec alohida signal tarmog'ini talab qiladi." },
      { k: "Shaffof, qayta ishlab chiqariladigan dalil", v: "75 avtomatik test + 14 fayllik dalil to'plami + 72 soat soak (864 namuna, 0 xato). Raqiblarda avtomatik dalil yo'q yoki bo'lak-bo'lak." },
      { k: "Self-hosted · MIT · Turkiyada ishlab chiqilgan", v: "Ma'lumotingiz sizda qoladi, vendor qaramligi yo'q, to'liq ochiq kod. SOC vaqt chizig'i, Prometheus metrikalari va Telegram boshqaruvi bitta panelda (:8443)." },
    ],
    vsNote:
      "Halol chegara: ba'zi sohalarda raqiblar aniq yaxshiroq (qizil kataklar). ModSec + CRS birinchi so'rovni bir zumda bloklashda oldinda; CrowdSec taqsimlangan hamjamiyat signal tarmog'ida va boshqariladigan SaaS konsolida kuchli. Buning evaziga xuddi shu korpus va xuddi shu 121 CRS pattern ustida WAF/CRS o'tkazuvchanligimiz 280 373 EPS — ModSec'ning 16 560 EPS'idan 16,93× yuqori (bench-vs-modsec.json).",
    vsLegend: "Qizil = shu qatordagi g'olib",
    honestItems: [
      "Reaktiv arxitektura — log qatori tushguncha birinchi so'rov o'tishi mumkin; biz ModSec'ning inline tezligida emasmiz.",
      "L3/L4 DDoS'ni yutmaymiz — CDN orqasida turamiz.",
      "Taqsimlangan botnet — IP bo'yicha ban; CrowdSec signal tarmog'i yo'q.",
      "Qiladi: log → CRS/WAF → ~20 ms kernel ban, dalil PDF, Telegram boshqaruvi, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset ban (~15 daq)",
      "eBPF demoni, panel, metrikalar, flot",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Metrika", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Kuchli tomonlar (o'lchangan)", "Halol chegaralar"],
    vsRows0: [
      ["Log → WAF → yadro ban", "Yagona zanjir", "Faqat ban", "Bo'lak-bo'lak", "WAF alohida"],
      ["WAF/CRS o'tkazuvchanligi (xuddi shu korpus)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["OWASP CRS pariteti", "100% (121 qoida)", "—", "—", "Etalon (100%)"],
      ["Haqiqiy hujum recall", "100% (1K+10K)", "—", "—", "100%"],
      ["Taqsimlangan / JA3 klaster ban", "100% (80 IP)", "—", "Signal asosli", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Alohida modul"],
      ["L7 ilova himoyasi", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Yadro / eBPF (XDP) ban", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Noto'g'ri pozitiv", "0,2% (o'lchangan)", "Yuqori", "O'rta", "CRS-ga bog'liq"],
      ["Ban kechikishi", "~20 ms", "son–daq", "son", "Alohida integratsiya"],
      ["Qisqa barqarorlik (5 daq)", "PASS (0 nosozlik)", "—", "—", "—"],
      ["72s soak", "PASS (864/0)", "—", "—", "—"],
      ["Dalil paketi PDF+JSON", "Avtomatik (14 fayl)", "Yo'q", "Qisman", "Modul-modul"],
      ["Avtomat test matritsasi", "75 test", "—", "Qisman", "—"],
      ["SOC vaqt chizig'i / dashboard", "Ha (:8443)", "—", "Konsol", "—"],
      ["Telegram operatsiya + ack", "Ha (bir bosish)", "—", "Qisman", "—"],
      ["O'rnatish vaqti", "~15 daq", "daqiqa", "daqiqa", "soat (sozlash)"],
    ],
    vsRows1: [
      ["Birinchi so'rovni darhol bloklash", "Reaktiv (log qatori)", "Reaktiv", "Qisman", "Inline (darhol)"],
      ["Hajmli L3/L4 tozalash", "Yo'q — CDN tavsiya", "Yo'q", "Yo'q", "Yo'q"],
      ["Jamoa signal tarmog'i", "O'zini xosting", "—", "Ha (global)", "—"],
      ["Edge / Cloud WAF", "Origin qatlami", "—", "Bouncer", "Proksi rejimi"],
      ["Boshqariladigan bulut / SaaS", "Yo'q (o'zini xosting)", "Yo'q", "Ha (konsol)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 yoki Debian 12 (amd64)",
      "nginx + yoziladigan access log (log_guardian formati)",
      "Root yoki sudo (systemd, ipset, /etc/log-guardian)",
      "~200 MB disk, 128 MB RAM (Core); Pro uchun Docker",
      "Ixtiyoriy Pro: eBPF/XDP uchun 5.10+ yadro, Docker (dashboard/metrikalar)",
    ],
    setup: {
      pathTitles: ["Yangi server — .deb paketi", "Manba kod — qurish va o'rnatish"],
      pathBadges: ["tavsiya etiladi", "dasturchi"],
      pathNotes: [
        "Qurish shart emas. Paket binar faylni, systemd unitlarini, qoidalar va skriptlarni keltiradi. Yangilashga xavfsiz: mavjud /etc/log-guardian/rules.conf saqlanadi. GitHub Releases-dan (log-guardian_*_amd64.deb) yoki bash scripts/build_deb.sh → dist/ orqali quring.",
        "GitHub repozitoriyini klonlang va quring. Ishlab chiqish, sozlash va to'liq manba ko'rigi uchun ideal. install.sh systemd unitlarini, qoidalarni va nginx log formatini o'rnatadi.",
      ],
      pathSteps: [
        [
          { t: "Bog'liqliklar", d: "Birinchi o'rnatishda Debian paket bog'liqliklarini qo'shing. nginx yo'q bo'lsa, uni o'sha buyruqda qo'shish mumkin." },
          { t: "Paketni o'rnatish", d: "dpkg -i bog'liqlik xatosi bersa, apt-get install -f ni ishga tushiring. postinst bosqichi log-guardian foydalanuvchisini, ruxsatlarni, systemd unitlarini va standart rules.conf ni avtomatik yaratadi." },
          { t: "Birinchi ishga tushirish va API xavfsizligi", d: "nginx log formatini, FP trust-ni va API xavfsizligini (token, fail-closed) bir yo'la tayyorlaydi. Skriptlar paket ichida (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Manba va qurish", d: "Repozitoriyni klonlang, barcha yadrolar bilan quring va asosiy o'rnatish skriptini ishga tushiring." },
          { t: "Birinchi ishga tushirish va token sinxroni", d: "Xizmatlarni ko'taradi va API token sinxroni hamda dashboard ulanishini tayyorlaydi." },
        ],
      ],
      commonTitle: "Umumiy bosqichlar (A yoki B dan keyin)",
      commonSteps: [
        { t: "Nginx log formati", d: "WAF so'rov tanasini va X-Forwarded-For-ni o'qishi uchun log_guardian log formati kerak. Setup uni odatda avtomatik qo'llaydi; STRICT rejimda tekshiring." },
        { t: "Sog'liq va holat tekshiruvi", d: "Daemon IPC-ni, xizmat holatini va BPF xususiyatlarini tekshiring. Yashil darvoza: post_install_verify oxirida FAIL: 0 ko'rishingiz kerak." },
        { t: "Metrikalar va birinchi ban testi", d: "Prometheus metrikalarini tekshiring; trafikdan keyin hisoblagichlar ko'tarilishini kuzating. Hujum qatorini kiritib ban-ni ipset-da tekshirishingiz mumkin." },
        { t: "VirtualBox / XDP-siz (noutbuk va VM)", d: "eBPF/XDP yo'q muhitlarda ipset asosli ban bilan --no-xdp yetarli. Xizmat bog'liqligi muvaffaqiyatsiz bo'lsa, ta'mirlash skripti bitta buyruq." },
      ],
      dashboardTitle: "Pro dashboard — o'rnatishdan keyin (ixtiyoriy)",
      dashboardBadge: "Pro · ixtiyoriy",
      dashboardNote: "Dashboard ushbu landing saytida emas, o'z mashinangizda ishlaydi. Prod stack Caddy + Docker orqali https://localhost:8443 manzilida xizmat qiladi.",
      dashboardSteps: [
        { t: "Prod stack-ni ishga tushirish", d: "O'z serveringizda dashboard-ni quradi va ko'taradi. Kirish: admin / .env-dagi DASHBOARD_ADMIN_PASSWORD." },
        { t: "Uzoq VPS uchun SSH tunnel", d: "Dashboard-ni internetga ochmasdan xavfsiz ko'rish uchun SSH tunnel o'rnating; avval serverni mustahkamlang." },
      ],
    },
  },
  ky: {
    pipelineNote:
      "XDR, Wasm маркети жана LLM Copilot — узак мөөнөттүү кошумча катмарлар; Core өзү өндүрүшкө даяр.",
    selectedBodies: [
      "Бирдиктүү чынжыр: nginx логу → OWASP CRS → ~20 мс kernel ban. ~15 мүнөттө өндүрүштө.",
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
      { k: "~20 мс kernel ban", v: "Лог сабынан ipset/XDP банга медиана ~20 мс. Fail2ban/CrowdSec секунд–мүнөт деңгээлинде калат; 21 өлчөнгөн үлгү менен далилденген." },
      { k: "280 373 EPS · 16,93× ModSec", v: "Ошол эле корпусто жана ошол эле 121 OWASP CRS үлгүсүндө (PCRE2 JIT) WAF/CRS өткөрүмдүүлүгү — 280 373 EPS, ModSec'тин 16 560 EPS'инен 16,93× тезирээк. Өлчөнгөн жана кайра чыгарылуучу (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS паритети", v: "121 OWASP CRS эрежеси, 1500 саптык корпуста чыныгы чабуул recall 100% жана ModSec менен толук паритет — 0.2% жалган позитивде." },
      { k: "Бөлүштүрүлгөн чабуулду камтуу", v: "JA3 кластерин аныктоо + IP боюнча ban — 80 IP түз тестте 100%. Fail2ban жалгыз IP'лик; CrowdSec өзүнчө сигнал тармагын талап кылат." },
      { k: "Ачык, кайра чыгарылуучу далил", v: "75 автоматтык тест + 14 файлдык далил топтому + 72 саат soak (864 үлгү, 0 ката). Атаандаштарда автоматтык далил жок же бөлүк-бөлүк." },
      { k: "Self-hosted · MIT · Түркияда жасалган", v: "Маалыматыңыз сизде калат, вендорго көз карандылык жок, толук ачык код. SOC убакыт сызыгы, Prometheus метрикалары жана Telegram башкаруусу бир панелде (:8443)." },
    ],
    vsNote:
      "Чынчыл чек: кээ бир тармактарда атаандаштар ачык жакшыраак (кызыл уячалар). ModSec + CRS биринчи сурамды заматта бөгөттөөдө алдыда; CrowdSec бөлүштүрүлгөн коомдук сигнал тармагында жана башкарылуучу SaaS консолунда күчтүү. Анын ордуна ошол эле корпусто жана ошол эле 121 CRS үлгүсүндө WAF/CRS өткөрүмдүүлүгүбүз — 280 373 EPS, ModSec'тин 16 560 EPS'инен 16,93× жогору (bench-vs-modsec.json).",
    vsLegend: "Кызыл = ошол саптагы жеңүүчү",
    honestItems: [
      "Реактивдүү архитектура — лог сабы түшкөнгө чейин биринчи сурам өтүшү мүмкүн; биз ModSec'тин inline ылдамдыгында эмеспиз.",
      "L3/L4 DDoS'ту сиңирбейбиз — CDN артында турабыз.",
      "Бөлүштүрүлгөн ботнет — IP боюнча ban; CrowdSec сигнал тармагы жок.",
      "Кылат: лог → CRS/WAF → ~20 мс kernel ban, далил PDF, Telegram башкаруу, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset ban (~15 мүн)",
      "eBPF демону, панель, метрикалар, флот",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Метрика", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Күчтүү жактары (өлчөнгөн)", "Чынчыл чектөөлөр"],
    vsRows0: [
      ["Лог → WAF → ядро бан", "Бир чынжыр", "Бан гана", "Бөлүктөп", "WAF өзүнчө"],
      ["WAF/CRS өткөрүмдүүлүгү (ошол эле корпус)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["OWASP CRS паритети", "100% (121 эреже)", "—", "—", "Эталон (100%)"],
      ["Чыныгы кол салуу recall", "100% (1K+10K)", "—", "—", "100%"],
      ["Бөлүштүрүлгөн / JA3 кластер бан", "100% (80 IP)", "—", "Сигнал негизинде", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Өзүнчө модуль"],
      ["L7 колдонмо коргоосу", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Ядро / eBPF (XDP) бан", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Жалган позитив", "0,2% (өлчөнгөн)", "Жогорку", "Орточо", "CRS-ке көз каранды"],
      ["Бан кечигүүсү", "~20 мс", "сек–мүн", "сек", "Өзүнчө интеграция"],
      ["Кыска туруктуулук (5 мүн)", "PASS (0 ката)", "—", "—", "—"],
      ["72с soak", "PASS (864/0)", "—", "—", "—"],
      ["Далил топтому PDF+JSON", "Автоматтык (14 файл)", "Жок", "Жарым-жартылай", "Модуль-модуль"],
      ["Автомат тест матрицасы", "75 тест", "—", "Жарым-жартылай", "—"],
      ["SOC убакыт сызыгы / дашборд", "Ооба (:8443)", "—", "Консоль", "—"],
      ["Telegram операция + ack", "Ооба (бир басуу)", "—", "Жарым-жартылай", "—"],
      ["Орнотуу убактысы", "~15 мүн", "мүнөт", "мүнөт", "саат (тууралоо)"],
    ],
    vsRows1: [
      ["Биринчи сурамды дароо бөгөө", "Реактивдүү (лог сабы)", "Реактивдүү", "Жарым-жартылай", "Inline (дароо)"],
      ["Көлөмдүк L3/L4 тазалоо", "Жок — CDN сунушталат", "Жок", "Жок", "Жок"],
      ["Коомчулук сигнал тармагы", "Өз-хостинг", "—", "Ооба (глобалдык)", "—"],
      ["Edge / Cloud WAF", "Origin катмары", "—", "Bouncer", "Прокси режими"],
      ["Башкарылуучу булут / SaaS", "Жок (өз-хостинг)", "Жок", "Ооба (консоль)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 же Debian 12 (amd64)",
      "nginx + жазылуучу access лог (log_guardian форматы)",
      "Root же sudo (systemd, ipset, /etc/log-guardian)",
      "~200 МБ диск, 128 МБ RAM (Core); Pro үчүн Docker",
      "Кошумча Pro: eBPF/XDP үчүн 5.10+ ядро, Docker (дашборд/метрикалар)",
    ],
    setup: {
      pathTitles: ["Жаңы сервер — .deb пакети", "Баштапкы код — куруу жана орнотуу"],
      pathBadges: ["сунушталат", "иштеп чыгуучу"],
      pathNotes: [
        "Куруу талап кылынбайт. Пакет бинарды, systemd юниттерин, эрежелерди жана скрипттерди алып келет. Жаңылоого коопсуз: бар /etc/log-guardian/rules.conf сакталат. GitHub Releases-тен (log-guardian_*_amd64.deb) же bash scripts/build_deb.sh → dist/ аркылуу куруңуз.",
        "GitHub репозиторийин клондоп, куруңуз. Иштеп чыгуу, ыңгайлаштыруу жана толук код текшерүү үчүн эң сонун. install.sh systemd юниттерин, эрежелерди жана nginx лог форматын орнотот.",
      ],
      pathSteps: [
        [
          { t: "Көз карандылыктар", d: "Биринчи орнотууда Debian пакет көз карандылыктарын кошуңуз. nginx жок болсо, аны ошол эле буйрукта кошсо болот." },
          { t: "Пакетти орнотуу", d: "dpkg -i көз карандылык катасын билдирсе, apt-get install -f иштетиңиз. postinst кадамы log-guardian колдонуучусун, уруксаттарды, systemd юниттерин жана демейки rules.conf-ту автоматтык түзөт." },
          { t: "Биринчи ишке киргизүү жана API коопсуздугу", d: "nginx лог форматын, FP trust-ту жана API коопсуздугун (токен, fail-closed) бир жолу даярдайт. Скрипттер пакеттин ичинде (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Баштапкы код жана куруу", d: "Репозиторийди клондоп, бардык өзөктөр менен куруп, негизги орнотуу скриптин иштетиңиз." },
          { t: "Биринчи ишке киргизүү жана токен синхрону", d: "Кызматтарды көтөрөт жана API токен синхронун жана дашборд байланышын даярдайт." },
        ],
      ],
      commonTitle: "Жалпы кадамдар (A же B кийин)",
      commonSteps: [
        { t: "Nginx лог форматы", d: "WAF сурам денесин жана X-Forwarded-For-ду окуш үчүн log_guardian лог форматы керек. Setup аны адатта автоматтык колдонот; STRICT режиминде текшериңиз." },
        { t: "Ден соолук жана абал текшерүү", d: "Daemon IPC-ди, кызмат абалын жана BPF мүмкүнчүлүктөрүн текшериңиз. Жашыл дарбаза: post_install_verify аягында FAIL: 0 көрүшүңүз керек." },
        { t: "Метрикалар жана биринчи бан тести", d: "Prometheus метрикаларын текшериңиз; трафиктен кийин эсептегичтердин көтөрүлүшүн байкаңыз. Кол салуу сабын киргизип бан-ды ipset-те текшере аласыз." },
        { t: "VirtualBox / XDP-сиз (ноутбук жана VM)", d: "eBPF/XDP жок чөйрөлөрдө ipset негизиндеги бан менен --no-xdp жетиштүү. Кызмат көз карандылыгы ишке ашпаса, оңдоо скрипти бир буйрук." },
      ],
      dashboardTitle: "Pro дашборд — орнотуудан кийин (кошумча)",
      dashboardBadge: "Pro · кошумча",
      dashboardNote: "Дашборд бул landing сайтта эмес, өз машинаңызда иштейт. Prod стек Caddy + Docker аркылуу https://localhost:8443 дарегинде тейленет.",
      dashboardSteps: [
        { t: "Prod стекти ишке киргизүү", d: "Өз серверинизде дашбордду курат жана көтөрөт. Кирүү: admin / .env-деги DASHBOARD_ADMIN_PASSWORD." },
        { t: "Алыскы VPS үчүн SSH туннель", d: "Дашбордду интернетке ачпай коопсуз көрүү үчүн SSH туннель орнотуңуз; адегенде серверди катыраңыз." },
      ],
    },
  },
  tk: {
    pipelineNote:
      "XDR, Wasm marketi we LLM Copilot uzak möhletli goşmaça gatlaklardyr — Core ýeke özi önümçilige taýýar.",
    selectedBodies: [
      "Ýeke zynjyr: nginx logy → OWASP CRS → ~20 ms kernel ban. ~15 minutda önümçilikde.",
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
      { k: "~20 ms kernel ban", v: "Log setirinden ipset/XDP bana mediana ~20 ms. Fail2ban/CrowdSec sekunt–minut derejesinde galýar; 5 ölçelen nusga bilen subut edildi." },
      { k: "280 373 EPS · 16,93× ModSec", v: "Şol korpusda we şol 121 OWASP CRS patterninde (PCRE2 JIT) WAF/CRS geçirijiligi 280 373 EPS — ModSec-iň 16 560 EPS-inden 16,93× çalt. Ölçelen we gaýtadan öndürilýän (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS pariteti", v: "121 OWASP CRS düzgüni, 1500 setirli korpusda hakyky hüjüm recall 100% we ModSec bilen doly paritet — 0.2% ýalňyş pozitiwde." },
      { k: "Paýlanan hüjümi gurşap almak", v: "JA3 klaster ýüze çykarmak + IP boýunça ban — 80 IP göni testde 100%. Fail2ban ýeke IP'li; CrowdSec aýratyn signal ulgamyny talap edýär." },
      { k: "Aýdyň, gaýtadan öndürilýän subutnama", v: "75 awtomatik test + 14 faýlly subutnama paketi + 72 sagat soak (864 nusga, 0 ýalňyşlyk). Bäsdeşlerde awtomatik subutnama ýok ýa-da bölek-bölek." },
      { k: "Self-hosted · MIT · Türkiýede öndürilen", v: "Maglumatyňyz sizde galýar, wendor garaşlylygy ýok, doly açyk kod. SOC wagt çyzygy, Prometheus metrikalary we Telegram dolandyryşy bir panelde (:8443)." },
    ],
    vsNote:
      "Dogruçyl çäk: käbir ugurlarda bäsdeşler aýdyň has gowy (gyzyl öýjükler). ModSec + CRS ilkinji soragy derrew bloklamakda öňde; CrowdSec paýlanan jemgyýet signal ulgamynda we dolandyrylýan SaaS konsolynda güýçli. Munuň öwezine şol korpusda we şol 121 CRS patterninde WAF/CRS geçirijiligimiz 280 373 EPS — ModSec-iň 16 560 EPS-inden 16,93× ýokary (bench-vs-modsec.json).",
    vsLegend: "Gyzyl = şol setirdäki ýeňiji",
    honestItems: [
      "Reaktiw arhitektura — log setiri düşýänçä ilkinji sorag geçip biler; biz ModSec-iň inline tizliginde däl.",
      "L3/L4 DDoS-y siňdirmeýäris — CDN arkasynda durýarys.",
      "Paýlanan botnet — IP boýunça ban; CrowdSec signal ulgamy ýok.",
      "Edýär: log → CRS/WAF → ~20 ms kernel ban, subutnama PDF, Telegram dolandyryş, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset ban (~15 min)",
      "eBPF demony, panel, metrikalar, flot",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Metrika", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Güýçli taraplary (ölçelen)", "Dogruçyl çäkler"],
    vsRows0: [
      ["Log → WAF → ýadro ban", "Ýeke zynjyr", "Diňe ban", "Böleklaýyn", "WAF aýry"],
      ["WAF/CRS geçirijiligi (şol korpus)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["OWASP CRS pariteti", "100% (121 düzgün)", "—", "—", "Etalon (100%)"],
      ["Hakyky hüjüm recall", "100% (1K+10K)", "—", "—", "100%"],
      ["Paýlanan / JA3 klaster ban", "100% (80 IP)", "—", "Signal esasly", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Aýry modul"],
      ["L7 programma goragy", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Ýadro / eBPF (XDP) ban", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Ýalňyş pozitiw", "0,2% (ölçelen)", "Ýokary", "Orta", "CRS-e bagly"],
      ["Ban gijikdirmesi", "~20 ms", "sek–min", "sek", "Aýry integrasiýa"],
      ["Gysga durnuklylyk (5 min)", "PASS (0 şowsuzlyk)", "—", "—", "—"],
      ["72s soak", "PASS (864/0)", "—", "—", "—"],
      ["Subutnama paketi PDF+JSON", "Awtomatik (14 faýl)", "Ýok", "Kismen", "Modul-modul"],
      ["Awtomat test matrisasy", "75 test", "—", "Kismen", "—"],
      ["SOC wagt çyzygy / dashboard", "Hawa (:8443)", "—", "Konsol", "—"],
      ["Telegram operasiýa + ack", "Hawa (bir basyş)", "—", "Kismen", "—"],
      ["Gurnama wagty", "~15 min", "minut", "minut", "sagat (sazlama)"],
    ],
    vsRows1: [
      ["Ilkinji islegi derrew blokla", "Reaktiw (log setiri)", "Reaktiw", "Kismen", "Inline (derrew)"],
      ["Wolýumetrik L3/L4 arassalaýyş", "Ýok — CDN maslahat berilýär", "Ýok", "Ýok", "Ýok"],
      ["Jemgyýet signal ulgamy", "Öz-hosting", "—", "Hawa (global)", "—"],
      ["Edge / Cloud WAF", "Origin gatlak", "—", "Bouncer", "Proksi režimi"],
      ["Dolandyrylýan bulut / SaaS", "Ýok (öz-hosting)", "Ýok", "Hawa (konsol)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 ýa-da Debian 12 (amd64)",
      "nginx + ýazylýan access log (log_guardian formaty)",
      "Root ýa-da sudo (systemd, ipset, /etc/log-guardian)",
      "~200 MB disk, 128 MB RAM (Core); Pro üçin Docker",
      "Islege bagly Pro: eBPF/XDP üçin 5.10+ ýadro, Docker (dashboard/metrikalar)",
    ],
    setup: {
      pathTitles: ["Täze server — .deb paketi", "Çeşme kod — gurmak we gurnamak"],
      pathBadges: ["maslahat berilýär", "işläp düzüji"],
      pathNotes: [
        "Gurmak talap edilmeýär. Paket binar faýly, systemd unitleri, düzgünleri we skriptleri getirýär. Täzelemäge howpsuz: bar bolan /etc/log-guardian/rules.conf saklanýar. GitHub Releases-den (log-guardian_*_amd64.deb) ýa-da bash scripts/build_deb.sh → dist/ arkaly guruň.",
        "GitHub repo-ny klonlaň we guruň. Ösüş, sazlama we doly çeşme barlagy üçin ideal. install.sh systemd unitlerini, düzgünleri we nginx log formatyny gurnaýar.",
      ],
      pathSteps: [
        [
          { t: "Baglylyklar", d: "Ilkinji gurnamada Debian paket baglylyklaryny goşuň. nginx ýok bolsa, ony şol buýrukda goşup bolýar." },
          { t: "Paketi gurnamak", d: "dpkg -i baglylyk ýalňyşyny habar berse, apt-get install -f işlediň. postinst ädimi log-guardian ulanyjysyny, rugsatlary, systemd unitlerini we deslapky rules.conf-y awtomatik döredýär." },
          { t: "Ilkinji işletmek we API howpsuzlygy", d: "nginx log formatyny, FP trust-y we API howpsuzlygyny (token, fail-closed) bir gezekde taýýarlaýar. Skriptler paketiň içinde (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Çeşme we gurmak", d: "Repo-ny klonlaň, ähli ýadrolar bilen guruň we esasy gurnama skriptini işlediň." },
          { t: "Ilkinji işletmek we token sinhrony", d: "Hyzmatlary galdyrýar we API token sinhronyny hem-de dashboard baglanyşygyny taýýarlaýar." },
        ],
      ],
      commonTitle: "Umumy ädimler (A ýa-da B-den soň)",
      commonSteps: [
        { t: "Nginx log formaty", d: "WAF islegiň bedenini we X-Forwarded-For-y okamagy üçin log_guardian log formaty gerek. Setup ony adatça awtomatik ulanýar; STRICT režiminde barlaň." },
        { t: "Saglyk we ýagdaý barlagy", d: "Daemon IPC-ni, hyzmat ýagdaýyny we BPF aýratynlyklaryny barlaň. Ýaşyl derweze: post_install_verify soňunda FAIL: 0 görmeli." },
        { t: "Metrikalar we ilkinji ban synagy", d: "Prometheus metrikalaryny barlaň; trafikden soň sanaýjylaryň galýanyny synlaň. Hüjüm setirini goýup ban-y ipset-de barlap bilersiňiz." },
        { t: "VirtualBox / XDP-siz (noutbuk we VM)", d: "eBPF/XDP ýok gurşawlarda ipset esasly ban bilen --no-xdp ýeterlik. Hyzmat baglylygy şowsuz bolsa, bejeriş skripti bir buýruk." },
      ],
      dashboardTitle: "Pro dashboard — gurnamadan soň (islege bagly)",
      dashboardBadge: "Pro · islege bagly",
      dashboardNote: "Dashboard bu landing saýtda däl, öz maşynyňyzda işleýär. Prod stack Caddy + Docker arkaly https://localhost:8443 salgysynda hyzmat edýär.",
      dashboardSteps: [
        { t: "Prod stack-i başlatmak", d: "Öz serweriňizde dashboard-y gurýar we galdyrýar. Giriş: admin / .env-däki DASHBOARD_ADMIN_PASSWORD." },
        { t: "Uzak VPS üçin SSH tunel", d: "Dashboard-y internete açman howpsuz görmek üçin SSH tunel guruň; ilki serweri berkidiň." },
      ],
    },
  },
  tt: {
    pipelineNote:
      "XDR, Wasm маркеты һәм LLM Copilot — озын сроклы өстәмә катламнар; Core үзе генә җитештерүгә әзер.",
    selectedBodies: [
      "Бер чылбыр: nginx логы → OWASP CRS → ~20 мс kernel ban. ~15 минутта җитештерүдә.",
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
      { k: "~20 мс kernel ban", v: "Лог юлыннан ipset/XDP банга медиана ~20 мс. Fail2ban/CrowdSec секунд–минут дәрәҗәсендә кала; 5 үлчәнгән үрнәк белән расланган." },
      { k: "280 373 EPS · 16,93× ModSec", v: "Шул ук корпуста һәм шул ук 121 OWASP CRS үрнәгендә (PCRE2 JIT) WAF/CRS үткәрүчәнлеге — 280 373 EPS, ModSec-ның 16 560 EPS-ыннан 16,93× тизрәк. Үлчәнгән һәм кабат ясала торган (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS паритеты", v: "121 OWASP CRS кагыйдәсе, 1500 юллык корпуста чын һөҗүм recall 100% һәм ModSec белән тулы паритет — 0.2% ялган позитивта." },
      { k: "Таратылган һөҗүмне каплау", v: "JA3 кластерын ачыклау + IP буенча ban — 80 IP туры тестта 100%. Fail2ban ялгыз IP'лы; CrowdSec аерым сигнал челтәрен таләп итә." },
      { k: "Ачык, кабат җитештерелә торган дәлил", v: "75 автоматик тест + 14 файллы дәлил пакеты + 72 сәгать soak (864 үрнәк, 0 хата). Көндәшләрдә автоматик дәлил юк яки өлешле." },
      { k: "Self-hosted · MIT · Төркиядә ясалган", v: "Мәгълүматыгыз сездә кала, вендорга бәйлелек юк, тулысынча ачык код. SOC вакыт сызыгы, Prometheus метрикалары һәм Telegram идарәсе бер панельдә (:8443)." },
    ],
    vsNote:
      "Намуслы чик: кайбер өлкәләрдә көндәшләр ачык яхшырак (кызыл күзәнәкләр). ModSec + CRS беренче соравны шунда ук блоклауда алда; CrowdSec таратылган җәмгыять сигнал челтәрендә һәм идарә ителә торган SaaS консолендә көчле. Аның каравы шул ук корпуста һәм шул ук 121 CRS үрнәгендә WAF/CRS үткәрүчәнлегебез — 280 373 EPS, ModSec-ның 16 560 EPS-ыннан 16,93× югарырак (bench-vs-modsec.json).",
    vsLegend: "Кызыл = шул юлдагы җиңүче",
    honestItems: [
      "Реактив архитектура — лог юлы төшкәнче беренче сорау үтә ала; без ModSec'ның inline тизлегендә түгел.",
      "L3/L4 DDoS'ны сеңдермибез — CDN артында торабыз.",
      "Таратылган ботнет — IP буенча ban; CrowdSec сигнал челтәре юк.",
      "Эшли: лог → CRS/WAF → ~20 мс kernel ban, дәлил PDF, Telegram идарә, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset ban (~15 мин)",
      "eBPF демоны, панель, метрикалар, флот",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Метрика", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Көчле яклары (үлчәнгән)", "Намуслы чикләр"],
    vsRows0: [
      ["Лог → WAF → ядро бан", "Бер чылбыр", "Бары бан", "Кисәкләп", "WAF аерым"],
      ["WAF/CRS үткәрүчәнлеге (шул ук корпус)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["OWASP CRS паритеты", "100% (121 кагыйдә)", "—", "—", "Эталон (100%)"],
      ["Чын һөҗүм recall", "100% (1K+10K)", "—", "—", "100%"],
      ["Таратылган / JA3 кластер бан", "100% (80 IP)", "—", "Сигналга нигезләнгән", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Аерым модуль"],
      ["L7 кушымта саклавы", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Ядро / eBPF (XDP) бан", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Ялган позитив", "0,2% (үлчәнгән)", "Югары", "Урта", "CRS-ка бәйле"],
      ["Бан тоткарлыгы", "~20 мс", "сек–мин", "сек", "Аерым интеграция"],
      ["Кыска тотрыклылык (5 мин)", "PASS (0 хата)", "—", "—", "—"],
      ["72с soak", "PASS (864/0)", "—", "—", "—"],
      ["Дәлил тупламы PDF+JSON", "Автомат (14 файл)", "Юк", "Өлешчә", "Модуль-модуль"],
      ["Автомат тест матрицасы", "75 тест", "—", "Өлешчә", "—"],
      ["SOC вакыт сызыгы / дашборд", "Әйе (:8443)", "—", "Консоль", "—"],
      ["Telegram операция + ack", "Әйе (бер басу)", "—", "Өлешчә", "—"],
      ["Урнаштыру вакыты", "~15 мин", "минут", "минут", "сәгать (көйләү)"],
    ],
    vsRows1: [
      ["Беренче сорауны шунда ук блоклау", "Реактив (лог юлы)", "Реактив", "Өлешчә", "Inline (шунда ук)"],
      ["Күләмле L3/L4 чистарту", "Юк — CDN тәкъдим ителә", "Юк", "Юк", "Юк"],
      ["Җәмгыять сигнал челтәре", "Үз-хостинг", "—", "Әйе (глобаль)", "—"],
      ["Edge / Cloud WAF", "Origin катламы", "—", "Bouncer", "Прокси режимы"],
      ["Идарә ителүче болыт / SaaS", "Юк (үз-хостинг)", "Юк", "Әйе (консоль)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 яки Debian 12 (amd64)",
      "nginx + язылучан access лог (log_guardian форматы)",
      "Root яки sudo (systemd, ipset, /etc/log-guardian)",
      "~200 МБ диск, 128 МБ RAM (Core); Pro өчен Docker",
      "Өстәмә Pro: eBPF/XDP өчен 5.10+ ядро, Docker (дашборд/метрикалар)",
    ],
    setup: {
      pathTitles: ["Яңа сервер — .deb пакеты", "Чыганак код — җыю һәм урнаштыру"],
      pathBadges: ["тәкъдим ителә", "эшләүче"],
      pathNotes: [
        "Җыю таләп ителми. Пакет бинарны, systemd юнитларын, кагыйдәләрне һәм скриптларны китерә. Яңартуга куркынычсыз: булган /etc/log-guardian/rules.conf сакланa. GitHub Releases-тан (log-guardian_*_amd64.deb) яки bash scripts/build_deb.sh → dist/ аша җыегыз.",
        "GitHub репозиторийны клонлагыз һәм җыегыз. Эшләү, көйләү һәм тулы чыганак тикшерүе өчен идеаль. install.sh systemd юнитларын, кагыйдәләрне һәм nginx лог форматын урнаштыра.",
      ],
      pathSteps: [
        [
          { t: "Бәйлелекләр", d: "Беренче урнаштыруда Debian пакет бәйлелекләрен өстәгез. nginx юк булса, аны шул ук боерыкта өстәп була." },
          { t: "Пакетны урнаштыру", d: "dpkg -i бәйлелек хатасын хәбәр итсә, apt-get install -f эшләтегез. postinst адымы log-guardian кулланучысын, рөхсәтләрне, systemd юнитларын һәм default rules.conf-ны автомат тудыра." },
          { t: "Беренче эшләтү һәм API куркынычсызлыгы", d: "nginx лог форматын, FP trust-ны һәм API куркынычсызлыгын (токен, fail-closed) бер юлы әзерли. Скриптлар пакет эчендә (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Чыганак һәм җыю", d: "Репозиторийны клонлагыз, барлык үзәкләр белән җыегыз һәм төп урнаштыру скриптын эшләтегез." },
          { t: "Беренче эшләтү һәм токен синхроны", d: "Хезмәтләрне күтәрә һәм API токен синхронын һәм дашборд бәйләнешен әзерли." },
        ],
      ],
      commonTitle: "Уртак адымнар (A яки B соңында)",
      commonSteps: [
        { t: "Nginx лог форматы", d: "WAF сорау гәүдәсен һәм X-Forwarded-For-ны укуы өчен log_guardian лог форматы кирәк. Setup аны гадәттә автомат куллана; STRICT режимында тикшерегез." },
        { t: "Сәламәтлек һәм халәт тикшерүе", d: "Daemon IPC-ны, хезмәт халәтен һәм BPF мөмкинлекләрен тикшерегез. Яшел капка: post_install_verify азагында FAIL: 0 күрергә тиеш." },
        { t: "Метрикалар һәм беренче бан тесты", d: "Prometheus метрикаларын тикшерегез; трафиктан соң санагычларның үсүен күзәтегез. Һөҗүм юлын кертеп бан-ны ipset-та тикшерә аласыз." },
        { t: "VirtualBox / XDP-сыз (ноутбук һәм VM)", d: "eBPF/XDP юк тирәлекләрдә ipset нигезендәге бан белән --no-xdp җитә. Хезмәт бәйлелеге уңышсыз булса, төзәтү скрипты бер боерык." },
      ],
      dashboardTitle: "Pro дашборд — урнаштырудан соң (өстәмә)",
      dashboardBadge: "Pro · өстәмә",
      dashboardNote: "Дашборд бу landing сайтта түгел, үз машинагызда эшли. Prod стек Caddy + Docker аша https://localhost:8443 адресендә хезмәт итә.",
      dashboardSteps: [
        { t: "Prod стекны җибәрү", d: "Үз серверыгызда дашбордны җыя һәм күтәрә. Керү: admin / .env-тагы DASHBOARD_ADMIN_PASSWORD." },
        { t: "Ерак VPS өчен SSH туннель", d: "Дашбордны интернетка ачмыйча куркынычсыз күрер өчен SSH туннель урнаштырыгыз; башта серверны ныгытыгыз." },
      ],
    },
  },
  ba: {
    pipelineNote:
      "XDR, Wasm маркеты һәм LLM Copilot — оҙаҡ мөҙҙәтле өҫтәмә ҡатламдар; Core үҙе генә етештереүгә әҙер.",
    selectedBodies: [
      "Бер сылбыр: nginx логы → OWASP CRS → ~20 мс kernel ban. ~15 минутта етештереүҙә.",
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
      { k: "~20 мс kernel ban", v: "Лог юлынан ipset/XDP банға медиана ~20 мс. Fail2ban/CrowdSec секунд–минут кимәлендә ҡала; 5 үлсәнгән өлгө менән раҫланған." },
      { k: "280 373 EPS · 16,93× ModSec", v: "Шул уҡ корпуста һәм шул уҡ 121 OWASP CRS өлгөһөндә (PCRE2 JIT) WAF/CRS үткәреү һәләтлеге — 280 373 EPS, ModSec-тың 16 560 EPS-ынан 16,93× тиҙерәк. Үлсәнгән һәм ҡабат яһала торған (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS паритеты", v: "121 OWASP CRS ҡағиҙәһе, 1500 юллыҡ корпуста ысын һөжүм recall 100% һәм ModSec менән тулы паритет — 0.2% ялған позитивта." },
      { k: "Таратылған һөжүмде ҡаплау", v: "JA3 кластерын асыҡлау + IP буйынса ban — 80 IP тура тестта 100%. Fail2ban яңғыҙ IP'лы; CrowdSec айырым сигнал селтәрен талап итә." },
      { k: "Асыҡ, ҡабат етештерелә торған дәлил", v: "75 автоматик тест + 14 файллы дәлил пакеты + 72 сәғәт soak (864 өлгө, 0 хата). Көндәштәрҙә автоматик дәлил юҡ йәки өлөшлө." },
      { k: "Self-hosted · MIT · Төркиәлә яһалған", v: "Мәғлүмәтегеҙ һеҙҙә ҡала, вендорға бәйлелек юҡ, тулыһынса асыҡ код. SOC ваҡыт һыҙығы, Prometheus метрикалары һәм Telegram идараһы бер панелдә (:8443)." },
    ],
    vsNote:
      "Намыҫлы сик: ҡайһы бер өлкәләрҙә көндәштәр асыҡ яҡшыраҡ (ҡыҙыл күҙәнәктәр). ModSec + CRS беренсе һорауҙы шунда уҡ блоклауҙа алда; CrowdSec таратылған йәмғиәт сигнал селтәрендә һәм идара ителгән SaaS консолендә көслө. Уның ҡарауы шул уҡ корпуста һәм шул уҡ 121 CRS өлгөһөндә WAF/CRS үткәреү һәләтебеҙ — 280 373 EPS, ModSec-тың 16 560 EPS-ынан 16,93× юғарыраҡ (bench-vs-modsec.json).",
    vsLegend: "Ҡыҙыл = шул юлдағы еңеүсе",
    honestItems: [
      "Реактив архитектура — лог юлы төшкәнсе беренсе һорау үтә ала; беҙ ModSec'тың inline тиҙлегендә түгел.",
      "L3/L4 DDoS'ты һеңдермәйбеҙ — CDN артында торабыҙ.",
      "Таратылған ботнет — IP буйынса ban; CrowdSec сигнал селтәре юҡ.",
      "Эшләй: лог → CRS/WAF → ~20 мс kernel ban, дәлил PDF, Telegram идара, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset ban (~15 мин)",
      "eBPF демоны, панель, метрикалар, флот",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Метрика", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Көслө яҡтары (үлсәнгән)", "Намыҫлы сиктәр"],
    vsRows0: [
      ["Лог → WAF → ядро бан", "Бер сылбыр", "Тик бан", "Киҫәкләп", "WAF айырым"],
      ["WAF/CRS үткәреү һәләтлеге (шул уҡ корпус)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["OWASP CRS паритеты", "100% (121 ҡағиҙә)", "—", "—", "Эталон (100%)"],
      ["Ысын һөжүм recall", "100% (1K+10K)", "—", "—", "100%"],
      ["Таратылған / JA3 кластер бан", "100% (80 IP)", "—", "Сигналға нигеҙләнгән", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Айырым модуль"],
      ["L7 ҡушымта һаҡлауы", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Ядро / eBPF (XDP) бан", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Ялған позитив", "0,2% (үлсәнгән)", "Юғары", "Урта", "CRS-ҡа бәйле"],
      ["Бан тотҡарлығы", "~20 мс", "сек–мин", "сек", "Айырым интеграция"],
      ["Ҡыҫҡа тотороҡлолоҡ (5 мин)", "PASS (0 хата)", "—", "—", "—"],
      ["72с soak", "PASS (864/0)", "—", "—", "—"],
      ["Дәлил тупламы PDF+JSON", "Автомат (14 файл)", "Юҡ", "Өлөшләтә", "Модуль-модуль"],
      ["Автомат тест матрицаһы", "75 тест", "—", "Өлөшләтә", "—"],
      ["SOC ваҡыт һыҙығы / дашборд", "Эйе (:8443)", "—", "Консоль", "—"],
      ["Telegram операция + ack", "Эйе (бер баҫыу)", "—", "Өлөшләтә", "—"],
      ["Урынлаштырыу ваҡыты", "~15 мин", "минут", "минут", "сәғәт (көйләү)"],
    ],
    vsRows1: [
      ["Беренсе һорауҙы шунда уҡ блоклау", "Реактив (лог юлы)", "Реактив", "Өлөшләтә", "Inline (шунда уҡ)"],
      ["Күләмле L3/L4 таҙартыу", "Юҡ — CDN тәҡдим ителә", "Юҡ", "Юҡ", "Юҡ"],
      ["Йәмғиәт сигнал селтәре", "Үҙ-хостинг", "—", "Эйе (глобаль)", "—"],
      ["Edge / Cloud WAF", "Origin ҡатламы", "—", "Bouncer", "Прокси режимы"],
      ["Идара ителеүсе болот / SaaS", "Юҡ (үҙ-хостинг)", "Юҡ", "Эйе (консоль)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 йәки Debian 12 (amd64)",
      "nginx + яҙылыусан access лог (log_guardian форматы)",
      "Root йәки sudo (systemd, ipset, /etc/log-guardian)",
      "~200 МБ диск, 128 МБ RAM (Core); Pro өсөн Docker",
      "Өҫтәмә Pro: eBPF/XDP өсөн 5.10+ ядро, Docker (дашборд/метрикалар)",
    ],
    setup: {
      pathTitles: ["Яңы сервер — .deb пакеты", "Сығанаҡ код — йыйыу һәм урынлаштырыу"],
      pathBadges: ["тәҡдим ителә", "эшләүсе"],
      pathNotes: [
        "Йыйыу талап ителмәй. Пакет бинарҙы, systemd юниттарын, ҡағиҙәләрҙе һәм скрипттарҙы килтерә. Яңыртыуға хәүефһеҙ: булған /etc/log-guardian/rules.conf һаҡлана. GitHub Releases-тан (log-guardian_*_amd64.deb) йәки bash scripts/build_deb.sh → dist/ аша йыйығыҙ.",
        "GitHub репозиторийын клонлағыҙ һәм йыйығыҙ. Эшләү, көйләү һәм тулы сығанаҡ тикшереүе өсөн идеаль. install.sh systemd юниттарын, ҡағиҙәләрҙе һәм nginx лог форматын урынлаштыра.",
      ],
      pathSteps: [
        [
          { t: "Бәйлелектәр", d: "Беренсе урынлаштырыуҙа Debian пакет бәйлелектәрен өҫтәгеҙ. nginx юҡ булһа, уны шул уҡ бойороҡта өҫтәп була." },
          { t: "Пакетты урынлаштырыу", d: "dpkg -i бәйлелек хатаһын хәбәр итһә, apt-get install -f эшләтегеҙ. postinst аҙымы log-guardian ҡулланыусыһын, рөхсәттәрҙе, systemd юниттарын һәм default rules.conf-ты автомат тыуҙыра." },
          { t: "Беренсе эшләтеү һәм API хәүефһеҙлеге", d: "nginx лог форматын, FP trust-ты һәм API хәүефһеҙлеген (токен, fail-closed) бер юлы әҙерләй. Скрипттар пакет эсендә (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Сығанаҡ һәм йыйыу", d: "Репозиторийҙы клонлағыҙ, бөтә үҙәктәр менән йыйығыҙ һәм төп урынлаштырыу скриптын эшләтегеҙ." },
          { t: "Беренсе эшләтеү һәм токен синхроны", d: "Хеҙмәттәрҙе күтәрә һәм API токен синхронын һәм дашборд бәйләнешен әҙерләй." },
        ],
      ],
      commonTitle: "Уртаҡ аҙымдар (A йәки B һуңында)",
      commonSteps: [
        { t: "Nginx лог форматы", d: "WAF һорау кәүҙәһен һәм X-Forwarded-For-ҙы уҡыуы өсөн log_guardian лог форматы кәрәк. Setup уны ғәҙәттә автомат ҡуллана; STRICT режимында тикшерегеҙ." },
        { t: "Һаулыҡ һәм торош тикшереүе", d: "Daemon IPC-ҙы, хеҙмәт торошон һәм BPF мөмкинлектәрен тикшерегеҙ. Йәшел ҡапҡа: post_install_verify аҙағында FAIL: 0 күрергә тейеш." },
        { t: "Метрикалар һәм беренсе бан тесты", d: "Prometheus метрикаларын тикшерегеҙ; трафиктан һуң һанағыстарҙың үҫеүен күҙәтегеҙ. Һөжүм юлын индереп бан-ды ipset-та тикшерә алаһығыҙ." },
        { t: "VirtualBox / XDP-һыҙ (ноутбук һәм VM)", d: "eBPF/XDP юҡ тирәлектәрҙә ipset нигеҙендәге бан менән --no-xdp етә. Хеҙмәт бәйлелеге уңышһыҙ булһа, төҙәтеү скрипты бер бойороҡ." },
      ],
      dashboardTitle: "Pro дашборд — урынлаштырыуҙан һуң (өҫтәмә)",
      dashboardBadge: "Pro · өҫтәмә",
      dashboardNote: "Дашборд был landing сайтта түгел, үҙ машинағыҙҙа эшләй. Prod стек Caddy + Docker аша https://localhost:8443 адресында хеҙмәт итә.",
      dashboardSteps: [
        { t: "Prod стекты ебәреү", d: "Үҙ серверығыҙҙа дашбордты йыя һәм күтәрә. Инеү: admin / .env-тағы DASHBOARD_ADMIN_PASSWORD." },
        { t: "Алыҫ VPS өсөн SSH туннель", d: "Дашбордты интернетҡа асмайынса хәүефһеҙ күреү өсөн SSH туннель урынлаштырығыҙ; башта серверҙы нығытығыҙ." },
      ],
    },
  },
  cv: {
    pipelineNote:
      "XDR, Wasm маркечӗ тата LLM Copilot — вӑрӑм вӑхӑтлӑ хушма сийсем; Core хӑй тӗллӗн продакшена хатӗр.",
    selectedBodies: [
      "Пӗр сӑнчӑр: nginx логӗ → OWASP CRS → ~20 мс kernel бан. ~15 минутра продакшенра.",
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
      { k: "~20 мс kernel бан", v: "Лог йӗркинчен ipset/XDP бана медиана ~20 мс. Fail2ban/CrowdSec ҫекунт–минут шайӗнче юлаҫҫӗ; 5 виҫнӗ тӗслӗхпе ҫирӗплетнӗ." },
      { k: "280 373 EPS · 16,93× ModSec", v: "Ҫав корпусра тата ҫав 121 OWASP CRS үлгинче (PCRE2 JIT) WAF/CRS витӗмлӗхӗ — 280 373 EPS, ModSec 16 560 EPS-ӗнчен 16,93× хӑвӑртрах. Виҫнӗ тата тепӗр хут кӑларма пулакан (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS паритечӗ", v: "121 OWASP CRS правили, 1500 йӗркеллӗ корпусра чӑн тапӑну recall 100% тата ModSec-па тулли паритет — 0.2% суя позитивра." },
      { k: "Сарӑлнӑ тапӑнӑва хуплани", v: "JA3 кластерне тупни + IP тӑрӑх бан — 80 IP чӗрӗ тестра 100%. Fail2ban пӗр IP-лӑ; CrowdSec уйрӑм сигнал тетелне ыйтать." },
      { k: "Уҫӑ, тепӗр хут тӑвакан кӑтарту", v: "75 автомат тест + 14 файллӑ кӑтарту пакечӗ + 72 сехет soak (864 тӗслӗх, 0 йӑнӑш). Конкурентсен автомат кӑтарту ҫук е татӑк-татӑк." },
      { k: "Self-hosted · MIT · Турцире тунӑ", v: "Сирӗн даннӑйсем сирӗнте юлаҫҫӗ, вендора ҫыхӑнни ҫук, пӗтӗмпех уҫӑ код. SOC вӑхӑт линийӗ, Prometheus метрикисем тата Telegram майлашӑвӗ пӗр панельре (:8443)." },
    ],
    vsNote:
      "Тӳрӗ чикӗ: хӑш-пӗр енре конкурентсем уҫҫӑнах лайӑхрах (хӗрлӗ клеткӑсем). ModSec + CRS пӗрремӗш ыйтӑва самантрах пӳлнинче мала тухать; CrowdSec сарӑлнӑ обществӑ сигнал тетелӗнче тата майлаштарнӑ SaaS консольте вӑйлӑ. Ун вырӑнне ҫав корпусра тата ҫав 121 CRS үлгинче WAF/CRS витӗмлӗхӗмӗр — 280 373 EPS, ModSec 16 560 EPS-ӗнчен 16,93× пысӑкрах (bench-vs-modsec.json).",
    vsLegend: "Хӗрлӗ = ҫав йӗркери ҫӗнтерекен",
    honestItems: [
      "Реактивлӑ архитектура — лог йӗрки ӳкиччен пӗрремӗш ыйту иртме пултарать; эпир ModSec inline хӑвӑртлӑхӗнче мар.",
      "L3/L4 DDoS-а ҫӑтмастпӑр — CDN хыҫӗнче тӑратпӑр.",
      "Сарӑлнӑ ботнет — IP тӑрӑх бан; CrowdSec сигнал тетелӗ ҫук.",
      "Тӑвать: лог → CRS/WAF → ~20 мс kernel бан, кӑтарту PDF, Telegram майлашу, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset бан (~15 мин)",
      "eBPF демонӗ, панель, метрикисем, флот",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Метрика", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Вӑйлӑ енӗсем (виҫнӗ)", "Тӳрӗ чиккисем"],
    vsRows0: [
      ["Лог → WAF → ядро бан", "Пӗр сӑнчӑр", "Бан анчах", "Пайӑн-пайӑн", "WAF уйрӑм"],
      ["WAF/CRS витӗмлӗхӗ (ҫав корпус)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["OWASP CRS паритечӗ", "100% (121 правило)", "—", "—", "Эталон (100%)"],
      ["Чӑн тапӑну recall", "100% (1K+10K)", "—", "—", "100%"],
      ["Сапаланӑ / JA3 кластер бан", "100% (80 IP)", "—", "Сигнал ҫинче", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Уйрӑм модуль"],
      ["L7 приложени хӳтлӗхӗ", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Ядро / eBPF (XDP) бан", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Суя позитив", "0,2% (виҫнӗ)", "Ҫӳллӗ", "Вӑтам", "CRS ҫине килет"],
      ["Бан кӗтесси", "~20 мс", "ҫек–мин", "ҫек", "Уйрӑм интеграци"],
      ["Кӗске тӑнӑҫлӑх (5 мин)", "PASS (0 йӑнӑш)", "—", "—", "—"],
      ["72с soak", "PASS (864/0)", "—", "—", "—"],
      ["Кӑтарту пакечӗ PDF+JSON", "Автомат (14 файл)", "Ҫук", "Пайӑн", "Модуль-модуль"],
      ["Автомат тест матрици", "75 тест", "—", "Пайӑн", "—"],
      ["SOC вӑхӑт линийӗ / дашборд", "Ҫапла (:8443)", "—", "Консоль", "—"],
      ["Telegram операци + ack", "Ҫапла (пӗр пусӑ)", "—", "Пайӑн", "—"],
      ["Вырнаҫтару вӑхӑчӗ", "~15 мин", "минут", "минут", "сехет (тӳрлетӳ)"],
    ],
    vsRows1: [
      ["Пӗрремӗш ыйтӑва тӳрех блоклани", "Реактивлӑ (лог йӗрки)", "Реактивлӑ", "Пайӑн", "Inline (тӳрех)"],
      ["Калӑплӑ L3/L4 тасату", "Ҫук — CDN сӗнеҫҫӗ", "Ҫук", "Ҫук", "Ҫук"],
      ["Пӗрлӗх сигнал тетелӗ", "Хӑй-хостинг", "—", "Ҫапла (глобаллӑ)", "—"],
      ["Edge / Cloud WAF", "Origin сийӗ", "—", "Bouncer", "Прокси режимӗ"],
      ["Тытса пыракан пӗлӗт / SaaS", "Ҫук (хӑй-хостинг)", "Ҫук", "Ҫапла (консоль)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 е Debian 12 (amd64)",
      "nginx + ҫырма пулакан access лог (log_guardian форматне)",
      "Root е sudo (systemd, ipset, /etc/log-guardian)",
      "~200 МБ диск, 128 МБ RAM (Core); Pro валли Docker",
      "Хушма Pro: eBPF/XDP валли 5.10+ ядро, Docker (дашборд/метрикӑсем)",
    ],
    setup: {
      pathTitles: ["Ҫӗнӗ сервер — .deb пакет", "Пуҫламӑш код — пуҫтарни тата вырнаҫтарни"],
      pathBadges: ["сӗнеҫҫӗ", "аталантаракан"],
      pathNotes: [
        "Пуҫтарма кирлӗ мар. Пакет бинарне, systemd юничӗсене, правилӑсене тата скриптсене илсе килет. Ҫӗнетме хӑрушсӑр: пур /etc/log-guardian/rules.conf упранать. GitHub Releases-ран (log-guardian_*_amd64.deb) е bash scripts/build_deb.sh → dist/ урлӑ пуҫтарӑр.",
        "GitHub репозиторине клонлӑр тата пуҫтарӑр. Аталантару, тӳрлетӳ тата тулли код тӗрӗслев валли идеаллӑ. install.sh systemd юничӗсене, правилӑсене тата nginx лог форматне вырнаҫтарать.",
      ],
      pathSteps: [
        [
          { t: "Ҫыхӑнусем", d: "Пӗрремӗш вырнаҫтарура Debian пакет ҫыхӑнӑвӗсене хушӑр. nginx ҫук пулсан, ӑна ҫав хушурах хушма пулать." },
          { t: "Пакет вырнаҫтарни", d: "dpkg -i ҫыхӑну йӑнӑшӗ пӗлтерсен, apt-get install -f ӗҫлеттерӗр. postinst утӑмӗ log-guardian усӑ куракана, ирӗксене, systemd юничӗсене тата default rules.conf-а автомат туса хурать." },
          { t: "Пӗрремӗш ӗҫлеттерни тата API хӑрушсӑрлӑхӗ", d: "nginx лог форматне, FP trust-а тата API хӑрушсӑрлӑхне (токен, fail-closed) пӗр харӑс хатӗрлет. Скриптсем пакет ӑшӗнче (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Пуҫламӑш код тата пуҫтарни", d: "Репозиторине клонлӑр, пур ядрӑпа пуҫтарӑр тата тӗп вырнаҫтару скриптне ӗҫлеттерӗр." },
          { t: "Пӗрремӗш ӗҫлеттерни тата токен синхронӗ", d: "Ӗҫсене ҫӗклет тата API токен синхронне тата дашборд ҫыхӑнӑвне хатӗрлет." },
        ],
      ],
      commonTitle: "Пӗрлехи утӑмсем (A е B хыҫҫӑн)",
      commonSteps: [
        { t: "Nginx лог формачӗ", d: "WAF ыйту кӗлеткине тата X-Forwarded-For-а вулама log_guardian лог форматне кирлӗ. Setup ӑна яланах автомат хурать; STRICT режимра тӗрӗслӗр." },
        { t: "Сывлӑх тата тӑрӑм тӗрӗслев", d: "Daemon IPC-не, ӗҫ тӑрӑмне тата BPF пахалӑхӗсене тӗрӗслӗр. Симӗс хапха: post_install_verify вӗҫӗнче FAIL: 0 курмалла." },
        { t: "Метрикӑсем тата пӗрремӗш бан тест", d: "Prometheus метрикисене тӗрӗслӗр; трафик хыҫҫӑн шутлавҫӑсем ӳснине сӑнӑр. Тапӑну йӗркине кӗртсе бан-а ipset-ра тӗрӗслеме пулать." },
        { t: "VirtualBox / XDP-сӗр (ноутбук тата VM)", d: "eBPF/XDP ҫук хутлӑхсенче ipset ҫинчи бан тата --no-xdp ҫитет. Ӗҫ ҫыхӑнӑвӗ ӑнӑҫмасан, юсав скрипчӗ пӗр хушу." },
      ],
      dashboardTitle: "Pro дашборд — вырнаҫтарнӑ хыҫҫӑн (хушма)",
      dashboardBadge: "Pro · хушма",
      dashboardNote: "Дашборд ку landing сайтра мар, хӑвӑр машинӑра ӗҫлет. Prod стек Caddy + Docker урлӑ https://localhost:8443 адресра ӗҫлет.",
      dashboardSteps: [
        { t: "Prod стека тапратни", d: "Хӑвӑр серверӑра дашборда пуҫтарать тата ҫӗклет. Кӗрӳ: admin / .env-ри DASHBOARD_ADMIN_PASSWORD." },
        { t: "Инҫетри VPS валли SSH туннель", d: "Дашборда интернета уҫмасӑр хӑрушсӑр курма SSH туннель вырнаҫтарӑр; малтан сервера ҫирӗплетӗр." },
      ],
    },
  },
  crh: {
    pipelineNote:
      "XDR, Wasm marketi ve LLM Copilot uzun vadeli qoşımca qatlardır — Core tek başına istihsalge azır.",
    selectedBodies: [
      "Tek zıncır: nginx logu → OWASP CRS → ~20 ms kernel ban. ~15 daqiqada istihsalde.",
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
      { k: "~20 ms kernel ban", v: "Log satırından ipset/XDP banğa mediana ~20 ms. Fail2ban/CrowdSec saniye–daqiqa seviyesinde qala; 5 ölçengen örneknen isbatlanğan." },
      { k: "280 373 EPS · 16,93× ModSec", v: "Aynı korpus ve aynı 121 OWASP CRS pattern (PCRE2 JIT) üzerinde WAF/CRS ötkerim qabiliyeti 280 373 EPS — ModSec'niñ 16 560 EPS'inden 16,93× daa tez. Ölçengen ve kene çıqarıla bilgen (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS pariteti", v: "121 OWASP CRS qaidesi, 1500 satırlıq korpusta kerçek hücum recall 100% ve ModSec ile tam paritet — 0.2% yañlış pozitivde." },
      { k: "Dağıtıq hücumnı qaplav", v: "JA3 klaster tapuv + IP başına ban — 80 IP canlı testte 100%. Fail2ban tek IP'li; CrowdSec ayrı signal ağını ister." },
      { k: "Şeffaf, tekrar tüzülgen delil", v: "75 avtomatik test + 14 fayllı delil paketi + 72 saat soak (864 örnek, 0 hata). Raqiplerde avtomatik delil yoq ya da parça-parça." },
      { k: "Self-hosted · MIT · Türkiyede yapılğan", v: "Malümatıñız sizde qala, vendor bağlılığı yoq, tamamen açıq kod. SOC vaqıt sızığı, Prometheus metrikaları ve Telegram idaresi bir pan'elde (:8443)." },
    ],
    vsNote:
      "Doğru sıñır: bazı sahalarda raqipler açıq şekilde daha yahşı (qırmızı hüceyreler). ModSec + CRS ilk sorağını hemen bloklavda ögde; CrowdSec dağıtıq cemaat signal ağında ve idare etilgen SaaS konsolunda küçlü. Onıñ yerine aynı korpus ve aynı 121 CRS pattern üzerinde WAF/CRS ötkerim qabiliyetimiz 280 373 EPS — ModSec'niñ 16 560 EPS'inden 16,93× yüksek (bench-vs-modsec.json).",
    vsLegend: "Qırmızı = o satırdaki ğalip",
    honestItems: [
      "Reaktiv mimarlıq — log satırı tüşkence ilk soravnıñ keçüvi mümkün; biz ModSec'niñ inline tezliginde degilmiz.",
      "L3/L4 DDoS'nı yutmaymız — CDN artında turamız.",
      "Dağıtıq botnet — IP başına ban; CrowdSec signal ağı yoq.",
      "Yapa: log → CRS/WAF → ~20 ms kernel ban, delil PDF, Telegram idare, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset ban (~15 daq)",
      "eBPF demonı, pan'el, metrikalar, filo",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Metrika", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Küçlü tarafları (ölçengen)", "Doğru sıñırlar"],
    vsRows0: [
      ["Log → WAF → kernel ban", "Tek zıncır", "Faqat ban", "Parça-parça", "WAF ayrı"],
      ["WAF/CRS ötkerim qabiliyeti (aynı korpus)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["OWASP CRS pariteti", "100% (121 qaide)", "—", "—", "Referans (100%)"],
      ["Kerçek ücüm recall", "100% (1K+10K)", "—", "—", "100%"],
      ["Dağıtılğan / JA3 klaster ban", "100% (80 IP)", "—", "Signal esaslı", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Ayrı modul"],
      ["L7 uygulama qoruvı", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Kernel / eBPF (XDP) ban", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Yañlış pozitiv", "0,2% (ölçengen)", "Yüksek", "Orta", "CRS-ge bağlı"],
      ["Ban keçikmesi", "~20 ms", "san–daq", "san", "Ayrı integratsiya"],
      ["Qısqa istiqrarlıq (5 daq)", "PASS (0 muvafaqiyetsizlik)", "—", "—", "—"],
      ["72s soak", "PASS (864/0)", "—", "—", "—"],
      ["Delil paketi PDF+JSON", "Avtomatik (14 fayl)", "Yoq", "Qısmen", "Modul-modul"],
      ["Avtomat test matritsası", "75 test", "—", "Qısmen", "—"],
      ["SOC vaqıt sızığı / dashboard", "Ebet (:8443)", "—", "Konsol", "—"],
      ["Telegram ameliyat + ack", "Ebet (bir basuv)", "—", "Qısmen", "—"],
      ["Qurulım vaqtı", "~15 daq", "daqqa", "daqqa", "saat (sazlav)"],
    ],
    vsRows1: [
      ["Birinci istekni deral bloklamaq", "Reaktiv (log satırı)", "Reaktiv", "Qısmen", "Inline (deral)"],
      ["Volumetrik L3/L4 tazalav", "Yoq — CDN tevsiye etile", "Yoq", "Yoq", "Yoq"],
      ["Cemaat signal ağı", "Öz-hosting", "—", "Ebet (global)", "—"],
      ["Edge / Cloud WAF", "Origin qatı", "—", "Bouncer", "Proksi rejimi"],
      ["İdare etilgen bulut / SaaS", "Yoq (öz-hosting)", "Yoq", "Ebet (konsol)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 ya da Debian 12 (amd64)",
      "nginx + yazıla bilgen access log (log_guardian formatı)",
      "Root ya da sudo (systemd, ipset, /etc/log-guardian)",
      "~200 MB disk, 128 MB RAM (Core); Pro içün Docker",
      "İhtiyariy Pro: eBPF/XDP içün 5.10+ kernel, Docker (dashboard/metrikalar)",
    ],
    setup: {
      pathTitles: ["Taze server — .deb paketi", "Menba kod — qurmaq ve qurmaq"],
      pathBadges: ["tevsiye etile", "programcı"],
      pathNotes: [
        "Qurmaq talap etilmey. Paket binar faylnı, systemd unitlerini, qaidelerni ve skriptlerni ketire. Yañartuvğa qorunçlı: mevcut /etc/log-guardian/rules.conf saqlana. GitHub Releases-ten (log-guardian_*_amd64.deb) ya da bash scripts/build_deb.sh → dist/ ile qurıñız.",
        "GitHub repo-nı klonlañız ve qurıñız. İnkişaf, sazlav ve tam menba baquv içün ideal. install.sh systemd unitlerini, qaidelerni ve nginx log formatını qura.",
      ],
      pathSteps: [
        [
          { t: "Bağlılıqlar", d: "İlk qurulımda Debian paket bağlılıqlarını qoşuñız. nginx yoq ise, onı aynı emirde qoşmaq mümkün." },
          { t: "Paketni qurmaq", d: "dpkg -i bağlılıq hatasını bildirse, apt-get install -f çalıştırıñız. postinst adımı log-guardian qullanıcısını, izinlerni, systemd unitlerini ve default rules.conf-nı avtomat yarata." },
          { t: "İlk çalıştıruv ve API qorunçlığı", d: "nginx log formatını, FP trust-nı ve API qorunçlığını (token, fail-closed) bir kere azırlay. Skriptler paket içinde (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Menba ve qurmaq", d: "Repo-nı klonlañız, bütün yadrolar ile qurıñız ve esas qurulım skriptini çalıştırıñız." },
          { t: "İlk çalıştıruv ve token sinxronı", d: "Hızmetlerni köterе ve API token sinxronını ve dashboard bağlantısını azırlay." },
        ],
      ],
      commonTitle: "Umumiy adımlar (A ya da B soñu)",
      commonSteps: [
        { t: "Nginx log formatı", d: "WAF istek gövdesini ve X-Forwarded-For-nı oqumaq içün log_guardian log formatı kerek. Setup onı adette avtomat qullana; STRICT rejiminde teşkeriñiz." },
        { t: "Sağlıq ve durum teşkeriv", d: "Daemon IPC-ni, hızmet durumını ve BPF hususiyetlerini teşkeriñiz. Yeşil qapı: post_install_verify soñunda FAIL: 0 körmeli." },
        { t: "Metrikalar ve ilk ban testi", d: "Prometheus metrikalarını teşkeriñiz; trafiktan soñ sayaçlarnıñ köterilgenini közetiñiz. Ücüm satırını qoşıp ban-nı ipset-te teşkere bilesiñiz." },
        { t: "VirtualBox / XDP-sız (laptop ve VM)", d: "eBPF/XDP olmağan çevrelerde ipset esaslı ban ile --no-xdp yeter. Hızmet bağlılığı muvafaqiyetsiz olsa, tamir skripti bir emir." },
      ],
      dashboardTitle: "Pro dashboard — qurulımdan soñ (ihtiyariy)",
      dashboardBadge: "Pro · ihtiyariy",
      dashboardNote: "Dashboard bu landing saytında degil, öz maşiñızda çalışa. Prod stack Caddy + Docker vastasında https://localhost:8443 adresinde hızmet ete.",
      dashboardSteps: [
        { t: "Prod stack-nı başlatmaq", d: "Öz serveriñizde dashboard-nı qura ve kötere. Kirüv: admin / .env-deki DASHBOARD_ADMIN_PASSWORD." },
        { t: "Uzaq VPS içün SSH tünel", d: "Dashboard-nı internetke açmadan qorunçlı körmek içün SSH tünel qurıñız; evvel serverni qatılaştırıñız." },
      ],
    },
  },
  gag: {
    pipelineNote:
      "XDR, Wasm marketi hem LLM Copilot uzun vadeli seçili katlar — Core tek başına üretimä hazır.",
    selectedBodies: [
      "Tek zincir: nginx logu → OWASP CRS → ~20 ms kernel ban. ~15 dakikada üretimdä.",
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
      { k: "~20 ms kernel ban", v: "Log satırından ipset/XDP bana mediana ~20 ms. Fail2ban/CrowdSec saniye–dakika kertindä kalêr; 5 ölçülü örneklän ispatlandı." },
      { k: "280 373 EPS · 16,93× ModSec", v: "Aynı korpusta hem aynı 121 OWASP CRS pattern (PCRE2 JIT) üzerindä WAF/CRS geçirim kapasitesi 280 373 EPS — ModSec'in 16 560 EPS'indän 16,93× tez. Ölçülü hem genä yapılabilän (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS pariteti", v: "121 OWASP CRS kuralı, 1500 satırlık korpusta gerçek saldırı recall 100% hem ModSec ilä tam paritet — 0.2% yalancı pozitivdä." },
      { k: "Daalı saldırıyı kaplamak", v: "JA3 klaster bulması + IP başına ban — 80 IP canlı testtä 100%. Fail2ban tek IP'li; CrowdSec ayırı sinyal aa ister." },
      { k: "Açık, tekrar yapılabilän delil", v: "75 avtomatik test + 14 dosyalı delil paketi + 72 saat soak (864 örnek, 0 hata). Rakiplerdä avtomatik delil yok osaydı parça-parça." },
      { k: "Self-hosted · MIT · Türkiyedä yapıldı", v: "Bilgileriniz sizdä kalêr, vendor baalantısı yok, bütünnä açık kod. SOC zaman çizgisi, Prometheus metrikaları hem Telegram işlemesi bir paneldä (:8443)." },
    ],
    vsNote:
      "Dooru sınır: kimi alannarda rakiplär açık şekildä taa islää (kırmızı üücüklär). ModSec + CRS ilk isteyi hemen bloklamakta önnärdä; CrowdSec daalı cümnä sinyal aandä hem işlenän SaaS konsolundä küvetli. Onun erinä aynı korpusta hem aynı 121 CRS pattern üzerindä WAF/CRS geçirim kapasitemiz 280 373 EPS — ModSec'in 16 560 EPS'indän 16,93× büük (bench-vs-modsec.json).",
    vsLegend: "Kırmızı = o satırdaki kazanan",
    honestItems: [
      "Reaktiv mimarlık — log satırı düşenädäk ilk isteyin geçmesi olabilir; biz ModSec'in inline hızındä diiliz.",
      "L3/L4 DDoS'u yutmeeriz — CDN ardında dururuz.",
      "Daalı botnet — IP başına ban; CrowdSec sinyal aa yok.",
      "Yapêr: log → CRS/WAF → ~20 ms kernel ban, delil PDF, Telegram işlemäk, MIT self-hosted.",
    ],
    layersBodies: [
      "log → WAF → ipset ban (~15 dak)",
      "eBPF demonu, panel, metrikalar, filo",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Metrika", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Kuvetli taraflar (ölçülü)", "Dooru sınırlar"],
    vsRows0: [
      ["Log → WAF → kernel ban", "Bir zincir", "Salt ban", "Parça-parça", "WAF ayrı"],
      ["WAF/CRS geçirim kapasitesi (aynı korpus)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["OWASP CRS pariteti", "100% (121 kural)", "—", "—", "Referans (100%)"],
      ["Gerçek saldırı recall", "100% (23 kat, 1K+10K)", "—", "—", "100%"],
      ["Daaıdılmış / JA3 klaster ban", "100% (80 IP)", "—", "Signal temelli", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Ayrı modul"],
      ["L7 uygulama koruması", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Kernel / eBPF (XDP) ban", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Yalancı pozitiv", "0,2% (ölçülü)", "Üüsek", "Orta", "CRS-a baalı"],
      ["Ban gecikmesi", "~20 ms", "san–dak", "san", "Ayrı integratsiya"],
      ["Kısa stabillik (5 dak)", "PASS (0 başarısızlık)", "—", "—", "—"],
      ["72s soak", "PASS (864/0)", "—", "—", "—"],
      ["Delil paketi PDF+JSON", "Avtomat (14 fayl)", "Yok", "Kısmen", "Modul-modul"],
      ["Avtomat test matritsası", "75 test", "—", "Kısmen", "—"],
      ["SOC zaman çizgisi / dashboard", "Ya (:8443)", "—", "Konsol", "—"],
      ["Telegram operatsiya + ack", "Ya (bir basış)", "—", "Kısmen", "—"],
      ["Kuruluş zamanı", "~15 dak", "dakka", "dakka", "saat (ayarlama)"],
    ],
    vsRows1: [
      ["İlk isteyi hemen bloklamaa", "Reaktiv (log satırı)", "Reaktiv", "Kısmen", "Inline (hemen)"],
      ["Volumetrik L3/L4 temizleme", "Yok — CDN tavsiye ediler", "Yok", "Yok", "Yok"],
      ["Cemaat signal aa", "Öz-hosting", "—", "Ya (global)", "—"],
      ["Edge / Cloud WAF", "Origin katı", "—", "Bouncer", "Proksi rejimi"],
      ["İdare edilän bulut / SaaS", "Yok (öz-hosting)", "Yok", "Ya (konsol)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 osa Debian 12 (amd64)",
      "nginx + yazılabilän access log (log_guardian formatı)",
      "Root osa sudo (systemd, ipset, /etc/log-guardian)",
      "~200 MB disk, 128 MB RAM (Core); Pro için Docker",
      "İsteğä görä Pro: eBPF/XDP için 5.10+ kernel, Docker (dashboard/metrikalar)",
    ],
    setup: {
      pathTitles: ["Yeni server — .deb paketi", "Kaynak kod — kurmaa hem kurmaa"],
      pathBadges: ["tavsiye ediler", "geliştirici"],
      pathNotes: [
        "Kurmaa lääzım diil. Paket binar faylı, systemd unitlerini, kuralları hem skriptleri getirer. Enilemää güvenli: var olan /etc/log-guardian/rules.conf saklanêr. GitHub Releases-tan (log-guardian_*_amd64.deb) osa bash scripts/build_deb.sh → dist/ ile kurun.",
        "GitHub repo-yu klonlayın hem kurun. Geliştirmä, ayarlama hem tam kaynak bakışı için ideal. install.sh systemd unitlerini, kuralları hem nginx log formatını kurêr.",
      ],
      pathSteps: [
        [
          { t: "Baalantılar", d: "İlk kuruluşta Debian paket baalantılarını ekleyin. nginx yoksa, onu aynı komutta eklemää olêr." },
          { t: "Paketi kurmaa", d: "dpkg -i baalantı yannışı bildirärsä, apt-get install -f çalıştırın. postinst adımı log-guardian kullanıcısını, izinneri, systemd unitlerini hem default rules.conf-u avtomat yaradêr." },
          { t: "İlk çalıştırma hem API güvenniklii", d: "nginx log formatını, FP trust-u hem API güvennikliini (token, fail-closed) birdän hazırlêr. Skriptlär paketin içindä (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Kaynak hem kurmaa", d: "Repo-yu klonlayın, hepsi çekirdeklärlän kurun hem baş kuruluş skriptini çalıştırın." },
          { t: "İlk çalıştırma hem token sinxronu", d: "Servisleri kaldırêr hem API token sinxronunu hem dashboard baalantısını hazırlêr." },
        ],
      ],
      commonTitle: "Ortak adımnar (A osa B sora)",
      commonSteps: [
        { t: "Nginx log formatı", d: "WAF isteyin gövdesini hem X-Forwarded-For-u okumaa için log_guardian log formatı lääzım. Setup onu genä avtomat kullanêr; STRICT rejimindä kontrol edin." },
        { t: "Saalık hem durum kontrolü", d: "Daemon IPC-yi, servis durumunu hem BPF özelliklerini kontrol edin. Yeşil kapı: post_install_verify sonunda FAIL: 0 görmää lääzım." },
        { t: "Metrikalar hem ilk ban testi", d: "Prometheus metrikalarını kontrol edin; trafiktän sora sayaçların kalktıını izleyin. Saldırı satırını ekleyip ban-ı ipset-tä kontrol edäbilirsiniz." },
        { t: "VirtualBox / XDP-sız (laptop hem VM)", d: "eBPF/XDP olmayan çevrelerdä ipset temelli ban ile --no-xdp yeter. Servis baalantısı başarısız olêrsa, tamir skripti bir komut." },
      ],
      dashboardTitle: "Pro dashboard — kuruluştan sora (isteğä görä)",
      dashboardBadge: "Pro · isteğä görä",
      dashboardNote: "Dashboard bu landing saytında diil, kendi maşinanızda çalışêr. Prod stack Caddy + Docker aracıllıınnan https://localhost:8443 adresindä hizmet eder.",
      dashboardSteps: [
        { t: "Prod stack-i başlatmaa", d: "Kendi serverinizdä dashboard-u kurêr hem kaldırêr. Giriş: admin / .env-deki DASHBOARD_ADMIN_PASSWORD." },
        { t: "Uzak VPS için SSH tünel", d: "Dashboard-u internetä açmadaan güvenli görmää için SSH tünel kurun; ilkin serveri sertleştirin." },
      ],
    },
  },
  ug: {
    pipelineNote:
      "XDR، Wasm بازىرى ۋە LLM Copilot ئۇزۇن مۇددەتلىك تاللانما قاتلاملار — Core ئۆزىلا ئىشلەپچىقىرىشقا تەييار.",
    selectedBodies: [
      "بىرلا زەنجىر: nginx خاتىرىسى → OWASP CRS → ~20 مىللىسېكۇنت يادرو چەكلىشى. ~15 مىنۇتتا ئىشلەپچىقىرىشتا.",
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
      { k: "~20 مىللىسېكۇنت يادرو چەكلىشى", v: "خاتىرە قۇرىدىن ipset/XDP چەكلەشكە ئوتتۇرا قىممەت ~20 مىللىسېكۇنت. Fail2ban/CrowdSec سېكۇنت–مىنۇت دەرىجىسىدە قالىدۇ؛ 21 ئۆلچەنگەن نەمۇنە بىلەن ئىسپاتلانغان." },
      { k: "280,373 EPS · 16.93× ModSec", v: "ئوخشاش كوربۇستا ۋە ئوخشاش 121 OWASP CRS قېلىپىدا (PCRE2 JIT) WAF/CRS ئۆتكۈزۈش ئىقتىدارى 280,373 EPS — ModSec نىڭ 16,560 EPS ئىدىن 16.93× تېز. ئۆلچەنگەن ۋە قايتا ئىشلەپچىقارغىلى بولىدۇ (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS تەڭپۇڭلۇقى", v: "121 OWASP CRS قائىدىسى، 1500 قۇرلۇق كورپۇستا ھەقىقىي ھۇجۇم recall 100% ۋە ModSec بىلەن تولۇق تەڭپۇڭلۇق — 0.2% يالغان مۇسبەتتە." },
      { k: "تارقاق ھۇجۇمنى قاپلاش", v: "JA3 توپلام بايقاش + IP بويىچە چەكلەش — 80 IP جانلىق سىناقتا 100%. Fail2ban يەككە IP لىق؛ CrowdSec ئايرىم سىگنال تورى تەلەپ قىلىدۇ." },
      { k: "ئوچۇق، قايتا ياسىغىلى بولىدىغان ئىسپات", v: "75 ئاپتوماتىك سىناق + 14 ھۆججەتلىك ئىسپات بولىقى + 72 سائەت soak (864 نەمۇنە، 0 خاتالىق). رەقىبلەردە ئاپتوماتىك ئىسپات يوق ياكى پارچە-پارچە." },
      { k: "Self-hosted · MIT · تۈركىيەدە ياسالغان", v: "سانلىق مەلۇماتىڭىز سىزدە قالىدۇ، ساتقۇچىغا باغلىنىش يوق، تولۇق ئوچۇق كود. SOC ۋاقىت سىزىقى، Prometheus مېترىكىلىرى ۋە Telegram باشقۇرۇشى بىر تاختىدا (:8443)." },
    ],
    vsNote:
      "سەمىمىي چەك: بەزى ساھەلەردە رەقىبلەر ئېنىق ياخشىراق (قىزىل كاتەكچىلەر). ModSec + CRS تۇنجى ئىلتىماسنى دەرھال توسۇشتا ئالدىدا؛ CrowdSec تارقاق جەمئىيەت سىگنال تورىدا ۋە باشقۇرۇلىدىغان SaaS كونسولىدا كۈچلۈك. ئۇنىڭ ئورنىغا ئوخشاش كوربۇستا ۋە ئوخشاش 121 CRS قېلىپىدا WAF/CRS ئۆتكۈزۈش ئىقتىدارىمىز 280,373 EPS — ModSec نىڭ 16,560 EPS ئىدىن 16.93× يۇقىرى (bench-vs-modsec.json).",
    vsLegend: "قىزىل = شۇ قۇردىكى غالىب",
    honestItems: [
      "ئىنكاسچان قۇرۇلما — خاتىرە قۇرى چۈشكۈچە تۇنجى ئىلتىماس ئۆتۈپ كېتىشى مۇمكىن؛ بىز ModSec نىڭ inline سۈرئىتىدە ئەمەس.",
      "L3/L4 DDoS نى سىڭدۈرمەيمىز — CDN ئارقىسىدا تۇرىمىز.",
      "تارقاق botnet — IP بويىچە چەكلەش؛ CrowdSec سىگنال تورى يوق.",
      "قىلىدۇ: خاتىرە → CRS/WAF → ~20 مىللىسېكۇنت يادرو چەكلىشى، ئىسپات PDF، Telegram باشقۇرۇش، MIT self-hosted.",
    ],
    layersBodies: [
      "خاتىرە → WAF → ipset چەكلەش (~15 مىنۇت)",
      "eBPF دېمونى، تاختا، مېترىكىلار، فلوت",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["ئۆلچەم", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["كۈچلۈك تەرەپلىرى (ئۆلچەنگەن)", "سەمىمىي چەكلەر"],
    vsRows0: [
      ["لوگ → WAF → يادرو چەكلەش", "بىر زەنجىر", "پەقەت چەكلەش", "پارچە-پارچە", "WAF ئايرىم"],
      ["WAF/CRS ئۆتكۈزۈش ئىقتىدارى (ئوخشاش كوربۇس)", "280,373 EPS (16.93×)", "—", "—", "16,560 EPS"],
      ["OWASP CRS تەڭپۇڭلۇقى", "100% (121 قائىدە)", "—", "—", "پايدىلىنىش (100%)"],
      ["ھەقىقىي ھۇجۇم recall", "100% (1K+10K)", "—", "—", "100%"],
      ["تارقاق / JA3 كلاستېر چەكلەش", "100% (80 IP)", "—", "سىگنالغا ئاساسەن", "—"],
      ["nginx ئىچكى consult", "PASS", "—", "—", "ئايرىم مودۇل"],
      ["L7 پروگرامما قوغدىشى", "WAF + consult + eBPF", "—", "—", "CRS ئىچكى"],
      ["يادرو / eBPF (XDP) چەكلەش", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["يالغان مۇسبەت", "0.2% (ئۆلچەنگەن)", "يۇقىرى", "ئوتتۇرا", "CRS غا باغلىق"],
      ["چەكلەش كېچىكىشى", "~20 ms", "سېكۇنت–مىنۇت", "سېكۇنت", "ئايرىم بىرلەشتۈرۈش"],
      ["قىسقا مۇقىملىق (5 مىنۇت)", "PASS (0 مەغلۇبىيەت)", "—", "—", "—"],
      ["72سائەت soak", "PASS (864/0)", "—", "—", "—"],
      ["ئىسپات بوغچىسى PDF+JSON", "ئاپتوماتىك (14 ھۆججەت)", "يوق", "قىسمەن", "مودۇل-مودۇل"],
      ["ئاپتومات سىناق ماترىتسىسى", "75 سىناق", "—", "قىسمەن", "—"],
      ["SOC ۋاقىت سىزىقى / تاختا", "ھەئە (:8443)", "—", "كونسول", "—"],
      ["Telegram مەشغۇلات + ack", "ھەئە (بىر چېكىش)", "—", "قىسمەن", "—"],
      ["ئورنىتىش ۋاقتى", "~15 مىنۇت", "مىنۇت", "مىنۇت", "سائەت (تەڭشەش)"],
    ],
    vsRows1: [
      ["تۇنجى ئىلتىماسنى دەرھال توسۇش", "ئىنكاسچان (لوگ قۇرى)", "ئىنكاسچان", "قىسمەن", "ئىچكى (دەرھال)"],
      ["ھەجىملىك L3/L4 تازىلاش", "يوق — CDN تەۋسىيە", "يوق", "يوق", "يوق"],
      ["مەھەللە سىگنال تورى", "ئۆزى ھوستلاش", "—", "ھەئە (گلوباللىق)", "—"],
      ["Edge / بۇلۇت WAF", "مەنبە قەۋىتى", "—", "Bouncer", "ۋاكالەتچى ھالىتى"],
      ["باشقۇرۇلىدىغان بۇلۇت / SaaS", "يوق (ئۆزى ھوستلاش)", "يوق", "ھەئە (كونسول)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 ياكى Debian 12 (amd64)",
      "nginx + يازغىلى بولىدىغان access لوگ (log_guardian فورماتى)",
      "Root ياكى sudo (systemd، ipset، /etc/log-guardian)",
      "~200 MB دىسكا، 128 MB RAM (Core)؛ Pro ئۈچۈن Docker",
      "تاللانما Pro: eBPF/XDP ئۈچۈن 5.10+ يادرو، Docker (تاختا/ئۆلچەملەر)",
    ],
    setup: {
      pathTitles: ["يېڭى مۇلازىمېتىر — .deb بوغچىسى", "مەنبە كودى — قۇرۇش ۋە ئورنىتىش"],
      pathBadges: ["تەۋسىيە قىلىنىدۇ", "ئىجادكار"],
      pathNotes: [
        "قۇرۇش تەلەپ قىلىنمايدۇ. بوغچا بىنارنى، systemd بىرلىكلىرىنى، قائىدىلەرنى ۋە قوليازمىلارنى ئېلىپ كېلىدۇ. يېڭىلاشقا بىخەتەر: مەۋجۇت /etc/log-guardian/rules.conf ساقلىنىدۇ. GitHub Releases دىن (log-guardian_*_amd64.deb) ياكى bash scripts/build_deb.sh → dist/ ئارقىلىق قۇرۇڭ.",
        "GitHub خەزىنىسىنى كۆچۈرۈپ قۇرۇڭ. ئېچىش، خاسلاشتۇرۇش ۋە تولۇق مەنبە تەكشۈرۈش ئۈچۈن ئەڭ ياخشى. install.sh systemd بىرلىكلىرىنى، قائىدىلەرنى ۋە nginx لوگ فورماتىنى ئورنىتىدۇ.",
      ],
      pathSteps: [
        [
          { t: "بېقىنمىلىقلار", d: "تۇنجى ئورنىتىشتا Debian بوغچا بېقىنمىلىقلىرىنى قوشۇڭ. nginx يوق بولسا، ئۇنى ئوخشاش بۇيرۇقتا قوشقىلى بولىدۇ." },
          { t: "بوغچىنى ئورنىتىش", d: "dpkg -i بېقىنمىلىق خاتالىقىنى مەلۇم قىلسا، apt-get install -f نى ئىجرا قىلىڭ. postinst باسقۇچى log-guardian ئىشلەتكۈچىسىنى، ھوقۇقلارنى، systemd بىرلىكلىرىنى ۋە كۆڭۈلدىكى rules.conf نى ئاپتوماتىك قۇرىدۇ." },
          { t: "تۇنجى ئىجرا ۋە API بىخەتەرلىكى", d: "nginx لوگ فورماتىنى، FP trust نى ۋە API بىخەتەرلىكىنى (تالون، fail-closed) بىراقلا تەييارلايدۇ. قوليازمىلار بوغچا ئىچىدە (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "مەنبە ۋە قۇرۇش", d: "خەزىنىنى كۆچۈرۈپ، بارلىق يادرولار بىلەن قۇرۇڭ ۋە ئاساسلىق ئورنىتىش قوليازمىسىنى ئىجرا قىلىڭ." },
          { t: "تۇنجى ئىجرا ۋە تالون ماسلىشىشى", d: "مۇلازىمەتلەرنى قوزغىتىدۇ ۋە API تالون ماسلىشىشى ۋە تاختا ئۇلىنىشىنى تەييارلايدۇ." },
        ],
      ],
      commonTitle: "ئورتاق باسقۇچلار (A ياكى B دىن كېيىن)",
      commonSteps: [
        { t: "Nginx لوگ فورماتى", d: "WAF نىڭ ئىلتىماس گەۋدىسى ۋە X-Forwarded-For نى ئوقۇشى ئۈچۈن log_guardian لوگ فورماتى كېرەك. Setup ئۇنى ئادەتتە ئاپتوماتىك قوللىنىدۇ؛ STRICT ھالەتتە تەكشۈرۈڭ." },
        { t: "ساغلاملىق ۋە ھالەت تەكشۈرۈش", d: "Daemon IPC نى، مۇلازىمەت ھالىتىنى ۋە BPF ئىقتىدارلىرىنى تەكشۈرۈڭ. يېشىل دەرۋازا: post_install_verify ئاخىرىدا FAIL: 0 كۆرۈنۈشى كېرەك." },
        { t: "ئۆلچەملەر ۋە تۇنجى چەكلەش سىنىقى", d: "Prometheus ئۆلچەملىرىنى تەكشۈرۈڭ؛ ئېقىمدىن كېيىن ساناقچىلارنىڭ ئۆرلىگىنىنى كۆزىتىڭ. ھۇجۇم قۇرىنى قىستۇرۇپ چەكلەشنى ipset دا تەكشۈرەلەيسىز." },
        { t: "VirtualBox / XDP سىز (يان كومپيۇتېر ۋە VM)", d: "eBPF/XDP يوق مۇھىتلاردا ipset ئاساسىدىكى چەكلەش بىلەن --no-xdp يېتەرلىك. مۇلازىمەت بېقىنمىلىقى مەغلۇپ بولسا، ئوڭشاش قوليازمىسى بىر بۇيرۇق." },
      ],
      dashboardTitle: "Pro تاختا — ئورنىتىشتىن كېيىن (تاللانما)",
      dashboardBadge: "Pro · تاللانما",
      dashboardNote: "تاختا بۇ landing بېتىدە ئەمەس، ئۆزىڭىزنىڭ ماشىنىسىدا ئىجرا بولىدۇ. Prod stack Caddy + Docker ئارقىلىق https://localhost:8443 دا مۇلازىمەت قىلىدۇ.",
      dashboardSteps: [
        { t: "Prod stack نى قوزغىتىش", d: "ئۆزىڭىزنىڭ مۇلازىمېتىرىدا تاختىنى قۇرۇپ قوزغىتىدۇ. كىرىش: admin / .env دىكى DASHBOARD_ADMIN_PASSWORD." },
        { t: "يىراق VPS ئۈچۈن SSH توننېل", d: "تاختىنى تورغا ئاشكارىلىماي بىخەتەر كۆرۈش ئۈچۈن SSH توننېل قۇرۇڭ؛ ئالدى بىلەن مۇلازىمېتىرنى مۇستەھكەملەڭ." },
      ],
    },
  },
  sah: {
    pipelineNote:
      "XDR, Wasm маркета уонна LLM Copilot — уһун болдьохтоох талыллар слойдар; Core бэйэтэ продакшеҥҥа бэлэм.",
    selectedBodies: [
      "Биир сиэп: nginx лога → OWASP CRS → ~20 мс kernel бан. ~15 мүнүөтэ продакшеҥҥа.",
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
      { k: "~20 мс kernel бан", v: "Лог строкатыттан ipset/XDP баҥҥа медиана ~20 мс. Fail2ban/CrowdSec сөкүүндэ–мүнүөтэ таһымыгар хаалаллар; 5 кээмэйдэммит холобурунан дакаастаммыт." },
      { k: "280 373 EPS · 16,93× ModSec", v: "Биир корпуска уонна биир 121 OWASP CRS pattern (PCRE2 JIT) үрдүгэр WAF/CRS ыытар кыаҕа — 280 373 EPS, ModSec 16 560 EPS-тан 16,93× түргэн. Кээмэйдэммит уонна хатыланар (bench-vs-modsec.json)." },
      { k: "100% recall + 100% CRS паритета", v: "121 OWASP CRS быраабылата, 1500 строкалаах корпуска чахчы саба түһүү recall 100% уонна ModSec кытта толору паритет — 0.2% сымыйа позитивга." },
      { k: "Тарҕаммыт саба түһүүнү хабыы", v: "JA3 кластеры булуу + IP аайы бан — 80 IP тыыннаах тескэ 100%. Fail2ban биир IP-лаах; CrowdSec туспа сигнал ситимин ирдиир." },
      { k: "Ыраас, хат оҥоһуллар туоһу", v: "75 автомат тест + 14 файллаах туоһу пакета + 72 чаас soak (864 холобур, 0 алҕас). Күрэхтэһээччилэргэ автомат туоһу суох эбэтэр аҥаардас." },
      { k: "Self-hosted · MIT · Турцияҕа оҥоһуллубут", v: "Дааннайдарыҥ эйиэхэ хаалаллар, вендорга сыһыаны суох, толору аһаҕас код. SOC кэм линията, Prometheus метриктэрэ уонна Telegram салайыыта биир панельга (:8443)." },
    ],
    vsNote:
      "Кырдьык кыраныыс: сорох эйгэлэргэ күрэхтэһээччилэр биллэрдик ордуктар (кыһыл клеткалар). ModSec + CRS маҥнайгы көрдөһүүнү тута хаайарыгар инники; CrowdSec тарҕаммыт общество сигнал ситимигэр уонна салайыллар SaaS консолугар күүстээх. Онун оннугар биир корпуска уонна биир 121 CRS pattern үрдүгэр биһиги WAF/CRS ыытар кыахпыт — 280 373 EPS, ModSec 16 560 EPS-тан 16,93× үрдүк (bench-vs-modsec.json).",
    vsLegend: "Кыһыл = ол строкаҕа кыайааччы",
    honestItems: [
      "Реактивнай архитектура — лог строката түһүөр диэри маҥнайгы көрдөһүү ааһыан сөп; биһиги ModSec inline түргэнигэр буолбатахпыт.",
      "L3/L4 DDoS-у ыҥырбаппыт — CDN кэннигэр турабыт.",
      "Тарҕаммыт ботнет — IP аайы бан; CrowdSec сигнал ситимэ суох.",
      "Оҥорор: лог → CRS/WAF → ~20 мс kernel бан, туоһу PDF, Telegram салайыы, MIT self-hosted.",
    ],
    layersBodies: [
      "лог → WAF → ipset бан (~15 мүн)",
      "eBPF демон, панель, метриктэр, флот",
      "K8s/Helm (kind) + fleet + Wasm/mesh",
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
    vsCols: ["Метрика", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
    vsGroupLabels: ["Күүстээх өрүттэрэ (кээмэйдэммит)", "Кырдьыктаах кыраныыссалар"],
    vsRows0: [
      ["Лог → WAF → ядро бан", "Биир силбиэ", "Бан эрэ", "Аҥаардастыы", "WAF туспа"],
      ["WAF/CRS ыытар кыаҕа (биир корпус)", "280 373 EPS (16,93×)", "—", "—", "16 560 EPS"],
      ["OWASP CRS паритета", "100% (121 быраабыла)", "—", "—", "Эталон (100%)"],
      ["Дьиҥнээх саба түһүү recall", "100% (1K+10K)", "—", "—", "100%"],
      ["Тарҕаммыт / JA3 кластер бан", "100% (80 IP)", "—", "Сигналга олоҕуран", "—"],
      ["nginx inline consult", "PASS", "—", "—", "Туспа модуль"],
      ["L7 программа харыстабыла", "WAF + consult + eBPF", "—", "—", "CRS inline"],
      ["Ядро / eBPF (XDP) бан", "ipset + XDP", "iptables", "iptables/nft", "—"],
      ["Сымыйа позитив", "0,2% (кээмэйдэммит)", "Үрдүк", "Орто", "CRS-ка тутулуктаах"],
      ["Бан хойутааһына", "~20 мс", "сөк–мүн", "сөк", "Туспа интеграция"],
      ["Кылгас туруктаах (5 мүн)", "PASS (0 сатаммат)", "—", "—", "—"],
      ["72ч soak", "PASS (864/0)", "—", "—", "—"],
      ["Туоһу пакета PDF+JSON", "Автомат (14 файл)", "Суох", "Аҥаардас", "Модуль-модуль"],
      ["Автомат тест матрицата", "75 тест", "—", "Аҥаардас", "—"],
      ["SOC кэм линията / дашборд", "Сөп (:8443)", "—", "Консоль", "—"],
      ["Telegram операция + ack", "Сөп (биир баттааһын)", "—", "Аҥаардас", "—"],
      ["Туруорар кэмэ", "~15 мүн", "мүнүүтэ", "мүнүүтэ", "чаас (туруоруу)"],
    ],
    vsRows1: [
      ["Бастакы ыйытыыны түргэнник бөҕөрдүү", "Реактивнай (лог устуруока)", "Реактивнай", "Аҥаардас", "Inline (түргэнник)"],
      ["Кээмэйдээх L3/L4 ыраастааһын", "Суох — CDN сүбэлэнэр", "Суох", "Суох", "Суох"],
      ["Общество сигнал ситимэ", "Бэйэ-хостинг", "—", "Сөп (глобальнай)", "—"],
      ["Edge / Cloud WAF", "Origin хос", "—", "Bouncer", "Прокси режим"],
      ["Салайыллар былыт / SaaS", "Суох (бэйэ-хостинг)", "Суох", "Сөп (консоль)", "—"],
    ],
    requirements: [
      "Ubuntu 22.04 / 24.04 эбэтэр Debian 12 (amd64)",
      "nginx + суруллар access лог (log_guardian формата)",
      "Root эбэтэр sudo (systemd, ipset, /etc/log-guardian)",
      "~200 МБ диск, 128 МБ RAM (Core); Pro туһугар Docker",
      "Эбии Pro: eBPF/XDP туһугар 5.10+ ядро, Docker (дашборд/метрикалар)",
    ],
    setup: {
      pathTitles: ["Саҥа сервер — .deb пакета", "Төрүт кот — оҥоруу уонна туруоруу"],
      pathBadges: ["сүбэлэнэр", "оҥорооччу"],
      pathNotes: [
        "Оҥоруу наадата суох. Пакет бинары, systemd юниттарын, быраабылалары уонна скрипттэри аҕалар. Саҥардыыга куттала суох: баар /etc/log-guardian/rules.conf харалла хаалар. GitHub Releases-тан (log-guardian_*_amd64.deb) эбэтэр bash scripts/build_deb.sh → dist/ нөҥүө оҥоруҥ.",
        "GitHub репозиторийын клонныаҥ уонна оҥоруҥ. Сайыннарыы, туруоруу уонна толору кот бэрэбиэркэтэ туһугар быйаҥ. install.sh systemd юниттарын, быраабылалары уонна nginx лог форматын туруорар.",
      ],
      pathSteps: [
        [
          { t: "Тутулуктар", d: "Бастакы туруорууга Debian пакет тутулуктарын эбиҥ. nginx суох буоллаҕына, кинини биир бэйэтигэр эбиэххэ сөп." },
          { t: "Пакеты туруоруу", d: "dpkg -i тутулук алҕаһын биллэрдэҕинэ, apt-get install -f хамсатыҥ. postinst хамаан log-guardian туттааччытын, көҥүллэри, systemd юниттарын уонна default rules.conf-ы автоматынан үөскэтэр." },
          { t: "Бастакы хамсатыы уонна API куттала суоҕа", d: "nginx лог форматын, FP trust-ы уонна API куттала суоҕун (токен, fail-closed) биирдэ бэлэмнээбит. Скрипттэр пакет иһигэр (/usr/local/share/log-guardian/scripts/)." },
        ],
        [
          { t: "Төрүт уонна оҥоруу", d: "Репозиторийы клонныаҥ, бары ядролары кытта оҥоруҥ уонна сүрүн туруоруу скриптин хамсатыҥ." },
          { t: "Бастакы хамсатыы уонна токен синхрона", d: "Сулууспалары көтөҕөр уонна API токен синхронун уонна дашборд ситимин бэлэмнээбит." },
        ],
      ],
      commonTitle: "Уопсай хаамыылар (A эбэтэр B кэнниттэн)",
      commonSteps: [
        { t: "Nginx лог формата", d: "WAF ыйытыы этин уонна X-Forwarded-For-у ааҕарыгар log_guardian лог формата наада. Setup кинини сүрүннээн автоматынан туттар; STRICT режимҥэ бэрэбиэрдээҥ." },
        { t: "Доруобуйа уонна турук бэрэбиэркэтэ", d: "Daemon IPC-ны, сулууспа турукун уонна BPF кыахтарын бэрэбиэрдээҥ. Күөх аан: post_install_verify бүтүүтүгэр FAIL: 0 көрүөхтээххин." },
        { t: "Метрикалар уонна бастакы бан тест", d: "Prometheus метрикаларын бэрэбиэрдээҥ; трафик кэнниттэн ааҕааччылар үрдүүрүн одуулааҥ. Саба түһүү устуруокатын киллэрэн бан-ы ipset-ка бэрэбиэрдиэххэ сөп." },
        { t: "VirtualBox / XDP суох (ноутбук уонна VM)", d: "eBPF/XDP суох эйгэлэргэ ipset олоҕурбут бан уонна --no-xdp тиийэр. Сулууспа тутулуга сатамматаҕына, өрөмүөн скрипта биир хамаан." },
      ],
      dashboardTitle: "Pro дашборд — туруорууттан кэнниттэн (эбии)",
      dashboardBadge: "Pro · эбии",
      dashboardNote: "Дашборд бу landing сайтка буолбатах, бэйэҥ массыынаҥар үлэлиир. Prod стек Caddy + Docker нөҥүө https://localhost:8443 адреска үлэлиир.",
      dashboardSteps: [
        { t: "Prod стеги саҕалааһын", d: "Бэйэҥ серверыҥар дашборду оҥорор уонна көтөҕөр. Киирии: admin / .env-тэн DASHBOARD_ADMIN_PASSWORD." },
        { t: "Ыраах VPS туһугар SSH туннель", d: "Дашборду интэриниэккэ аспакка куттала суох көрөр туһугар SSH туннель туруоруҥ; бастаан сервери бөҕөргөтүҥ." },
      ],
    },
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
      cols: b.vsCols ?? base.vs.cols,
      groups: base.vs.groups.map((g, i) => ({
        ...g,
        label: b.vsGroupLabels?.[i] ?? g.label,
        rows: (i === 0 ? b.vsRows0 : b.vsRows1) ?? g.rows,
      })),
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
      requirements: b.requirements ?? base.setup.requirements,
      paths: b.setup
        ? base.setup.paths.map((p, pi) => ({
            ...p,
            title: b.setup!.pathTitles[pi] ?? p.title,
            badge: b.setup!.pathBadges[pi] ?? p.badge,
            note: b.setup!.pathNotes[pi] ?? p.note,
            steps: p.steps.map((s, si) => ({
              ...s,
              title: b.setup!.pathSteps[pi]?.[si]?.t ?? s.title,
              description: b.setup!.pathSteps[pi]?.[si]?.d ?? s.description,
            })),
          }))
        : base.setup.paths,
      common: b.setup
        ? {
            ...base.setup.common,
            title: b.setup.commonTitle,
            steps: base.setup.common.steps.map((s, si) => ({
              ...s,
              title: b.setup!.commonSteps[si]?.t ?? s.title,
              description: b.setup!.commonSteps[si]?.d ?? s.description,
            })),
          }
        : base.setup.common,
      dashboard: b.setup
        ? {
            ...base.setup.dashboard,
            title: b.setup.dashboardTitle,
            note: b.setup.dashboardNote,
            steps: base.setup.dashboard.steps.map((s, si) => ({
              ...s,
              title: b.setup!.dashboardSteps[si]?.t ?? s.title,
              description: b.setup!.dashboardSteps[si]?.d ?? s.description,
            })),
          }
        : base.setup.dashboard,
      dashboardBadge: b.setup?.dashboardBadge ?? base.setup.dashboardBadge,
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

/* --------------------- Per-locale /testler (tests) i18n --------------------- */
// Only the UI chrome (headings, summary block around the 100% badge, filters,
// status labels) is localized here. Individual test cards stay TR/EN.
type TestsOverride = Partial<PageCopy["tests"]>;

const TESTS_OVERRIDES: Partial<Record<Locale, TestsOverride>> = {
  de: {
    eyebrow: "//:Proof · Testmatrix", title: "Verifikationstests",
    intro: "Dieselbe automatische Testmatrix wie das Dashboard — Installations-Gates, CRS-Parität, FP, Ban-Latenz, Korpus-Recall und 72h-Soak. Alles gemessen und reproduzierbar.",
    allPassed: "Alle Tests bestanden", summary: "Testübersicht",
    passedWord: "Tests bestanden", warnWord: "Warnungen", failWord: "fehlgeschlagen",
    ctaPdf: "Nachweis-PDF", filterAll: "Alle",
    filterGate: "Installations- & Sicherheits-Gates", filterProof: "Wettbewerbs- & Sicherheitsnachweis",
    gateHeading: "Installations- und Sicherheits-Gates", proofHeading: "Wettbewerbs- und Sicherheitsnachweis",
    statusPass: "BESTANDEN", statusWarn: "WARNUNG", statusFail: "FEHLER", statusPending: "AUSSTEHEND",
  },
  fr: {
    eyebrow: "//:Proof · Matrice de tests", title: "Tests de vérification",
    intro: "La même matrice de tests automatiques que le tableau de bord — gates d'installation, parité CRS, FP, latence de ban, rappel de corpus et soak 72h. Tout mesuré et reproductible.",
    allPassed: "Tous les tests réussis", summary: "Résumé des tests",
    passedWord: "tests réussis", warnWord: "avertissements", failWord: "échoués",
    ctaPdf: "PDF de preuve", filterAll: "Tous",
    filterGate: "Gates d'installation & sécurité", filterProof: "Preuve compétitive & sécurité",
    gateHeading: "Gates d'installation et de sécurité", proofHeading: "Preuve compétitive et de sécurité",
    statusPass: "RÉUSSI", statusWarn: "ALERTE", statusFail: "ÉCHEC", statusPending: "EN ATTENTE",
  },
  es: {
    eyebrow: "//:Proof · Matriz de pruebas", title: "Pruebas de verificación",
    intro: "La misma matriz de pruebas automáticas que el panel — gates de instalación, paridad CRS, FP, latencia de ban, recall de corpus y soak 72h. Todo medido y reproducible.",
    allPassed: "Todas las pruebas superadas", summary: "Resumen de pruebas",
    passedWord: "pruebas superadas", warnWord: "avisos", failWord: "fallidas",
    ctaPdf: "PDF de prueba", filterAll: "Todas",
    filterGate: "Gates de instalación y seguridad", filterProof: "Prueba competitiva y de seguridad",
    gateHeading: "Gates de instalación y seguridad", proofHeading: "Prueba competitiva y de seguridad",
    statusPass: "PASA", statusWarn: "AVISO", statusFail: "FALLO", statusPending: "PENDIENTE",
  },
  ru: {
    eyebrow: "//:Proof · Матрица тестов", title: "Проверочные тесты",
    intro: "Та же автоматическая матрица тестов, что и в дашборде — гейты установки, паритет CRS, FP, задержка бана, recall корпуса и 72ч soak. Всё измерено и воспроизводимо.",
    allPassed: "Все тесты пройдены", summary: "Сводка тестов",
    passedWord: "тестов пройдено", warnWord: "предупреждений", failWord: "провалено",
    ctaPdf: "PDF-доказательство", filterAll: "Все",
    filterGate: "Гейты установки и безопасности", filterProof: "Конкурентное и защитное доказательство",
    gateHeading: "Гейты установки и безопасности", proofHeading: "Конкурентное и защитное доказательство",
    statusPass: "ПРОЙДЕНО", statusWarn: "ПРЕДУПР.", statusFail: "ПРОВАЛ", statusPending: "ОЖИДАНИЕ",
  },
  pt: {
    eyebrow: "//:Proof · Matriz de testes", title: "Testes de verificação",
    intro: "A mesma matriz de testes automáticos do painel — gates de instalação, paridade CRS, FP, latência de ban, recall de corpus e soak 72h. Tudo medido e reproduzível.",
    allPassed: "Todos os testes aprovados", summary: "Resumo dos testes",
    passedWord: "testes aprovados", warnWord: "avisos", failWord: "falharam",
    ctaPdf: "PDF de prova", filterAll: "Todos",
    filterGate: "Gates de instalação e segurança", filterProof: "Prova competitiva e de segurança",
    gateHeading: "Gates de instalação e segurança", proofHeading: "Prova competitiva e de segurança",
    statusPass: "PASSOU", statusWarn: "AVISO", statusFail: "FALHOU", statusPending: "PENDENTE",
  },
  nl: {
    eyebrow: "//:Proof · Testmatrix", title: "Verificatietests",
    intro: "Dezelfde automatische testmatrix als het dashboard — installatie-gates, CRS-pariteit, FP, ban-latency, corpus-recall en 72u soak. Alles gemeten en reproduceerbaar.",
    allPassed: "Alle tests geslaagd", summary: "Testoverzicht",
    passedWord: "tests geslaagd", warnWord: "waarschuwingen", failWord: "mislukt",
    ctaPdf: "Bewijs-PDF", filterAll: "Alle",
    filterGate: "Installatie- & beveiligingsgates", filterProof: "Concurrentie- & beveiligingsbewijs",
    gateHeading: "Installatie- en beveiligingsgates", proofHeading: "Concurrentie- en beveiligingsbewijs",
    statusPass: "GESLAAGD", statusWarn: "WAARSCH.", statusFail: "MISLUKT", statusPending: "IN AFW.",
  },
  zh: {
    eyebrow: "//:Proof · 测试矩阵", title: "验证测试",
    intro: "与仪表板相同的自动测试矩阵——安装关卡、CRS 对等、误报、封禁延迟、语料召回和 72 小时 soak。全部实测且可复现。",
    allPassed: "所有测试通过", summary: "测试摘要",
    passedWord: "项测试通过", warnWord: "警告", failWord: "失败",
    ctaPdf: "证据 PDF", filterAll: "全部",
    filterGate: "安装与安全关卡", filterProof: "竞争与安全证据",
    gateHeading: "安装与安全关卡", proofHeading: "竞争与安全证据",
    statusPass: "通过", statusWarn: "警告", statusFail: "失败", statusPending: "待定",
  },
  ja: {
    eyebrow: "//:Proof · テストマトリクス", title: "検証テスト",
    intro: "ダッシュボードと同じ自動テストマトリクス——インストールゲート、CRS 整合、誤検知、BAN レイテンシ、コーパスリコール、72時間ソーク。すべて実測・再現可能。",
    allPassed: "全テスト合格", summary: "テスト概要",
    passedWord: "テスト合格", warnWord: "警告", failWord: "失敗",
    ctaPdf: "証拠 PDF", filterAll: "すべて",
    filterGate: "インストール & セキュリティゲート", filterProof: "競合 & セキュリティ証拠",
    gateHeading: "インストールとセキュリティゲート", proofHeading: "競合とセキュリティ証拠",
    statusPass: "合格", statusWarn: "警告", statusFail: "失敗", statusPending: "保留",
  },
  ko: {
    eyebrow: "//:Proof · 테스트 매트릭스", title: "검증 테스트",
    intro: "대시보드와 동일한 자동 테스트 매트릭스 — 설치 게이트, CRS 동등성, 오탐, 밴 지연, 코퍼스 재현율, 72시간 soak. 모두 측정·재현 가능.",
    allPassed: "모든 테스트 통과", summary: "테스트 요약",
    passedWord: "개 테스트 통과", warnWord: "경고", failWord: "실패",
    ctaPdf: "증거 PDF", filterAll: "전체",
    filterGate: "설치 & 보안 게이트", filterProof: "경쟁 & 보안 증거",
    gateHeading: "설치 및 보안 게이트", proofHeading: "경쟁 및 보안 증거",
    statusPass: "통과", statusWarn: "경고", statusFail: "실패", statusPending: "대기",
  },
  ar: {
    eyebrow: "//:Proof · مصفوفة الاختبارات", title: "اختبارات التحقق",
    intro: "نفس مصفوفة الاختبارات الآلية مثل اللوحة — بوابات التثبيت، تكافؤ CRS، الإيجابيات الكاذبة، زمن الحظر، استرجاع المجموعة وsoak لمدة 72 ساعة. كله مقاس وقابل لإعادة الإنتاج.",
    allPassed: "نجحت كل الاختبارات", summary: "ملخص الاختبارات",
    passedWord: "اختبار ناجح", warnWord: "تحذيرات", failWord: "فشل",
    ctaPdf: "PDF الدليل", filterAll: "الكل",
    filterGate: "بوابات التثبيت والأمان", filterProof: "دليل تنافسي وأمني",
    gateHeading: "بوابات التثبيت والأمان", proofHeading: "دليل تنافسي وأمني",
    statusPass: "ناجح", statusWarn: "تحذير", statusFail: "فشل", statusPending: "معلّق",
  },
  az: {
    eyebrow: "//:Proof · Test matrisi", title: "Doğrulama testləri",
    intro: "Dashboard ilə eyni avtomatik test matrisi — quraşdırma qapıları, CRS pariteti, FP, ban gecikməsi, korpus recall və 72s soak. Hamısı ölçülmüş və təkrar istehsal edilə bilən.",
    allPassed: "Bütün testlər keçdi", summary: "Test xülasəsi",
    passedWord: "test keçdi", warnWord: "xəbərdarlıq", failWord: "uğursuz",
    ctaPdf: "Sübut PDF", filterAll: "Hamısı",
    filterGate: "Quraşdırma və təhlükəsizlik qapıları", filterProof: "Rəqabət və təhlükəsizlik sübutu",
    gateHeading: "Quraşdırma və təhlükəsizlik qapıları", proofHeading: "Rəqabət və təhlükəsizlik sübutu",
    statusPass: "KEÇDİ", statusWarn: "XƏBƏRDARLIQ", statusFail: "UĞURSUZ", statusPending: "GÖZLƏYİR",
  },
  kk: {
    eyebrow: "//:Proof · Тест матрицасы", title: "Тексеру тесттері",
    intro: "Дашбордпен бірдей автоматты тест матрицасы — орнату қақпалары, CRS паритеті, FP, бан кідірісі, корпус recall және 72с soak. Бәрі өлшенген және қайта жаңғыртылатын.",
    allPassed: "Барлық тесттер өтті", summary: "Тест қорытындысы",
    passedWord: "тест өтті", warnWord: "ескерту", failWord: "құлады",
    ctaPdf: "Дәлел PDF", filterAll: "Барлығы",
    filterGate: "Орнату және қауіпсіздік қақпалары", filterProof: "Бәсеке және қауіпсіздік дәлелі",
    gateHeading: "Орнату және қауіпсіздік қақпалары", proofHeading: "Бәсеке және қауіпсіздік дәлелі",
    statusPass: "ӨТТІ", statusWarn: "ЕСКЕРТУ", statusFail: "ҚҰЛАДЫ", statusPending: "КҮТУДЕ",
  },
  uz: {
    eyebrow: "//:Proof · Test matritsasi", title: "Tekshirish testlari",
    intro: "Dashboard bilan bir xil avtomatik test matritsasi — o'rnatish darvozalari, CRS pariteti, FP, ban kechikishi, korpus recall va 72s soak. Hammasi o'lchangan va qayta ishlab chiqariladigan.",
    allPassed: "Barcha testlar o'tdi", summary: "Test xulosasi",
    passedWord: "test o'tdi", warnWord: "ogohlantirish", failWord: "muvaffaqiyatsiz",
    ctaPdf: "Dalil PDF", filterAll: "Hammasi",
    filterGate: "O'rnatish va xavfsizlik darvozalari", filterProof: "Raqobat va xavfsizlik dalili",
    gateHeading: "O'rnatish va xavfsizlik darvozalari", proofHeading: "Raqobat va xavfsizlik dalili",
    statusPass: "O'TDI", statusWarn: "OGOHLANTIRISH", statusFail: "MUVAFFAQIYATSIZ", statusPending: "KUTILMOQDA",
  },
  ky: {
    eyebrow: "//:Proof · Тест матрицасы", title: "Текшерүү тесттери",
    intro: "Дашборд менен бирдей автоматтык тест матрицасы — орнотуу дарбазалары, CRS паритети, FP, бан кечигүүсү, корпус recall жана 72с soak. Баары өлчөнгөн жана кайра чыгарылуучу.",
    allPassed: "Бардык тесттер өттү", summary: "Тест жыйынтыгы",
    passedWord: "тест өттү", warnWord: "эскертүү", failWord: "кулады",
    ctaPdf: "Далил PDF", filterAll: "Баары",
    filterGate: "Орнотуу жана коопсуздук дарбазалары", filterProof: "Атаандаштык жана коопсуздук далили",
    gateHeading: "Орнотуу жана коопсуздук дарбазалары", proofHeading: "Атаандаштык жана коопсуздук далили",
    statusPass: "ӨТТҮ", statusWarn: "ЭСКЕРТҮҮ", statusFail: "КУЛАДЫ", statusPending: "КҮТҮҮДӨ",
  },
  tk: {
    eyebrow: "//:Proof · Test matrisasy", title: "Barlaýyş testleri",
    intro: "Dashboard bilen birmeňzeş awtomatik test matrisasy — gurnama derwezeleri, CRS pariteti, FP, ban gijikdirmesi, korpus recall we 72s soak. Hemmesi ölçelen we gaýtadan öndürilýän.",
    allPassed: "Ähli testler geçdi", summary: "Test jemi",
    passedWord: "test geçdi", warnWord: "duýduryş", failWord: "şowsuz",
    ctaPdf: "Subutnama PDF", filterAll: "Hemmesi",
    filterGate: "Gurnama we howpsuzlyk derwezeleri", filterProof: "Bäsdeşlik we howpsuzlyk subutnamasy",
    gateHeading: "Gurnama we howpsuzlyk derwezeleri", proofHeading: "Bäsdeşlik we howpsuzlyk subutnamasy",
    statusPass: "GEÇDI", statusWarn: "DUÝDURYŞ", statusFail: "ŞOWSUZ", statusPending: "GARAŞÝAR",
  },
  tt: {
    eyebrow: "//:Proof · Тест матрицасы", title: "Тикшерү тестлары",
    intro: "Дашборд белән бертөрле автомат тест матрицасы — урнаштыру капкалары, CRS паритеты, FP, бан тоткарлыгы, корпус recall һәм 72с soak. Барысы да үлчәнгән һәм кабат җитештерелә торган.",
    allPassed: "Барлык тестлар үтте", summary: "Тест йомгагы",
    passedWord: "тест үтте", warnWord: "кисәтү", failWord: "калды",
    ctaPdf: "Дәлил PDF", filterAll: "Барысы",
    filterGate: "Урнаштыру һәм куркынычсызлык капкалары", filterProof: "Ярыш һәм куркынычсызлык дәлиле",
    gateHeading: "Урнаштыру һәм куркынычсызлык капкалары", proofHeading: "Ярыш һәм куркынычсызлык дәлиле",
    statusPass: "ҮТТЕ", statusWarn: "КИСӘТҮ", statusFail: "КАЛДЫ", statusPending: "КӨТӘ",
  },
  ba: {
    eyebrow: "//:Proof · Тест матрицаһы", title: "Тикшереү тестары",
    intro: "Дашборд менән бер төрлө автомат тест матрицаһы — урынлаштырыу ҡапҡалары, CRS паритеты, FP, бан тотҡарлығы, корпус recall һәм 72с soak. Барыһы ла үлсәнгән һәм ҡабат етештерелә торған.",
    allPassed: "Бөтә тестар үтте", summary: "Тест йомғағы",
    passedWord: "тест үтте", warnWord: "иҫкәртеү", failWord: "йығылды",
    ctaPdf: "Дәлил PDF", filterAll: "Барыһы",
    filterGate: "Урынлаштырыу һәм хәүефһеҙлек ҡапҡалары", filterProof: "Ярыш һәм хәүефһеҙлек дәлиле",
    gateHeading: "Урынлаштырыу һәм хәүефһеҙлек ҡапҡалары", proofHeading: "Ярыш һәм хәүефһеҙлек дәлиле",
    statusPass: "ҮТТЕ", statusWarn: "ИҪКӘРТЕҮ", statusFail: "ЙЫҒЫЛДЫ", statusPending: "КӨТӘ",
  },
  cv: {
    eyebrow: "//:Proof · Тест матрици", title: "Тӗрӗслев тесчӗсем",
    intro: "Дашбордри пекех автомат тест матрици — вырнаҫтару хапхисем, CRS паритечӗ, FP, бан кӗтесси, корпус recall тата 72с soak. Пурте виҫнӗ тата тепӗр хут тӑвакан.",
    allPassed: "Пур тестсем иртрӗҫ", summary: "Тест пӗтӗмлетӗвӗ",
    passedWord: "тест иртрӗ", warnWord: "асӑрхаттару", failWord: "ӳкрӗ",
    ctaPdf: "Кӑтарту PDF", filterAll: "Пурте",
    filterGate: "Вырнаҫтару тата хӑрушсӑрлӑх хапхисем", filterProof: "Ӑмӑрту тата хӑрушсӑрлӑх кӑтартӑвӗ",
    gateHeading: "Вырнаҫтару тата хӑрушсӑрлӑх хапхисем", proofHeading: "Ӑмӑрту тата хӑрушсӑрлӑх кӑтартӑвӗ",
    statusPass: "ИРТРӖ", statusWarn: "АСӐРХ.", statusFail: "ӲКРӖ", statusPending: "КӖТЕТ",
  },
  crh: {
    eyebrow: "//:Proof · Test matritsası", title: "Doğrulama testleri",
    intro: "Dashboard ile aynı avtomatik test matritsası — qurulım qapıları, CRS pariteti, FP, ban keçikmesi, korpus recall ve 72s soak. Episi ölçengen ve tekrar tüzülgen.",
    allPassed: "Episi testler keçti", summary: "Test hulâsası",
    passedWord: "test keçti", warnWord: "tenbi", failWord: "keçmedi",
    ctaPdf: "Delil PDF", filterAll: "Episi",
    filterGate: "Qurulım ve qavutlıq qapıları", filterProof: "Rekabet ve qavutlıq delili",
    gateHeading: "Qurulım ve qavutlıq qapıları", proofHeading: "Rekabet ve qavutlıq delili",
    statusPass: "KEÇTI", statusWarn: "TENBİ", statusFail: "KEÇMEDİ", statusPending: "BEKLEY",
  },
  gag: {
    eyebrow: "//:Proof · Test matritsası", title: "Doğrulama testleri",
    intro: "Dashboard ile aynı avtomat test matritsası — kuruluş kapıları, CRS pariteti, FP, ban gecikmesi, korpus recall hem 72s soak. Hepsi ölçülü hem tekrar yapılabilän.",
    allPassed: "Hepsi testler geçti", summary: "Test özeti",
    passedWord: "test geçti", warnWord: "tenbi", failWord: "geçmedi",
    ctaPdf: "Delil PDF", filterAll: "Hepsi",
    filterGate: "Kuruluş hem güvennik kapıları", filterProof: "Yarış hem güvennik delili",
    gateHeading: "Kuruluş hem güvennik kapıları", proofHeading: "Yarış hem güvennik delili",
    statusPass: "GEÇTI", statusWarn: "TENBİ", statusFail: "GEÇMEDI", statusPending: "BEKLER",
  },
  ug: {
    eyebrow: "//:Proof · سىناق ماترىتسىسى", title: "دەلىللەش سىناقلىرى",
    intro: "باشقۇرۇش تاختىسى بىلەن ئوخشاش ئاپتوماتىك سىناق ماترىتسىسى — ئورنىتىش دەرۋازىلىرى، CRS تەڭپۇڭلۇقى، FP، چەكلەش كېچىكىشى، كورپۇس recall ۋە 72سائەت soak. ھەممىسى ئۆلچەنگەن ۋە قايتا ياسىغىلى بولىدۇ.",
    allPassed: "بارلىق سىناقلار ئۆتتى", summary: "سىناق خۇلاسىسى",
    passedWord: "سىناق ئۆتتى", warnWord: "ئاگاھلاندۇرۇش", failWord: "مەغلۇپ",
    ctaPdf: "ئىسپات PDF", filterAll: "ھەممىسى",
    filterGate: "ئورنىتىش ۋە بىخەتەرلىك دەرۋازىلىرى", filterProof: "رىقابەت ۋە بىخەتەرلىك ئىسپاتى",
    gateHeading: "ئورنىتىش ۋە بىخەتەرلىك دەرۋازىلىرى", proofHeading: "رىقابەت ۋە بىخەتەرلىك ئىسپاتى",
    statusPass: "ئۆتتى", statusWarn: "ئاگاھ", statusFail: "مەغلۇپ", statusPending: "كۈتۈۋاتىدۇ",
  },
  sah: {
    eyebrow: "//:Proof · Тест матрицата", title: "Бэрэбиэркэ тестэрэ",
    intro: "Дашбордтыын биир автомат тест матрицата — туруоруу ааннара, CRS паритета, FP, бан хойутааһына, корпус recall уонна 72ч soak. Бары кээмэйдэммит уонна хат оҥоһуллар.",
    allPassed: "Бары тестэр аастылар", summary: "Тест түмүгэ",
    passedWord: "тест ааста", warnWord: "сэрэтии", failWord: "түстэ",
    ctaPdf: "Туоһу PDF", filterAll: "Барыта",
    filterGate: "Туруоруу уонна куттала суох ааннара", filterProof: "Күрэс уонна куттала суох туоһута",
    gateHeading: "Туруоруу уонна куттала суох ааннара", proofHeading: "Күрэс уонна куттала суох туоһута",
    statusPass: "ААСТА", statusWarn: "СЭРЭТИИ", statusFail: "ТҮСТЭ", statusPending: "КҮҮТ",
  },
};

export function getCopy(locale: Locale): PageCopy {
  if (locale === "tr") return CO_TR;
  if (locale === "en") return CO_EN;
  const o = SECTION_OVERRIDES[locale];
  let copy = o ? applySection(CO_EN, o) : CO_EN;
  const b = BODY_OVERRIDES[locale];
  if (b) copy = applyBody(copy, b);
  const to = TESTS_OVERRIDES[locale];
  if (to) copy = { ...copy, tests: { ...copy.tests, ...to } };
  return copy;
}
