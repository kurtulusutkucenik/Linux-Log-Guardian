// Canlı siteden (ceniklinuxlogguardian.org) taşınan gerçek içerik — tek kaynak.

export const NAV = [
  { href: "#hero", label: "Ana sayfa", i18n: "nav_home" as const },
  { href: "#nedir", label: "Nedir", i18n: "nav_about" as const },
  { href: "#pipeline", label: "Pipeline", i18n: "nav_pipeline" as const },
  { href: "#rakipler", label: "Rakipler", i18n: "nav_rivals" as const },
  { href: "#kurulum", label: "Kurulum", i18n: "nav_setup" as const },
  { href: "/testler", label: "Testler", i18n: "nav_tests" as const },
  { href: "#iletisim", label: "İletişim", i18n: "nav_contact" as const },
];

export const HERO = {
  badge: "//:LOG→BAN · SYSTEM ONLINE",
  title: "Linux Log Guardian",
  bullets: ["~20 ms kernel ban", "79 otomatik test", "72h soak PASS"],
  tagline: "nginx access log → WAF/CRS → kernel ban · tek zincir · self-hosted",
  chips: ["açık kaynak · MIT", "72h soak PASS"],
  reach: "3,65k+ ziyaret · 56 ülke · kanıt PDF",
  quickstart: [
    "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git",
    "cd Linux-Log-Guardian",
    "make -j$(nproc)",
    "sudo bash install.sh",
  ],
  github: "https://github.com/kurtulusutkucenik/Linux-Log-Guardian",
  praise: {
    lead: "Türkiye'nin ölçülebilir kanıtlı, tek zincir self-hosted güvenlik stack'i — rakipler parça parça, biz hepsi bir arada.",
    highlights: [
      "~20 ms medyan ban — Fail2ban'ın saatler süren iptables yoluna karşı ölçülmüş 21 örnek",
      "%100 gerçek saldırı recall + %100 OWASP CRS parity — 121 kural, 1500 satır corpus",
      "%0.2 false positive — 500 benign satırda 1 alarm; rakiplerde yüksek/orta",
      "72 saat VM soak — 864 örnek, 0 hata; rakiplerde otomatik kanıt yok",
      "76 otomatik test + 14 dosyalık kanıt paketi — PDF/JSON, tekrar üretilebilir",
      "3 araç yığını tek ürün: ban motoru + WAF/CRS + SOC/kanıt — ~15 dk kurulum",
    ],
    bold: [
      { v: "~20ms", l: "kernel ban" },
      { v: "%100", l: "recall" },
      { v: "76", l: "otomatik test" },
      { v: "3→1", l: "araç birleşimi" },
    ],
  },
};

export const ABOUT = {
  eyebrow: "//:Nedir",
  title: "Linux Log Guardian nedir?",
  intro:
    "Türkiye'de geliştirilen, tamamen açık kaynak (MIT) bir self-hosted güvenlik yazılımı. nginx erişim loglarını gerçek zamanlı okur, OWASP CRS/WAF ile değerlendirir ve saldırgan IP'yi ipset ile kernel seviyesinde ~20 ms'de banlar — tek zincirde, üçüncü parti bulut olmadan.",
  paragraphs: [
    "Fail2ban yalnızca ban atar, ModSecurity WAF ayrı bir modüldür, dağıtık saldırı için ayrı araçlar gerekir. Log Guardian bunları tek hatta birleştirir: log satırı düşer → parser normalize eder → CRS/WAF kural motoru (PCRE2 JIT) değerlendirir → ban pipeline politika + tenant kararı verir → ipset/XDP kernelde uygular → Prometheus metrik ve dashboard SOC timeline'a yazar.",
    "Sonuç ölçülebilir ve tekrar üretilebilir: gerçek saldırı corpus'unda %100 recall, OWASP CRS ile %100 parity, %0.2 false positive, ~20 ms medyan ban gecikmesi ve 72 saatlik VM soak testinde 864 örnek boyunca 0 hata. Hepsi competitive-proof PDF/JSON paketinde ve /testler matrisinde açık.",
    "Bu web sitesi halka açık tanıtım ve indirme sayfasıdır — statik içerik sunar. Yazılım burada çalışmaz; kendi Linux sunucunuza kurar, verinizin sizde kalmasını sağlarsınız. Vendor lock-in yok, kaynak kodu tamamen açık.",
  ],
  highlights: [
    { k: "Tek zincir", v: "log → WAF → kernel ban, tek araç" },
    { k: "~20 ms", v: "log satırından ipset ban'a medyan gecikme" },
    { k: "%100 recall", v: "gerçek saldırı corpus + CRS parity" },
    { k: "%0.2 FP", v: "500 benign satırda 1 alarm" },
    { k: "72h soak", v: "864 örnek, 0 hata (VM)" },
    { k: "MIT · TR", v: "açık kaynak, Türkçe doküman, self-hosted" },
  ],
};

export const PIPELINE = {
  eyebrow: "//:Pipeline",
  title: "Tek zincir: logdan kernel ban'a",
  sub: "nginx access log satırından ipset ban'a ~20 ms — rakiplerde parçalı mimari.",
  steps: [
    { n: "1", label: "nginx access log", hint: "yazılabilir access log, log_guardian formatı" },
    { n: "2", label: "Parser + normalize", hint: "URI, method, XFF, body — tek şema" },
    { n: "3", label: "CRS / WAF motoru", hint: "OWASP CRS, PCRE2 JIT, schema/BOLA" },
    { n: "4", label: "Ban pipeline", hint: "policy + tenant + FP trust kararı" },
    { n: "5", label: "ipset / XDP kernel", hint: "~20 ms kernel ban" },
    { n: "6", label: "Metrik + dashboard", hint: "Prometheus tenant + SOC timeline" },
  ],
  note: "XDR, Wasm marketplace ve LLM Copilot uzun vadeli opsiyonel katmanlardır — Core tek başına üretimde kullanılabilir.",
};

export const MARQUEE_ITEMS = [
  "nginx log → WAF → kernel ban",
  "76 otomatik test",
  "72h soak PASS",
  "~20 ms kernel ban",
  "false positive %0.2",
  "gerçek saldırı recall %100",
  "OWASP CRS parity %100",
  "MIT · Türkiye",
  "self-hosted · vendor lock-in yok",
];

export const SELECTED = {
  eyebrow: "//:Seçili",
  title: "Seçili kanıtlar",
  lead: "Core · Pro · Proof — tek zincirde ölçülebilir sonuçlar.",
  cards: [
    {
      tag: "//:Core",
      kicker: "CORE",
      title: 'What="we do"',
      body: "Tek zincir: nginx log → OWASP CRS → ~20 ms kernel ban. ~15 dakikada üretim.",
      chips: ["~20 ms ban", "OWASP CRS"],
    },
    {
      tag: "//:Pro",
      kicker: "SOC",
      title: 'Pro="SOC"',
      body: "Filo, SOC timeline, panolar — kurulum sonrası kendi sunucunuzda opsiyonel katman.",
      chips: ["Fleet", "Timeline"],
    },
    {
      tag: "//:Proof",
      kicker: "PROOF",
      title: 'Proof="79 test"',
      body: "76 otomatik test, competitive PDF, 72h soak — dashboard /tests ile aynı matris.",
      chips: ["79 test", "72h soak"],
    },
    {
      tag: "//:Metrics",
      kicker: "METRİK",
      title: 'Metrics="obs"',
      body: "Tenant etiketli Prometheus metrikleri, panolar ve alert kuralları — self-hosted gözlemlenebilirlik.",
      chips: ["Prometheus", "Alert"],
    },
    {
      tag: "//:Fleet",
      kicker: "FLEET",
      title: 'Fleet="mesh"',
      body: "Çok düğümlü filo: agent senkron, etcd mesh politika ve hedefli komut dağıtımı — tek panelden.",
      chips: ["Multi-node", "etcd"],
    },
    {
      tag: "//:Threat",
      kicker: "TEHDİT",
      title: 'Ops="Telegram"',
      body: "TAXII/STIX tehdit beslemesi + Telegram SOC: alert, ban ve tek-tık 'Gördüm' onayı — canlı operatör akışı.",
      chips: ["Threat intel", "Telegram"],
    },
    {
      tag: "//:eBPF",
      kicker: "KERNEL",
      title: 'eBPF="XDP"',
      body: "XDP filter + execve/lineage uprobes — kernel seviyesinde paket düşürme ve syscall izleme. Laptop'ta --no-xdp ile ipset yeterli.",
      chips: ["XDP", "ipset"],
    },
    {
      tag: "//:JA3",
      kicker: "CLUSTER",
      title: 'JA3="80 IP"',
      body: "Dağıtık scanner tespiti: aynı JA3 fingerprint + farklı IP kümesi %100 recall — 80 IP canlı test.",
      chips: ["%100 recall", "80 IP"],
    },
    {
      tag: "//:XDR",
      kicker: "XDR",
      title: 'Lineage="APT"',
      body: "Attack tree, lineage probe, syscall uprobe — uzun vadeli opsiyonel katman; saldırı zinciri ve gizli kanal tespiti.",
      chips: ["Attack tree", "Lineage"],
    },
    {
      tag: "//:Wasm",
      kicker: "PLUGIN",
      title: 'Wasm="market"',
      body: "Wasm runtime ile özel kural eklentileri — marketplace modeli, Core'a dokunmadan genişletme.",
      chips: ["Wasm", "Plugin"],
    },
    {
      tag: "//:SIEM",
      kicker: "EXPORT",
      title: 'SIEM="JSON"',
      body: "JSON event_type akışı — Splunk/Elastic/Vector hedeflerine SIEM export kanıtı (siem-export-report.json).",
      chips: ["JSON", "SIEM"],
    },
    {
      tag: "//:Deception",
      kicker: "TRAP",
      title: 'Deception="tarpit"',
      body: "Tarpit server + trap watcher — saldırganı yavaşlatma ve honeypot sinyali; deception katmanı.",
      chips: ["Tarpit", "Honeypot"],
    },
  ],
};

export const WHY = {
  eyebrow: "//:Why",
  title: "Neden Log Guardian?",
  lead: "Rakipler parça parça — biz tek zincirde ölçülebilir kanıt sunuyoruz.",
  cards: [
    {
      n: "01",
      title: "Tek hat",
      body: "nginx log → OWASP CRS → ~20 ms kernel ban. Fail2ban + ModSec + script yığını yok.",
    },
    {
      n: "02",
      title: "Şeffaf kanıt",
      body: "competitive-proof PDF, 79 test, 72h soak — rakiplerde yok veya parçalı.",
    },
    {
      n: "03",
      title: "MIT · Türkiye",
      body: "Açık kaynak, Türkçe doküman, self-hosted — vendor lock-in yok.",
    },
    {
      n: "04",
      title: "Dürüst sınır",
      body: "ModSec inline EPS'te değiliz; L3/L4'ü CDN absorb eder. Origin'de entegrasyon + hız.",
    },
    {
      n: "05",
      title: "3'ü 1 arada",
      body: "Fail2ban, ModSecurity, CrowdSec ayrı ayrı değil — ban + WAF + SOC tek üründe.",
    },
    {
      n: "06",
      title: "Kernel hızı",
      body: "~20 ms medyan ban — Fail2ban/CrowdSec saniye–dakika ölçeğinde; ölçülmüş 21 örnek.",
    },
    {
      n: "07",
      title: "Dağıtık saldırı",
      body: "JA3 cluster %100 recall — 80 IP canlı test; IP başına ban + cluster tespiti.",
    },
    {
      n: "08",
      title: "Operatör akışı",
      body: "Telegram alert + tek-tık ack, SOC timeline, tenant metrik — kurulum sonrası :8443.",
    },
  ],
};

export const VS = {
  eyebrow: "//:Vs",
  title: "Rakiplerle kıyas",
  sub: "Ölçülmüş kanıt — Fail2ban / CrowdSec / ModSecurity mimari notları. Her satırda üstün olan kırmızı ile işaretli.",
  advTitle: "Size sağladığımız avantajlar",
  advLead:
    "Fail2ban yalnızca ban atar, ModSecurity WAF ayrı modüldür, CrowdSec parçalı bir yığın ister. Log Guardian bu üç işi tek zincirde birleştirir — ölçülmüş kanıtla.",
  advantages: [
    {
      k: "Tek kurulum, tek zincir",
      v: "Fail2ban + ModSecurity + CrowdSec'i ayrı ayrı kurup entegre etmezsiniz. nginx log → WAF/CRS → kernel ban tek üründe, ~15 dk kurulum.",
    },
    {
      k: "~20 ms kernel ban",
      v: "Log satırından ipset/XDP ban'a medyan ~20 ms. Fail2ban/CrowdSec saniye–dakika ölçeğinde kalır; 21 ölçülmüş örnekle kanıtlı.",
    },
    {
      k: "280.373 EPS · 16.93× ModSec",
      v: "Aynı corpus ve aynı 121 OWASP CRS pattern'ında (PCRE2 JIT) WAF/CRS throughput 280.373 EPS — ModSec'in 16.560 EPS'ine karşı 16.93 kat hızlı. Ölçülmüş ve tekrar üretilebilir (bench-vs-modsec.json).",
    },
    {
      k: "%100 recall + %100 CRS parity",
      v: "121 OWASP CRS kuralı, 1500 satır corpus'ta gerçek saldırı recall'ı %100 ve ModSec ile tam parity — %0.2 false positive ile.",
    },
    {
      k: "Dağıtık saldırı kapsama",
      v: "JA3 cluster tespiti + IP başına ban — 80 IP canlı testte %100. Fail2ban tek IP mantığında, CrowdSec ayrı sinyal ağı ister.",
    },
    {
      k: "Şeffaf, tekrar üretilebilir kanıt",
      v: "76 otomatik test + 14 dosyalık PDF/JSON kanıt paketi + 72h soak (864 örnek, 0 hata). Rakiplerde otomatik kanıt yok veya parçalı.",
    },
    {
      k: "Self-hosted · MIT · Türk yapımı",
      v: "Veriniz sizde kalır, vendor lock-in yok, kaynak tamamen açık. SOC timeline, Prometheus metrik ve Telegram ops tek panelde (:8443).",
    },
  ],
  cols: ["Metrik", "Log Guardian", "Fail2ban", "CrowdSec", "ModSec + CRS"],
  groups: [
    {
      label: "Güçlü yanlar (ölçülmüş)",
      honest: false,
      // winners[i] = i. satırda üstün olan sütun (1=LG … 4=ModSec), yoksa 0.
      winners: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      rows: [
        ["Log → WAF → kernel ban", "Tek hat", "Yalnız ban", "Parçalı", "WAF ayrı"],
        ["WAF/CRS throughput (aynı corpus)", "280.373 EPS (16.93×)", "—", "—", "16.560 EPS"],
        ["OWASP CRS parity", "%100 (121 kural)", "—", "—", "Referans (%100)"],
        ["Gerçek saldırı recall", "%100 (1K+10K)", "—", "—", "%100"],
        ["Dağıtık / JA3 cluster ban", "%100 (80 IP)", "—", "Sinyal tabanlı", "—"],
        ["nginx inline consult", "PASS", "—", "—", "Ayrı modül"],
        ["L7 uygulama koruması", "WAF + consult + eBPF", "—", "—", "CRS inline"],
        ["Kernel / eBPF (XDP) ban", "ipset + XDP", "iptables", "iptables/nft", "—"],
        ["False positive", "%0.2 (ölçülü)", "Yüksek", "Orta", "CRS bağlı"],
        ["Ban gecikmesi", "~20 ms", "sn–dk", "sn", "Ayrı entegrasyon"],
        ["Kısa stabilite (5 dk)", "PASS (0 fail)", "—", "—", "—"],
        ["72h soak", "PASS (864/0)", "—", "—", "—"],
        ["Kanıt paketi PDF+JSON", "Otomatik (14 dosya)", "Yok", "Kısmi", "Modül modül"],
        ["Otomatik test matrisi", "79 test", "—", "Kısmi", "—"],
        ["SOC timeline / dashboard", "Var (:8443)", "—", "Konsol", "—"],
        ["Telegram ops + ack", "Var (tek-tık)", "—", "Kısmi", "—"],
        ["Kurulum süresi", "~15 dk", "dakikalar", "dakikalar", "saatler (tuning)"],
      ],
    },
    {
      label: "Dürüst sınırlar",
      honest: true,
      // winners: rakibin bizden açıkça üstün olduğu sütun (kırmızı), yoksa 0.
      winners: [4, 0, 3, 4, 3],
      rows: [
        ["İlk isteği anında engelleme", "Reaktif (log satırı)", "Reaktif", "Kısmen", "Inline (anında)"],
        ["Volumetrik L3/L4 scrub", "Yok — CDN önerilir", "Yok", "Yok", "Yok"],
        ["Topluluk sinyal ağı", "Self-hosted", "—", "Var (global)", "—"],
        ["Edge / Cloud WAF", "Origin katmanı", "—", "Bouncer", "Proxy modu"],
        ["Yönetilen bulut / SaaS", "Yok (self-hosted)", "Yok", "Var (konsol)", "—"],
      ],
    },
  ],
  note: "Dürüst sınır: bazı alanlarda rakipler açıkça daha iyi (kırmızı hücreler). ModSec + CRS ilk isteği inline anında engeller (biz reaktifiz — log satırı düşene kadar ilk istek geçebilir); CrowdSec dağıtık topluluk sinyal ağında ve yönetilen SaaS konsolunda güçlü. Buna karşılık aynı corpus + aynı 121 CRS pattern ölçümünde WAF/CRS throughput'umuz 280.373 EPS ile ModSec'in 16.560 EPS'inin 16.93 katı (bench-vs-modsec.json).",
};

export interface LineSeries {
  name: string;
  values: number[];
  us?: boolean;
  dash?: "solid" | "dash" | "dot";
}

export const CHARTS: {
  eyebrow: string;
  title: string;
  sub: string;
  profile: {
    title: string;
    hint: string;
    categories: string[];
    yMax: number;
    series: LineSeries[];
  };
  latency: {
    title: string;
    hint: string;
    labels: string[];
    yMax: number;
    unit: string;
    target: number;
    series: LineSeries[];
  };
  soak: {
    title: string;
    hint: string;
    labels: string[];
    yMax: number;
    unit: string;
    series: LineSeries[];
  };
  fp: {
    title: string;
    hint: string;
    labels: string[];
    yMax: number;
    unit: string;
    series: LineSeries[];
  };
  eps: {
    title: string;
    hint: string;
    labels: string[];
    yMax: number;
    unit: string;
    honest: boolean;
    series: LineSeries[];
  };
  recall: {
    title: string;
    hint: string;
    labels: string[];
    yMax: number;
    unit: string;
    series: LineSeries[];
  };
} = {
  eyebrow: "//:Charts",
  title: "Grafiklerle kıyas",
  sub: "Ölçülmüş kanıttan (competitive-proof.json, bench-vs-modsec.json, fp-report.json, bench-ban-latency.json) türetilmiştir. Bizim çizgi fosforlu turkuaz.",
  profile: {
    title: "Performans profili (9 eksen)",
    hint: "Yüksek = iyi · 0–100 normalize · Throughput: bench-vs-modsec.json EPS oranı (280k vs 16,5k) — LG 100 iddiası yok",
    categories: [
      "Tek zincir",
      "Recall",
      "Düşük FP",
      "Ban hızı",
      "Kanıt",
      "Throughput",
      "Dağıtık",
      "Doküman",
      "Kurulum",
    ],
    yMax: 100,
    series: [
      { name: "Log Guardian", us: true, values: [100, 100, 98, 100, 100, 95, 100, 100, 92] },
      { name: "ModSec + CRS", dash: "solid", values: [60, 100, 55, 40, 40, 6, 20, 70, 40] },
      { name: "CrowdSec", dash: "dash", values: [55, 40, 60, 55, 45, 4, 85, 55, 65] },
      { name: "Fail2ban", dash: "dot", values: [30, 10, 40, 20, 10, 3, 10, 40, 72] },
    ],
  },
  latency: {
    title: "Ban gecikmesi — ölçüm örnekleri",
    hint: "Düşük = iyi · 21 örnekten temsili (bench-ban-latency.json) · medyan 20.2 ms · hedef 75 ms",
    labels: ["#1", "#2", "#3", "#4", "#5"],
    yMax: 90,
    unit: "ms",
    target: 75,
    series: [
      { name: "Log Guardian", us: true, values: [19.68, 20.06, 20.23, 20.61, 20.82] },
    ],
  },
  soak: {
    title: "72h soak — servis ayakta kalma",
    hint: "Yüksek = iyi · 864 örnek · 0 hata",
    labels: ["0h", "12h", "24h", "36h", "48h", "60h", "72h"],
    yMax: 100,
    unit: "%",
    series: [
      { name: "Log Guardian", us: true, values: [100, 100, 100, 100, 100, 100, 100] },
    ],
  },
  fp: {
    title: "False positive karşılaştırması",
    hint: "Düşük = iyi · % · LG ölçülü, rakipler mimari not",
    labels: ["Log Guardian", "CrowdSec", "Fail2ban", "ModSec"],
    yMax: 100,
    unit: "%",
    series: [
      { name: "FP oranı", us: true, values: [0.2, 45, 80, 55] },
    ],
  },
  eps: {
    title: "WAF/CRS throughput (EPS) — aynı corpus",
    hint: "Yüksek = iyi · bench-vs-modsec.json · aynı 121 CRS pattern, PCRE2 JIT · 16.93× ModSec",
    labels: ["Log Guardian", "ModSec + CRS"],
    yMax: 300000,
    unit: "",
    honest: false,
    series: [
      { name: "EPS (aynı corpus)", us: true, values: [280373, 16560] },
    ],
  },
  recall: {
    title: "Saldırı recall — kategori bazlı",
    hint: "Yüksek = iyi · corpus · %",
    labels: ["SQLi", "XSS", "RCE", "LFI", "Bot", "Dağıtık"],
    yMax: 110,
    unit: "%",
    series: [
      { name: "Log Guardian", us: true, values: [100, 100, 100, 100, 100, 100] },
      { name: "ModSec CRS", dash: "solid", values: [100, 100, 100, 100, 100, 0] },
    ],
  },
};

export const METRICS = {
  eyebrow: "//:Sayılar",
  title: "Sitede gösterilen tüm sayısal değerler",
  sub: "Kaynak: competitive-proof.json · bench-ban-latency.json · bench-vs-modsec.json · fp-report.json · soak-report.json",
  groups: [
    {
      label: "Ban & gecikme",
      items: [
        { value: "20.23", unit: "ms", label: "Medyan ban gecikmesi" },
        { value: "21.1", unit: "ms", label: "P90 ban gecikmesi" },
        { value: "18.69", unit: "ms", label: "Min örnek (21 ölçüm)" },
        { value: "21.64", unit: "ms", label: "Max örnek (21 ölçüm)" },
        { value: "75", unit: "ms", label: "Laptop hedef (PASS)" },
        { value: "50", unit: "ms", label: "Prod hedef" },
      ],
    },
    {
      label: "WAF & recall",
      items: [
        { value: "100", unit: "%", label: "Gerçek saldırı recall" },
        { value: "100", unit: "%", label: "OWASP CRS parity" },
        { value: "121", unit: "", label: "CRS kural sayısı" },
        { value: "0.2", unit: "%", label: "False positive oranı" },
        { value: "500", unit: "", label: "Benign test satırı" },
        { value: "1500", unit: "", label: "Bench corpus satırı" },
      ],
    },
    {
      label: "Throughput",
      items: [
        { value: "280.373", unit: "EPS", label: "WAF/CRS (aynı corpus, LG)" },
        { value: "16.560", unit: "EPS", label: "ModSec CRS replay" },
        { value: "16.93×", unit: "", label: "LG / ModSec hız oranı" },
        { value: "3.57", unit: "µs", label: "Satır başı latency (LG)" },
        { value: "16", unit: "", label: "Bench worker sayısı" },
      ],
    },
    {
      label: "Stabilite & kanıt",
      items: [
        { value: "76", unit: "", label: "Otomatik test" },
        { value: "72", unit: "saat", label: "VM soak süresi" },
        { value: "864", unit: "", label: "Soak örnek sayısı" },
        { value: "0", unit: "", label: "Soak hata" },
        { value: "14", unit: "", label: "Kanıt dosyası" },
        { value: "80", unit: "IP", label: "JA3 cluster test" },
      ],
    },
    {
      label: "Erişim & kurulum",
      items: [
        { value: "3.65k+", unit: "", label: "Site ziyareti" },
        { value: "56", unit: "", label: "Ülke erişimi" },
        { value: "~15", unit: "dk", label: "Core kurulum süresi" },
        { value: "9091", unit: "", label: "Prometheus port" },
        { value: "8443", unit: "", label: "Dashboard port (prod)" },
      ],
    },
  ],
};

export const PACKAGES = {
  eyebrow: "//:3Paket",
  title: "3 paketin tek zincirde birleşimi",
  hero:
    "Log Guardian, üretimde genelde ayrı ayrı kurulan üç yazılım yığınını tek self-hosted üründe birleştirir — ölçülebilir kanıtla.",
  merge: [
    {
      n: "01",
      name: "Ban motoru",
      company: "Fail2ban",
      replaces: "Fail2ban + iptables script yığını",
      body: "Fail2ban'ı ayrı kurmazsınız. Log satırından ipset/XDP kernel ban ~20 ms — policy, tenant, FP trust tek pipeline.",
      metrics: ["~20 ms medyan", "ipset + XDP", "0 fail (5 dk)"],
      color: "neon" as const,
    },
    {
      n: "02",
      name: "WAF / CRS katmanı",
      company: "ModSecurity",
      replaces: "ModSecurity + nginx ayrı entegrasyon",
      body: "ModSecurity'yi ayrı modül olarak bağlamazsınız. OWASP CRS 121 kural, PCRE2 JIT — nginx log satırından tek geçiş.",
      metrics: ["%100 CRS parity", "%100 recall", "%0.2 FP"],
      color: "turq" as const,
    },
    {
      n: "03",
      name: "SOC & sinyal katmanı",
      company: "CrowdSec",
      replaces: "CrowdSec bouncer + ayrı konsol + manuel kanıt",
      body: "CrowdSec parçalı mimarisine gerek yok. Prometheus, SOC timeline, 79 test, 14 kanıt dosyası, Telegram ops — tek panel.",
      metrics: ["79 test", "72h soak PASS", "14 kanıt dosyası"],
      color: "cyan" as const,
    },
  ],
  result: {
    title: "Birleşince ne olur?",
    bullets: [
      "Tek kurulum (~15 dk) — üç ayrı araç + entegrasyon scripti yok",
      "Tek metrik zinciri — loganalyzer_* tenant etiketli, Grafana/dashboard uyumlu",
      "Tek kanıt paketi — competitive-proof PDF/JSON, rakiplerde parçalı veya yok",
      "Tek operatör akışı — alert → ban → Telegram ack → SOC timeline",
    ],
    big: [
      { v: "3→1", l: "Araç yığını" },
      { v: "~20ms", l: "Uçtan uca ban" },
      { v: "%100", l: "Recall + parity" },
      { v: "76", l: "Otomatik test" },
    ],
  },
  tiers: {
    title: "Ürün sürümleri (Core · Pro · Pro Plus)",
    items: [
      {
        tag: "Core",
        time: "~15 dk",
        body: "log → WAF → ipset ban. Üretimde tek başına yeterli.",
        includes: ["nginx parser", "OWASP CRS", "ban pipeline", "ipset", "Prometheus"],
      },
      {
        tag: "Pro",
        time: "kurulum sonrası",
        body: "eBPF daemon, dashboard (:8443), filo, etcd mesh, panolar.",
        includes: ["XDP/eBPF", "SOC timeline", "fleet sync", "alert kuralları"],
      },
      {
        tag: "Pro Plus",
        time: "kurumsal vitrin",
        body: "PRO + K8s/Helm kanıtı (kind), fleet vitrin, opsiyonel Wasm/mesh — koruma aynı, sadece görünürlük+entegrasyon kanıtı.",
        includes: ["kind + Helm", "fleet vitrin", "Wasm/mesh (ops.)", "XDR/Copilot roadmap"],
      },
    ],
  },
  strengths: [
    {
      title: "Tek zincir entegrasyon",
      body: "Fail2ban log okur ban atar; ModSec ayrı modül; SIEM ayrı agent. Bizde log satırı → CRS → ban → metrik tek process hattında.",
      stat: "1 hat",
    },
    {
      title: "Ölçülebilir ban hızı",
      body: "bench-ban-latency.json: 21 örnek, medyan 20.2 ms, hedef 75 ms — PASS. Rakipler saniye–dakika ölçeğinde.",
      stat: "~20 ms",
    },
    {
      title: "Şeffaf kanıt",
      body: "76 otomatik test, 14 JSON/PDF dosya, 72h soak 864/0. Rakiplerde otomatik paket yok.",
      stat: "79 test",
    },
    {
      title: "Türk yapımı · MIT",
      body: "Self-hosted, vendor lock-in yok, Türkçe doküman. Kaynak tamamen açık.",
      stat: "MIT",
    },
  ],
};

export const LAYERS = [
  { tag: "Core", body: "log → WAF → ipset ban (~15 dk)" },
  { tag: "Pro", body: "eBPF daemon, dashboard, metrikler, fleet" },
  { tag: "Pro Plus", body: "K8s/Helm kanıtı (kind), fleet vitrin, opsiyonel Wasm/mesh (XDR/Copilot roadmap)" },
];

export interface SetupStep {
  number: string;
  title: string;
  description: string;
  command: string;
  output?: string;
}

export const SETUP = {
  eyebrow: "//:Setup",
  title: "Kurulum rehberi (detaylı)",
  sub: "Ubuntu/Debian üzerinde sıfırdan Core kurulumu (~15 dk) — komut komut.",
  intro:
    "Kaynak: GitHub — Linux-Log-Guardian. İki yol var: hazır .deb paketi (önerilen) veya kaynak koddan derleme. Laptop / sanal makinede eBPF/XDP olmadan da (ipset tabanlı ban) çalışır. Aşağıdaki adımlar üretim sunucusu içindir; her komutun beklenen çıktısı da verilmiştir.",
  requirements: [
    "Ubuntu 22.04 / 24.04 veya Debian 12 (amd64)",
    "nginx + yazılabilir access log (log_guardian formatı)",
    "Root veya sudo (systemd, ipset, /etc/log-guardian)",
    "~200 MB disk, 128 MB RAM (Core); Pro için Docker",
    "Opsiyonel Pro: eBPF/XDP için 5.10+ kernel, Docker (dashboard/metrik)",
  ],
  paths: [
    {
      id: "A",
      title: "Sıfır sunucu — .deb paketi",
      badge: "önerilen",
      note: "Derleme gerektirmez. Paket binary, systemd unit'leri, kuralları ve script'leri içerir. Upgrade güvenli: mevcut /etc/log-guardian/rules.conf silinmez. İndir: GitHub Releases (log-guardian_*_amd64.deb) ya da repodan bash scripts/build_deb.sh → dist/.",
      steps: [
        {
          number: "01",
          title: "Bağımlılıklar",
          description:
            "İlk kurulumda Debian paket bağımlılıklarını yükleyin. nginx kurulu değilse aynı komutla eklenebilir.",
          command:
            "sudo apt-get update\nsudo apt-get install -y ipset libbpf1 libcurl4 libpcre2-8-0 \\\n  libsqlite3-0 libssl3 libelf1 liburing2 nginx",
          output:
            "Reading package lists... Done\nSetting up ipset (7.x) ...\nSetting up libbpf1:amd64 ...\nSetting up nginx (1.x) ...",
        },
        {
          number: "02",
          title: "Paketi kur",
          description:
            "dpkg -i sonrası bağımlılık hatası görürseniz apt-get install -f çalıştırın. postinst; log-guardian kullanıcısını, izinleri, systemd unit'lerini ve varsayılan rules.conf'u otomatik hazırlar.",
          command:
            "sudo dpkg -i log-guardian_*_amd64.deb\nsudo apt-get install -f   # bağımlılık eksikse",
          output:
            "Selecting previously unselected package log-guardian.\nSetting up log-guardian (72e5a7b) ...\n[deb_post_install] rules.conf olusturuldu: /etc/log-guardian/rules.conf\n\nlog-guardian kuruldu.",
        },
        {
          number: "03",
          title: "İlk çalıştırma ve API güvenliği",
          description:
            "nginx log formatı, FP trust ve API güvenliğini (token, fail-closed) tek seferde hazırlar. Script'ler paket içindedir (/usr/local/share/log-guardian/scripts/).",
          command:
            "sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh\nsudo bash /usr/local/share/log-guardian/scripts/ensure_api_security.sh\nbash /usr/local/share/log-guardian/scripts/post_install_verify.sh",
          output:
            "[OK] log-guardian.service active\n[OK] log-guardian-daemon.service active\n[OK] --health IPC\n[OK] API fail-closed (tokensiz 403)\n\n=== ozet ===\n  FAIL: 0   WARN: 0\n[OK] post_install_verify — kurulum kapisi gecti",
        },
      ] as SetupStep[],
    },
    {
      id: "B",
      title: "Kaynak kod — derleme ve kurulum",
      badge: "geliştirici",
      note: "GitHub reposunu klonlayıp derlersiniz. Geliştirme, özelleştirme ve tam kaynak incelemesi için uygundur. install.sh; systemd unit'lerini, kuralları ve nginx log formatını hazırlar.",
      steps: [
        {
          number: "01",
          title: "Kaynak ve derleme",
          description:
            "Repoyu klonlayın, tüm çekirdeklerle derleyin ve ana kurulum scriptini çalıştırın.",
          command:
            "git clone https://github.com/kurtulusutkucenik/Linux-Log-Guardian.git\ncd Linux-Log-Guardian\nmake -j$(nproc)\nsudo bash install.sh",
          output:
            "cc -O2 ... -o log-guardian\ncc -O2 ... -o log-guardian-daemon\n[install] systemd unit'leri kuruldu\n[install] rules.conf hazir",
        },
        {
          number: "02",
          title: "İlk çalıştırma ve token senkronu",
          description:
            "Servisleri ayağa kaldırır, API token senkronunu ve dashboard bağlantısını hazırlar.",
          command:
            "sudo bash scripts/install_first_run.sh\nsudo bash scripts/ensure_api_security.sh\nbash scripts/sync_dashboard_api_token.sh",
          output:
            "[OK] servisler aktif\n[OK] API token yazildi (.env)\n[OK] dashboard token senkron",
        },
      ] as SetupStep[],
    },
  ],
  common: {
    title: "Ortak adımlar (A ve B sonrası)",
    steps: [
      {
        number: "01",
        title: "Nginx log formatı",
        description:
          "WAF'ın request body ve X-Forwarded-For okuyabilmesi için log_guardian log formatı şarttır. Kurulum çoğu durumda otomatik uygular; STRICT modda doğrulayın.",
        command:
          "# examples/nginx-log-guardian.conf → site config\nSTRICT=1 bash scripts/check_nginx_log_format.sh\nsudo nginx -t && sudo systemctl reload nginx",
        output:
          "[check] log_format log_guardian bulundu\n[check] access_log log_guardian aktif\nnginx: configuration file test is successful",
      },
      {
        number: "02",
        title: "Sağlık ve durum doğrulama",
        description:
          "Daemon IPC, servis durumu ve BPF özelliklerini kontrol edin. Yeşil kapı: post_install_verify sonunda FAIL: 0 görmelisiniz.",
        command:
          "sudo log-guardian --health\nsudo log-guardian --status\nbash scripts/post_install_verify.sh",
        output:
          "[HEALTH] daemon IPC: OK\n[HEALTH] BPF xdp=ON execve=OFF lineage=OFF\n\n=== ozet ===\n  FAIL: 0   WARN: 0",
      },
      {
        number: "03",
        title: "Metrik ve ilk ban testi",
        description:
          "Prometheus metriklerini kontrol edin; trafik sonrası sayaçların arttığını görün. Bir saldırı satırı enjekte edip ipset'te ban'ı doğrulayabilirsiniz.",
        command:
          "curl -s http://127.0.0.1:9091/metrics | grep loganalyzer_\nsudo ipset list log-guardian-ban | head",
        output:
          'loganalyzer_log_lines_total{tenant_id="default"} 8\nloganalyzer_ban_success_total{tenant_id="default"} 8\nName: log-guardian-ban\nMembers:\n203.0.113.250',
      },
      {
        number: "04",
        title: "VirtualBox / XDP yok (laptop & VM)",
        description:
          "eBPF/XDP olmayan ortamlarda --no-xdp ile ipset tabanlı ban yeterlidir. Servis bağımlılığı hatası alırsanız onarım scripti tek komuttur.",
        command:
          "sudo bash install.sh --no-xdp\nsudo bash scripts/install_first_run.sh\n# servis FAIL ise:\nsudo bash scripts/repair_no_xdp_stack.sh",
        output: "[install] XDP atlandi — ipset ban aktif\n[OK] servisler aktif (no-xdp)",
      },
    ] as SetupStep[],
  },
  dashboard: {
    title: "Pro dashboard — kurulum sonrası (opsiyonel)",
    note: "Dashboard bu tanıtım sitesinde değil, kurduğunuz kendi makinenizde çalışır. Prod stack Caddy + Docker ile https://localhost:8443 üzerinden sunulur.",
    steps: [
      {
        number: "01",
        title: "Prod stack'i başlat",
        description:
          "Dashboard'ı kendi sunucunuzda derleyip ayağa kaldırır. Giriş: admin / .env içindeki DASHBOARD_ADMIN_PASSWORD.",
        command:
          "bash scripts/dashboard_refresh.sh\n# aynı makinede tarayıcı: https://localhost:8443",
        output: "[dashboard] docker compose build + up\n[OK] https://localhost:8443 hazir",
      },
      {
        number: "02",
        title: "Uzak VPS için SSH tüneli",
        description:
          "Dashboard'ı internete açmadan güvenle görüntülemek için SSH tüneli kurun; önce sunucuyu sertleştirin.",
        command:
          "ssh -L 8443:127.0.0.1:8443 kullanici@sunucu\n# public VPS'te önce:\nsudo env LG_NEW_PASSWORD='...' bash scripts/laptop_harden.sh",
        output: "[harden] demo parola degistirildi\n[harden] fail-closed profil aktif",
      },
    ] as SetupStep[],
  },
  tip: "İpucu: JWT ve dashboard parolası için bash scripts/laptop_jwt_setup.sh. 3 dakikalık demo: SKIP_WEBHOOK=1 bash scripts/demo_3min.sh. Detaylı doküman: docs/QUICKSTART_NGINX.md · docs/LAPTOP_OPS.md · docs/SECURITY_PROFILES.md.",
};

export const EVIDENCE = {
  eyebrow: "//:Evidence",
  title: "Kanıt paketi",
  note: "Kapılar: laptop_sprint_gate.sh · 1h soak (laptop) · 72h soak (VM) PASS",
  files: [
    "competitive-proof.pdf",
    "competitive-proof.json",
    "bench-vs-modsec.json",
    "fp-report.json",
    "bench-ban-latency.json",
    "soak-report.json",
    "SOAK_SUMMARY.md",
    "sprint-prod-proof.json",
    "siem-export-report.json",
    "taxii-feed-report.json",
    "vm-sprint-proof.json",
    "geoip-mmdb-report.json",
    "webhook-route-proof-report.json",
    "webhook-telegram-live-report.json",
  ],
};

export const HONEST = {
  eyebrow: "//:Honest",
  title: "Dürüst sınırlar",
  items: [
    "Reaktif mimari — log satırı düşene kadar ilk istek geçebilir; ModSec inline'ın ilk isteği anında engellemesine karşı biz reaktifiz.",
    "L3/L4 DDoS absorb etmiyoruz — CDN üstüne konuruz.",
    "Dağıtık botnet — IP başına ban; CrowdSec sinyal ağı yok.",
    "Yapar: log → CRS/WAF → ~20 ms kernel ban, kanıt PDF, Telegram ops, MIT self-hosted.",
  ],
};

export const CONTACT = {
  eyebrow: "//:Contact",
  title: "İletişim & katkı",
  body:
    "Sorular, iş birliği veya katkı için yazın. Hata bildirimi ve pull request'ler açık kaynak ruhuyla memnuniyetle karşılanır.",
  email: "kurtulusutkucenikcontact@gmail.com",
  github: "https://github.com/kurtulusutkucenik/Linux-Log-Guardian",
};
