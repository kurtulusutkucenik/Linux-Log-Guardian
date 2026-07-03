// Core · Pro · Pro Plus sürüm paketleri + kendi kendine yeten kurulum rehberleri.
// Kabuk komutları/çıktıları dile bağlı değildir → tek yerde tanımlanır (CMD/OUT).
// Metinler her dil için bir "text pack" ile verilir ve build() ile TiersCopy'ye
// dönüştürülür. getTiers(locale): pack varsa onu döner; Türki diller TR'ye,
// bilinmeyen diller EN'e düşer.

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

// 11 adımın komut/çıktıları (sabit sıra: core 1–5, pro +6–8, pro plus +9–11)
const STEP_CMDS = [
  CMD.deps, CMD.build, CMD.firstRun, CMD.nginx, CMD.health,
  CMD.docker, CMD.proStack, CMD.proVerify,
  CMD.k8sCli, CMD.proPlusStack, CMD.proPlusVerify,
];
const STEP_OUTS = [
  OUT.deps, OUT.build, OUT.firstRun, OUT.nginx, OUT.health,
  OUT.docker, OUT.proStack, OUT.proVerify,
  OUT.k8sCli, OUT.proPlusStack, OUT.proPlusVerify,
];

// --- Çeviri paketi tipi ---------------------------------------------------
type TierTextPack = {
  eyebrow: string;
  sub: string;
  ramLabel: string;
  diskLabel: string;
  chainLabel: string;
  includesLabel: string;
  protectionNote: string;
  respTitle: string;
  respBody: string;
  respCols: [string, string, string];
  respRows: [[string, string], [string, string], [string, string]];
  installEyebrow: string;
  installTitle: string;
  installSub: string;
  selfContainedNote: string;
  stepsWord: string;
  badges: [string, string, string];
  taglines: [string, string, string];
  chains: [string, string, string];
  rams: [string, string, string];
  disks: [string, string, string];
  includes: [string[], string[], string[]];
  stepTitles: string[]; // 11
  stepDescs: string[]; // 11
};

function build(p: TierTextPack): TiersCopy {
  const steps: TierStep[] = STEP_CMDS.map((cmd, i) => ({
    n: String(i + 1).padStart(2, "0"),
    title: p.stepTitles[i],
    desc: p.stepDescs[i],
    cmd,
    out: STEP_OUTS[i],
  }));

  const mkTier = (
    idx: number,
    id: Tier["id"],
    name: string,
    fullName: string,
    accent: Tier["accent"],
    stepCount: number,
  ): Tier => ({
    id,
    name,
    fullName,
    accent,
    badge: p.badges[idx],
    tagline: p.taglines[idx],
    chain: p.chains[idx],
    ram: p.rams[idx],
    disk: p.disks[idx],
    includes: p.includes[idx],
    installSteps: steps.slice(0, stepCount),
  });

  return {
    eyebrow: p.eyebrow,
    title: "Core · Pro · Pro Plus",
    sub: p.sub,
    ramLabel: p.ramLabel,
    diskLabel: p.diskLabel,
    chainLabel: p.chainLabel,
    includesLabel: p.includesLabel,
    protectionNote: p.protectionNote,
    respTitle: p.respTitle,
    respBody: p.respBody,
    respCols: p.respCols,
    respRows: [
      { layer: "Core", ours: p.respRows[0][0], third: p.respRows[0][1] },
      { layer: "Pro", ours: p.respRows[1][0], third: p.respRows[1][1] },
      { layer: "Pro Plus", ours: p.respRows[2][0], third: p.respRows[2][1] },
    ],
    installEyebrow: p.installEyebrow,
    installTitle: p.installTitle,
    installSub: p.installSub,
    selfContainedNote: p.selfContainedNote,
    stepsWord: p.stepsWord,
    tiers: [
      mkTier(0, "core", "Core", "Linux Log Guardian", "neon", 5),
      mkTier(1, "pro", "Pro", "Linux Log Guardian Pro", "turq", 8),
      mkTier(2, "proplus", "Pro Plus", "Linux Log Guardian Pro Plus", "cyan", 11),
    ],
  };
}

// --- TÜRKÇE ---------------------------------------------------------------
const TR_PACK: TierTextPack = {
  eyebrow: "//:Sürümler",
  sub: "Aynı C çekirdeği, üç paketleme. İhtiyacın olan katmanı seç — hepsi bir arada 'mega platform' değil.",
  ramLabel: "RAM",
  diskLabel: "Disk",
  chainLabel: "Zincir",
  includesLabel: "İçindekiler",
  protectionNote: "Koruma seviyesi üç sürümde de aynıdır. Pro ve Pro Plus yalnızca görünürlük ve entegrasyon kanıtı ekler.",
  respTitle: "RAM ve disk artışı — sorumluluk sınırı",
  respBody: "Sürüm büyüdükçe artan RAM ve disk Log Guardian C çekirdeğinden kaynaklanmaz. Core binary ~515 KB ve ~110 MB RAM'de kalır. Fazlalık, SOC ve demo için seçtiğin harici araçların (Docker, Grafana, kind vb.) kapladığı alandır — kapatınca veya sadece Core çalıştırınca maliyet düşer.",
  respCols: ["Katman", "Log Guardian sorumluluğu", "Üçüncü parti (bizim dışımızda)"],
  respRows: [
    ["log-guardian + daemon + config/DB (~110 MB RAM, ~4–55 MB disk)", "—"],
    ["Aynı Core binary; ek koruma yok", "Docker image'ları, Node.js dashboard, Grafana, Prometheus, Caddy"],
    ["Yine aynı Core; ek koruma yok", "kind/K8s node, Helm chart pod'ları, operator, opsiyonel Wasm/mesh"],
  ],
  installEyebrow: "//:Kurulum",
  installTitle: "Sürüme göre kurulum rehberi",
  installSub: "Sekmeni seç; her rehber kendi kendine yeter — Pro için Core'a, Pro Plus için Pro/Core'a bakmana gerek yok.",
  selfContainedNote: "Bu rehber baştan sona tek başına tamamlanır. Ubuntu 22.04/24.04 veya Debian 12 (amd64), root/sudo.",
  stepsWord: "adım",
  badges: ["önerilen", "SOC paneli", "en kapsamlı"],
  taglines: [
    "log → WAF → kernel ban. Üretimde tek başına yeterli.",
    "Core + SOC dashboard, Grafana, Prometheus, Caddy TLS, fleet.",
    "Pro + K8s/Helm kanıtı (kind), fleet vitrin, opsiyonel Wasm/mesh.",
  ],
  chains: [
    "C binary → log → WAF → ban",
    "Core + Dashboard + Grafana + Caddy + Prometheus",
    "Pro + K8s/Helm kanıtı (kind) + fleet + Wasm/mesh",
  ],
  rams: ["~110 MB", "~730 MB (laptop) · ~400 MB (VM)", "~1,9 GB (laptop, hepsi açık)"],
  disks: ["~4 MB (temiz) · ~55 MB (events.db dolu)", "~5,3 GB (VM, çoğunlukla Docker image)", "Pro disk + ~2–3 GB (kind volume)"],
  includes: [
    ["nginx parser", "OWASP CRS 121 kural", "ban pipeline", "ipset / XDP", "Prometheus metrik"],
    ["SOC timeline (:8443)", "Grafana + $tenant panelleri", "Caddy TLS + JWT", "fleet / multi-tenant", "Telegram ops"],
    ["helm install log-guardian", "kind + admission webhook", "DaemonSet + operator", "fleet vitrin", "Wasm/mesh (ops.)"],
  ],
  stepTitles: [
    "Bağımlılıklar",
    "Kaynak + derleme + kurulum",
    "İlk çalıştırma + API güvenliği",
    "Nginx log formatı",
    "Sağlık + ilk ban testi",
    "Docker (kuruluysa atla)",
    "Pro SOC stack'i başlat",
    "Dashboard doğrula",
    "K8s CLI (kind + kubectl + helm)",
    "Pro Plus stack (kind + Helm)",
    "Ölç + demo bitince kapat",
  ],
  stepDescs: [
    "Debian/Ubuntu paket bağımlılıklarını ve (yoksa) nginx'i yükleyin.",
    "Repoyu klonlayın, tüm çekirdeklerle derleyin ve install.sh ile systemd unit'lerini + kuralları kurun.",
    "Servisleri başlatır, API token'ı fail-closed hazırlar ve kurulum kapısını doğrular (FAIL: 0 bekleyin).",
    "WAF'ın body + X-Forwarded-For okuyabilmesi için log_guardian formatını uygulayın ve nginx'i reload edin.",
    "Daemon IPC, Prometheus metrik ve ipset ban listesini kontrol edin. Core artık üretimde.",
    "Pro stack (dashboard, Grafana, Prometheus, Caddy) Docker ile çalışır.",
    "Dashboard + Grafana + Prometheus + Caddy TLS'i tek komutla ayağa kaldırır (LOG_GUARDIAN_TIER=pro).",
    "Tier'ı ve :8443 SOC panelini doğrulayın. Giriş: admin / .env DASHBOARD_ADMIN_PASSWORD.",
    "Pro Plus vitrini için Kubernetes araçlarını kurar.",
    "kind cluster oluşturur ve helm install ile 'cluster'da da çalışır' kanıtını üretir.",
    "RAM'i katman katman ölçün; demo bitince kind'i kapatıp ~1,2 GB RAM'i geri alın.",
  ],
};

// --- ENGLISH --------------------------------------------------------------
const EN_PACK: TierTextPack = {
  eyebrow: "//:Editions",
  sub: "Same C core, three packagings. Pick the layer you need — not an all-in-one 'mega platform'.",
  ramLabel: "RAM",
  diskLabel: "Disk",
  chainLabel: "Chain",
  includesLabel: "Includes",
  protectionNote: "The protection level is identical across all three editions. Pro and Pro Plus only add visibility and integration proof.",
  respTitle: "RAM & disk growth — the responsibility boundary",
  respBody: "The RAM and disk that grow with higher editions do not come from the Log Guardian C core. The Core binary stays at ~515 KB and ~110 MB RAM. The extra footprint is the third-party tools you chose for SOC and demos (Docker, Grafana, kind, etc.) — shut them down or run Core only and the cost drops.",
  respCols: ["Layer", "Log Guardian's responsibility", "Third-party (outside us)"],
  respRows: [
    ["log-guardian + daemon + config/DB (~110 MB RAM, ~4–55 MB disk)", "—"],
    ["Same Core binary; no extra protection", "Docker images, Node.js dashboard, Grafana, Prometheus, Caddy"],
    ["Still the same Core; no extra protection", "kind/K8s node, Helm chart pods, operator, optional Wasm/mesh"],
  ],
  installEyebrow: "//:Setup",
  installTitle: "Install guide by edition",
  installSub: "Pick your tab; each guide is self-contained — you don't need to read Core for Pro, or Pro/Core for Pro Plus.",
  selfContainedNote: "This guide completes end to end on its own. Ubuntu 22.04/24.04 or Debian 12 (amd64), root/sudo.",
  stepsWord: "steps",
  badges: ["recommended", "SOC panel", "most complete"],
  taglines: [
    "log → WAF → kernel ban. Enough on its own in production.",
    "Core + SOC dashboard, Grafana, Prometheus, Caddy TLS, fleet.",
    "Pro + K8s/Helm proof (kind), fleet showcase, optional Wasm/mesh.",
  ],
  chains: [
    "C binary → log → WAF → ban",
    "Core + Dashboard + Grafana + Caddy + Prometheus",
    "Pro + K8s/Helm proof (kind) + fleet + Wasm/mesh",
  ],
  rams: ["~110 MB", "~730 MB (laptop) · ~400 MB (VM)", "~1.9 GB (laptop, all on)"],
  disks: ["~4 MB (clean) · ~55 MB (events.db full)", "~5.3 GB (VM, mostly Docker images)", "Pro disk + ~2–3 GB (kind volume)"],
  includes: [
    ["nginx parser", "OWASP CRS 121 rules", "ban pipeline", "ipset / XDP", "Prometheus metrics"],
    ["SOC timeline (:8443)", "Grafana + $tenant panels", "Caddy TLS + JWT", "fleet / multi-tenant", "Telegram ops"],
    ["helm install log-guardian", "kind + admission webhook", "DaemonSet + operator", "fleet showcase", "Wasm/mesh (opt.)"],
  ],
  stepTitles: [
    "Dependencies",
    "Source + build + install",
    "First run + API security",
    "Nginx log format",
    "Health + first ban test",
    "Docker (skip if installed)",
    "Start the Pro SOC stack",
    "Verify the dashboard",
    "K8s CLI (kind + kubectl + helm)",
    "Pro Plus stack (kind + Helm)",
    "Measure + shut down after the demo",
  ],
  stepDescs: [
    "Install Debian/Ubuntu package dependencies and nginx (if missing).",
    "Clone the repo, build with all cores and install systemd units + rules via install.sh.",
    "Starts services, prepares the fail-closed API token and verifies the setup gate (expect FAIL: 0).",
    "Apply the log_guardian format so the WAF can read body + X-Forwarded-For, then reload nginx.",
    "Check daemon IPC, Prometheus metrics and the ipset ban list. Core is now in production.",
    "The Pro stack (dashboard, Grafana, Prometheus, Caddy) runs on Docker.",
    "Brings up dashboard + Grafana + Prometheus + Caddy TLS in one command (LOG_GUARDIAN_TIER=pro).",
    "Verify the tier and the :8443 SOC panel. Login: admin / .env DASHBOARD_ADMIN_PASSWORD.",
    "Installs the Kubernetes tools for the Pro Plus showcase.",
    "Creates a kind cluster and produces the 'runs on a cluster too' proof via helm install.",
    "Measure RAM layer by layer; after the demo shut kind down and reclaim ~1.2 GB RAM.",
  ],
};

// --- DEUTSCH --------------------------------------------------------------
const DE_PACK: TierTextPack = {
  eyebrow: "//:Editionen",
  sub: "Derselbe C-Kern, drei Pakete. Wähle die Schicht, die du brauchst — keine All-in-one-'Mega-Plattform'.",
  ramLabel: "RAM",
  diskLabel: "Disk",
  chainLabel: "Kette",
  includesLabel: "Enthält",
  protectionNote: "Das Schutzniveau ist in allen drei Editionen identisch. Pro und Pro Plus fügen nur Sichtbarkeit und Integrationsnachweis hinzu.",
  respTitle: "RAM- & Disk-Wachstum — die Verantwortungsgrenze",
  respBody: "Der mit höheren Editionen wachsende RAM und Disk stammt nicht aus dem Log-Guardian-C-Kern. Das Core-Binary bleibt bei ~515 KB und ~110 MB RAM. Der Mehrbedarf sind die von dir gewählten Drittanbieter-Tools für SOC und Demos (Docker, Grafana, kind usw.) — schalte sie ab oder betreibe nur Core, und die Kosten sinken.",
  respCols: ["Schicht", "Verantwortung von Log Guardian", "Drittanbieter (außerhalb von uns)"],
  respRows: [
    ["log-guardian + daemon + config/DB (~110 MB RAM, ~4–55 MB Disk)", "—"],
    ["Dasselbe Core-Binary; kein zusätzlicher Schutz", "Docker-Images, Node.js-Dashboard, Grafana, Prometheus, Caddy"],
    ["Weiterhin derselbe Core; kein zusätzlicher Schutz", "kind/K8s-Node, Helm-Chart-Pods, Operator, optional Wasm/mesh"],
  ],
  installEyebrow: "//:Setup",
  installTitle: "Installationsanleitung nach Edition",
  installSub: "Wähle deinen Tab; jede Anleitung ist eigenständig — du musst für Pro nicht Core lesen, für Pro Plus nicht Pro/Core.",
  selfContainedNote: "Diese Anleitung ist von Anfang bis Ende eigenständig. Ubuntu 22.04/24.04 oder Debian 12 (amd64), root/sudo.",
  stepsWord: "Schritte",
  badges: ["empfohlen", "SOC-Panel", "am umfassendsten"],
  taglines: [
    "log → WAF → Kernel-Ban. Allein produktionsreif.",
    "Core + SOC-Dashboard, Grafana, Prometheus, Caddy TLS, Flotte.",
    "Pro + K8s/Helm-Nachweis (kind), Flotten-Showcase, optional Wasm/mesh.",
  ],
  chains: [
    "C-Binary → Log → WAF → Ban",
    "Core + Dashboard + Grafana + Caddy + Prometheus",
    "Pro + K8s/Helm-Nachweis (kind) + Flotte + Wasm/mesh",
  ],
  rams: ["~110 MB", "~730 MB (Laptop) · ~400 MB (VM)", "~1,9 GB (Laptop, alles an)"],
  disks: ["~4 MB (sauber) · ~55 MB (events.db voll)", "~5,3 GB (VM, meist Docker-Images)", "Pro-Disk + ~2–3 GB (kind-Volume)"],
  includes: [
    ["nginx-Parser", "OWASP CRS 121 Regeln", "Ban-Pipeline", "ipset / XDP", "Prometheus-Metriken"],
    ["SOC-Timeline (:8443)", "Grafana + $tenant-Panels", "Caddy TLS + JWT", "Flotte / Multi-Tenant", "Telegram-Ops"],
    ["helm install log-guardian", "kind + Admission-Webhook", "DaemonSet + Operator", "Flotten-Showcase", "Wasm/mesh (opt.)"],
  ],
  stepTitles: [
    "Abhängigkeiten",
    "Quelle + Build + Installation",
    "Erster Start + API-Sicherheit",
    "Nginx-Log-Format",
    "Health + erster Ban-Test",
    "Docker (überspringen, falls installiert)",
    "Pro-SOC-Stack starten",
    "Dashboard verifizieren",
    "K8s-CLI (kind + kubectl + helm)",
    "Pro-Plus-Stack (kind + Helm)",
    "Messen + nach der Demo herunterfahren",
  ],
  stepDescs: [
    "Installiere die Debian/Ubuntu-Paketabhängigkeiten und nginx (falls fehlend).",
    "Klone das Repo, baue mit allen Kernen und installiere systemd-Units + Regeln via install.sh.",
    "Startet Dienste, bereitet das fail-closed API-Token vor und prüft das Setup-Gate (erwarte FAIL: 0).",
    "Wende das log_guardian-Format an, damit die WAF Body + X-Forwarded-For lesen kann, dann nginx neu laden.",
    "Prüfe daemon-IPC, Prometheus-Metriken und die ipset-Ban-Liste. Core ist jetzt produktiv.",
    "Der Pro-Stack (Dashboard, Grafana, Prometheus, Caddy) läuft auf Docker.",
    "Startet Dashboard + Grafana + Prometheus + Caddy TLS mit einem Befehl (LOG_GUARDIAN_TIER=pro).",
    "Verifiziere die Edition und das :8443-SOC-Panel. Login: admin / .env DASHBOARD_ADMIN_PASSWORD.",
    "Installiert die Kubernetes-Tools für den Pro-Plus-Showcase.",
    "Erstellt einen kind-Cluster und erzeugt den 'läuft auch im Cluster'-Nachweis via helm install.",
    "Miss den RAM Schicht für Schicht; fahre kind nach der Demo herunter und gewinne ~1,2 GB RAM zurück.",
  ],
};

// --- FRANÇAIS -------------------------------------------------------------
const FR_PACK: TierTextPack = {
  eyebrow: "//:Éditions",
  sub: "Le même cœur C, trois packagings. Choisis la couche dont tu as besoin — pas une 'méga-plateforme' tout-en-un.",
  ramLabel: "RAM",
  diskLabel: "Disque",
  chainLabel: "Chaîne",
  includesLabel: "Inclut",
  protectionNote: "Le niveau de protection est identique dans les trois éditions. Pro et Pro Plus n'ajoutent que de la visibilité et une preuve d'intégration.",
  respTitle: "Croissance RAM & disque — la limite de responsabilité",
  respBody: "La RAM et le disque qui augmentent avec les éditions supérieures ne viennent pas du cœur C de Log Guardian. Le binaire Core reste à ~515 Ko et ~110 Mo de RAM. Le surplus provient des outils tiers que tu as choisis pour le SOC et les démos (Docker, Grafana, kind, etc.) — arrête-les ou n'exécute que Core et le coût baisse.",
  respCols: ["Couche", "Responsabilité de Log Guardian", "Tiers (hors de nous)"],
  respRows: [
    ["log-guardian + daemon + config/DB (~110 Mo RAM, ~4–55 Mo disque)", "—"],
    ["Même binaire Core ; aucune protection supplémentaire", "Images Docker, dashboard Node.js, Grafana, Prometheus, Caddy"],
    ["Toujours le même Core ; aucune protection supplémentaire", "nœud kind/K8s, pods Helm chart, opérateur, Wasm/mesh optionnel"],
  ],
  installEyebrow: "//:Installation",
  installTitle: "Guide d'installation par édition",
  installSub: "Choisis ton onglet ; chaque guide est autonome — pas besoin de lire Core pour Pro, ni Pro/Core pour Pro Plus.",
  selfContainedNote: "Ce guide se complète de bout en bout tout seul. Ubuntu 22.04/24.04 ou Debian 12 (amd64), root/sudo.",
  stepsWord: "étapes",
  badges: ["recommandé", "panneau SOC", "le plus complet"],
  taglines: [
    "log → WAF → ban noyau. Suffisant seul en production.",
    "Core + dashboard SOC, Grafana, Prometheus, Caddy TLS, flotte.",
    "Pro + preuve K8s/Helm (kind), vitrine de flotte, Wasm/mesh optionnel.",
  ],
  chains: [
    "binaire C → log → WAF → ban",
    "Core + Dashboard + Grafana + Caddy + Prometheus",
    "Pro + preuve K8s/Helm (kind) + flotte + Wasm/mesh",
  ],
  rams: ["~110 Mo", "~730 Mo (portable) · ~400 Mo (VM)", "~1,9 Go (portable, tout activé)"],
  disks: ["~4 Mo (propre) · ~55 Mo (events.db plein)", "~5,3 Go (VM, surtout images Docker)", "disque Pro + ~2–3 Go (volume kind)"],
  includes: [
    ["parseur nginx", "OWASP CRS 121 règles", "pipeline de ban", "ipset / XDP", "métriques Prometheus"],
    ["timeline SOC (:8443)", "Grafana + panneaux $tenant", "Caddy TLS + JWT", "flotte / multi-tenant", "ops Telegram"],
    ["helm install log-guardian", "kind + admission webhook", "DaemonSet + opérateur", "vitrine de flotte", "Wasm/mesh (opt.)"],
  ],
  stepTitles: [
    "Dépendances",
    "Source + build + installation",
    "Premier lancement + sécurité API",
    "Format de log Nginx",
    "Santé + premier test de ban",
    "Docker (ignorer si installé)",
    "Démarrer le stack SOC Pro",
    "Vérifier le dashboard",
    "CLI K8s (kind + kubectl + helm)",
    "Stack Pro Plus (kind + Helm)",
    "Mesurer + arrêter après la démo",
  ],
  stepDescs: [
    "Installe les dépendances de paquets Debian/Ubuntu et nginx (s'il manque).",
    "Clone le dépôt, compile avec tous les cœurs et installe les units systemd + règles via install.sh.",
    "Démarre les services, prépare le token API fail-closed et vérifie le gate d'installation (attends FAIL: 0).",
    "Applique le format log_guardian pour que la WAF lise le body + X-Forwarded-For, puis recharge nginx.",
    "Vérifie l'IPC du daemon, les métriques Prometheus et la liste de ban ipset. Core est maintenant en production.",
    "Le stack Pro (dashboard, Grafana, Prometheus, Caddy) tourne sur Docker.",
    "Démarre dashboard + Grafana + Prometheus + Caddy TLS en une commande (LOG_GUARDIAN_TIER=pro).",
    "Vérifie l'édition et le panneau SOC :8443. Connexion : admin / .env DASHBOARD_ADMIN_PASSWORD.",
    "Installe les outils Kubernetes pour la vitrine Pro Plus.",
    "Crée un cluster kind et produit la preuve 'tourne aussi sur un cluster' via helm install.",
    "Mesure la RAM couche par couche ; après la démo, arrête kind et récupère ~1,2 Go de RAM.",
  ],
};

// --- ESPAÑOL --------------------------------------------------------------
const ES_PACK: TierTextPack = {
  eyebrow: "//:Ediciones",
  sub: "El mismo núcleo C, tres empaquetados. Elige la capa que necesitas — no una 'megaplataforma' todo en uno.",
  ramLabel: "RAM",
  diskLabel: "Disco",
  chainLabel: "Cadena",
  includesLabel: "Incluye",
  protectionNote: "El nivel de protección es idéntico en las tres ediciones. Pro y Pro Plus solo añaden visibilidad y prueba de integración.",
  respTitle: "Crecimiento de RAM y disco — el límite de responsabilidad",
  respBody: "La RAM y el disco que crecen con ediciones superiores no provienen del núcleo C de Log Guardian. El binario Core se mantiene en ~515 KB y ~110 MB de RAM. El extra son las herramientas de terceros que elegiste para SOC y demos (Docker, Grafana, kind, etc.) — apágalas o ejecuta solo Core y el coste baja.",
  respCols: ["Capa", "Responsabilidad de Log Guardian", "Terceros (fuera de nosotros)"],
  respRows: [
    ["log-guardian + daemon + config/DB (~110 MB RAM, ~4–55 MB disco)", "—"],
    ["Mismo binario Core; sin protección extra", "Imágenes Docker, dashboard Node.js, Grafana, Prometheus, Caddy"],
    ["Sigue siendo el mismo Core; sin protección extra", "nodo kind/K8s, pods del Helm chart, operador, Wasm/mesh opcional"],
  ],
  installEyebrow: "//:Instalación",
  installTitle: "Guía de instalación por edición",
  installSub: "Elige tu pestaña; cada guía es autónoma — no necesitas leer Core para Pro, ni Pro/Core para Pro Plus.",
  selfContainedNote: "Esta guía se completa de principio a fin por sí sola. Ubuntu 22.04/24.04 o Debian 12 (amd64), root/sudo.",
  stepsWord: "pasos",
  badges: ["recomendado", "panel SOC", "el más completo"],
  taglines: [
    "log → WAF → ban de kernel. Suficiente por sí solo en producción.",
    "Core + dashboard SOC, Grafana, Prometheus, Caddy TLS, flota.",
    "Pro + prueba K8s/Helm (kind), escaparate de flota, Wasm/mesh opcional.",
  ],
  chains: [
    "binario C → log → WAF → ban",
    "Core + Dashboard + Grafana + Caddy + Prometheus",
    "Pro + prueba K8s/Helm (kind) + flota + Wasm/mesh",
  ],
  rams: ["~110 MB", "~730 MB (portátil) · ~400 MB (VM)", "~1,9 GB (portátil, todo activado)"],
  disks: ["~4 MB (limpio) · ~55 MB (events.db lleno)", "~5,3 GB (VM, sobre todo imágenes Docker)", "disco Pro + ~2–3 GB (volumen kind)"],
  includes: [
    ["parser nginx", "OWASP CRS 121 reglas", "pipeline de ban", "ipset / XDP", "métricas Prometheus"],
    ["timeline SOC (:8443)", "Grafana + paneles $tenant", "Caddy TLS + JWT", "flota / multi-tenant", "ops Telegram"],
    ["helm install log-guardian", "kind + admission webhook", "DaemonSet + operador", "escaparate de flota", "Wasm/mesh (opc.)"],
  ],
  stepTitles: [
    "Dependencias",
    "Fuente + build + instalación",
    "Primer arranque + seguridad API",
    "Formato de log Nginx",
    "Salud + primera prueba de ban",
    "Docker (omitir si está instalado)",
    "Iniciar el stack SOC Pro",
    "Verificar el dashboard",
    "CLI K8s (kind + kubectl + helm)",
    "Stack Pro Plus (kind + Helm)",
    "Medir + apagar tras la demo",
  ],
  stepDescs: [
    "Instala las dependencias de paquetes Debian/Ubuntu y nginx (si falta).",
    "Clona el repo, compila con todos los núcleos e instala units systemd + reglas via install.sh.",
    "Inicia los servicios, prepara el token API fail-closed y verifica el gate de instalación (espera FAIL: 0).",
    "Aplica el formato log_guardian para que la WAF lea el body + X-Forwarded-For, luego recarga nginx.",
    "Comprueba el IPC del daemon, las métricas Prometheus y la lista de ban ipset. Core ya está en producción.",
    "El stack Pro (dashboard, Grafana, Prometheus, Caddy) se ejecuta sobre Docker.",
    "Levanta dashboard + Grafana + Prometheus + Caddy TLS en un comando (LOG_GUARDIAN_TIER=pro).",
    "Verifica la edición y el panel SOC :8443. Acceso: admin / .env DASHBOARD_ADMIN_PASSWORD.",
    "Instala las herramientas de Kubernetes para el escaparate Pro Plus.",
    "Crea un clúster kind y produce la prueba 'también corre en un clúster' via helm install.",
    "Mide la RAM capa por capa; tras la demo apaga kind y recupera ~1,2 GB de RAM.",
  ],
};

// --- PORTUGUÊS ------------------------------------------------------------
const PT_PACK: TierTextPack = {
  eyebrow: "//:Edições",
  sub: "O mesmo núcleo C, três empacotamentos. Escolhe a camada de que precisas — não uma 'megaplataforma' tudo-em-um.",
  ramLabel: "RAM",
  diskLabel: "Disco",
  chainLabel: "Cadeia",
  includesLabel: "Inclui",
  protectionNote: "O nível de proteção é idêntico nas três edições. Pro e Pro Plus apenas adicionam visibilidade e prova de integração.",
  respTitle: "Crescimento de RAM e disco — o limite de responsabilidade",
  respBody: "A RAM e o disco que crescem com edições superiores não vêm do núcleo C do Log Guardian. O binário Core mantém-se em ~515 KB e ~110 MB de RAM. O excesso são as ferramentas de terceiros que escolheste para SOC e demos (Docker, Grafana, kind, etc.) — desliga-as ou executa apenas o Core e o custo desce.",
  respCols: ["Camada", "Responsabilidade do Log Guardian", "Terceiros (fora de nós)"],
  respRows: [
    ["log-guardian + daemon + config/DB (~110 MB RAM, ~4–55 MB disco)", "—"],
    ["Mesmo binário Core; sem proteção extra", "Imagens Docker, dashboard Node.js, Grafana, Prometheus, Caddy"],
    ["Ainda o mesmo Core; sem proteção extra", "nó kind/K8s, pods do Helm chart, operador, Wasm/mesh opcional"],
  ],
  installEyebrow: "//:Instalação",
  installTitle: "Guia de instalação por edição",
  installSub: "Escolhe o teu separador; cada guia é autónomo — não precisas de ler o Core para o Pro, nem Pro/Core para o Pro Plus.",
  selfContainedNote: "Este guia completa-se de ponta a ponta sozinho. Ubuntu 22.04/24.04 ou Debian 12 (amd64), root/sudo.",
  stepsWord: "passos",
  badges: ["recomendado", "painel SOC", "o mais completo"],
  taglines: [
    "log → WAF → ban de kernel. Suficiente sozinho em produção.",
    "Core + dashboard SOC, Grafana, Prometheus, Caddy TLS, frota.",
    "Pro + prova K8s/Helm (kind), montra de frota, Wasm/mesh opcional.",
  ],
  chains: [
    "binário C → log → WAF → ban",
    "Core + Dashboard + Grafana + Caddy + Prometheus",
    "Pro + prova K8s/Helm (kind) + frota + Wasm/mesh",
  ],
  rams: ["~110 MB", "~730 MB (portátil) · ~400 MB (VM)", "~1,9 GB (portátil, tudo ligado)"],
  disks: ["~4 MB (limpo) · ~55 MB (events.db cheio)", "~5,3 GB (VM, sobretudo imagens Docker)", "disco Pro + ~2–3 GB (volume kind)"],
  includes: [
    ["parser nginx", "OWASP CRS 121 regras", "pipeline de ban", "ipset / XDP", "métricas Prometheus"],
    ["timeline SOC (:8443)", "Grafana + painéis $tenant", "Caddy TLS + JWT", "frota / multi-tenant", "ops Telegram"],
    ["helm install log-guardian", "kind + admission webhook", "DaemonSet + operador", "montra de frota", "Wasm/mesh (opc.)"],
  ],
  stepTitles: [
    "Dependências",
    "Fonte + build + instalação",
    "Primeiro arranque + segurança da API",
    "Formato de log Nginx",
    "Saúde + primeiro teste de ban",
    "Docker (ignora se instalado)",
    "Iniciar o stack SOC Pro",
    "Verificar o dashboard",
    "CLI K8s (kind + kubectl + helm)",
    "Stack Pro Plus (kind + Helm)",
    "Medir + desligar após a demo",
  ],
  stepDescs: [
    "Instala as dependências de pacotes Debian/Ubuntu e o nginx (se faltar).",
    "Clona o repo, compila com todos os núcleos e instala as units systemd + regras via install.sh.",
    "Inicia os serviços, prepara o token de API fail-closed e verifica o gate de instalação (espera FAIL: 0).",
    "Aplica o formato log_guardian para a WAF ler o body + X-Forwarded-For, depois recarrega o nginx.",
    "Verifica o IPC do daemon, as métricas Prometheus e a lista de ban ipset. O Core já está em produção.",
    "O stack Pro (dashboard, Grafana, Prometheus, Caddy) corre sobre Docker.",
    "Sobe dashboard + Grafana + Prometheus + Caddy TLS num comando (LOG_GUARDIAN_TIER=pro).",
    "Verifica a edição e o painel SOC :8443. Login: admin / .env DASHBOARD_ADMIN_PASSWORD.",
    "Instala as ferramentas Kubernetes para a montra Pro Plus.",
    "Cria um cluster kind e produz a prova 'também corre num cluster' via helm install.",
    "Mede a RAM camada a camada; após a demo desliga o kind e recupera ~1,2 GB de RAM.",
  ],
};

// --- NEDERLANDS -----------------------------------------------------------
const NL_PACK: TierTextPack = {
  eyebrow: "//:Edities",
  sub: "Dezelfde C-kern, drie verpakkingen. Kies de laag die je nodig hebt — geen alles-in-één 'megaplatform'.",
  ramLabel: "RAM",
  diskLabel: "Schijf",
  chainLabel: "Keten",
  includesLabel: "Bevat",
  protectionNote: "Het beschermingsniveau is in alle drie de edities identiek. Pro en Pro Plus voegen alleen zichtbaarheid en integratiebewijs toe.",
  respTitle: "RAM- & schijfgroei — de verantwoordelijkheidsgrens",
  respBody: "De RAM en schijf die met hogere edities groeien, komen niet uit de Log Guardian C-kern. De Core-binary blijft op ~515 KB en ~110 MB RAM. Het extra is de door jou gekozen externe tools voor SOC en demo's (Docker, Grafana, kind enz.) — schakel ze uit of draai alleen Core en de kosten dalen.",
  respCols: ["Laag", "Verantwoordelijkheid van Log Guardian", "Derden (buiten ons)"],
  respRows: [
    ["log-guardian + daemon + config/DB (~110 MB RAM, ~4–55 MB schijf)", "—"],
    ["Dezelfde Core-binary; geen extra bescherming", "Docker-images, Node.js-dashboard, Grafana, Prometheus, Caddy"],
    ["Nog steeds dezelfde Core; geen extra bescherming", "kind/K8s-node, Helm-chart-pods, operator, optioneel Wasm/mesh"],
  ],
  installEyebrow: "//:Installatie",
  installTitle: "Installatiegids per editie",
  installSub: "Kies je tab; elke gids is op zichzelf staand — je hoeft voor Pro geen Core te lezen, of Pro/Core voor Pro Plus.",
  selfContainedNote: "Deze gids voltooit van begin tot eind op zichzelf. Ubuntu 22.04/24.04 of Debian 12 (amd64), root/sudo.",
  stepsWord: "stappen",
  badges: ["aanbevolen", "SOC-paneel", "meest compleet"],
  taglines: [
    "log → WAF → kernel-ban. Alleen al genoeg in productie.",
    "Core + SOC-dashboard, Grafana, Prometheus, Caddy TLS, fleet.",
    "Pro + K8s/Helm-bewijs (kind), fleet-showcase, optioneel Wasm/mesh.",
  ],
  chains: [
    "C-binary → log → WAF → ban",
    "Core + Dashboard + Grafana + Caddy + Prometheus",
    "Pro + K8s/Helm-bewijs (kind) + fleet + Wasm/mesh",
  ],
  rams: ["~110 MB", "~730 MB (laptop) · ~400 MB (VM)", "~1,9 GB (laptop, alles aan)"],
  disks: ["~4 MB (schoon) · ~55 MB (events.db vol)", "~5,3 GB (VM, vooral Docker-images)", "Pro-schijf + ~2–3 GB (kind-volume)"],
  includes: [
    ["nginx-parser", "OWASP CRS 121 regels", "ban-pipeline", "ipset / XDP", "Prometheus-metrics"],
    ["SOC-timeline (:8443)", "Grafana + $tenant-panelen", "Caddy TLS + JWT", "fleet / multi-tenant", "Telegram-ops"],
    ["helm install log-guardian", "kind + admission webhook", "DaemonSet + operator", "fleet-showcase", "Wasm/mesh (opt.)"],
  ],
  stepTitles: [
    "Afhankelijkheden",
    "Broncode + build + installatie",
    "Eerste start + API-beveiliging",
    "Nginx-logformaat",
    "Health + eerste ban-test",
    "Docker (sla over indien geïnstalleerd)",
    "Start de Pro SOC-stack",
    "Verifieer het dashboard",
    "K8s-CLI (kind + kubectl + helm)",
    "Pro Plus-stack (kind + Helm)",
    "Meet + sluit af na de demo",
  ],
  stepDescs: [
    "Installeer de Debian/Ubuntu-pakketafhankelijkheden en nginx (indien afwezig).",
    "Kloon de repo, bouw met alle cores en installeer systemd-units + regels via install.sh.",
    "Start diensten, bereidt het fail-closed API-token voor en verifieert de setup-gate (verwacht FAIL: 0).",
    "Pas het log_guardian-formaat toe zodat de WAF body + X-Forwarded-For kan lezen, herlaad dan nginx.",
    "Controleer daemon-IPC, Prometheus-metrics en de ipset-ban-lijst. Core draait nu in productie.",
    "De Pro-stack (dashboard, Grafana, Prometheus, Caddy) draait op Docker.",
    "Start dashboard + Grafana + Prometheus + Caddy TLS met één commando (LOG_GUARDIAN_TIER=pro).",
    "Verifieer de editie en het :8443 SOC-paneel. Login: admin / .env DASHBOARD_ADMIN_PASSWORD.",
    "Installeert de Kubernetes-tools voor de Pro Plus-showcase.",
    "Maakt een kind-cluster en levert het 'draait ook op een cluster'-bewijs via helm install.",
    "Meet de RAM laag voor laag; sluit kind na de demo af en win ~1,2 GB RAM terug.",
  ],
};

// --- РУССКИЙ ---------------------------------------------------------------
const RU_PACK: TierTextPack = {
  eyebrow: "//:Издания",
  sub: "Одно C-ядро, три варианта поставки. Выбери нужный слой — это не универсальная «мегаплатформа».",
  ramLabel: "ОЗУ",
  diskLabel: "Диск",
  chainLabel: "Цепочка",
  includesLabel: "Включает",
  protectionNote: "Уровень защиты одинаков во всех трёх изданиях. Pro и Pro Plus добавляют лишь наблюдаемость и доказательство интеграции.",
  respTitle: "Рост ОЗУ и диска — граница ответственности",
  respBody: "ОЗУ и диск, растущие в старших изданиях, не относятся к C-ядру Log Guardian. Бинарник Core остаётся на уровне ~515 КБ и ~110 МБ ОЗУ. Излишек — это выбранные тобой сторонние инструменты для SOC и демо (Docker, Grafana, kind и т.д.) — выключи их или запусти только Core, и затраты снизятся.",
  respCols: ["Слой", "Ответственность Log Guardian", "Третьи стороны (вне нас)"],
  respRows: [
    ["log-guardian + daemon + config/DB (~110 МБ ОЗУ, ~4–55 МБ диск)", "—"],
    ["Тот же бинарник Core; без доп. защиты", "Docker-образы, Node.js-дашборд, Grafana, Prometheus, Caddy"],
    ["Всё тот же Core; без доп. защиты", "узел kind/K8s, поды Helm chart, оператор, опционально Wasm/mesh"],
  ],
  installEyebrow: "//:Установка",
  installTitle: "Руководство по установке по изданиям",
  installSub: "Выбери вкладку; каждое руководство самодостаточно — не нужно читать Core для Pro или Pro/Core для Pro Plus.",
  selfContainedNote: "Это руководство выполняется от начала до конца самостоятельно. Ubuntu 22.04/24.04 или Debian 12 (amd64), root/sudo.",
  stepsWord: "шагов",
  badges: ["рекомендуется", "панель SOC", "самое полное"],
  taglines: [
    "log → WAF → бан в ядре. Самодостаточно в проде.",
    "Core + SOC-дашборд, Grafana, Prometheus, Caddy TLS, флот.",
    "Pro + доказательство K8s/Helm (kind), витрина флота, опционально Wasm/mesh.",
  ],
  chains: [
    "C-бинарник → log → WAF → бан",
    "Core + Dashboard + Grafana + Caddy + Prometheus",
    "Pro + доказательство K8s/Helm (kind) + флот + Wasm/mesh",
  ],
  rams: ["~110 МБ", "~730 МБ (ноутбук) · ~400 МБ (VM)", "~1,9 ГБ (ноутбук, всё включено)"],
  disks: ["~4 МБ (чисто) · ~55 МБ (events.db полон)", "~5,3 ГБ (VM, в основном Docker-образы)", "диск Pro + ~2–3 ГБ (том kind)"],
  includes: [
    ["nginx-парсер", "OWASP CRS 121 правило", "конвейер бана", "ipset / XDP", "метрики Prometheus"],
    ["SOC-таймлайн (:8443)", "Grafana + панели $tenant", "Caddy TLS + JWT", "флот / мультитенант", "Telegram-ops"],
    ["helm install log-guardian", "kind + admission webhook", "DaemonSet + оператор", "витрина флота", "Wasm/mesh (опц.)"],
  ],
  stepTitles: [
    "Зависимости",
    "Исходники + сборка + установка",
    "Первый запуск + безопасность API",
    "Формат лога Nginx",
    "Здоровье + первый тест бана",
    "Docker (пропусти, если установлен)",
    "Запуск Pro SOC-стека",
    "Проверка дашборда",
    "K8s CLI (kind + kubectl + helm)",
    "Стек Pro Plus (kind + Helm)",
    "Замер + выключение после демо",
  ],
  stepDescs: [
    "Установи зависимости пакетов Debian/Ubuntu и nginx (если отсутствует).",
    "Клонируй репозиторий, собери на всех ядрах и установи systemd-юниты + правила через install.sh.",
    "Запускает сервисы, готовит fail-closed API-токен и проверяет установочный гейт (ожидай FAIL: 0).",
    "Примени формат log_guardian, чтобы WAF читала body + X-Forwarded-For, затем перезагрузи nginx.",
    "Проверь IPC демона, метрики Prometheus и список бана ipset. Core теперь в продакшене.",
    "Стек Pro (дашборд, Grafana, Prometheus, Caddy) работает на Docker.",
    "Поднимает дашборд + Grafana + Prometheus + Caddy TLS одной командой (LOG_GUARDIAN_TIER=pro).",
    "Проверь издание и SOC-панель :8443. Вход: admin / .env DASHBOARD_ADMIN_PASSWORD.",
    "Устанавливает инструменты Kubernetes для витрины Pro Plus.",
    "Создаёт кластер kind и выдаёт доказательство «работает и в кластере» через helm install.",
    "Замерь ОЗУ слой за слоем; после демо выключи kind и верни ~1,2 ГБ ОЗУ.",
  ],
};

// --- 中文 -----------------------------------------------------------------
const ZH_PACK: TierTextPack = {
  eyebrow: "//:版本",
  sub: "同一个 C 内核，三种打包。选择你需要的层级——不是一体化的“超级平台”。",
  ramLabel: "内存",
  diskLabel: "磁盘",
  chainLabel: "链路",
  includesLabel: "包含",
  protectionNote: "三个版本的防护级别完全相同。Pro 和 Pro Plus 只增加可见性和集成证明。",
  respTitle: "内存与磁盘增长——责任边界",
  respBody: "随更高版本增长的内存和磁盘并非来自 Log Guardian C 内核。Core 二进制保持在约 515 KB 和约 110 MB 内存。多出的部分是你为 SOC 和演示选择的第三方工具（Docker、Grafana、kind 等）——关闭它们或只运行 Core，成本即下降。",
  respCols: ["层级", "Log Guardian 的责任", "第三方（我们之外）"],
  respRows: [
    ["log-guardian + daemon + 配置/DB（约 110 MB 内存，约 4–55 MB 磁盘）", "—"],
    ["同一个 Core 二进制；无额外防护", "Docker 镜像、Node.js 仪表板、Grafana、Prometheus、Caddy"],
    ["仍是同一个 Core；无额外防护", "kind/K8s 节点、Helm chart pod、operator、可选 Wasm/mesh"],
  ],
  installEyebrow: "//:安装",
  installTitle: "按版本的安装指南",
  installSub: "选择你的标签页；每份指南都自成一体——Pro 无需看 Core，Pro Plus 无需看 Pro/Core。",
  selfContainedNote: "本指南可从头到尾独立完成。Ubuntu 22.04/24.04 或 Debian 12（amd64），root/sudo。",
  stepsWord: "步",
  badges: ["推荐", "SOC 面板", "最完整"],
  taglines: [
    "log → WAF → 内核封禁。生产环境单独即可。",
    "Core + SOC 仪表板、Grafana、Prometheus、Caddy TLS、fleet。",
    "Pro + K8s/Helm 证明（kind）、fleet 展示、可选 Wasm/mesh。",
  ],
  chains: [
    "C 二进制 → log → WAF → 封禁",
    "Core + 仪表板 + Grafana + Caddy + Prometheus",
    "Pro + K8s/Helm 证明（kind）+ fleet + Wasm/mesh",
  ],
  rams: ["约 110 MB", "约 730 MB（笔记本）· 约 400 MB（VM）", "约 1.9 GB（笔记本，全开）"],
  disks: ["约 4 MB（干净）· 约 55 MB（events.db 满）", "约 5.3 GB（VM，主要是 Docker 镜像）", "Pro 磁盘 + 约 2–3 GB（kind 卷）"],
  includes: [
    ["nginx 解析器", "OWASP CRS 121 条规则", "封禁流水线", "ipset / XDP", "Prometheus 指标"],
    ["SOC 时间线（:8443）", "Grafana + $tenant 面板", "Caddy TLS + JWT", "fleet / 多租户", "Telegram 运维"],
    ["helm install log-guardian", "kind + admission webhook", "DaemonSet + operator", "fleet 展示", "Wasm/mesh（可选）"],
  ],
  stepTitles: [
    "依赖",
    "源码 + 构建 + 安装",
    "首次运行 + API 安全",
    "Nginx 日志格式",
    "健康检查 + 首次封禁测试",
    "Docker（已安装则跳过）",
    "启动 Pro SOC 栈",
    "验证仪表板",
    "K8s CLI（kind + kubectl + helm）",
    "Pro Plus 栈（kind + Helm）",
    "测量 + 演示后关闭",
  ],
  stepDescs: [
    "安装 Debian/Ubuntu 软件包依赖和 nginx（如缺失）。",
    "克隆仓库，用全部核心构建，并通过 install.sh 安装 systemd 单元 + 规则。",
    "启动服务，准备 fail-closed API 令牌并验证安装关卡（期望 FAIL: 0）。",
    "应用 log_guardian 格式，使 WAF 能读取 body + X-Forwarded-For，然后重载 nginx。",
    "检查 daemon IPC、Prometheus 指标和 ipset 封禁列表。Core 现已投入生产。",
    "Pro 栈（仪表板、Grafana、Prometheus、Caddy）运行在 Docker 上。",
    "一条命令拉起仪表板 + Grafana + Prometheus + Caddy TLS（LOG_GUARDIAN_TIER=pro）。",
    "验证版本和 :8443 SOC 面板。登录：admin / .env DASHBOARD_ADMIN_PASSWORD。",
    "为 Pro Plus 展示安装 Kubernetes 工具。",
    "创建 kind 集群并通过 helm install 产出“也能在集群运行”的证明。",
    "逐层测量内存；演示结束后关闭 kind，回收约 1.2 GB 内存。",
  ],
};

// --- 日本語 ---------------------------------------------------------------
const JA_PACK: TierTextPack = {
  eyebrow: "//:エディション",
  sub: "同じ C コア、3 つのパッケージング。必要な層を選択——オールインワンの「メガプラットフォーム」ではありません。",
  ramLabel: "RAM",
  diskLabel: "ディスク",
  chainLabel: "チェーン",
  includesLabel: "含まれるもの",
  protectionNote: "保護レベルは 3 エディションで同一です。Pro と Pro Plus は可視性と統合の証明を追加するだけです。",
  respTitle: "RAM・ディスクの増加——責任境界",
  respBody: "上位エディションで増える RAM とディスクは Log Guardian の C コアに由来しません。Core バイナリは約 515 KB・約 110 MB RAM のままです。増加分は SOC やデモ用に選んだサードパーティ製ツール（Docker、Grafana、kind など）——停止するか Core のみ実行すればコストは下がります。",
  respCols: ["層", "Log Guardian の責任", "サードパーティ（当方の外）"],
  respRows: [
    ["log-guardian + daemon + config/DB（約 110 MB RAM、約 4–55 MB ディスク）", "—"],
    ["同じ Core バイナリ；追加保護なし", "Docker イメージ、Node.js ダッシュボード、Grafana、Prometheus、Caddy"],
    ["やはり同じ Core；追加保護なし", "kind/K8s ノード、Helm chart の Pod、operator、任意の Wasm/mesh"],
  ],
  installEyebrow: "//:セットアップ",
  installTitle: "エディション別インストールガイド",
  installSub: "タブを選択；各ガイドは自己完結——Pro のために Core を、Pro Plus のために Pro/Core を読む必要はありません。",
  selfContainedNote: "このガイドは最初から最後まで単独で完結します。Ubuntu 22.04/24.04 または Debian 12（amd64）、root/sudo。",
  stepsWord: "ステップ",
  badges: ["推奨", "SOC パネル", "最も完全"],
  taglines: [
    "log → WAF → カーネル BAN。本番で単独でも十分。",
    "Core + SOC ダッシュボード、Grafana、Prometheus、Caddy TLS、fleet。",
    "Pro + K8s/Helm 証明（kind）、fleet ショーケース、任意の Wasm/mesh。",
  ],
  chains: [
    "C バイナリ → log → WAF → BAN",
    "Core + ダッシュボード + Grafana + Caddy + Prometheus",
    "Pro + K8s/Helm 証明（kind）+ fleet + Wasm/mesh",
  ],
  rams: ["約 110 MB", "約 730 MB（ラップトップ）· 約 400 MB（VM）", "約 1.9 GB（ラップトップ、全て有効）"],
  disks: ["約 4 MB（クリーン）· 約 55 MB（events.db 満杯）", "約 5.3 GB（VM、主に Docker イメージ）", "Pro ディスク + 約 2–3 GB（kind ボリューム）"],
  includes: [
    ["nginx パーサー", "OWASP CRS 121 ルール", "BAN パイプライン", "ipset / XDP", "Prometheus メトリクス"],
    ["SOC タイムライン（:8443）", "Grafana + $tenant パネル", "Caddy TLS + JWT", "fleet / マルチテナント", "Telegram 運用"],
    ["helm install log-guardian", "kind + admission webhook", "DaemonSet + operator", "fleet ショーケース", "Wasm/mesh（任意）"],
  ],
  stepTitles: [
    "依存関係",
    "ソース + ビルド + インストール",
    "初回実行 + API セキュリティ",
    "Nginx ログ形式",
    "ヘルス + 初回 BAN テスト",
    "Docker（インストール済みならスキップ）",
    "Pro SOC スタックを起動",
    "ダッシュボードを検証",
    "K8s CLI（kind + kubectl + helm）",
    "Pro Plus スタック（kind + Helm）",
    "計測 + デモ後にシャットダウン",
  ],
  stepDescs: [
    "Debian/Ubuntu のパッケージ依存関係と nginx（無ければ）をインストール。",
    "リポジトリをクローンし、全コアでビルドして install.sh で systemd ユニット + ルールをインストール。",
    "サービスを起動し、fail-closed の API トークンを準備してセットアップゲートを検証（FAIL: 0 を期待）。",
    "WAF が body + X-Forwarded-For を読めるよう log_guardian 形式を適用し、nginx をリロード。",
    "daemon IPC、Prometheus メトリクス、ipset BAN リストを確認。Core は本番稼働に入りました。",
    "Pro スタック（ダッシュボード、Grafana、Prometheus、Caddy）は Docker 上で動作。",
    "1 コマンドでダッシュボード + Grafana + Prometheus + Caddy TLS を起動（LOG_GUARDIAN_TIER=pro）。",
    "エディションと :8443 SOC パネルを検証。ログイン：admin / .env DASHBOARD_ADMIN_PASSWORD。",
    "Pro Plus ショーケース用の Kubernetes ツールをインストール。",
    "kind クラスタを作成し、helm install で「クラスタでも動く」証明を生成。",
    "RAM を層ごとに計測；デモ後に kind を停止して約 1.2 GB の RAM を回収。",
  ],
};

// --- 한국어 ---------------------------------------------------------------
const KO_PACK: TierTextPack = {
  eyebrow: "//:에디션",
  sub: "동일한 C 코어, 세 가지 패키징. 필요한 계층을 선택하세요 — 올인원 '메가 플랫폼'이 아닙니다.",
  ramLabel: "RAM",
  diskLabel: "디스크",
  chainLabel: "체인",
  includesLabel: "포함",
  protectionNote: "보호 수준은 세 에디션에서 동일합니다. Pro와 Pro Plus는 가시성과 통합 증거만 추가합니다.",
  respTitle: "RAM·디스크 증가 — 책임 경계",
  respBody: "상위 에디션에서 늘어나는 RAM과 디스크는 Log Guardian C 코어에서 오지 않습니다. Core 바이너리는 약 515 KB, 약 110 MB RAM을 유지합니다. 초과분은 SOC와 데모용으로 선택한 서드파티 도구(Docker, Grafana, kind 등)입니다 — 끄거나 Core만 실행하면 비용이 내려갑니다.",
  respCols: ["계층", "Log Guardian의 책임", "서드파티(우리 외부)"],
  respRows: [
    ["log-guardian + daemon + config/DB(약 110 MB RAM, 약 4–55 MB 디스크)", "—"],
    ["동일한 Core 바이너리; 추가 보호 없음", "Docker 이미지, Node.js 대시보드, Grafana, Prometheus, Caddy"],
    ["여전히 동일한 Core; 추가 보호 없음", "kind/K8s 노드, Helm 차트 Pod, operator, 선택적 Wasm/mesh"],
  ],
  installEyebrow: "//:설치",
  installTitle: "에디션별 설치 가이드",
  installSub: "탭을 선택하세요; 각 가이드는 자체 완결형입니다 — Pro를 위해 Core를, Pro Plus를 위해 Pro/Core를 읽을 필요가 없습니다.",
  selfContainedNote: "이 가이드는 처음부터 끝까지 단독으로 완료됩니다. Ubuntu 22.04/24.04 또는 Debian 12(amd64), root/sudo.",
  stepsWord: "단계",
  badges: ["권장", "SOC 패널", "가장 완전함"],
  taglines: [
    "log → WAF → 커널 밴. 프로덕션에서 단독으로 충분.",
    "Core + SOC 대시보드, Grafana, Prometheus, Caddy TLS, fleet.",
    "Pro + K8s/Helm 증거(kind), fleet 쇼케이스, 선택적 Wasm/mesh.",
  ],
  chains: [
    "C 바이너리 → log → WAF → 밴",
    "Core + 대시보드 + Grafana + Caddy + Prometheus",
    "Pro + K8s/Helm 증거(kind) + fleet + Wasm/mesh",
  ],
  rams: ["약 110 MB", "약 730 MB(노트북) · 약 400 MB(VM)", "약 1.9 GB(노트북, 전체 활성화)"],
  disks: ["약 4 MB(클린) · 약 55 MB(events.db 가득)", "약 5.3 GB(VM, 대부분 Docker 이미지)", "Pro 디스크 + 약 2–3 GB(kind 볼륨)"],
  includes: [
    ["nginx 파서", "OWASP CRS 121개 규칙", "밴 파이프라인", "ipset / XDP", "Prometheus 메트릭"],
    ["SOC 타임라인(:8443)", "Grafana + $tenant 패널", "Caddy TLS + JWT", "fleet / 멀티테넌트", "Telegram 운영"],
    ["helm install log-guardian", "kind + admission webhook", "DaemonSet + operator", "fleet 쇼케이스", "Wasm/mesh(선택)"],
  ],
  stepTitles: [
    "의존성",
    "소스 + 빌드 + 설치",
    "첫 실행 + API 보안",
    "Nginx 로그 형식",
    "헬스 + 첫 밴 테스트",
    "Docker(설치되어 있으면 건너뛰기)",
    "Pro SOC 스택 시작",
    "대시보드 검증",
    "K8s CLI(kind + kubectl + helm)",
    "Pro Plus 스택(kind + Helm)",
    "측정 + 데모 후 종료",
  ],
  stepDescs: [
    "Debian/Ubuntu 패키지 의존성과 nginx(없으면)를 설치합니다.",
    "저장소를 클론하고 모든 코어로 빌드한 뒤 install.sh로 systemd 유닛 + 규칙을 설치합니다.",
    "서비스를 시작하고 fail-closed API 토큰을 준비하며 설치 게이트를 검증합니다(FAIL: 0 예상).",
    "WAF가 body + X-Forwarded-For를 읽도록 log_guardian 형식을 적용한 뒤 nginx를 리로드합니다.",
    "daemon IPC, Prometheus 메트릭, ipset 밴 목록을 확인합니다. 이제 Core는 프로덕션 상태입니다.",
    "Pro 스택(대시보드, Grafana, Prometheus, Caddy)은 Docker에서 실행됩니다.",
    "한 명령으로 대시보드 + Grafana + Prometheus + Caddy TLS를 띄웁니다(LOG_GUARDIAN_TIER=pro).",
    "에디션과 :8443 SOC 패널을 검증합니다. 로그인: admin / .env DASHBOARD_ADMIN_PASSWORD.",
    "Pro Plus 쇼케이스를 위한 Kubernetes 도구를 설치합니다.",
    "kind 클러스터를 만들고 helm install로 '클러스터에서도 실행됨' 증거를 생성합니다.",
    "RAM을 계층별로 측정하고, 데모 후 kind를 종료해 약 1.2 GB RAM을 회수합니다.",
  ],
};

// --- العربية --------------------------------------------------------------
const AR_PACK: TierTextPack = {
  eyebrow: "//:الإصدارات",
  sub: "نفس نواة C، ثلاث حزم. اختر الطبقة التي تحتاجها — وليست 'منصة عملاقة' شاملة.",
  ramLabel: "ذاكرة",
  diskLabel: "قرص",
  chainLabel: "سلسلة",
  includesLabel: "يشمل",
  protectionNote: "مستوى الحماية متطابق في الإصدارات الثلاثة. لا يضيف Pro وPro Plus سوى الرؤية وإثبات التكامل.",
  respTitle: "نمو الذاكرة والقرص — حدّ المسؤولية",
  respBody: "الذاكرة والقرص اللذان يزدادان في الإصدارات الأعلى لا ينبعان من نواة C في Log Guardian. يبقى ثنائي Core عند نحو 515 كيلوبايت ونحو 110 ميغابايت ذاكرة. الزيادة هي أدوات الطرف الثالث التي اخترتها لـ SOC والعروض (Docker، Grafana، kind، إلخ) — أوقفها أو شغّل Core فقط لتنخفض التكلفة.",
  respCols: ["الطبقة", "مسؤولية Log Guardian", "طرف ثالث (خارجنا)"],
  respRows: [
    ["log-guardian + daemon + config/DB (نحو 110 ميغابايت ذاكرة، نحو 4–55 ميغابايت قرص)", "—"],
    ["نفس ثنائي Core؛ دون حماية إضافية", "صور Docker، لوحة Node.js، Grafana، Prometheus، Caddy"],
    ["لا يزال نفس Core؛ دون حماية إضافية", "عقدة kind/K8s، حاويات Helm chart، operator، Wasm/mesh اختياري"],
  ],
  installEyebrow: "//:التثبيت",
  installTitle: "دليل التثبيت حسب الإصدار",
  installSub: "اختر تبويبك؛ كل دليل مكتفٍ بذاته — لا حاجة لقراءة Core من أجل Pro، ولا Pro/Core من أجل Pro Plus.",
  selfContainedNote: "يكتمل هذا الدليل من البداية إلى النهاية بمفرده. Ubuntu 22.04/24.04 أو Debian 12 (amd64)، root/sudo.",
  stepsWord: "خطوات",
  badges: ["موصى به", "لوحة SOC", "الأكثر اكتمالاً"],
  taglines: [
    "log → WAF → حظر النواة. كافٍ وحده في الإنتاج.",
    "Core + لوحة SOC، Grafana، Prometheus، Caddy TLS، أسطول.",
    "Pro + إثبات K8s/Helm (kind)، عرض الأسطول، Wasm/mesh اختياري.",
  ],
  chains: [
    "ثنائي C → log → WAF → حظر",
    "Core + لوحة + Grafana + Caddy + Prometheus",
    "Pro + إثبات K8s/Helm (kind) + أسطول + Wasm/mesh",
  ],
  rams: ["نحو 110 ميغابايت", "نحو 730 ميغابايت (حاسوب محمول) · نحو 400 ميغابايت (VM)", "نحو 1.9 غيغابايت (حاسوب محمول، كل شيء مُفعّل)"],
  disks: ["نحو 4 ميغابايت (نظيف) · نحو 55 ميغابايت (events.db ممتلئ)", "نحو 5.3 غيغابايت (VM، غالباً صور Docker)", "قرص Pro + نحو 2–3 غيغابايت (وحدة تخزين kind)"],
  includes: [
    ["محلل nginx", "OWASP CRS 121 قاعدة", "خط أنابيب الحظر", "ipset / XDP", "مقاييس Prometheus"],
    ["الخط الزمني SOC (:8443)", "Grafana + لوحات $tenant", "Caddy TLS + JWT", "أسطول / متعدد المستأجرين", "تشغيل Telegram"],
    ["helm install log-guardian", "kind + admission webhook", "DaemonSet + operator", "عرض الأسطول", "Wasm/mesh (اختياري)"],
  ],
  stepTitles: [
    "التبعيات",
    "المصدر + البناء + التثبيت",
    "أول تشغيل + أمان API",
    "تنسيق سجل Nginx",
    "الصحة + أول اختبار حظر",
    "Docker (تخطَّ إن كان مثبتاً)",
    "ابدأ حزمة Pro SOC",
    "تحقّق من اللوحة",
    "K8s CLI (kind + kubectl + helm)",
    "حزمة Pro Plus (kind + Helm)",
    "قِس + أوقف بعد العرض",
  ],
  stepDescs: [
    "ثبّت تبعيات حزم Debian/Ubuntu وnginx (إن كان مفقوداً).",
    "استنسخ المستودع، ابنِ بكل الأنوية وثبّت وحدات systemd + القواعد عبر install.sh.",
    "يشغّل الخدمات، يجهّز رمز API fail-closed ويتحقق من بوابة التثبيت (توقّع FAIL: 0).",
    "طبّق تنسيق log_guardian ليقرأ الـ WAF الـ body وX-Forwarded-For، ثم أعد تحميل nginx.",
    "افحص IPC للـ daemon، مقاييس Prometheus وقائمة حظر ipset. Core الآن في الإنتاج.",
    "تعمل حزمة Pro (اللوحة، Grafana، Prometheus، Caddy) على Docker.",
    "يرفع اللوحة + Grafana + Prometheus + Caddy TLS بأمر واحد (LOG_GUARDIAN_TIER=pro).",
    "تحقّق من الإصدار ولوحة SOC على :8443. الدخول: admin / .env DASHBOARD_ADMIN_PASSWORD.",
    "يثبّت أدوات Kubernetes لعرض Pro Plus.",
    "ينشئ عنقود kind وينتج إثبات 'يعمل على عنقود أيضاً' عبر helm install.",
    "قِس الذاكرة طبقة طبقة؛ بعد العرض أوقف kind واسترجع نحو 1.2 غيغابايت من الذاكرة.",
  ],
};

// --- Paket kaydı ve fallback ----------------------------------------------
const PACKS: Partial<Record<Locale, TiersCopy>> = {
  tr: build(TR_PACK),
  en: build(EN_PACK),
  de: build(DE_PACK),
  fr: build(FR_PACK),
  es: build(ES_PACK),
  pt: build(PT_PACK),
  nl: build(NL_PACK),
  ru: build(RU_PACK),
  zh: build(ZH_PACK),
  ja: build(JA_PACK),
  ko: build(KO_PACK),
  ar: build(AR_PACK),
};

// Türki diller kendi paketi yoksa TR'ye düşer (yakın dil ailesi).
const TURKIC: Locale[] = ["tr", "az", "kk", "uz", "ky", "tk", "ug", "tt", "ba", "cv", "crh", "gag", "sah"];

export function getTiers(locale: Locale): TiersCopy {
  const pack = PACKS[locale];
  if (pack) return pack;
  if (TURKIC.includes(locale)) return PACKS.tr as TiersCopy;
  return PACKS.en as TiersCopy;
}
