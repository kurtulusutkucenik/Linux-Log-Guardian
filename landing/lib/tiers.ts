// Core · Pro · Pro Plus sürüm paketleri + kendi kendine yeten kurulum rehberleri.
// Kabuk komutları dile bağlı değildir → tek yerde tanımlanır, TR/EN metinleri
// referans verir. getTiers(locale): Türki diller TR, diğerleri EN'e düşer.

import type { Locale } from "./i18n/locales";

export type TierStep = {
  n: string;
  title: string;
  desc: string;
  cmd: string;
  out?: string;
};

export type Tier = {
  id: "core" | "pro" | "proplus";
  name: string;
  fullName: string;
  badge: string;
  accent: "neon" | "turq" | "cyan";
  tagline: string;
  chain: string;
  ram: string;
  disk: string;
  includes: string[];
  installSteps: TierStep[];
};

export type TiersCopy = {
  eyebrow: string;
  title: string;
  sub: string;
  ramLabel: string;
  diskLabel: string;
  chainLabel: string;
  includesLabel: string;
  protectionNote: string;
  respTitle: string;
  respBody: string;
  respRows: { layer: string; ours: string; third: string }[];
  respCols: [string, string, string];
  installEyebrow: string;
  installTitle: string;
  installSub: string;
  selfContainedNote: string;
  stepsWord: string;
  tiers: Tier[];
};

// --- Dile bağlı olmayan kabuk komutları (tek kaynak) ---------------------
const CMD = {
  deps:
    "sudo apt-get update\nsudo apt-get install -y ipset libbpf1 libcurl4 libpcre2-8-0 \\\n  libsqlite3-0 libssl3 libelf1 liburing2 nginx",
  build:
    "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git\ncd Linux-Log-Guardian\nmake -j$(nproc)\nsudo bash install.sh",
  firstRun:
    "sudo bash scripts/install_first_run.sh\nsudo bash scripts/ensure_api_security.sh\nbash scripts/post_install_verify.sh",
  nginx:
    "STRICT=1 bash scripts/check_nginx_log_format.sh\nsudo nginx -t && sudo systemctl reload nginx",
  health:
    "sudo log-guardian --health\ncurl -s http://127.0.0.1:9091/metrics | grep loganalyzer_\nsudo ipset list log-guardian-ban | head",
  docker:
    "curl -fsSL https://get.docker.com | sudo sh\nsudo usermod -aG docker $USER   # yeniden oturum aç",
  proStack: "bash scripts/dashboard_stack.sh",
  proVerify:
    "curl -sk https://localhost:8443/api/tier | jq .\n# tarayıcı: https://localhost:8443  (admin / .env DASHBOARD_ADMIN_PASSWORD)",
  k8sCli: "sudo bash scripts/install_k8s_cli.sh   # kind + kubectl + helm",
  proPlusStack: "bash scripts/pro_plus_stack.sh",
  proPlusVerify:
    "bash scripts/pro_plus_status.sh   # Core / Pro / Pro Plus RAM ayrı ölçüm\nbash scripts/pro_plus_down.sh     # K8s vitrin kapat → ~1,2 GB RAM geri",
} as const;

const OUT = {
  deps: "Setting up ipset ...\nSetting up nginx ...",
  build:
    "cc -O2 ... -o log-guardian\ncc -O2 ... -o log-guardian-daemon\n[install] systemd unit'leri kuruldu",
  firstRun: "[OK] servisler aktif\n[OK] API fail-closed (tokensiz 403)\n  FAIL: 0   WARN: 0",
  nginx: "[check] access_log log_guardian aktif\nnginx: configuration file test is successful",
  health:
    '[HEALTH] daemon IPC: OK\nloganalyzer_ban_success_total{tenant_id="default"} 8\nMembers:\n203.0.113.250',
  docker: "Docker version 27.x\n[OK] docker aktif",
  proStack: "[dashboard] docker compose build + up\n[OK] https://localhost:8443 hazir",
  proVerify: '{ "tier": "pro" }',
  k8sCli: "[OK] kind + kubectl + helm kuruldu",
  proPlusStack:
    "[pro_plus_stack] kind cluster olusturuldu\n[pro_plus_stack] helm install log-guardian\n[OK] pro_plus — K8s vitrin + helm kaniti hazir",
  proPlusVerify: "Core ~110 MB · Pro ~730 MB · Pro Plus ~1,9 GB\n[OK] pro_plus_down — kind kapali",
} as const;

// --- Kurulum adımları (TR) -----------------------------------------------
function coreStepsTR(): TierStep[] {
  return [
    { n: "01", title: "Bağımlılıklar", desc: "Debian/Ubuntu paket bağımlılıklarını ve (yoksa) nginx'i yükleyin.", cmd: CMD.deps, out: OUT.deps },
    { n: "02", title: "Kaynak + derleme + kurulum", desc: "Repoyu klonlayın, tüm çekirdeklerle derleyin ve install.sh ile systemd unit'lerini + kuralları kurun.", cmd: CMD.build, out: OUT.build },
    { n: "03", title: "İlk çalıştırma + API güvenliği", desc: "Servisleri başlatır, API token'ı fail-closed hazırlar ve kurulum kapısını doğrular (FAIL: 0 bekleyin).", cmd: CMD.firstRun, out: OUT.firstRun },
    { n: "04", title: "Nginx log formatı", desc: "WAF'ın body + X-Forwarded-For okuyabilmesi için log_guardian formatını uygulayın ve nginx'i reload edin.", cmd: CMD.nginx, out: OUT.nginx },
    { n: "05", title: "Sağlık + ilk ban testi", desc: "Daemon IPC, Prometheus metrik ve ipset ban listesini kontrol edin. Core artık üretimde.", cmd: CMD.health, out: OUT.health },
  ];
}
const proExtraTR: TierStep[] = [
  { n: "06", title: "Docker (kuruluysa atla)", desc: "Pro stack (dashboard, Grafana, Prometheus, Caddy) Docker ile çalışır.", cmd: CMD.docker, out: OUT.docker },
  { n: "07", title: "Pro SOC stack'i başlat", desc: "Dashboard + Grafana + Prometheus + Caddy TLS'i tek komutla ayağa kaldırır (LOG_GUARDIAN_TIER=pro).", cmd: CMD.proStack, out: OUT.proStack },
  { n: "08", title: "Dashboard doğrula", desc: "Tier'ı ve :8443 SOC panelini doğrulayın. Giriş: admin / .env DASHBOARD_ADMIN_PASSWORD.", cmd: CMD.proVerify, out: OUT.proVerify },
];
const proPlusExtraTR: TierStep[] = [
  { n: "09", title: "K8s CLI (kind + kubectl + helm)", desc: "Pro Plus vitrini için Kubernetes araçlarını kurar.", cmd: CMD.k8sCli, out: OUT.k8sCli },
  { n: "10", title: "Pro Plus stack (kind + Helm)", desc: "kind cluster oluşturur ve helm install ile 'cluster'da da çalışır' kanıtını üretir.", cmd: CMD.proPlusStack, out: OUT.proPlusStack },
  { n: "11", title: "Ölç + demo bitince kapat", desc: "RAM'i katman katman ölçün; demo bitince kind'i kapatıp ~1,2 GB RAM'i geri alın.", cmd: CMD.proPlusVerify, out: OUT.proPlusVerify },
];

// --- Kurulum adımları (EN) -----------------------------------------------
function coreStepsEN(): TierStep[] {
  return [
    { n: "01", title: "Dependencies", desc: "Install Debian/Ubuntu package dependencies and nginx (if missing).", cmd: CMD.deps, out: OUT.deps },
    { n: "02", title: "Source + build + install", desc: "Clone the repo, build with all cores and install systemd units + rules via install.sh.", cmd: CMD.build, out: OUT.build },
    { n: "03", title: "First run + API security", desc: "Starts services, prepares the fail-closed API token and verifies the setup gate (expect FAIL: 0).", cmd: CMD.firstRun, out: OUT.firstRun },
    { n: "04", title: "Nginx log format", desc: "Apply the log_guardian format so the WAF can read body + X-Forwarded-For, then reload nginx.", cmd: CMD.nginx, out: OUT.nginx },
    { n: "05", title: "Health + first ban test", desc: "Check daemon IPC, Prometheus metrics and the ipset ban list. Core is now in production.", cmd: CMD.health, out: OUT.health },
  ];
}
const proExtraEN: TierStep[] = [
  { n: "06", title: "Docker (skip if installed)", desc: "The Pro stack (dashboard, Grafana, Prometheus, Caddy) runs on Docker.", cmd: CMD.docker, out: OUT.docker },
  { n: "07", title: "Start the Pro SOC stack", desc: "Brings up dashboard + Grafana + Prometheus + Caddy TLS in one command (LOG_GUARDIAN_TIER=pro).", cmd: CMD.proStack, out: OUT.proStack },
  { n: "08", title: "Verify the dashboard", desc: "Verify the tier and the :8443 SOC panel. Login: admin / .env DASHBOARD_ADMIN_PASSWORD.", cmd: CMD.proVerify, out: OUT.proVerify },
];
const proPlusExtraEN: TierStep[] = [
  { n: "09", title: "K8s CLI (kind + kubectl + helm)", desc: "Installs the Kubernetes tools for the Pro Plus showcase.", cmd: CMD.k8sCli, out: OUT.k8sCli },
  { n: "10", title: "Pro Plus stack (kind + Helm)", desc: "Creates a kind cluster and produces the 'runs on a cluster too' proof via helm install.", cmd: CMD.proPlusStack, out: OUT.proPlusStack },
  { n: "11", title: "Measure + shut down after the demo", desc: "Measure RAM layer by layer; after the demo shut kind down and reclaim ~1.2 GB RAM.", cmd: CMD.proPlusVerify, out: OUT.proPlusVerify },
];

const TR: TiersCopy = {
  eyebrow: "//:Sürümler",
  title: "Core · Pro · Pro Plus",
  sub: "Aynı C çekirdeği, üç paketleme. İhtiyacın olan katmanı seç — hepsi bir arada 'mega platform' değil.",
  ramLabel: "RAM",
  diskLabel: "Disk",
  chainLabel: "Zincir",
  includesLabel: "İçindekiler",
  protectionNote: "Koruma seviyesi üç sürümde de aynıdır. Pro ve Pro Plus yalnızca görünürlük ve entegrasyon kanıtı ekler.",
  respTitle: "RAM ve disk artışı — sorumluluk sınırı",
  respBody:
    "Sürüm büyüdükçe artan RAM ve disk Log Guardian C çekirdeğinden kaynaklanmaz. Core binary ~515 KB ve ~110 MB RAM'de kalır. Fazlalık, SOC ve demo için seçtiğin harici araçların (Docker, Grafana, kind vb.) kapladığı alandır — kapatınca veya sadece Core çalıştırınca maliyet düşer.",
  respCols: ["Katman", "Log Guardian sorumluluğu", "Üçüncü parti (bizim dışımızda)"],
  respRows: [
    { layer: "Core", ours: "log-guardian + daemon + config/DB (~110 MB RAM, ~4–55 MB disk)", third: "—" },
    { layer: "Pro", ours: "Aynı Core binary; ek koruma yok", third: "Docker image'ları, Node.js dashboard, Grafana, Prometheus, Caddy" },
    { layer: "Pro Plus", ours: "Yine aynı Core; ek koruma yok", third: "kind/K8s node, Helm chart pod'ları, operator, opsiyonel Wasm/mesh" },
  ],
  installEyebrow: "//:Kurulum",
  installTitle: "Sürüme göre kurulum rehberi",
  installSub: "Sekmeni seç; her rehber kendi kendine yeter — Pro için Core'a, Pro Plus için Pro/Core'a bakmana gerek yok.",
  selfContainedNote: "Bu rehber baştan sona tek başına tamamlanır. Ubuntu 22.04/24.04 veya Debian 12 (amd64), root/sudo.",
  stepsWord: "adım",
  tiers: [
    {
      id: "core",
      name: "Core",
      fullName: "Linux Log Guardian",
      badge: "önerilen",
      accent: "neon",
      tagline: "log → WAF → kernel ban. Üretimde tek başına yeterli.",
      chain: "C binary → log → WAF → ban",
      ram: "~110 MB",
      disk: "~4 MB (temiz) · ~55 MB (events.db dolu)",
      includes: ["nginx parser", "OWASP CRS 121 kural", "ban pipeline", "ipset / XDP", "Prometheus metrik"],
      installSteps: coreStepsTR(),
    },
    {
      id: "pro",
      name: "Pro",
      fullName: "Linux Log Guardian Pro",
      badge: "SOC paneli",
      accent: "turq",
      tagline: "Core + SOC dashboard, Grafana, Prometheus, Caddy TLS, fleet.",
      chain: "Core + Dashboard + Grafana + Caddy + Prometheus",
      ram: "~730 MB (laptop) · ~400 MB (VM)",
      disk: "~5,3 GB (VM, çoğunlukla Docker image)",
      includes: ["SOC timeline (:8443)", "Grafana + $tenant panelleri", "Caddy TLS + JWT", "fleet / multi-tenant", "Telegram ops"],
      installSteps: [...coreStepsTR(), ...proExtraTR],
    },
    {
      id: "proplus",
      name: "Pro Plus",
      fullName: "Linux Log Guardian Pro Plus",
      badge: "en kapsamlı",
      accent: "cyan",
      tagline: "Pro + K8s/Helm kanıtı (kind), fleet vitrin, opsiyonel Wasm/mesh.",
      chain: "Pro + K8s/Helm kanıtı (kind) + fleet + Wasm/mesh",
      ram: "~1,9 GB (laptop, hepsi açık)",
      disk: "Pro disk + ~2–3 GB (kind volume)",
      includes: ["helm install log-guardian", "kind + admission webhook", "DaemonSet + operator", "fleet vitrin", "Wasm/mesh (ops.)"],
      installSteps: [...coreStepsTR(), ...proExtraTR, ...proPlusExtraTR],
    },
  ],
};

const EN: TiersCopy = {
  eyebrow: "//:Editions",
  title: "Core · Pro · Pro Plus",
  sub: "Same C core, three packagings. Pick the layer you need — not an all-in-one 'mega platform'.",
  ramLabel: "RAM",
  diskLabel: "Disk",
  chainLabel: "Chain",
  includesLabel: "Includes",
  protectionNote: "The protection level is identical across all three editions. Pro and Pro Plus only add visibility and integration proof.",
  respTitle: "RAM & disk growth — the responsibility boundary",
  respBody:
    "The RAM and disk that grow with higher editions do not come from the Log Guardian C core. The Core binary stays at ~515 KB and ~110 MB RAM. The extra footprint is the third-party tools you chose for SOC and demos (Docker, Grafana, kind, etc.) — shut them down or run Core only and the cost drops.",
  respCols: ["Layer", "Log Guardian's responsibility", "Third-party (outside us)"],
  respRows: [
    { layer: "Core", ours: "log-guardian + daemon + config/DB (~110 MB RAM, ~4–55 MB disk)", third: "—" },
    { layer: "Pro", ours: "Same Core binary; no extra protection", third: "Docker images, Node.js dashboard, Grafana, Prometheus, Caddy" },
    { layer: "Pro Plus", ours: "Still the same Core; no extra protection", third: "kind/K8s node, Helm chart pods, operator, optional Wasm/mesh" },
  ],
  installEyebrow: "//:Setup",
  installTitle: "Install guide by edition",
  installSub: "Pick your tab; each guide is self-contained — you don't need to read Core for Pro, or Pro/Core for Pro Plus.",
  selfContainedNote: "This guide completes end to end on its own. Ubuntu 22.04/24.04 or Debian 12 (amd64), root/sudo.",
  stepsWord: "steps",
  tiers: [
    {
      id: "core",
      name: "Core",
      fullName: "Linux Log Guardian",
      badge: "recommended",
      accent: "neon",
      tagline: "log → WAF → kernel ban. Enough on its own in production.",
      chain: "C binary → log → WAF → ban",
      ram: "~110 MB",
      disk: "~4 MB (clean) · ~55 MB (events.db full)",
      includes: ["nginx parser", "OWASP CRS 121 rules", "ban pipeline", "ipset / XDP", "Prometheus metrics"],
      installSteps: coreStepsEN(),
    },
    {
      id: "pro",
      name: "Pro",
      fullName: "Linux Log Guardian Pro",
      badge: "SOC panel",
      accent: "turq",
      tagline: "Core + SOC dashboard, Grafana, Prometheus, Caddy TLS, fleet.",
      chain: "Core + Dashboard + Grafana + Caddy + Prometheus",
      ram: "~730 MB (laptop) · ~400 MB (VM)",
      disk: "~5.3 GB (VM, mostly Docker images)",
      includes: ["SOC timeline (:8443)", "Grafana + $tenant panels", "Caddy TLS + JWT", "fleet / multi-tenant", "Telegram ops"],
      installSteps: [...coreStepsEN(), ...proExtraEN],
    },
    {
      id: "proplus",
      name: "Pro Plus",
      fullName: "Linux Log Guardian Pro Plus",
      badge: "most complete",
      accent: "cyan",
      tagline: "Pro + K8s/Helm proof (kind), fleet showcase, optional Wasm/mesh.",
      chain: "Pro + K8s/Helm proof (kind) + fleet + Wasm/mesh",
      ram: "~1.9 GB (laptop, all on)",
      disk: "Pro disk + ~2–3 GB (kind volume)",
      includes: ["helm install log-guardian", "kind + admission webhook", "DaemonSet + operator", "fleet showcase", "Wasm/mesh (opt.)"],
      installSteps: [...coreStepsEN(), ...proExtraEN, ...proPlusExtraEN],
    },
  ],
};

const TURKIC: Locale[] = ["tr", "az", "kk", "uz", "ky", "tk", "ug", "tt", "ba", "cv", "crh", "gag", "sah"];

export function getTiers(locale: Locale): TiersCopy {
  if (locale === "en") return EN;
  if (TURKIC.includes(locale)) return TR;
  return EN;
}
