import type { Locale } from "./locales";

export type SectionCopy = {
  hero_badge: string;
  hero_bullets: string[];
  hero_tagline: string;
  hero_chips: string[];
  hero_reach: string;
  hero_praise_lead: string;
  hero_praise_highlights: string[];
  hero_praise_bold: Array<{ v: string; l: string }>;
  hero_side_title: string;
  hero_side_body: string;
  hero_cta_setup: string;
  hero_cta_github: string;
  hero_cta_tests: string;
  about_eyebrow: string;
  about_title: string;
  about_intro: string;
  about_paragraphs: string[];
  about_highlights: Array<{ k: string; v: string }>;
  pkg_title: string;
  pkg_hero: string;
  pkg_tagline: string;
  pkg_instead: string;
  pkg_footer: string;
  pkg_detail: string;
  merge: Array<{
    company: string;
    name: string;
    replaces: string;
    body: string;
    metrics: string[];
  }>;
  metrics_title: string;
  metrics_sub: string;
  metric_groups: Record<string, string>;
  why_title: string;
  why_lead: string;
  why_cards: Array<{ title: string; body: string }>;
  stats: Array<{ value: string; label: string }>;
  metric_labels: Record<string, string>;
};

const TR: SectionCopy = {
  hero_badge: "//:LOG→BAN · SYSTEM ONLINE",
  hero_bullets: ["~17 ms kernel ban", "75 otomatik test", "72h soak PASS"],
  hero_tagline: "nginx access log → WAF/CRS → kernel ban · tek zincir · self-hosted",
  hero_chips: ["açık kaynak · MIT", "72h soak PASS"],
  hero_reach: "2,3k+ ziyaret · 4k+ sayfa · 54 ülke · kanıt PDF",
  hero_praise_lead:
    "Türkiye'nin ölçülebilir kanıtlı, tek zincir self-hosted güvenlik stack'i — rakipler parça parça, biz hepsi bir arada.",
  hero_praise_highlights: [
    "~17 ms medyan ban — Fail2ban'ın saatler süren iptables yoluna karşı ölçülmüş 5 örnek",
    "%100 gerçek saldırı recall + %100 OWASP CRS parity — 121 kural, 1500 satır corpus",
    "%0.2 false positive — 500 benign satırda 1 alarm; rakiplerde yüksek/orta",
    "72 saat VM soak — 864 örnek, 0 hata; rakiplerde otomatik kanıt yok",
    "75 otomatik test + 14 dosyalık kanıt paketi — PDF/JSON, tekrar üretilebilir",
    "3 araç yığını tek ürün: Fail2ban + ModSecurity + CrowdSec — ~15 dk kurulum",
  ],
  hero_praise_bold: [
    { v: "~17ms", l: "kernel ban" },
    { v: "100", l: "recall" },
    { v: "75", l: "otomatik test" },
    { v: "3→1", l: "araç birleşimi" },
  ],
  hero_side_title:
    "Fail2ban + ModSecurity + CrowdSec ayrı ayrı mı? Tek ürün, tek kanıt, tek kurulum.",
  hero_side_body:
    "nginx access log satırından ipset ban'a kadar tek hat: parser, OWASP CRS/WAF değerlendirme ve ~17 ms kernel ban. Rakipler parçalı mimari sunar — biz ölçülmüş, tekrar üretilebilir PDF/JSON kanıtıyla tek zincirde birleştiririz. Türkiye'de geliştirildi, MIT lisansıyla açık kaynak, tamamen self-hosted.",
  hero_cta_setup: "15 dk kurulum",
  hero_cta_github: "GitHub kaynak",
  hero_cta_tests: "75 testi gör",
  about_eyebrow: "//:Nedir",
  about_title: "Linux Log Guardian nedir?",
  about_intro:
    "Türkiye'de geliştirilen, tamamen açık kaynak (MIT) bir self-hosted güvenlik yazılımı. nginx erişim loglarını gerçek zamanlı okur, OWASP CRS/WAF ile değerlendirir ve saldırgan IP'yi ipset ile kernel seviyesinde ~17 ms'de banlar — tek zincirde, üçüncü parti bulut olmadan.",
  about_paragraphs: [
    "Fail2ban yalnızca ban atar, ModSecurity WAF ayrı bir modüldür, CrowdSec parçalı mimari ister. Log Guardian bunları tek hatta birleştirir: log satırı düşer → parser normalize eder → CRS/WAF kural motoru (PCRE2 JIT) değerlendirir → ban pipeline politika + tenant kararı verir → ipset/XDP kernelde uygular → Prometheus metrik ve dashboard SOC timeline'a yazar.",
    "Sonuç ölçülebilir ve tekrar üretilebilir: gerçek saldırı corpus'unda %100 recall, OWASP CRS ile %100 parity, %0.2 false positive, ~17 ms medyan ban gecikmesi ve 72 saatlik VM soak testinde 864 örnek boyunca 0 hata.",
    "Bu web sitesi halka açık tanıtım ve indirme sayfasıdır — statik içerik sunar. Yazılım burada çalışmaz; kendi Linux sunucunuza kurar, verinizin sizde kalmasını sağlarsınız.",
  ],
  about_highlights: [
    { k: "Tek zincir", v: "log → WAF → kernel ban, tek araç" },
    { k: "~17 ms", v: "log satırından ipset ban'a medyan gecikme" },
    { k: "%100 recall", v: "gerçek saldırı corpus + CRS parity" },
    { k: "%0.2 FP", v: "500 benign satırda 1 alarm" },
    { k: "72h soak", v: "864 örnek, 0 hata (VM)" },
    { k: "MIT · TR", v: "açık kaynak, Türkçe doküman, self-hosted" },
  ],
  pkg_title: "3'ü 1 arada — ayrı ayrı kurulum yok",
  pkg_hero:
    "Fail2ban, ModSecurity ve CrowdSec'i tek tek kurup entegre etmek yerine Log Guardian hepsini tek self-hosted pakette birleştirir.",
  pkg_tagline: "Üç rakip araç · tek zincir · ölçülebilir kanıt",
  pkg_instead: "Tek başına kurmak yerine → Log Guardian'da dahil",
  pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 tek zincir",
  pkg_detail: "Detaylı anlatım → /paketler",
  merge: [
    {
      company: "Fail2ban",
      name: "Ban motoru",
      replaces: "Fail2ban + iptables script yığını",
      body: "Fail2ban'ı ayrı kurmazsınız. Log satırından ipset/XDP kernel ban ~17 ms — policy, tenant, FP trust tek pipeline.",
      metrics: ["~17 ms medyan", "ipset + XDP", "0 fail (5 dk)"],
    },
    {
      company: "ModSecurity",
      name: "WAF / CRS katmanı",
      replaces: "ModSecurity + nginx ayrı entegrasyon",
      body: "ModSecurity'yi ayrı modül olarak bağlamazsınız. OWASP CRS 121 kural, PCRE2 JIT — nginx log satırından tek geçiş.",
      metrics: ["%100 CRS parity", "%100 recall", "%0.2 FP"],
    },
    {
      company: "CrowdSec",
      name: "SOC & sinyal katmanı",
      replaces: "CrowdSec bouncer + ayrı konsol + manuel kanıt",
      body: "CrowdSec parçalı mimarisine gerek yok. Prometheus, SOC timeline, 75 test, 14 kanıt dosyası, Telegram ops — tek panel.",
      metrics: ["75 test", "72h soak PASS", "14 kanıt dosyası"],
    },
  ],
  metrics_title: "Sitede gösterilen tüm sayısal değerler",
  metrics_sub:
    "Kaynak: competitive-proof.json · bench-ban-latency.json · bench-vs-modsec.json · fp-report.json · soak-report.json",
  metric_groups: {
    "Ban & gecikme": "Ban & gecikme",
    "WAF & recall": "WAF & recall",
    Throughput: "Throughput",
    "Stabilite & kanıt": "Stabilite & kanıt",
    "Erişim & kurulum": "Erişim & kurulum",
  },
  why_title: "Neden Log Guardian?",
  why_lead: "Rakipler parça parça — biz tek zincirde ölçülebilir kanıt sunuyoruz.",
  why_cards: [
    {
      title: "Tek hat",
      body: "nginx log → OWASP CRS → ~17 ms kernel ban. Fail2ban + ModSec + script yığını yok.",
    },
    {
      title: "Şeffaf kanıt",
      body: "competitive-proof PDF, 75 test, 72h soak — rakiplerde yok veya parçalı.",
    },
    {
      title: "MIT · Türkiye",
      body: "Açık kaynak, Türkçe doküman, self-hosted — vendor lock-in yok.",
    },
    {
      title: "Dürüst sınır",
      body: "ModSec inline EPS'te değiliz; L3/L4'ü CDN absorb eder. Origin'de entegrasyon + hız.",
    },
    {
      title: "3'ü 1 arada",
      body: "Fail2ban, ModSecurity, CrowdSec ayrı ayrı değil — ban + WAF + SOC tek üründe.",
    },
    {
      title: "Kernel hızı",
      body: "~17 ms medyan ban — Fail2ban/CrowdSec saniye–dakika ölçeğinde; ölçülmüş 5 örnek.",
    },
    {
      title: "Dağıtık saldırı",
      body: "JA3 cluster %100 recall — 80 IP canlı test; IP başına ban + cluster tespiti.",
    },
    {
      title: "Operatör akışı",
      body: "Telegram alert + tek-tık ack, SOC timeline, tenant metrik — kurulum sonrası :8443.",
    },
  ],
  stats: [
    { value: "75", label: "Otomatik test" },
    { value: "72h", label: "Soak PASS" },
    { value: "~17ms", label: "Kernel ban" },
    { value: "54", label: "Ülke erişimi" },
  ],
  metric_labels: {},
};

const EN: SectionCopy = {
  hero_badge: "//:LOG→BAN · SYSTEM ONLINE",
  hero_bullets: ["~17 ms kernel ban", "75 automated tests", "72h soak PASS"],
  hero_tagline: "nginx access log → WAF/CRS → kernel ban · single chain · self-hosted",
  hero_chips: ["open source · MIT", "72h soak PASS"],
  hero_reach: "2.3k+ visits · 4k+ pages · 54 countries · proof PDF",
  hero_praise_lead:
    "Turkey's measurable-proof, single-chain self-hosted security stack — rivals are piecemeal, we are all-in-one.",
  hero_praise_highlights: [
    "~17 ms median ban — measured 5 samples vs Fail2ban's hours-long iptables path",
    "100% real attack recall + 100% OWASP CRS parity — 121 rules, 1500-line corpus",
    "0.2% false positive — 1 alarm in 500 benign lines; rivals higher/medium",
    "72h VM soak — 864 samples, 0 errors; no automatic proof in rivals",
    "75 automated tests + 14-file evidence pack — PDF/JSON, reproducible",
    "3 tool stacks in one product: Fail2ban + ModSecurity + CrowdSec — ~15 min setup",
  ],
  hero_praise_bold: [
    { v: "~17ms", l: "kernel ban" },
    { v: "100", l: "recall" },
    { v: "75", l: "auto tests" },
    { v: "3→1", l: "tool merge" },
  ],
  hero_side_title:
    "Fail2ban + ModSecurity + CrowdSec separately? One product, one proof, one install.",
  hero_side_body:
    "Single chain from nginx access log line to ipset ban: parser, OWASP CRS/WAF evaluation and ~17 ms kernel ban. Rivals offer piecemeal architecture — we merge in one chain with measured, reproducible PDF/JSON proof. Built in Turkey, MIT open source, fully self-hosted.",
  hero_cta_setup: "15 min setup",
  hero_cta_github: "GitHub source",
  hero_cta_tests: "See 75 tests",
  about_eyebrow: "//:About",
  about_title: "What is Linux Log Guardian?",
  about_intro:
    "An open-source (MIT) self-hosted security product built in Turkey. Reads nginx access logs in real time, evaluates with OWASP CRS/WAF and bans attacker IPs at kernel level via ipset in ~17 ms — single chain, no third-party cloud.",
  about_paragraphs: [
    "Fail2ban only bans, ModSecurity WAF is a separate module, CrowdSec needs a piecemeal stack. Log Guardian merges them: log line → parser → CRS/WAF (PCRE2 JIT) → ban pipeline policy + tenant → ipset/XDP kernel → Prometheus metrics and dashboard SOC timeline.",
    "Results are measurable and reproducible: 100% recall on real attack corpus, 100% OWASP CRS parity, 0.2% false positive, ~17 ms median ban latency and 0 errors over 864 samples in 72h VM soak.",
    "This site is a public landing and download page — static content. The software runs on your Linux server; your data stays with you.",
  ],
  about_highlights: [
    { k: "Single chain", v: "log → WAF → kernel ban, one tool" },
    { k: "~17 ms", v: "median latency log line to ipset ban" },
    { k: "100% recall", v: "real attack corpus + CRS parity" },
    { k: "0.2% FP", v: "1 alarm in 500 benign lines" },
    { k: "72h soak", v: "864 samples, 0 errors (VM)" },
    { k: "MIT · TR", v: "open source, Turkish docs, self-hosted" },
  ],
  pkg_title: "3-in-1 — no separate installs",
  pkg_hero:
    "Instead of installing Fail2ban, ModSecurity and CrowdSec separately, Log Guardian merges all three in one self-hosted package.",
  pkg_tagline: "Three rival tools · one chain · measured proof",
  pkg_instead: "Instead of standalone install → included in Log Guardian",
  pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 single chain",
  pkg_detail: "Full story → /paketler",
  merge: [
    {
      company: "Fail2ban",
      name: "Ban engine",
      replaces: "Fail2ban + iptables scripts",
      body: "No separate Fail2ban. Log line to ipset/XDP kernel ban ~17 ms — policy, tenant, FP trust in one pipeline.",
      metrics: ["~17 ms median", "ipset + XDP", "0 fail (5 min)"],
    },
    {
      company: "ModSecurity",
      name: "WAF / CRS layer",
      replaces: "ModSecurity + separate nginx integration",
      body: "No separate ModSecurity module. OWASP CRS 121 rules, PCRE2 JIT — single pass from nginx log line.",
      metrics: ["100% CRS parity", "100% recall", "0.2% FP"],
    },
    {
      company: "CrowdSec",
      name: "SOC & signal layer",
      replaces: "CrowdSec bouncer + separate console + manual proof",
      body: "No CrowdSec piecemeal stack. Prometheus, SOC timeline, 75 tests, 14 evidence files, Telegram ops — one panel.",
      metrics: ["75 tests", "72h soak PASS", "14 evidence files"],
    },
  ],
  metrics_title: "All numerical values on this site",
  metrics_sub:
    "Source: competitive-proof.json · bench-ban-latency.json · bench-vs-modsec.json · fp-report.json · soak-report.json",
  metric_groups: {
    "Ban & gecikme": "Ban & latency",
    "WAF & recall": "WAF & recall",
    Throughput: "Throughput",
    "Stabilite & kanıt": "Stability & proof",
    "Erişim & kurulum": "Reach & setup",
  },
  why_title: "Why Log Guardian?",
  why_lead: "Rivals are piecemeal — we offer measurable proof in a single chain.",
  why_cards: TR.why_cards.map((c, i) => ({
    title: ["Single chain", "Transparent proof", "MIT · Turkey", "Honest limits", "3-in-1", "Kernel speed", "Distributed attacks", "Operator flow"][i],
    body: [
      "nginx log → OWASP CRS → ~17 ms kernel ban. No Fail2ban + ModSec + script pile.",
      "competitive-proof PDF, 75 tests, 72h soak — missing or fragmented in rivals.",
      "Open source, Turkish docs, self-hosted — no vendor lock-in.",
      "Not inline ModSec EPS; CDN absorbs L3/L4. Origin integration + speed.",
      "Fail2ban, ModSecurity, CrowdSec not separate — ban + WAF + SOC in one product.",
      "~17 ms median ban — Fail2ban/CrowdSec in seconds–minutes; 5 measured samples.",
      "JA3 cluster 100% recall — 80 IP live test; per-IP ban + cluster detection.",
      "Telegram alert + one-click ack, SOC timeline, tenant metrics — :8443 after install.",
    ][i],
  })),
  stats: [
    { value: "75", label: "Automated tests" },
    { value: "72h", label: "Soak PASS" },
    { value: "~17ms", label: "Kernel ban" },
    { value: "54", label: "Countries" },
  ],
  metric_labels: {
    "Medyan ban gecikmesi": "Median ban latency",
    "P90 ban gecikmesi": "P90 ban latency",
    "Min örnek (5 ölçüm)": "Min sample (5 runs)",
    "Max örnek (5 ölçüm)": "Max sample (5 runs)",
    "Laptop hedef (PASS)": "Laptop target (PASS)",
    "Prod hedef": "Prod target",
    "Gerçek saldırı recall": "Real attack recall",
    "OWASP CRS parity": "OWASP CRS parity",
    "CRS kural sayısı": "CRS rule count",
    "False positive oranı": "False positive rate",
    "Benign test satırı": "Benign test lines",
    "Bench corpus satırı": "Bench corpus lines",
    "Log Guardian replay": "Log Guardian replay",
    "ModSec CRS replay": "ModSec CRS replay",
    "Satır başı latency (LG)": "Per-line latency (LG)",
    "Bench worker sayısı": "Bench worker count",
    "Otomatik test": "Automated tests",
    "VM soak süresi": "VM soak duration",
    "Soak örnek sayısı": "Soak sample count",
    "Soak hata": "Soak errors",
    "Kanıt dosyası": "Evidence files",
    "JA3 cluster test": "JA3 cluster test",
    "Site ziyareti": "Site visits",
    "Sayfa görüntüleme": "Page views",
    "Ülke erişimi": "Country reach",
    "Core kurulum süresi": "Core setup time",
    "Prometheus port": "Prometheus port",
    "Dashboard port (prod)": "Dashboard port (prod)",
  },
};

const TURKIC: Locale[] = [
  "tr", "az", "kk", "uz", "ky", "tk", "ug", "tt", "ba", "cv", "crh", "gag", "sah",
];

/**
 * Per-locale overrides for the high-visibility strings (headings, taglines,
 * CTAs, why-card titles, stat labels). Long descriptive paragraphs fall back
 * to the base language (Turkish for Turkic locales, English otherwise).
 */
type ShortOverride = Partial<
  Omit<SectionCopy, "merge" | "why_cards" | "stats" | "metric_groups" | "metric_labels">
> & {
  why_titles?: string[];
  stats_labels?: string[];
};

const SHORT_OVERRIDES: Partial<Record<Locale, ShortOverride>> = {
  de: {
    hero_tagline: "nginx access log → WAF/CRS → Kernel-Ban · eine Kette · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec getrennt? Ein Produkt, ein Nachweis, eine Installation.",
    hero_praise_lead:
      "Der messbar belegte, single-chain self-hosted Security-Stack aus der Türkei — Konkurrenten stückweise, wir alles in einem.",
    hero_cta_setup: "15 Min Setup",
    hero_cta_github: "GitHub-Quelle",
    hero_cta_tests: "75 Tests ansehen",
    about_title: "Was ist Linux Log Guardian?",
    about_intro:
      "Ein Open-Source (MIT), self-hosted Sicherheitsprodukt aus der Türkei. Liest nginx-Access-Logs in Echtzeit, wertet mit OWASP CRS/WAF aus und bannt Angreifer-IPs auf Kernel-Ebene per ipset in ~17 ms — eine Kette, keine Drittanbieter-Cloud.",
    pkg_title: "3-in-1 — keine getrennten Installationen",
    pkg_tagline: "Drei konkurrierende Tools · eine Kette · gemessener Nachweis",
    pkg_instead: "Statt Einzelinstallation → in Log Guardian enthalten",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 einzige Kette",
    pkg_detail: "Ganze Story → /paketler",
    metrics_title: "Alle Zahlenwerte auf dieser Seite",
    why_title: "Warum Log Guardian?",
    why_lead: "Konkurrenten sind Stückwerk — wir liefern messbaren Nachweis in einer Kette.",
    why_titles: ["Eine Kette", "Transparenter Nachweis", "MIT · Türkei", "Ehrliche Grenzen", "3-in-1", "Kernel-Tempo", "Verteilte Angriffe", "Betreiber-Flow"],
    stats_labels: ["Automatische Tests", "Soak PASS", "Kernel-Ban", "Länder"],
  },
  fr: {
    hero_tagline: "nginx access log → WAF/CRS → ban noyau · une seule chaîne · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec séparément ? Un produit, une preuve, une installation.",
    hero_praise_lead:
      "La stack de sécurité self-hosted à preuve mesurable et chaîne unique de la Turquie — les rivaux fragmentés, nous tout-en-un.",
    hero_cta_setup: "Installation 15 min",
    hero_cta_github: "Source GitHub",
    hero_cta_tests: "Voir 75 tests",
    about_title: "Qu'est-ce que Linux Log Guardian ?",
    about_intro:
      "Un produit de sécurité open source (MIT), auto-hébergé, conçu en Turquie. Lit les logs d'accès nginx en temps réel, évalue avec OWASP CRS/WAF et bannit les IP attaquantes au niveau noyau via ipset en ~17 ms — une seule chaîne, sans cloud tiers.",
    pkg_title: "3-en-1 — aucune installation séparée",
    pkg_tagline: "Trois outils rivaux · une chaîne · preuve mesurée",
    pkg_instead: "Au lieu d'une installation séparée → inclus dans Log Guardian",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 seule chaîne",
    pkg_detail: "Détails → /paketler",
    metrics_title: "Toutes les valeurs chiffrées de ce site",
    why_title: "Pourquoi Log Guardian ?",
    why_lead: "Les rivaux sont fragmentés — nous offrons une preuve mesurable en une seule chaîne.",
    why_titles: ["Chaîne unique", "Preuve transparente", "MIT · Turquie", "Limites honnêtes", "3-en-1", "Vitesse noyau", "Attaques distribuées", "Flux opérateur"],
    stats_labels: ["Tests automatiques", "Soak PASS", "Ban noyau", "Pays"],
  },
  es: {
    hero_tagline: "nginx access log → WAF/CRS → ban de kernel · una sola cadena · self-hosted",
    hero_side_title:
      "¿Fail2ban + ModSecurity + CrowdSec por separado? Un producto, una prueba, una instalación.",
    hero_praise_lead:
      "El stack de seguridad autoalojado de cadena única y prueba medible de Turquía — los rivales fragmentados, nosotros todo en uno.",
    hero_cta_setup: "Instalación 15 min",
    hero_cta_github: "Código GitHub",
    hero_cta_tests: "Ver 75 pruebas",
    about_title: "¿Qué es Linux Log Guardian?",
    about_intro:
      "Un producto de seguridad de código abierto (MIT), autoalojado, desarrollado en Turquía. Lee los logs de acceso de nginx en tiempo real, evalúa con OWASP CRS/WAF y banea las IP atacantes a nivel de kernel con ipset en ~17 ms — una sola cadena, sin nube de terceros.",
    pkg_title: "3 en 1 — sin instalaciones separadas",
    pkg_tagline: "Tres herramientas rivales · una cadena · prueba medida",
    pkg_instead: "En vez de instalación por separado → incluido en Log Guardian",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 sola cadena",
    pkg_detail: "Detalles → /paketler",
    metrics_title: "Todos los valores numéricos de este sitio",
    why_title: "¿Por qué Log Guardian?",
    why_lead: "Los rivales son fragmentados — ofrecemos prueba medible en una sola cadena.",
    why_titles: ["Cadena única", "Prueba transparente", "MIT · Turquía", "Límites honestos", "3 en 1", "Velocidad de kernel", "Ataques distribuidos", "Flujo de operador"],
    stats_labels: ["Pruebas automáticas", "Soak PASS", "Ban de kernel", "Países"],
  },
  ru: {
    hero_tagline: "nginx access log → WAF/CRS → бан на уровне ядра · одна цепочка · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec по отдельности? Один продукт, одно доказательство, одна установка.",
    hero_praise_lead:
      "Турецкий self-hosted стек безопасности с измеримым доказательством и единой цепочкой — конкуренты по частям, мы всё в одном.",
    hero_cta_setup: "Установка 15 мин",
    hero_cta_github: "Исходники GitHub",
    hero_cta_tests: "75 тестов",
    about_title: "Что такое Linux Log Guardian?",
    about_intro:
      "Открытый (MIT), self-hosted продукт безопасности, разработанный в Турции. Читает access-логи nginx в реальном времени, оценивает через OWASP CRS/WAF и банит IP атакующих на уровне ядра через ipset за ~17 мс — одна цепочка, без стороннего облака.",
    pkg_title: "3-в-1 — без отдельных установок",
    pkg_tagline: "Три конкурента · одна цепочка · измеренное доказательство",
    pkg_instead: "Вместо отдельной установки → включено в Log Guardian",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 единая цепочка",
    pkg_detail: "Подробнее → /paketler",
    metrics_title: "Все числовые значения на этом сайте",
    why_title: "Почему Log Guardian?",
    why_lead: "Конкуренты фрагментарны — мы даём измеримое доказательство в одной цепочке.",
    why_titles: ["Одна цепочка", "Прозрачное доказательство", "MIT · Турция", "Честные границы", "3-в-1", "Скорость ядра", "Распределённые атаки", "Поток оператора"],
    stats_labels: ["Автотесты", "Soak PASS", "Бан ядра", "Страны"],
  },
  pt: {
    hero_tagline: "nginx access log → WAF/CRS → ban de kernel · uma só cadeia · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec separados? Um produto, uma prova, uma instalação.",
    hero_praise_lead:
      "A stack de segurança self-hosted de cadeia única e prova mensurável da Turquia — rivais fragmentados, nós tudo-em-um.",
    hero_cta_setup: "Instalação 15 min",
    hero_cta_github: "Código GitHub",
    hero_cta_tests: "Ver 75 testes",
    about_title: "O que é o Linux Log Guardian?",
    about_intro:
      "Um produto de segurança open source (MIT), self-hosted, feito na Turquia. Lê logs de acesso do nginx em tempo real, avalia com OWASP CRS/WAF e bane IPs atacantes ao nível do kernel via ipset em ~17 ms — uma só cadeia, sem nuvem de terceiros.",
    pkg_title: "3 em 1 — sem instalações separadas",
    pkg_tagline: "Três ferramentas rivais · uma cadeia · prova medida",
    pkg_instead: "Em vez de instalação separada → incluído no Log Guardian",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 única cadeia",
    pkg_detail: "Detalhes → /paketler",
    metrics_title: "Todos os valores numéricos deste site",
    why_title: "Por que Log Guardian?",
    why_lead: "Os rivais são fragmentados — oferecemos prova mensurável numa só cadeia.",
    why_titles: ["Cadeia única", "Prova transparente", "MIT · Turquia", "Limites honestos", "3 em 1", "Velocidade de kernel", "Ataques distribuídos", "Fluxo do operador"],
    stats_labels: ["Testes automáticos", "Soak PASS", "Ban de kernel", "Países"],
  },
  nl: {
    hero_tagline: "nginx access log → WAF/CRS → kernel-ban · één keten · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec apart? Eén product, één bewijs, één installatie.",
    hero_praise_lead:
      "Turkije's meetbaar bewezen, single-chain self-hosted security-stack — concurrenten versnipperd, wij alles-in-één.",
    hero_cta_setup: "15 min installatie",
    hero_cta_github: "GitHub-broncode",
    hero_cta_tests: "Bekijk 75 tests",
    about_title: "Wat is Linux Log Guardian?",
    about_intro:
      "Een open-source (MIT), self-hosted beveiligingsproduct uit Turkije. Leest nginx-accesslogs in realtime, evalueert met OWASP CRS/WAF en bant aanvaller-IP's op kernelniveau via ipset in ~17 ms — één keten, zonder externe cloud.",
    pkg_title: "3-in-1 — geen aparte installaties",
    pkg_tagline: "Drie concurrerende tools · één keten · gemeten bewijs",
    pkg_instead: "In plaats van aparte installatie → inbegrepen in Log Guardian",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 enkele keten",
    pkg_detail: "Details → /paketler",
    metrics_title: "Alle numerieke waarden op deze site",
    why_title: "Waarom Log Guardian?",
    why_lead: "Concurrenten zijn versnipperd — wij bieden meetbaar bewijs in één keten.",
    why_titles: ["Eén keten", "Transparant bewijs", "MIT · Turkije", "Eerlijke grenzen", "3-in-1", "Kernelsnelheid", "Gedistribueerde aanvallen", "Operatorflow"],
    stats_labels: ["Automatische tests", "Soak PASS", "Kernel-ban", "Landen"],
  },
  zh: {
    hero_tagline: "nginx 访问日志 → WAF/CRS → 内核封禁 · 单一链路 · 自托管",
    hero_side_title: "还在分别部署 Fail2ban + ModSecurity + CrowdSec？一个产品、一份证据、一次安装。",
    hero_praise_lead:
      "土耳其打造的可衡量证据、单链路自托管安全栈——竞品零散，我们一体化。",
    hero_cta_setup: "15分钟安装",
    hero_cta_github: "GitHub 源码",
    hero_cta_tests: "查看 75 项测试",
    about_title: "什么是 Linux Log Guardian？",
    about_intro:
      "一款在土耳其开发的开源（MIT）自托管安全产品。实时读取 nginx 访问日志，使用 OWASP CRS/WAF 评估，并通过 ipset 在内核层约 17 毫秒封禁攻击者 IP——单一链路，无第三方云。",
    pkg_title: "三合一 — 无需分别安装",
    pkg_tagline: "三个竞品 · 一条链路 · 实测证据",
    pkg_instead: "无需单独安装 → 已包含在 Log Guardian 中",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 条统一链路",
    pkg_detail: "详情 → /paketler",
    metrics_title: "本站全部数值",
    why_title: "为什么选择 Log Guardian？",
    why_lead: "竞品各自为政——我们在单一链路中提供可衡量的证据。",
    why_titles: ["单一链路", "透明证据", "MIT · 土耳其", "诚实边界", "三合一", "内核速度", "分布式攻击", "运维流程"],
    stats_labels: ["自动化测试", "Soak 通过", "内核封禁", "覆盖国家"],
  },
  ja: {
    hero_tagline: "nginx アクセスログ → WAF/CRS → カーネルBAN · 単一チェーン · セルフホスト",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec を個別に？ 一つの製品、一つの証拠、一度の導入。",
    hero_praise_lead:
      "トルコ発、測定可能な証拠と単一チェーンのセルフホスト型セキュリティスタック——競合は断片的、私たちはオールインワン。",
    hero_cta_setup: "15分で導入",
    hero_cta_github: "GitHub ソース",
    hero_cta_tests: "75テストを見る",
    about_title: "Linux Log Guardian とは？",
    about_intro:
      "トルコで開発されたオープンソース（MIT）のセルフホスト型セキュリティ製品。nginx アクセスログをリアルタイムに読み取り、OWASP CRS/WAF で評価し、攻撃者 IP を ipset でカーネルレベルに約17msでBAN——単一チェーン、サードパーティクラウド不要。",
    pkg_title: "3-in-1 — 個別インストール不要",
    pkg_tagline: "3つの競合ツール · 単一チェーン · 実測の証拠",
    pkg_instead: "個別導入の代わりに → Log Guardian に同梱",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1本の統一チェーン",
    pkg_detail: "詳細 → /paketler",
    metrics_title: "本サイトの全数値",
    why_title: "なぜ Log Guardian か？",
    why_lead: "競合は断片的——私たちは単一チェーンで測定可能な証拠を提供します。",
    why_titles: ["単一チェーン", "透明な証拠", "MIT · トルコ", "正直な限界", "3-in-1", "カーネル速度", "分散攻撃", "運用フロー"],
    stats_labels: ["自動テスト", "Soak 合格", "カーネルBAN", "対応国"],
  },
  ko: {
    hero_tagline: "nginx 액세스 로그 → WAF/CRS → 커널 밴 · 단일 체인 · 셀프호스팅",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec 따로따로? 하나의 제품, 하나의 증거, 한 번의 설치.",
    hero_praise_lead:
      "튀르키예의 측정 가능한 증거, 단일 체인 셀프호스팅 보안 스택 — 경쟁사는 조각조각, 우리는 올인원.",
    hero_cta_setup: "15분 설치",
    hero_cta_github: "GitHub 소스",
    hero_cta_tests: "75개 테스트 보기",
    about_title: "Linux Log Guardian이란?",
    about_intro:
      "튀르키예에서 개발된 오픈소스(MIT) 셀프호스팅 보안 제품입니다. nginx 액세스 로그를 실시간으로 읽고 OWASP CRS/WAF로 평가하여 공격자 IP를 ipset으로 커널 수준에서 약 17ms 만에 차단합니다 — 단일 체인, 제3자 클라우드 불필요.",
    pkg_title: "3-in-1 — 개별 설치 불필요",
    pkg_tagline: "세 가지 경쟁 도구 · 단일 체인 · 측정된 증거",
    pkg_instead: "개별 설치 대신 → Log Guardian에 포함",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1개의 통합 체인",
    pkg_detail: "자세히 → /paketler",
    metrics_title: "이 사이트의 모든 수치",
    why_title: "왜 Log Guardian인가?",
    why_lead: "경쟁 제품은 조각조각 — 우리는 단일 체인에서 측정 가능한 증거를 제공합니다.",
    why_titles: ["단일 체인", "투명한 증거", "MIT · 튀르키예", "정직한 한계", "3-in-1", "커널 속도", "분산 공격", "운영 플로우"],
    stats_labels: ["자동 테스트", "Soak 통과", "커널 밴", "국가"],
  },
  ar: {
    hero_tagline: "سجل وصول nginx ← WAF/CRS ← حظر على مستوى النواة · سلسلة واحدة · استضافة ذاتية",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec بشكل منفصل؟ منتج واحد، دليل واحد، تثبيت واحد.",
    hero_praise_lead:
      "منظومة أمن ذاتية الاستضافة من تركيا بسلسلة واحدة ودليل قابل للقياس — المنافسون مجزّأون، ونحن الكل في واحد.",
    hero_cta_setup: "تثبيت 15 دقيقة",
    hero_cta_github: "مصدر GitHub",
    hero_cta_tests: "شاهد 75 اختباراً",
    about_title: "ما هو Linux Log Guardian؟",
    about_intro:
      "منتج أمني مفتوح المصدر (MIT) ذاتي الاستضافة طُوِّر في تركيا. يقرأ سجلات وصول nginx فورياً، ويقيّمها عبر OWASP CRS/WAF، ويحظر عناوين IP المهاجمة على مستوى النواة عبر ipset في نحو 17 مللي ثانية — سلسلة واحدة، بدون سحابة طرف ثالث.",
    pkg_title: "3 في 1 — دون تثبيتات منفصلة",
    pkg_tagline: "ثلاث أدوات منافسة · سلسلة واحدة · دليل مقاس",
    pkg_instead: "بدلاً من التثبيت المنفصل ← مضمّن في Log Guardian",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec ← سلسلة واحدة",
    pkg_detail: "التفاصيل ← /paketler",
    metrics_title: "جميع القيم الرقمية في هذا الموقع",
    why_title: "لماذا Log Guardian؟",
    why_lead: "المنافسون مجزّأون — نقدّم دليلاً قابلاً للقياس في سلسلة واحدة.",
    why_titles: ["سلسلة واحدة", "دليل شفّاف", "MIT · تركيا", "حدود صادقة", "3 في 1", "سرعة النواة", "هجمات موزّعة", "سير عمل المشغّل"],
    stats_labels: ["اختبارات آلية", "اجتياز Soak", "حظر النواة", "دول"],
  },
  az: {
    hero_tagline: "nginx giriş logu → WAF/CRS → kernel ban · tək zəncir · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec ayrı-ayrı? Bir məhsul, bir sübut, bir quraşdırma.",
    hero_praise_lead:
      "Türkiyənin ölçülə bilən sübutlu, tək zəncir self-hosted təhlükəsizlik yığını — rəqiblər parça-parça, biz hamısı bir arada.",
    hero_cta_setup: "15 dəq quraşdırma",
    hero_cta_github: "GitHub mənbə",
    hero_cta_tests: "75 testə bax",
    about_title: "Linux Log Guardian nədir?",
    about_intro:
      "Türkiyədə hazırlanmış tam açıq mənbəli (MIT) self-hosted təhlükəsizlik məhsulu. nginx giriş loglarını real vaxtda oxuyur, OWASP CRS/WAF ilə qiymətləndirir və hücumçu IP-ni ipset ilə kernel səviyyəsində ~17 ms-də banlayır — tək zəncir, üçüncü tərəf buludu olmadan.",
    pkg_title: "3-ü 1-də — ayrı-ayrı quraşdırma yoxdur",
    pkg_tagline: "Üç rəqib alət · tək zəncir · ölçülmüş sübut",
    pkg_instead: "Ayrıca quraşdırmaq əvəzinə → Log Guardian-a daxildir",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 tək zəncir",
    pkg_detail: "Ətraflı → /paketler",
    metrics_title: "Bu saytdakı bütün rəqəmsal dəyərlər",
    why_title: "Niyə Log Guardian?",
    why_lead: "Rəqiblər parça-parça — biz tək zəncirdə ölçülə bilən sübut təqdim edirik.",
    why_titles: ["Tək zəncir", "Şəffaf sübut", "MIT · Türkiyə", "Dürüst hədlər", "3-ü 1-də", "Kernel sürəti", "Paylanmış hücumlar", "Operator axını"],
    stats_labels: ["Avtomatik test", "Soak PASS", "Kernel ban", "Ölkə"],
  },
  kk: {
    hero_tagline: "nginx кіру журналы → WAF/CRS → kernel ban · бір тізбек · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec бөлек пе? Бір өнім, бір дәлел, бір орнату.",
    hero_praise_lead:
      "Түркияның өлшенетін дәлелді, бір тізбекті self-hosted қауіпсіздік стегі — бәсекелестер бөлшек, біз бәрі бір жерде.",
    hero_cta_setup: "15 мин орнату",
    hero_cta_github: "GitHub бастапқы коды",
    hero_cta_tests: "75 тестті көру",
    about_title: "Linux Log Guardian деген не?",
    about_intro:
      "Түркияда жасалған ашық кодты (MIT) self-hosted қауіпсіздік өнімі. nginx кіру журналдарын нақты уақытта оқиды, OWASP CRS/WAF арқылы бағалайды және шабуылшы IP-ді ipset арқылы ядро деңгейінде ~17 мс-та бұғаттайды — бір тізбек, үшінші тарап бұлтысыз.",
    pkg_title: "3-і 1-де — бөлек орнату жоқ",
    pkg_tagline: "Үш бәсекелес құрал · бір тізбек · өлшенген дәлел",
    pkg_instead: "Бөлек орнатудың орнына → Log Guardian ішінде",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 біртұтас тізбек",
    pkg_detail: "Толығырақ → /paketler",
    metrics_title: "Осы сайттағы барлық сандық мәндер",
    why_title: "Неге Log Guardian?",
    why_lead: "Бәсекелестер бөлшектелген — біз бір тізбекте өлшенетін дәлел ұсынамыз.",
    why_titles: ["Бір тізбек", "Ашық дәлел", "MIT · Түркия", "Адал шектер", "3-і 1-де", "Ядро жылдамдығы", "Таратылған шабуылдар", "Оператор ағыны"],
    stats_labels: ["Авто тесттер", "Soak PASS", "Kernel ban", "Елдер"],
  },
  uz: {
    hero_tagline: "nginx kirish logi → WAF/CRS → kernel ban · yagona zanjir · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec alohida-alohidami? Bitta mahsulot, bitta dalil, bitta o'rnatish.",
    hero_praise_lead:
      "Turkiyaning o'lchanadigan dalilli, yagona zanjirli self-hosted xavfsizlik steki — raqiblar bo'lak, biz hammasi bir joyda.",
    hero_cta_setup: "15 daq o'rnatish",
    hero_cta_github: "GitHub manba",
    hero_cta_tests: "75 testni ko'rish",
    about_title: "Linux Log Guardian nima?",
    about_intro:
      "Turkiyada ishlab chiqilgan ochiq kodli (MIT) self-hosted xavfsizlik mahsuloti. nginx kirish loglarini real vaqtda o'qiydi, OWASP CRS/WAF bilan baholaydi va hujumchi IP'ni ipset orqali yadro darajasida ~17 ms da bloklaydi — yagona zanjir, uchinchi tomon buluti holda.",
    pkg_title: "3 tasi 1 da — alohida o'rnatish yo'q",
    pkg_tagline: "Uchta raqib vosita · yagona zanjir · o'lchangan dalil",
    pkg_instead: "Alohida o'rnatish o'rniga → Log Guardian tarkibida",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 yagona zanjir",
    pkg_detail: "Batafsil → /paketler",
    metrics_title: "Ushbu saytdagi barcha raqamli qiymatlar",
    why_title: "Nega Log Guardian?",
    why_lead: "Raqiblar bo'lak-bo'lak — biz yagona zanjirda o'lchanadigan dalil taqdim etamiz.",
    why_titles: ["Yagona zanjir", "Shaffof dalil", "MIT · Turkiya", "Halol chegaralar", "3 tasi 1 da", "Yadro tezligi", "Taqsimlangan hujumlar", "Operator oqimi"],
    stats_labels: ["Avto testlar", "Soak PASS", "Kernel ban", "Davlatlar"],
  },
  ky: {
    hero_tagline: "nginx кирүү логу → WAF/CRS → kernel ban · бирдиктүү чынжыр · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec өзүнчөбү? Бир продукт, бир далил, бир орнотуу.",
    hero_praise_lead:
      "Түркиянын өлчөнгөн далилдүү, бирдиктүү чынжырлуу self-hosted коопсуздук стеги — атаандаштар бөлүк, биз баары бир жерде.",
    hero_cta_setup: "15 мүн орнотуу",
    hero_cta_github: "GitHub булагы",
    hero_cta_tests: "75 тестти көрүү",
    about_title: "Linux Log Guardian деген эмне?",
    about_intro:
      "Түркияда иштелип чыккан ачык коддуу (MIT) self-hosted коопсуздук продукту. nginx кирүү логдорун реалдуу убакытта окуйт, OWASP CRS/WAF менен баалайт жана чабуулчу IP'ни ipset аркылуу ядро деңгээлинде ~17 мс ичинде бөгөттөйт — бирдиктүү чынжыр, үчүнчү тараптын булутусуз.",
    pkg_title: "3өө 1де — өзүнчө орнотуу жок",
    pkg_tagline: "Үч атаандаш курал · бир чынжыр · өлчөнгөн далил",
    pkg_instead: "Өзүнчө орнотуунун ордуна → Log Guardian ичинде",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 бирдиктүү чынжыр",
    pkg_detail: "Толук → /paketler",
    metrics_title: "Бул сайттагы бардык сандык маанилер",
    why_title: "Эмне үчүн Log Guardian?",
    why_lead: "Атаандаштар бөлүк-бөлүк — биз бир чынжырда өлчөнгөн далил беребиз.",
    why_titles: ["Бирдиктүү чынжыр", "Ачык далил", "MIT · Түркия", "Чынчыл чектер", "3өө 1де", "Ядро ылдамдыгы", "Бөлүштүрүлгөн чабуулдар", "Оператор агымы"],
    stats_labels: ["Авто тесттер", "Soak PASS", "Kernel ban", "Өлкөлөр"],
  },
  tk: {
    hero_tagline: "nginx giriş logy → WAF/CRS → kernel ban · ýeke zynjyr · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec aýratynmy? Bir önüm, bir subutnama, bir gurnama.",
    hero_praise_lead:
      "Türkiýäniň ölçäp bolýan subutnamaly, ýeke zynjyrly self-hosted howpsuzlyk stegi — bäsdeşler bölek, biz hemmesi bir ýerde.",
    hero_cta_setup: "15 min gurnama",
    hero_cta_github: "GitHub çeşme",
    hero_cta_tests: "75 testi gör",
    about_title: "Linux Log Guardian näme?",
    about_intro:
      "Türkiýede işlenip düzülen açyk çeşmeli (MIT) self-hosted howpsuzlyk önümi. nginx giriş loglaryny hakyky wagtda okaýar, OWASP CRS/WAF bilen bahalandyrýar we hüjümçi IP-ni ipset arkaly ýadro derejesinde ~17 ms-da baglaýar — ýeke zynjyr, üçünji tarap bulutsyz.",
    pkg_title: "3-i 1-de — aýratyn gurnama ýok",
    pkg_tagline: "Üç bäsdeş gural · ýeke zynjyr · ölçelen subutnama",
    pkg_instead: "Aýratyn gurnamagyň ýerine → Log Guardian-da bar",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 ýeke zynjyr",
    pkg_detail: "Giňişleýin → /paketler",
    metrics_title: "Bu saýtdaky ähli san bahalary",
    why_title: "Näme üçin Log Guardian?",
    why_lead: "Bäsdeşler bölek-bölek — biz ýeke zynjyrda ölçäp bolýan subutnama hödürleýäris.",
    why_titles: ["Ýeke zynjyr", "Aýdyň subutnama", "MIT · Türkiýe", "Dogruçyl çäkler", "3-i 1-de", "Ýadro tizligi", "Paýlanan hüjümler", "Operator akymy"],
    stats_labels: ["Awto testler", "Soak PASS", "Kernel ban", "Ýurtlar"],
  },
  tt: {
    hero_tagline: "nginx керү журналы → WAF/CRS → kernel ban · бер чылбыр · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec аерыммы? Бер продукт, бер дәлил, бер урнаштыру.",
    hero_cta_setup: "15 мин урнаштыру",
    hero_cta_github: "GitHub чыганагы",
    hero_cta_tests: "75 тестны күрү",
    about_title: "Linux Log Guardian нәрсә ул?",
    pkg_title: "3не 1дә — аерым урнаштыру юк",
    pkg_tagline: "Өч көндәш корал · бер чылбыр · үлчәнгән дәлил",
    pkg_instead: "Аерым урнаштыру урынына → Log Guardian эчендә",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 бердәм чылбыр",
    pkg_detail: "Тулырак → /paketler",
    metrics_title: "Бу сайттагы барлык сан кыйммәтләре",
    why_title: "Ни өчен Log Guardian?",
    why_lead: "Көндәшләр өлеш-өлеш — без бер чылбырда үлчәнә торган дәлил тәкъдим итәбез.",
    why_titles: ["Бер чылбыр", "Ачык дәлил", "MIT · Төркия", "Намуслы чикләр", "3не 1дә", "Ядро тизлеге", "Таратылган һөҗүмнәр", "Оператор агымы"],
    stats_labels: ["Авто тестлар", "Soak PASS", "Kernel ban", "Илләр"],
  },
  ba: {
    hero_tagline: "nginx инеү журналы → WAF/CRS → kernel ban · бер сылбыр · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec айырыммы? Бер продукт, бер дәлил, бер урынлаштырыу.",
    hero_cta_setup: "15 мин урынлаштырыу",
    hero_cta_github: "GitHub сығанағы",
    hero_cta_tests: "75 тестты ҡарау",
    about_title: "Linux Log Guardian нимә ул?",
    pkg_title: "3-те 1-ҙә — айырым урынлаштырыу юҡ",
    pkg_tagline: "Өс көндәш ҡорал · бер сылбыр · үлсәнгән дәлил",
    pkg_instead: "Айырым урынлаштырыу урынына → Log Guardian эсендә",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 берҙәм сылбыр",
    pkg_detail: "Тулыраҡ → /paketler",
    metrics_title: "Был сайттағы бөтә һан ҡиммәттәре",
    why_title: "Ни өсөн Log Guardian?",
    why_lead: "Көндәштәр өлөш-өлөш — беҙ бер сылбырҙа үлсәнә торған дәлил тәҡдим итәбеҙ.",
    why_titles: ["Бер сылбыр", "Асыҡ дәлил", "MIT · Төркиә", "Намыҫлы сиктәр", "3-те 1-ҙә", "Ядро тиҙлеге", "Таратылған һөжүмдәр", "Оператор ағымы"],
    stats_labels: ["Авто тестар", "Soak PASS", "Kernel ban", "Илдәр"],
  },
  cv: {
    hero_tagline: "nginx кӗрӳ журналӗ → WAF/CRS → kernel ban · пӗр сӑнчӑр · self-hosted",
    hero_cta_setup: "15 мин вырнаҫтарни",
    hero_cta_github: "GitHub çӑлкуҫӗ",
    hero_cta_tests: "75 тест пӑх",
    about_title: "Linux Log Guardian мӗн вӑл?",
    pkg_title: "3-е 1-те — уйрӑм вырнаҫтарни ҫук",
    pkg_tagline: "Виҫӗ конкурент хатӗр · пӗр сӑнчӑр · виҫнӗ кӑтарту",
    pkg_instead: "Уйрӑм вырнаҫтарни вырӑнне → Log Guardian ӑшӗнче",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 пӗрлӗ сӑнчӑр",
    pkg_detail: "Тӗплӗнрех → /paketler",
    metrics_title: "Ку сайтри пур хисеп паллисем",
    why_title: "Мӗншӗн Log Guardian?",
    why_lead: "Конкурентсем татӑк-татӑк — эпир пӗр сӑнчӑрта виҫме пулакан кӑтарту паратпӑр.",
    why_titles: ["Пӗр сӑнчӑр", "Уҫӑ кӑтарту", "MIT · Турци", "Тӳрӗ чикӗсем", "3-е 1-те", "Ядро хӑвӑртлӑхӗ", "Сарӑлнӑ тапӑнусем", "Оператор юхӑмӗ"],
    stats_labels: ["Авто тест", "Soak PASS", "Kernel ban", "Ҫӗршывсем"],
  },
  ug: {
    hero_tagline: "nginx كىرىش خاتىرىسى → WAF/CRS → يادرو دەرىجىسىدە چەكلەش · بىرلا زەنجىر · ئۆز مۇلازىمېتىر",
    hero_cta_setup: "15 مىنۇت ئورنىتىش",
    hero_cta_github: "GitHub مەنبە",
    hero_cta_tests: "75 سىناقنى كۆرۈش",
    about_title: "Linux Log Guardian نېمە؟",
    pkg_title: "3 بىرگە — ئايرىم ئورنىتىش يوق",
    pkg_tagline: "ئۈچ رەقىب قورال · بىرلا زەنجىر · ئۆلچەنگەن ئىسپات",
    pkg_instead: "ئايرىم ئورنىتىشنىڭ ئورنىغا → Log Guardian ئىچىدە",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 بىرلا زەنجىر",
    pkg_detail: "تەپسىلاتى → /paketler",
    metrics_title: "بۇ بەتتىكى بارلىق سانلىق قىممەتلەر",
    why_title: "نېمە ئۈچۈن Log Guardian؟",
    why_lead: "رەقىبلەر پارچە-پارچە — بىز بىرلا زەنجىردە ئۆلچىگىلى بولىدىغان ئىسپات بېرىمىز.",
    why_titles: ["بىرلا زەنجىر", "ئوچۇق ئىسپات", "MIT · تۈركىيە", "سەمىمىي چەكلەر", "3 بىرگە", "يادرو تېزلىكى", "تارقاق ھۇجۇملار", "مەشغۇلات ئېقىمى"],
    stats_labels: ["ئاپتوماتىك سىناق", "Soak PASS", "يادرو چەكلەش", "دۆلەتلەر"],
  },
  crh: {
    hero_tagline: "nginx kirim logu → WAF/CRS → kernel ban · tek zıncır · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec ayrı-ayrımı? Bir mahsul, bir delil, bir qurulım.",
    hero_cta_setup: "15 daq qurulım",
    hero_cta_github: "GitHub menba",
    hero_cta_tests: "75 testni köster",
    about_title: "Linux Log Guardian nedir?",
    pkg_title: "3-ü 1-de — ayrı qurulım yoq",
    pkg_tagline: "Üç raqip alet · tek zıncır · ölçengen delil",
    pkg_instead: "Ayrı qurulım yerine → Log Guardian içinde",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 tek zıncır",
    pkg_detail: "Tafsilât → /paketler",
    metrics_title: "Bu saytdaki bütün sayı qıymetleri",
    why_title: "Niçün Log Guardian?",
    why_lead: "Raqipler parça-parça — biz tek zıncırda ölçele bilgen delil teklif etemiz.",
    why_titles: ["Tek zıncır", "Şeffaf delil", "MIT · Türkiye", "Doğru sıñırlar", "3-ü 1-de", "Kernel tezligi", "Dağıtıq hücumlar", "Operator aqımı"],
    stats_labels: ["Avto testler", "Soak PASS", "Kernel ban", "Memleketler"],
  },
  gag: {
    hero_tagline: "nginx giriş logu → WAF/CRS → kernel ban · tek zincir · self-hosted",
    hero_side_title:
      "Fail2ban + ModSecurity + CrowdSec ayırı-ayırı mı? Bir ürün, bir delil, bir kurma.",
    hero_cta_setup: "15 dak kurma",
    hero_cta_github: "GitHub kaynaa",
    hero_cta_tests: "75 testi gör",
    about_title: "Linux Log Guardian nedir?",
    pkg_title: "3'ü 1'dä — ayırı kurma yok",
    pkg_tagline: "Üç rakip alet · tek zincir · ölçülü delil",
    pkg_instead: "Ayırı kurma erinä → Log Guardian içindä",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 tek zincir",
    pkg_detail: "Detay → /paketler",
    metrics_title: "Bu saytta bütün sayı diişilmekleri",
    why_title: "Neçin Log Guardian?",
    why_lead: "Rakiplär parça-parça — biz tek zincirdä ölçülebilän delil verämiz.",
    why_titles: ["Tek zincir", "Açık delil", "MIT · Türkiye", "Dooru sınırlar", "3'ü 1'dä", "Kernel hızı", "Daalı saldırılar", "Operator akışı"],
    stats_labels: ["Avto testlär", "Soak PASS", "Kernel ban", "Devletlär"],
  },
  sah: {
    hero_tagline: "nginx киирии сурунаала → WAF/CRS → kernel ban · биир сиэп · self-hosted",
    hero_cta_setup: "15 мүн олохтооһун",
    hero_cta_github: "GitHub төрдө",
    hero_cta_tests: "75 туруору көр",
    about_title: "Linux Log Guardian диэн тугуй?",
    pkg_title: "3 биирдэ — араас олохтооһун суох",
    pkg_tagline: "Үс күрэхтэһээччи тэрил · биир сиэп · кээмэйдэммит туоһу",
    pkg_instead: "Араас олохтооһун оннугар → Log Guardian иһигэр",
    pkg_footer: "Fail2ban + ModSecurity + CrowdSec → 1 биир сиэп",
    pkg_detail: "Сиһилии → /paketler",
    metrics_title: "Бу сайкка баар барыта ахсаан суолталара",
    why_title: "Тоҕо Log Guardian?",
    why_lead: "Күрэхтэһээччилэр аҥаардас — биһиги биир сиэпкэ кээмэйдэнэр туоһуну биэрэбит.",
    why_titles: ["Биир сиэп", "Ыраас туоһу", "MIT · Турция", "Кырдьык кыраныыс", "3 биирдэ", "Ядро түргэнэ", "Тарҕаммыт саба түһүүлэр", "Оператор сүрүгэ"],
    stats_labels: ["Авто туруору", "Soak PASS", "Kernel ban", "Дойдулар"],
  },
};

const SECTION_BODIES: Partial<Record<Locale, SectionBody>> = {
  de: {
    hero_side_body:
      "Eine Kette von der nginx-Access-Log-Zeile bis zum ipset-Ban: Parser, OWASP-CRS/WAF-Auswertung und ~17 ms Kernel-Ban. Rivalen bieten eine stückweise Architektur — wir vereinen alles in einer Kette mit gemessenem, reproduzierbarem PDF/JSON-Nachweis. In der Türkei entwickelt, MIT Open Source, voll self-hosted.",
    about_paragraphs: [
      "Fail2ban bannt nur, ModSecurity-WAF ist ein separates Modul, CrowdSec braucht einen stückweisen Stack. Log Guardian vereint sie: Logzeile → Parser → CRS/WAF (PCRE2 JIT) → Ban-Pipeline (Policy + Tenant) → ipset/XDP-Kernel → Prometheus-Metriken und Dashboard-SOC-Timeline.",
      "Die Ergebnisse sind messbar und reproduzierbar: 100% Recall auf echtem Angriffskorpus, 100% OWASP-CRS-Parität, 0,2% False Positives, ~17 ms mediane Ban-Latenz und 0 Fehler über 864 Proben im 72h-VM-Soak.",
      "Diese Seite ist eine öffentliche Landing- und Download-Seite — statischer Inhalt. Die Software läuft auf Ihrem Linux-Server; Ihre Daten bleiben bei Ihnen.",
    ],
    pkg_hero:
      "Statt Fail2ban, ModSecurity und CrowdSec einzeln zu installieren, vereint Log Guardian alle drei in einem self-hosted Paket.",
    why_bodies: [
      "nginx-Log → OWASP CRS → ~17 ms Kernel-Ban. Kein Fail2ban + ModSec + Skript-Haufen.",
      "competitive-proof-PDF, 75 Tests, 72h-Soak — bei Rivalen fehlend oder fragmentiert.",
      "Open Source, türkische Docs, self-hosted — kein Vendor-Lock-in.",
      "Nicht Inline-ModSec-EPS; CDN absorbiert L3/L4. Origin-Integration + Tempo.",
      "Fail2ban, ModSecurity, CrowdSec nicht getrennt — Ban + WAF + SOC in einem Produkt.",
      "~17 ms medianer Ban — Fail2ban/CrowdSec in Sekunden–Minuten; 5 gemessene Proben.",
      "JA3-Cluster 100% Recall — Live-Test mit 80 IPs; Ban pro IP + Cluster-Erkennung.",
      "Telegram-Alarm + Ein-Klick-Ack, SOC-Timeline, Tenant-Metriken — :8443 nach der Installation.",
    ],
    merge_bodies: [
      "Kein separates Fail2ban. Logzeile bis ipset/XDP-Kernel-Ban ~17 ms — Policy, Tenant, FP-Trust in einer Pipeline.",
      "Kein separates ModSecurity-Modul. OWASP CRS 121 Regeln, PCRE2 JIT — ein Durchlauf ab der nginx-Logzeile.",
      "Kein stückweiser CrowdSec-Stack. Prometheus, SOC-Timeline, 75 Tests, 14 Nachweisdateien, Telegram-Betrieb — ein Panel.",
    ],
  },
  fr: {
    hero_side_body:
      "Une seule chaîne de la ligne de log d'accès nginx au ban ipset : parser, évaluation OWASP CRS/WAF et ban noyau ~17 ms. Les rivaux offrent une architecture fragmentée — nous réunissons tout en une chaîne avec une preuve PDF/JSON mesurée et reproductible. Conçu en Turquie, open source MIT, entièrement auto-hébergé.",
    about_paragraphs: [
      "Fail2ban ne fait que bannir, le WAF ModSecurity est un module séparé, CrowdSec exige une pile fragmentée. Log Guardian les réunit : ligne de log → parser → CRS/WAF (PCRE2 JIT) → pipeline de ban (policy + tenant) → noyau ipset/XDP → métriques Prometheus et timeline SOC du tableau de bord.",
      "Les résultats sont mesurables et reproductibles : 100% de rappel sur un corpus d'attaques réelles, 100% de parité OWASP CRS, 0,2% de faux positifs, ~17 ms de latence de ban médiane et 0 erreur sur 864 échantillons lors du soak 72h en VM.",
      "Ce site est une page publique de présentation et de téléchargement — contenu statique. Le logiciel s'exécute sur votre serveur Linux ; vos données restent chez vous.",
    ],
    pkg_hero:
      "Au lieu d'installer Fail2ban, ModSecurity et CrowdSec séparément, Log Guardian réunit les trois dans un seul paquet auto-hébergé.",
    why_bodies: [
      "log nginx → OWASP CRS → ban noyau ~17 ms. Pas de tas Fail2ban + ModSec + scripts.",
      "PDF competitive-proof, 75 tests, soak 72h — absent ou fragmenté chez les rivaux.",
      "Open source, docs turques, auto-hébergé — aucun verrouillage fournisseur.",
      "Pas l'EPS inline de ModSec ; le CDN absorbe le L3/L4. Intégration à l'origine + vitesse.",
      "Fail2ban, ModSecurity, CrowdSec non séparés — ban + WAF + SOC en un seul produit.",
      "Ban médian ~17 ms — Fail2ban/CrowdSec en secondes–minutes ; 5 échantillons mesurés.",
      "Cluster JA3 100% de rappel — test en direct sur 80 IP ; ban par IP + détection de cluster.",
      "Alerte Telegram + ack en un clic, timeline SOC, métriques par tenant — :8443 après installation.",
    ],
    merge_bodies: [
      "Pas de Fail2ban séparé. De la ligne de log au ban noyau ipset/XDP ~17 ms — policy, tenant, FP trust dans un pipeline.",
      "Pas de module ModSecurity séparé. OWASP CRS 121 règles, PCRE2 JIT — un seul passage depuis la ligne de log nginx.",
      "Pas de pile CrowdSec fragmentée. Prometheus, timeline SOC, 75 tests, 14 fichiers de preuve, exploitation Telegram — un seul panneau.",
    ],
  },
  es: {
    hero_side_body:
      "Una sola cadena desde la línea de log de acceso de nginx hasta el ban de ipset: parser, evaluación OWASP CRS/WAF y ban de kernel ~17 ms. Los rivales ofrecen arquitectura fragmentada — nosotros unimos todo en una cadena con prueba PDF/JSON medida y reproducible. Desarrollado en Turquía, open source MIT, totalmente autoalojado.",
    about_paragraphs: [
      "Fail2ban solo banea, el WAF ModSecurity es un módulo aparte, CrowdSec necesita un stack fragmentado. Log Guardian los une: línea de log → parser → CRS/WAF (PCRE2 JIT) → pipeline de ban (policy + tenant) → kernel ipset/XDP → métricas Prometheus y timeline SOC del panel.",
      "Los resultados son medibles y reproducibles: 100% de recall en corpus de ataques reales, 100% de paridad OWASP CRS, 0,2% de falsos positivos, ~17 ms de latencia de ban mediana y 0 errores en 864 muestras durante el soak 72h en VM.",
      "Este sitio es una página pública de presentación y descarga — contenido estático. El software se ejecuta en tu servidor Linux; tus datos se quedan contigo.",
    ],
    pkg_hero:
      "En vez de instalar Fail2ban, ModSecurity y CrowdSec por separado, Log Guardian une los tres en un solo paquete autoalojado.",
    why_bodies: [
      "log de nginx → OWASP CRS → ban de kernel ~17 ms. Sin montón de Fail2ban + ModSec + scripts.",
      "PDF competitive-proof, 75 pruebas, soak 72h — ausente o fragmentado en los rivales.",
      "Open source, docs en turco, autoalojado — sin bloqueo de proveedor.",
      "No el EPS inline de ModSec; el CDN absorbe L3/L4. Integración en el origen + velocidad.",
      "Fail2ban, ModSecurity, CrowdSec no separados — ban + WAF + SOC en un solo producto.",
      "Ban mediano ~17 ms — Fail2ban/CrowdSec en segundos–minutos; 5 muestras medidas.",
      "Clúster JA3 100% de recall — prueba en vivo con 80 IP; ban por IP + detección de clúster.",
      "Alerta Telegram + ack con un clic, timeline SOC, métricas por tenant — :8443 tras la instalación.",
    ],
    merge_bodies: [
      "Sin Fail2ban aparte. De la línea de log al ban de kernel ipset/XDP ~17 ms — policy, tenant, FP trust en un pipeline.",
      "Sin módulo ModSecurity aparte. OWASP CRS 121 reglas, PCRE2 JIT — una sola pasada desde la línea de log de nginx.",
      "Sin stack fragmentado de CrowdSec. Prometheus, timeline SOC, 75 pruebas, 14 archivos de evidencia, operación Telegram — un solo panel.",
    ],
  },
  ru: {
    hero_side_body:
      "Одна цепочка от строки access-лога nginx до бана ipset: парсер, оценка OWASP CRS/WAF и бан в ядре ~17 мс. Конкуренты предлагают фрагментарную архитектуру — мы объединяем всё в одну цепочку с измеренным, воспроизводимым доказательством PDF/JSON. Разработано в Турции, открытый код MIT, полностью self-hosted.",
    about_paragraphs: [
      "Fail2ban только банит, WAF ModSecurity — отдельный модуль, CrowdSec требует фрагментарного стека. Log Guardian объединяет их: строка лога → парсер → CRS/WAF (PCRE2 JIT) → пайплайн бана (policy + tenant) → ядро ipset/XDP → метрики Prometheus и SOC-таймлайн дашборда.",
      "Результаты измеримы и воспроизводимы: 100% recall на корпусе реальных атак, 100% паритет OWASP CRS, 0,2% ложных срабатываний, ~17 мс медианной задержки бана и 0 ошибок на 864 образцах за 72-часовой soak на ВМ.",
      "Этот сайт — публичная посадочная страница и страница загрузки — статический контент. Софт работает на вашем сервере Linux; ваши данные остаются у вас.",
    ],
    pkg_hero:
      "Вместо отдельной установки Fail2ban, ModSecurity и CrowdSec, Log Guardian объединяет все три в одном self-hosted пакете.",
    why_bodies: [
      "лог nginx → OWASP CRS → бан в ядре ~17 мс. Без груды Fail2ban + ModSec + скриптов.",
      "PDF competitive-proof, 75 тестов, 72ч soak — у конкурентов нет или фрагментарно.",
      "Открытый код, документация на турецком, self-hosted — без привязки к вендору.",
      "Не inline-EPS ModSec; CDN поглощает L3/L4. Интеграция на origin + скорость.",
      "Fail2ban, ModSecurity, CrowdSec не по отдельности — бан + WAF + SOC в одном продукте.",
      "Медианный бан ~17 мс — Fail2ban/CrowdSec в секундах–минутах; 5 измеренных образцов.",
      "Кластер JA3 100% recall — живой тест на 80 IP; бан по IP + обнаружение кластера.",
      "Алерт Telegram + ack в один клик, SOC-таймлайн, метрики по tenant — :8443 после установки.",
    ],
    merge_bodies: [
      "Без отдельного Fail2ban. От строки лога до бана в ядре ipset/XDP ~17 мс — policy, tenant, FP trust в одном пайплайне.",
      "Без отдельного модуля ModSecurity. OWASP CRS 121 правило, PCRE2 JIT — один проход от строки лога nginx.",
      "Без фрагментарного стека CrowdSec. Prometheus, SOC-таймлайн, 75 тестов, 14 файлов доказательств, управление Telegram — одна панель.",
    ],
  },
  pt: {
    hero_side_body:
      "Uma só cadeia da linha de log de acesso do nginx ao ban de ipset: parser, avaliação OWASP CRS/WAF e ban de kernel ~17 ms. Os rivais oferecem arquitetura fragmentada — juntamos tudo numa cadeia com prova PDF/JSON medida e reproduzível. Feito na Turquia, open source MIT, totalmente self-hosted.",
    about_paragraphs: [
      "O Fail2ban só bane, o WAF ModSecurity é um módulo à parte, o CrowdSec precisa de um stack fragmentado. O Log Guardian junta-os: linha de log → parser → CRS/WAF (PCRE2 JIT) → pipeline de ban (policy + tenant) → kernel ipset/XDP → métricas Prometheus e timeline SOC do painel.",
      "Os resultados são mensuráveis e reproduzíveis: 100% de recall no corpus de ataques reais, 100% de paridade OWASP CRS, 0,2% de falsos positivos, ~17 ms de latência de ban mediana e 0 erros em 864 amostras no soak 72h em VM.",
      "Este site é uma página pública de apresentação e download — conteúdo estático. O software corre no seu servidor Linux; os seus dados ficam consigo.",
    ],
    pkg_hero:
      "Em vez de instalar Fail2ban, ModSecurity e CrowdSec separadamente, o Log Guardian junta os três num só pacote self-hosted.",
    why_bodies: [
      "log do nginx → OWASP CRS → ban de kernel ~17 ms. Sem pilha de Fail2ban + ModSec + scripts.",
      "PDF competitive-proof, 75 testes, soak 72h — ausente ou fragmentado nos rivais.",
      "Open source, docs em turco, self-hosted — sem lock-in de fornecedor.",
      "Não o EPS inline do ModSec; o CDN absorve L3/L4. Integração na origem + velocidade.",
      "Fail2ban, ModSecurity, CrowdSec não separados — ban + WAF + SOC num só produto.",
      "Ban mediano ~17 ms — Fail2ban/CrowdSec em segundos–minutos; 5 amostras medidas.",
      "Cluster JA3 100% de recall — teste ao vivo com 80 IP; ban por IP + deteção de cluster.",
      "Alerta Telegram + ack com um clique, timeline SOC, métricas por tenant — :8443 após a instalação.",
    ],
    merge_bodies: [
      "Sem Fail2ban à parte. Da linha de log ao ban de kernel ipset/XDP ~17 ms — policy, tenant, FP trust num pipeline.",
      "Sem módulo ModSecurity à parte. OWASP CRS 121 regras, PCRE2 JIT — uma só passagem desde a linha de log do nginx.",
      "Sem stack fragmentado do CrowdSec. Prometheus, timeline SOC, 75 testes, 14 ficheiros de prova, operação Telegram — um só painel.",
    ],
  },
  nl: {
    hero_side_body:
      "Eén keten van de nginx-accesslogregel tot de ipset-ban: parser, OWASP-CRS/WAF-evaluatie en kernel-ban ~17 ms. Concurrenten bieden een versnipperde architectuur — wij voegen alles samen in één keten met gemeten, reproduceerbaar PDF/JSON-bewijs. Gemaakt in Turkije, MIT open source, volledig self-hosted.",
    about_paragraphs: [
      "Fail2ban bant alleen, de ModSecurity-WAF is een aparte module, CrowdSec vraagt een versnipperde stack. Log Guardian voegt ze samen: logregel → parser → CRS/WAF (PCRE2 JIT) → ban-pipeline (policy + tenant) → ipset/XDP-kernel → Prometheus-metrics en dashboard-SOC-timeline.",
      "De resultaten zijn meetbaar en reproduceerbaar: 100% recall op een corpus van echte aanvallen, 100% OWASP-CRS-pariteit, 0,2% false positives, ~17 ms mediane ban-latency en 0 fouten over 864 monsters in de 72h-VM-soak.",
      "Deze site is een openbare landings- en downloadpagina — statische inhoud. De software draait op je Linux-server; je data blijft bij jou.",
    ],
    pkg_hero:
      "In plaats van Fail2ban, ModSecurity en CrowdSec apart te installeren, voegt Log Guardian alle drie samen in één self-hosted pakket.",
    why_bodies: [
      "nginx-log → OWASP CRS → kernel-ban ~17 ms. Geen Fail2ban + ModSec + scripthoop.",
      "competitive-proof-PDF, 75 tests, 72h-soak — bij concurrenten ontbrekend of versnipperd.",
      "Open source, Turkse docs, self-hosted — geen vendor lock-in.",
      "Niet de inline-EPS van ModSec; CDN absorbeert L3/L4. Origin-integratie + snelheid.",
      "Fail2ban, ModSecurity, CrowdSec niet apart — ban + WAF + SOC in één product.",
      "Mediane ban ~17 ms — Fail2ban/CrowdSec in seconden–minuten; 5 gemeten monsters.",
      "JA3-cluster 100% recall — live test met 80 IP's; ban per IP + clusterdetectie.",
      "Telegram-alert + één-klik-ack, SOC-timeline, tenant-metrics — :8443 na installatie.",
    ],
    merge_bodies: [
      "Geen aparte Fail2ban. Van logregel tot ipset/XDP-kernel-ban ~17 ms — policy, tenant, FP trust in één pipeline.",
      "Geen aparte ModSecurity-module. OWASP CRS 121 regels, PCRE2 JIT — één doorloop vanaf de nginx-logregel.",
      "Geen versnipperde CrowdSec-stack. Prometheus, SOC-timeline, 75 tests, 14 bewijsbestanden, Telegram-beheer — één paneel.",
    ],
  },
  zh: {
    hero_side_body:
      "从 nginx 访问日志行到 ipset 封禁的单一链路：解析器、OWASP CRS/WAF 评估和约 17 毫秒内核封禁。竞品提供零散架构——我们用实测、可复现的 PDF/JSON 证据将一切合并到一条链路中。土耳其制造，MIT 开源，完全自托管。",
    about_paragraphs: [
      "Fail2ban 只做封禁，ModSecurity WAF 是独立模块，CrowdSec 需要零散技术栈。Log Guardian 将它们合并：日志行 → 解析器 → CRS/WAF（PCRE2 JIT）→ 封禁流水线（策略 + 租户）→ ipset/XDP 内核 → Prometheus 指标和仪表盘 SOC 时间线。",
      "结果可衡量、可复现：真实攻击语料 100% 召回、100% OWASP CRS 对等、0.2% 误报、约 17 毫秒中位封禁延迟，以及 72 小时 VM soak 中 864 个样本 0 错误。",
      "本站是公开的落地与下载页面——静态内容。软件运行在你自己的 Linux 服务器上；数据留在你手中。",
    ],
    pkg_hero:
      "无需分别安装 Fail2ban、ModSecurity 和 CrowdSec，Log Guardian 将三者合并到一个自托管软件包中。",
    why_bodies: [
      "nginx 日志 → OWASP CRS → 约 17 毫秒内核封禁。没有 Fail2ban + ModSec + 脚本堆。",
      "competitive-proof PDF、75 项测试、72 小时 soak——竞品缺失或零散。",
      "开源、土耳其语文档、自托管——无供应商锁定。",
      "不是 ModSec 的内联 EPS；CDN 吸收 L3/L4。源站集成 + 速度。",
      "Fail2ban、ModSecurity、CrowdSec 不再分离——封禁 + WAF + SOC 于一个产品。",
      "中位封禁约 17 毫秒——Fail2ban/CrowdSec 在秒—分钟级；5 个实测样本。",
      "JA3 集群 100% 召回——80 IP 实测；按 IP 封禁 + 集群检测。",
      "Telegram 告警 + 一键 ack、SOC 时间线、租户指标——安装后 :8443。",
    ],
    merge_bodies: [
      "无需单独的 Fail2ban。从日志行到 ipset/XDP 内核封禁约 17 毫秒——策略、租户、FP trust 于一条流水线。",
      "无需单独的 ModSecurity 模块。OWASP CRS 121 条规则、PCRE2 JIT——从 nginx 日志行一次通过。",
      "无需零散的 CrowdSec 技术栈。Prometheus、SOC 时间线、75 项测试、14 个证据文件、Telegram 运维——一个面板。",
    ],
  },
  ja: {
    hero_side_body:
      "nginx アクセスログの行から ipset BAN までの単一チェーン：パーサー、OWASP CRS/WAF 評価、約17msのカーネルBAN。競合は断片的なアーキテクチャを提供します——私たちは実測・再現可能な PDF/JSON の証拠とともに一本のチェーンに統合します。トルコ製、MIT オープンソース、完全セルフホスト。",
    about_paragraphs: [
      "Fail2ban は BAN のみ、ModSecurity WAF は別モジュール、CrowdSec は断片的なスタックを要します。Log Guardian はそれらを統合します：ログ行 → パーサー → CRS/WAF（PCRE2 JIT）→ BAN パイプライン（ポリシー + テナント）→ ipset/XDP カーネル → Prometheus メトリクスとダッシュボード SOC タイムライン。",
      "結果は測定可能で再現可能です：実攻撃コーパスでリコール100%、OWASP CRS 100%整合、誤検知0.2%、中央値 約17msのBANレイテンシ、72時間 VM ソークで864サンプル中0エラー。",
      "本サイトは公開のランディング兼ダウンロードページ——静的コンテンツです。ソフトウェアはご自身の Linux サーバーで動作し、データは手元に残ります。",
    ],
    pkg_hero:
      "Fail2ban、ModSecurity、CrowdSec を個別に導入する代わりに、Log Guardian は3つを1つのセルフホストパッケージに統合します。",
    why_bodies: [
      "nginx ログ → OWASP CRS → 約17msのカーネルBAN。Fail2ban + ModSec + スクリプトの山は不要。",
      "competitive-proof PDF、75テスト、72時間ソーク——競合では欠落または断片的。",
      "オープンソース、トルコ語ドキュメント、セルフホスト——ベンダーロックインなし。",
      "ModSec のインライン EPS ではない；CDN が L3/L4 を吸収。オリジンでの統合 + 速度。",
      "Fail2ban、ModSecurity、CrowdSec は別々ではない——BAN + WAF + SOC を1製品に。",
      "中央値BAN 約17ms——Fail2ban/CrowdSec は秒〜分単位；5件の実測サンプル。",
      "JA3 クラスタ リコール100%——80 IP のライブテスト；IP ごとの BAN + クラスタ検知。",
      "Telegram アラート + ワンクリック ack、SOC タイムライン、テナントメトリクス——導入後 :8443。",
    ],
    merge_bodies: [
      "個別の Fail2ban は不要。ログ行から ipset/XDP カーネルBANまで約17ms——ポリシー、テナント、FP trust が1本のパイプラインに。",
      "個別の ModSecurity モジュールは不要。OWASP CRS 121ルール、PCRE2 JIT——nginx ログ行から一度の通過。",
      "断片的な CrowdSec スタックは不要。Prometheus、SOC タイムライン、75テスト、14の証拠ファイル、Telegram 運用——一つのパネルに。",
    ],
  },
  ko: {
    hero_side_body:
      "nginx 액세스 로그 라인에서 ipset 밴까지의 단일 체인: 파서, OWASP CRS/WAF 평가, 약 17ms 커널 밴. 경쟁사는 조각난 아키텍처를 제공합니다 — 우리는 측정되고 재현 가능한 PDF/JSON 증거와 함께 모든 것을 하나의 체인으로 통합합니다. 튀르키예 제작, MIT 오픈소스, 완전 셀프호스팅.",
    about_paragraphs: [
      "Fail2ban은 밴만 하고, ModSecurity WAF는 별도 모듈이며, CrowdSec은 조각난 스택이 필요합니다. Log Guardian은 이를 통합합니다: 로그 라인 → 파서 → CRS/WAF(PCRE2 JIT) → 밴 파이프라인(정책 + 테넌트) → ipset/XDP 커널 → Prometheus 메트릭과 대시보드 SOC 타임라인.",
      "결과는 측정 가능하고 재현 가능합니다: 실제 공격 코퍼스에서 재현율 100%, OWASP CRS 100% 동등성, 오탐 0.2%, 중앙값 약 17ms 밴 지연, 72시간 VM soak에서 864 샘플 중 0 오류.",
      "이 사이트는 공개 랜딩 및 다운로드 페이지입니다 — 정적 콘텐츠. 소프트웨어는 당신의 Linux 서버에서 실행되며, 데이터는 당신에게 남습니다.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity, CrowdSec을 따로 설치하는 대신, Log Guardian은 셋을 하나의 셀프호스팅 패키지로 통합합니다.",
    why_bodies: [
      "nginx 로그 → OWASP CRS → 약 17ms 커널 밴. Fail2ban + ModSec + 스크립트 더미 없음.",
      "competitive-proof PDF, 75개 테스트, 72시간 soak — 경쟁사는 없거나 조각남.",
      "오픈소스, 튀르키예어 문서, 셀프호스팅 — 벤더 종속 없음.",
      "ModSec의 인라인 EPS가 아님; CDN이 L3/L4를 흡수. 오리진 통합 + 속도.",
      "Fail2ban, ModSecurity, CrowdSec 분리 아님 — 밴 + WAF + SOC를 한 제품에.",
      "중앙값 밴 약 17ms — Fail2ban/CrowdSec은 초~분 단위; 5개 측정 샘플.",
      "JA3 클러스터 재현율 100% — 80 IP 실시간 테스트; IP별 밴 + 클러스터 탐지.",
      "Telegram 알림 + 원클릭 ack, SOC 타임라인, 테넌트 메트릭 — 설치 후 :8443.",
    ],
    merge_bodies: [
      "별도 Fail2ban 없음. 로그 라인에서 ipset/XDP 커널 밴까지 약 17ms — 정책, 테넌트, FP trust가 하나의 파이프라인에.",
      "별도 ModSecurity 모듈 없음. OWASP CRS 121 규칙, PCRE2 JIT — nginx 로그 라인에서 한 번에 통과.",
      "조각난 CrowdSec 스택 없음. Prometheus, SOC 타임라인, 75개 테스트, 14개 증거 파일, Telegram 운영 — 하나의 패널.",
    ],
  },
  ar: {
    hero_side_body:
      "سلسلة واحدة من سطر سجل وصول nginx إلى حظر ipset: محلّل، تقييم OWASP CRS/WAF وحظر على مستوى النواة نحو 17 مللي ثانية. المنافسون يقدّمون بنية مجزّأة — نحن ندمج كل شيء في سلسلة واحدة مع دليل PDF/JSON مقاس وقابل لإعادة الإنتاج. صُنع في تركيا، مفتوح المصدر MIT، ذاتي الاستضافة بالكامل.",
    about_paragraphs: [
      "Fail2ban يحظر فقط، وModSecurity WAF وحدة منفصلة، وCrowdSec يتطلّب حزمة مجزّأة. يدمجها Log Guardian: سطر السجل ← محلّل ← CRS/WAF (PCRE2 JIT) ← خط حظر (سياسة + مستأجر) ← نواة ipset/XDP ← مقاييس Prometheus وخط زمني SOC للوحة.",
      "النتائج قابلة للقياس وإعادة الإنتاج: استرجاع 100% على مجموعة هجمات حقيقية، تكافؤ OWASP CRS 100%، إيجابيات كاذبة 0.2%، وسيط زمن حظر نحو 17 مللي ثانية و0 خطأ عبر 864 عينة في soak لمدة 72 ساعة على جهاز افتراضي.",
      "هذا الموقع صفحة تعريف وتنزيل عامة — محتوى ثابت. البرنامج يعمل على خادم Linux الخاص بك؛ بياناتك تبقى لديك.",
    ],
    pkg_hero:
      "بدلاً من تثبيت Fail2ban وModSecurity وCrowdSec بشكل منفصل، يدمج Log Guardian الثلاثة في حزمة واحدة ذاتية الاستضافة.",
    why_bodies: [
      "سجل nginx ← OWASP CRS ← حظر على مستوى النواة نحو 17 مللي ثانية. بلا كومة Fail2ban + ModSec + سكربتات.",
      "PDF ‏competitive-proof، 75 اختباراً، soak 72 ساعة — مفقود أو مجزّأ لدى المنافسين.",
      "مفتوح المصدر، وثائق بالتركية، ذاتي الاستضافة — بلا احتكار مورّد.",
      "ليس EPS المضمّن لـ ModSec؛ الـ CDN يمتصّ L3/L4. تكامل عند الأصل + سرعة.",
      "Fail2ban وModSecurity وCrowdSec ليست منفصلة — حظر + WAF + SOC في منتج واحد.",
      "وسيط الحظر نحو 17 مللي ثانية — Fail2ban/CrowdSec بثوانٍ–دقائق؛ 5 عينات مقاسة.",
      "عنقود JA3 استرجاع 100% — اختبار حي على 80 IP؛ حظر لكل IP + كشف عنقود.",
      "تنبيه Telegram + ack بنقرة واحدة، خط زمني SOC، مقاييس لكل مستأجر — :8443 بعد التثبيت.",
    ],
    merge_bodies: [
      "بلا Fail2ban منفصل. من سطر السجل إلى حظر نواة ipset/XDP نحو 17 مللي ثانية — سياسة، مستأجر، FP trust في خط واحد.",
      "بلا وحدة ModSecurity منفصلة. OWASP CRS 121 قاعدة، PCRE2 JIT — مرور واحد من سطر سجل nginx.",
      "بلا حزمة CrowdSec مجزّأة. Prometheus، خط زمني SOC، 75 اختباراً، 14 ملف دليل، تشغيل Telegram — لوحة واحدة.",
    ],
  },
  az: {
    hero_side_body:
      "nginx giriş log sətrindən ipset bana qədər tək zəncir: parser, OWASP CRS/WAF qiymətləndirməsi və ~17 ms kernel ban. Rəqiblər parçalı memarlıq təklif edir — biz hər şeyi ölçülmüş, təkrar istehsal edilə bilən PDF/JSON sübutu ilə bir zəncirdə birləşdiririk. Türkiyədə hazırlanıb, MIT açıq mənbə, tam self-hosted.",
    about_paragraphs: [
      "Fail2ban yalnız banlayır, ModSecurity WAF ayrıca moduldur, CrowdSec parçalı stek tələb edir. Log Guardian onları birləşdirir: log sətri → parser → CRS/WAF (PCRE2 JIT) → ban pipeline (siyasət + tenant) → ipset/XDP kernel → Prometheus metrikləri və panel SOC zaman xətti.",
      "Nəticələr ölçülə bilən və təkrar istehsal edilə biləndir: real hücum korpusunda 100% recall, 100% OWASP CRS pariteti, 0.2% yanlış pozitiv, ~17 ms median ban gecikməsi və 72 saat VM soak-da 864 nümunədə 0 xəta.",
      "Bu sayt açıq təqdimat və yükləmə səhifəsidir — statik məzmun. Proqram öz Linux serverinizdə işləyir; məlumatınız sizdə qalır.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity və CrowdSec-i ayrıca quraşdırmaq əvəzinə, Log Guardian üçünü bir self-hosted paketdə birləşdirir.",
    why_bodies: [
      "nginx logu → OWASP CRS → ~17 ms kernel ban. Fail2ban + ModSec + skript yığını yoxdur.",
      "competitive-proof PDF, 75 test, 72 saat soak — rəqiblərdə yoxdur və ya parçalı.",
      "Açıq mənbə, türkcə sənədlər, self-hosted — vendor asılılığı yoxdur.",
      "ModSec-in inline EPS-i deyil; CDN L3/L4-ü udur. Origin-də inteqrasiya + sürət.",
      "Fail2ban, ModSecurity, CrowdSec ayrı deyil — ban + WAF + SOC bir məhsulda.",
      "Median ban ~17 ms — Fail2ban/CrowdSec saniyə–dəqiqə səviyyəsində; 5 ölçülmüş nümunə.",
      "JA3 klaster 100% recall — 80 IP canlı test; IP başına ban + klaster aşkarlanması.",
      "Telegram alert + bir kliklə ack, SOC zaman xətti, tenant metrikləri — quraşdırmadan sonra :8443.",
    ],
    merge_bodies: [
      "Ayrıca Fail2ban yoxdur. Log sətrindən ipset/XDP kernel bana ~17 ms — siyasət, tenant, FP trust bir pipeline-da.",
      "Ayrıca ModSecurity modulu yoxdur. OWASP CRS 121 qayda, PCRE2 JIT — nginx log sətrindən bir keçid.",
      "Parçalı CrowdSec steki yoxdur. Prometheus, SOC zaman xətti, 75 test, 14 sübut faylı, Telegram idarəetmə — bir panel.",
    ],
  },
  kk: {
    hero_side_body:
      "nginx кіру лог жолынан ipset банға дейін бір тізбек: parser, OWASP CRS/WAF бағалауы және ~17 мс kernel ban. Бәсекелестер бөлшек архитектура ұсынады — біз бәрін өлшенген, қайта жаңғыртылатын PDF/JSON дәлелімен бір тізбекте біріктіреміз. Түркияда жасалған, MIT ашық код, толық self-hosted.",
    about_paragraphs: [
      "Fail2ban тек бан салады, ModSecurity WAF бөлек модуль, CrowdSec бөлшек стек қажет етеді. Log Guardian оларды біріктіреді: лог жолы → parser → CRS/WAF (PCRE2 JIT) → ban pipeline (саясат + tenant) → ipset/XDP kernel → Prometheus метрикалары және панель SOC уақыт сызығы.",
      "Нәтижелер өлшенеді және қайта жаңғыртылады: нақты шабуыл корпусында recall 100%, OWASP CRS паритеті 100%, 0.2% жалған позитив, ~17 мс медиана бан кідірісі және 72 сағат VM soak ішінде 864 үлгіде 0 қате.",
      "Бұл сайт — ашық таныстыру және жүктеу беті — статикалық мазмұн. Бағдарлама сіздің Linux серверіңізде жұмыс істейді; деректеріңіз сізде қалады.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity және CrowdSec-ті бөлек орнатудың орнына, Log Guardian үшеуін бір self-hosted пакетте біріктіреді.",
    why_bodies: [
      "nginx логы → OWASP CRS → ~17 мс kernel ban. Fail2ban + ModSec + скрипт үйіндісі жоқ.",
      "competitive-proof PDF, 75 тест, 72 сағат soak — бәсекелестерде жоқ немесе бөлшектелген.",
      "Ашық код, түрікше құжаттама, self-hosted — вендорға тәуелділік жоқ.",
      "ModSec-тің inline EPS-і емес; CDN L3/L4-ті сіңіреді. Origin-де интеграция + жылдамдық.",
      "Fail2ban, ModSecurity, CrowdSec бөлек емес — ban + WAF + SOC бір өнімде.",
      "Медиана бан ~17 мс — Fail2ban/CrowdSec секунд–минут деңгейінде; 5 өлшенген үлгі.",
      "JA3 кластер recall 100% — 80 IP тікелей тест; IP бойынша ban + кластерді анықтау.",
      "Telegram alert + бір рет басып ack, SOC уақыт сызығы, tenant метрикалары — орнатудан кейін :8443.",
    ],
    merge_bodies: [
      "Бөлек Fail2ban жоқ. Лог жолынан ipset/XDP kernel банға ~17 мс — саясат, tenant, FP trust бір pipeline-да.",
      "Бөлек ModSecurity модулі жоқ. OWASP CRS 121 ереже, PCRE2 JIT — nginx лог жолынан бір өту.",
      "Бөлшек CrowdSec стегі жоқ. Prometheus, SOC уақыт сызығы, 75 тест, 14 дәлел файлы, Telegram басқару — бір панель.",
    ],
  },
  uz: {
    hero_side_body:
      "nginx kirish log qatoridan ipset banga qadar yagona zanjir: parser, OWASP CRS/WAF baholash va ~17 ms kernel ban. Raqiblar bo'lak arxitektura taklif qiladi — biz hammasini o'lchangan, qayta ishlab chiqariladigan PDF/JSON dalil bilan bitta zanjirda birlashtiramiz. Turkiyada ishlab chiqilgan, MIT ochiq kod, to'liq self-hosted.",
    about_paragraphs: [
      "Fail2ban faqat ban qiladi, ModSecurity WAF alohida modul, CrowdSec bo'lak stek talab qiladi. Log Guardian ularni birlashtiradi: log qatori → parser → CRS/WAF (PCRE2 JIT) → ban pipeline (siyosat + tenant) → ipset/XDP kernel → Prometheus metrikalar va panel SOC vaqt chizig'i.",
      "Natijalar o'lchanadigan va qayta ishlab chiqariladigan: haqiqiy hujum korpusida recall 100%, OWASP CRS pariteti 100%, 0.2% noto'g'ri pozitiv, ~17 ms median ban kechikishi va 72 soat VM soak'da 864 namunada 0 xato.",
      "Bu sayt ochiq taqdimot va yuklab olish sahifasi — statik kontent. Dastur o'z Linux serveringizda ishlaydi; ma'lumotingiz sizda qoladi.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity va CrowdSec'ni alohida o'rnatish o'rniga, Log Guardian uchtasini bitta self-hosted paketda birlashtiradi.",
    why_bodies: [
      "nginx logi → OWASP CRS → ~17 ms kernel ban. Fail2ban + ModSec + skript uyumi yo'q.",
      "competitive-proof PDF, 75 test, 72 soat soak — raqiblarda yo'q yoki bo'lak.",
      "Ochiq kod, turkcha hujjatlar, self-hosted — vendor qaramligi yo'q.",
      "ModSec'ning inline EPS'i emas; CDN L3/L4'ni yutadi. Origin'da integratsiya + tezlik.",
      "Fail2ban, ModSecurity, CrowdSec alohida emas — ban + WAF + SOC bitta mahsulotda.",
      "Median ban ~17 ms — Fail2ban/CrowdSec soniya–daqiqa darajasida; 5 o'lchangan namuna.",
      "JA3 klaster recall 100% — 80 IP jonli test; IP bo'yicha ban + klaster aniqlash.",
      "Telegram alert + bir bosishda ack, SOC vaqt chizig'i, tenant metrikalar — o'rnatishdan keyin :8443.",
    ],
    merge_bodies: [
      "Alohida Fail2ban yo'q. Log qatoridan ipset/XDP kernel banga ~17 ms — siyosat, tenant, FP trust bitta pipeline'da.",
      "Alohida ModSecurity moduli yo'q. OWASP CRS 121 qoida, PCRE2 JIT — nginx log qatoridan bir o'tish.",
      "Bo'lak CrowdSec steki yo'q. Prometheus, SOC vaqt chizig'i, 75 test, 14 dalil fayli, Telegram boshqaruvi — bitta panel.",
    ],
  },
  ky: {
    hero_side_body:
      "nginx кирүү лог сабынан ipset банга чейин бирдиктүү чынжыр: parser, OWASP CRS/WAF баалоо жана ~17 мс kernel ban. Атаандаштар бөлүк архитектура сунуштайт — биз баарын өлчөнгөн, кайра чыгарылуучу PDF/JSON далили менен бир чынжырда бириктиребиз. Түркияда жасалган, MIT ачык код, толук self-hosted.",
    about_paragraphs: [
      "Fail2ban бир гана бан салат, ModSecurity WAF өзүнчө модуль, CrowdSec бөлүк стек талап кылат. Log Guardian аларды бириктирет: лог сабы → parser → CRS/WAF (PCRE2 JIT) → ban pipeline (саясат + tenant) → ipset/XDP kernel → Prometheus метрикалары жана панель SOC убакыт сызыгы.",
      "Натыйжалар өлчөнөт жана кайра чыгарылат: чыныгы чабуул корпусунда recall 100%, OWASP CRS паритети 100%, 0.2% жалган позитив, ~17 мс медиана бан кечигүүсү жана 72 саат VM soak ичинде 864 үлгүдө 0 ката.",
      "Бул сайт — ачык тааныштыруу жана жүктөө барагы — статикалык мазмун. Программа өзүңүздүн Linux серверыңызда иштейт; маалыматыңыз сизде калат.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity жана CrowdSec'ти өзүнчө орнотуунун ордуна, Log Guardian үчөөнү бир self-hosted пакетте бириктирет.",
    why_bodies: [
      "nginx логу → OWASP CRS → ~17 мс kernel ban. Fail2ban + ModSec + скрипт үймөгү жок.",
      "competitive-proof PDF, 75 тест, 72 саат soak — атаандаштарда жок же бөлүк.",
      "Ачык код, түркчө документтер, self-hosted — вендорго көз карандылык жок.",
      "ModSec'тин inline EPS'и эмес; CDN L3/L4'ту сиңирет. Origin'де интеграция + ылдамдык.",
      "Fail2ban, ModSecurity, CrowdSec өзүнчө эмес — ban + WAF + SOC бир продуктта.",
      "Медиана бан ~17 мс — Fail2ban/CrowdSec секунд–мүнөт деңгээлинде; 5 өлчөнгөн үлгү.",
      "JA3 кластер recall 100% — 80 IP түз тест; IP боюнча ban + кластерди аныктоо.",
      "Telegram alert + бир басып ack, SOC убакыт сызыгы, tenant метрикалары — орнотуудан кийин :8443.",
    ],
    merge_bodies: [
      "Өзүнчө Fail2ban жок. Лог сабынан ipset/XDP kernel банга ~17 мс — саясат, tenant, FP trust бир pipeline'да.",
      "Өзүнчө ModSecurity модулу жок. OWASP CRS 121 эреже, PCRE2 JIT — nginx лог сабынан бир өтүү.",
      "Бөлүк CrowdSec стеги жок. Prometheus, SOC убакыт сызыгы, 75 тест, 14 далил файлы, Telegram башкаруу — бир панель.",
    ],
  },
  tk: {
    hero_side_body:
      "nginx giriş log setirinden ipset bana çenli ýeke zynjyr: parser, OWASP CRS/WAF bahalandyrma we ~17 ms kernel ban. Bäsdeşler bölek arhitektura hödürleýär — biz hemmesini ölçelen, gaýtadan öndürilýän PDF/JSON subutnamasy bilen bir zynjyrda birleşdirýäris. Türkiýede öndürilen, MIT açyk çeşme, doly self-hosted.",
    about_paragraphs: [
      "Fail2ban diňe ban edýär, ModSecurity WAF aýratyn modul, CrowdSec bölek stek talap edýär. Log Guardian olary birleşdirýär: log setiri → parser → CRS/WAF (PCRE2 JIT) → ban pipeline (syýasat + tenant) → ipset/XDP kernel → Prometheus metrikalary we panel SOC wagt çyzygy.",
      "Netijeler ölçäp bolýan we gaýtadan öndürilýän: hakyky hüjüm korpusynda recall 100%, OWASP CRS pariteti 100%, 0.2% ýalňyş pozitiw, ~17 ms mediana ban gijikdirmesi we 72 sagat VM soak-da 864 nusgada 0 ýalňyşlyk.",
      "Bu saýt açyk tanyşdyryş we ýükleme sahypasy — statik mazmun. Programma öz Linux serweriňizde işleýär; maglumatyňyz sizde galýar.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity we CrowdSec-i aýratyn gurnamagyň ýerine, Log Guardian üçüsini bir self-hosted pakete birleşdirýär.",
    why_bodies: [
      "nginx logy → OWASP CRS → ~17 ms kernel ban. Fail2ban + ModSec + skript üýşmegi ýok.",
      "competitive-proof PDF, 75 test, 72 sagat soak — bäsdeşlerde ýok ýa-da bölek.",
      "Açyk çeşme, türkçe resminamalar, self-hosted — wendor garaşlylygy ýok.",
      "ModSec-iň inline EPS-i däl; CDN L3/L4-i siňdirýär. Origin-de integrasiýa + tizlik.",
      "Fail2ban, ModSecurity, CrowdSec aýratyn däl — ban + WAF + SOC bir önümde.",
      "Mediana ban ~17 ms — Fail2ban/CrowdSec sekunt–minut derejesinde; 5 ölçelen nusga.",
      "JA3 klaster recall 100% — 80 IP göni test; IP boýunça ban + klaster ýüze çykarmak.",
      "Telegram alert + bir gezek basyp ack, SOC wagt çyzygy, tenant metrikalary — gurnamadan soň :8443.",
    ],
    merge_bodies: [
      "Aýratyn Fail2ban ýok. Log setirinden ipset/XDP kernel bana ~17 ms — syýasat, tenant, FP trust bir pipeline-da.",
      "Aýratyn ModSecurity moduly ýok. OWASP CRS 121 düzgün, PCRE2 JIT — nginx log setirinden bir geçiş.",
      "Bölek CrowdSec steki ýok. Prometheus, SOC wagt çyzygy, 75 test, 14 subutnama faýly, Telegram dolandyryş — bir panel.",
    ],
  },
  tt: {
    hero_side_body:
      "nginx керү лог юлыннан ipset банга кадәр бер чылбыр: parser, OWASP CRS/WAF бәяләү һәм ~17 мс kernel ban. Көндәшләр өлешле архитектура тәкъдим итә — без барысын да үлчәнгән, кабат җитештерелә торган PDF/JSON дәлиле белән бер чылбырда берләштерәбез. Төркиядә ясалган, MIT ачык код, тулысынча self-hosted.",
    about_paragraphs: [
      "Fail2ban бары тик ban сала, ModSecurity WAF аерым модуль, CrowdSec өлешле стек таләп итә. Log Guardian аларны берләштерә: лог юлы → parser → CRS/WAF (PCRE2 JIT) → ban pipeline (сәясәт + tenant) → ipset/XDP kernel → Prometheus метрикалары һәм панель SOC вакыт сызыгы.",
      "Нәтиҗәләр үлчәнә һәм кабат җитештерелә: чын һөҗүм корпусында recall 100%, OWASP CRS паритеты 100%, 0.2% ялган позитив, ~17 мс медиана бан тоткарлыгы һәм 72 сәгать VM soak эчендә 864 үрнәктә 0 хата.",
      "Бу сайт — ачык тәкъдим итү һәм йөкләү бите — статик эчтәлек. Программа сезнең Linux серверыгызда эшли; мәгълүматыгыз сездә кала.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity һәм CrowdSec'ны аерым урнаштыру урынына, Log Guardian өчесен бер self-hosted пакетта берләштерә.",
    why_bodies: [
      "nginx логы → OWASP CRS → ~17 мс kernel ban. Fail2ban + ModSec + скрипт өеме юк.",
      "competitive-proof PDF, 75 тест, 72 сәгать soak — көндәшләрдә юк яки өлешле.",
      "Ачык код, төрекчә документлар, self-hosted — вендорга бәйлелек юк.",
      "ModSec'ның inline EPS'ы түгел; CDN L3/L4'ны сеңдерә. Origin'да интеграция + тизлек.",
      "Fail2ban, ModSecurity, CrowdSec аерым түгел — ban + WAF + SOC бер продуктта.",
      "Медиана бан ~17 мс — Fail2ban/CrowdSec секунд–минут дәрәҗәсендә; 5 үлчәнгән үрнәк.",
      "JA3 кластер recall 100% — 80 IP туры тест; IP буенча ban + кластерны ачыклау.",
      "Telegram alert + бер басып ack, SOC вакыт сызыгы, tenant метрикалары — урнаштыргач :8443.",
    ],
    merge_bodies: [
      "Аерым Fail2ban юк. Лог юлыннан ipset/XDP kernel банга ~17 мс — сәясәт, tenant, FP trust бер pipeline'да.",
      "Аерым ModSecurity модуле юк. OWASP CRS 121 кагыйдә, PCRE2 JIT — nginx лог юлыннан бер узу.",
      "Өлешле CrowdSec стегы юк. Prometheus, SOC вакыт сызыгы, 75 тест, 14 дәлил файлы, Telegram идарә — бер панель.",
    ],
  },
  ba: {
    hero_side_body:
      "nginx инеү лог юлынан ipset банға тиклем бер сылбыр: parser, OWASP CRS/WAF баһалау һәм ~17 мс kernel ban. Көндәштәр өлөшлө архитектура тәҡдим итә — беҙ барыһын да үлсәнгән, ҡабат етештерелә торған PDF/JSON дәлиле менән бер сылбырҙа берләштерәбеҙ. Төркиәлә яһалған, MIT асыҡ код, тулыһынса self-hosted.",
    about_paragraphs: [
      "Fail2ban бары тик ban һала, ModSecurity WAF айырым модуль, CrowdSec өлөшлө стек талап итә. Log Guardian уларҙы берләштерә: лог юлы → parser → CRS/WAF (PCRE2 JIT) → ban pipeline (сәйәсәт + tenant) → ipset/XDP kernel → Prometheus метрикалары һәм панель SOC ваҡыт һыҙығы.",
      "Һөҙөмтәләр үлсәнә һәм ҡабат етештерелә: ысын һөжүм корпусында recall 100%, OWASP CRS паритеты 100%, 0.2% ялған позитив, ~17 мс медиана бан тотҡарлығы һәм 72 сәғәт VM soak эсендә 864 өлгөлә 0 хата.",
      "Был сайт — асыҡ тәҡдим итеү һәм йөкләү бите — статик эстәлек. Программа һеҙҙең Linux серверыгыҙҙа эшләй; мәғлүмәтегеҙ һеҙҙә ҡала.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity һәм CrowdSec'ты айырым урынлаштырыу урынына, Log Guardian өсөһөн бер self-hosted пакетта берләштерә.",
    why_bodies: [
      "nginx логы → OWASP CRS → ~17 мс kernel ban. Fail2ban + ModSec + скрипт өйөмө юҡ.",
      "competitive-proof PDF, 75 тест, 72 сәғәт soak — көндәштәрҙә юҡ йәки өлөшлө.",
      "Асыҡ код, төрөксә документтар, self-hosted — вендорға бәйлелек юҡ.",
      "ModSec'тың inline EPS'ы түгел; CDN L3/L4'ты һеңдерә. Origin'да интеграция + тиҙлек.",
      "Fail2ban, ModSecurity, CrowdSec айырым түгел — ban + WAF + SOC бер продуктта.",
      "Медиана бан ~17 мс — Fail2ban/CrowdSec секунд–минут кимәлендә; 5 үлсәнгән өлгө.",
      "JA3 кластер recall 100% — 80 IP тура тест; IP буйынса ban + кластерҙы асыҡлау.",
      "Telegram alert + бер баҫып ack, SOC ваҡыт һыҙығы, tenant метрикалары — урынлаштырғас :8443.",
    ],
    merge_bodies: [
      "Айырым Fail2ban юҡ. Лог юлынан ipset/XDP kernel банға ~17 мс — сәйәсәт, tenant, FP trust бер pipeline'да.",
      "Айырым ModSecurity модуле юҡ. OWASP CRS 121 ҡағиҙә, PCRE2 JIT — nginx лог юлынан бер үтеү.",
      "Өлөшлө CrowdSec стегы юҡ. Prometheus, SOC ваҡыт һыҙығы, 75 тест, 14 дәлил файлы, Telegram идара — бер панель.",
    ],
  },
  cv: {
    hero_side_body:
      "nginx кӗрӳ лог йӗркинчен ipset бана ҫитиччен пӗр сӑнчӑр: parser, OWASP CRS/WAF хаклани тата ~17 мс kernel бан. Конкурентсем татӑк-татӑк архитектура сӗнеҫҫӗ — эпир пурне те виҫнӗ, тепӗр хут тӑвакан PDF/JSON кӑтартупа пӗр сӑнчӑрта пӗрлештеретпӗр. Турцире тунӑ, MIT уҫӑ код, пӗтӗмпех self-hosted.",
    about_paragraphs: [
      "Fail2ban тӳрех бан ҫеҫ тӑвать, ModSecurity WAF уйрӑм модуль, CrowdSec татӑк-татӑк стек ыйтать. Log Guardian вӗсене пӗрлештерет: лог йӗрки → parser → CRS/WAF (PCRE2 JIT) → ban pipeline (политика + tenant) → ipset/XDP kernel → Prometheus метрикисем тата панель SOC вӑхӑт линийӗ.",
      "Результатсем виҫме тата тепӗр хут тума пулаҫҫӗ: чӑн тапӑну корпусӗнче recall 100%, OWASP CRS паритечӗ 100%, 0.2% суя позитив, ~17 мс медиана бан кӗтӗвӗ тата 72 сехет VM soak ӑшӗнче 864 тӗслӗхре 0 йӑнӑш.",
      "Ку сайт — уҫӑ паллаштару тата анлантару страници — статик контент. Программа сирӗн Linux серверӗнче ӗҫлет; сирӗн даннӑйсем сирӗнте юлаҫҫӗ.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity тата CrowdSec-а уйрӑммӑн вырнаҫтарас вырӑнне, Log Guardian виҫҫӗшне те пӗр self-hosted пакетра пӗрлештерет.",
    why_bodies: [
      "nginx логӗ → OWASP CRS → ~17 мс kernel бан. Fail2ban + ModSec + скрипт купи ҫук.",
      "competitive-proof PDF, 75 тест, 72 сехет soak — конкурентсен ҫук е татӑк-татӑк.",
      "Уҫӑ код, тӗрӗкле документсем, self-hosted — вендора ҫыхӑнни ҫук.",
      "ModSec inline EPS мар; CDN L3/L4-а ҫӑтать. Origin ҫинче интеграци + хӑвӑртлӑх.",
      "Fail2ban, ModSecurity, CrowdSec уйрӑм мар — бан + WAF + SOC пӗр продуктра.",
      "Медиана бан ~17 мс — Fail2ban/CrowdSec ҫекунт–минут шайӗнче; 5 виҫнӗ тӗслӗх.",
      "JA3 кластер recall 100% — 80 IP чӗрӗ тест; IP тӑрӑх бан + кластер тупни.",
      "Telegram alert + пӗр пусса ack, SOC вӑхӑт линийӗ, tenant метрикисем — вырнаҫтарнӑ хыҫҫӑн :8443.",
    ],
    merge_bodies: [
      "Уйрӑм Fail2ban ҫук. Лог йӗркинчен ipset/XDP kernel бана ~17 мс — политика, tenant, FP trust пӗр pipeline-ра.",
      "Уйрӑм ModSecurity модуль ҫук. OWASP CRS 121 правило, PCRE2 JIT — nginx лог йӗркинчен пӗр иртни.",
      "Татӑк-татӑк CrowdSec стек ҫук. Prometheus, SOC вӑхӑт линийӗ, 75 тест, 14 кӑтарту файлӗ, Telegram майлашу — пӗр панель.",
    ],
  },
  crh: {
    hero_side_body:
      "nginx kirim log satırından ipset banğa qadar tek zıncır: parser, OWASP CRS/WAF qıymetlendirüv ve ~17 ms kernel ban. Raqipler parça-parça mimarlıq teklif ete — biz episini ölçengen, tekrar tüzülgen PDF/JSON delilnen tek zıncırda birleştiremiz. Türkiyede yapılğan, MIT açıq kod, tamamen self-hosted.",
    about_paragraphs: [
      "Fail2ban tek ban yapa, ModSecurity WAF ayrı modul, CrowdSec parça-parça stek ister. Log Guardian olarnı birleştire: log satırı → parser → CRS/WAF (PCRE2 JIT) → ban pipeline (siyaset + tenant) → ipset/XDP kernel → Prometheus metrikaları ve pan'el SOC vaqıt sızığı.",
      "Neticeler ölçele bile ve tekrar tüzüle bile: kerçek hücum korpusında recall 100%, OWASP CRS pariteti 100%, 0.2% yañlış pozitiv, ~17 ms mediana ban keçikmesi ve 72 saat VM soak içinde 864 örnekte 0 hata.",
      "Bu sayt açıq tanıtım ve endirüv sahifesi — statik mündericat. Yazılım öz Linux serverıñızda çalışa; malümatıñız sizde qala.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity ve CrowdSec'ni ayrı qurmaq yerine, Log Guardian üçüsini bir self-hosted pakette birleştire.",
    why_bodies: [
      "nginx logu → OWASP CRS → ~17 ms kernel ban. Fail2ban + ModSec + skript yığını yoq.",
      "competitive-proof PDF, 75 test, 72 saat soak — raqiplerde yoq ya da parça-parça.",
      "Açıq kod, türkçe vesiqalar, self-hosted — vendor bağlılığı yoq.",
      "ModSec'niñ inline EPS'i degil; CDN L3/L4'ni yuta. Origin'de integratsiya + tezlik.",
      "Fail2ban, ModSecurity, CrowdSec ayrı degil — ban + WAF + SOC bir mahsulda.",
      "Mediana ban ~17 ms — Fail2ban/CrowdSec saniye–daqiqa seviyesinde; 5 ölçengen örnek.",
      "JA3 klaster recall 100% — 80 IP canlı test; IP başına ban + klaster tapuv.",
      "Telegram alert + bir basıp ack, SOC vaqıt sızığı, tenant metrikaları — qurulımdan soñ :8443.",
    ],
    merge_bodies: [
      "Ayrı Fail2ban yoq. Log satırından ipset/XDP kernel banğa ~17 ms — siyaset, tenant, FP trust bir pipeline'da.",
      "Ayrı ModSecurity modul yoq. OWASP CRS 121 qaide, PCRE2 JIT — nginx log satırından bir keçüv.",
      "Parça-parça CrowdSec stek yoq. Prometheus, SOC vaqıt sızığı, 75 test, 14 delil faylı, Telegram idare — bir pan'el.",
    ],
  },
  gag: {
    hero_side_body:
      "nginx giriş log satırından ipset bana kadar tek zincir: parser, OWASP CRS/WAF diişilmesi hem ~17 ms kernel ban. Rakiplär parça-parça mimarlık verer — biz hepsini ölçülü, tekrar yapılabilän PDF/JSON delillän tek zincirdä birleştireriz. Türkiyedä yapıldı, MIT açık kod, bütünnä self-hosted.",
    about_paragraphs: [
      "Fail2ban salt ban yapêr, ModSecurity WAF ayırı modül, CrowdSec parça-parça stek ister. Log Guardian onnarı birleştirer: log satırı → parser → CRS/WAF (PCRE2 JIT) → ban pipeline (politika + tenant) → ipset/XDP kernel → Prometheus metrikaları hem panel SOC zaman çizgisi.",
      "Sonuçlar ölçülebilir hem tekrar yapılabilir: gerçek saldırı korpusunda recall 100%, OWASP CRS pariteti 100%, 0.2% yalancı pozitiv, ~17 ms mediana ban gecikmesi hem 72 saat VM soak içindä 864 örnektä 0 hata.",
      "Bu sayt açık tanıtım hem indirmäk sayfası — statik içerik. Yazılım kendi Linux serverindä çalışêr; bilgileriniz sizdä kalêr.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity hem CrowdSec'i ayırı kurmak erinä, Log Guardian üçünü bir self-hosted pakettä birleştirer.",
    why_bodies: [
      "nginx logu → OWASP CRS → ~17 ms kernel ban. Fail2ban + ModSec + skript yıını yok.",
      "competitive-proof PDF, 75 test, 72 saat soak — rakiplerdä yok osaydı parça-parça.",
      "Açık kod, türkçä dokumentlär, self-hosted — vendor baalantısı yok.",
      "ModSec'in inline EPS'i diil; CDN L3/L4'ü yudêr. Origin'dä integratsiya + hız.",
      "Fail2ban, ModSecurity, CrowdSec ayırı diil — ban + WAF + SOC bir üründä.",
      "Mediana ban ~17 ms — Fail2ban/CrowdSec saniye–dakika kertindä; 5 ölçülü örnek.",
      "JA3 klaster recall 100% — 80 IP canlı test; IP başına ban + klaster bulması.",
      "Telegram alert + bir basmaklan ack, SOC zaman çizgisi, tenant metrikaları — kurmadan sora :8443.",
    ],
    merge_bodies: [
      "Ayırı Fail2ban yok. Log satırından ipset/XDP kernel bana ~17 ms — politika, tenant, FP trust bir pipeline'dä.",
      "Ayırı ModSecurity modül yok. OWASP CRS 121 kural, PCRE2 JIT — nginx log satırından bir geçmäk.",
      "Parça-parça CrowdSec stek yok. Prometheus, SOC zaman çizgisi, 75 test, 14 delil dosyası, Telegram işlemäk — bir panel.",
    ],
  },
  ug: {
    hero_side_body:
      "nginx كىرىش خاتىرە قۇرىدىن ipset چەكلەشكىچە بىرلا زەنجىر: parser، OWASP CRS/WAF باھالاش ۋە ~17 مىللىسېكۇنت يادرو چەكلىشى. رەقىبلەر پارچە قۇرۇلما تەمىنلەيدۇ — بىز ھەممىنى ئۆلچەنگەن، قايتا ياسىغىلى بولىدىغان PDF/JSON ئىسپاتى بىلەن بىرلا زەنجىرگە بىرلەشتۈرىمىز. تۈركىيەدە ياسالغان، MIT ئوچۇق كود، تولۇق self-hosted.",
    about_paragraphs: [
      "Fail2ban پەقەت چەكلەيدۇ، ModSecurity WAF ئايرىم مودۇل، CrowdSec پارچە سىتاك تەلەپ قىلىدۇ. Log Guardian ئۇلارنى بىرلەشتۈرىدۇ: خاتىرە قۇرى → parser → CRS/WAF (PCRE2 JIT) → چەكلەش quburى (سىياسەت + tenant) → ipset/XDP يادرو → Prometheus مېترىكىلىرى ۋە تاختا SOC ۋاقىت سىزىقى.",
      "نەتىجىلەر ئۆلچىگىلى ۋە قايتا ياسىغىلى بولىدۇ: ھەقىقىي ھۇجۇم كورپۇسىدا recall 100%، OWASP CRS تەڭپۇڭلۇقى 100%، 0.2% يالغان مۇسبەت، ~17 مىللىسېكۇنت ئوتتۇرا چەكلەش كېچىكىشى ۋە 72 سائەت VM soak ئىچىدە 864 نەمۇنىدە 0 خاتالىق.",
      "بۇ بەت ئوچۇق تونۇشتۇرۇش ۋە چۈشۈرۈش بېتى — مۇقىم مەزمۇن. يۇمشاق دېتال ئۆزىڭىزنىڭ Linux مۇلازىمېتىرىدا ئىشلەيدۇ؛ سانلىق مەلۇماتىڭىز سىزدە قالىدۇ.",
    ],
    pkg_hero:
      "Fail2ban، ModSecurity ۋە CrowdSec نى ئايرىم ئورنىتىشنىڭ ئورنىغا، Log Guardian ئۈچىنى بىر self-hosted بولاققا بىرلەشتۈرىدۇ.",
    why_bodies: [
      "nginx خاتىرىسى → OWASP CRS → ~17 مىللىسېكۇنت يادرو چەكلىشى. Fail2ban + ModSec + skript دۆۋىسى يوق.",
      "competitive-proof PDF، 75 سىناق، 72 سائەت soak — رەقىبلەردە يوق ياكى پارچە-پارچە.",
      "ئوچۇق كود، تۈركچە ھۆججەتلەر، self-hosted — ساتقۇچىغا باغلىنىش يوق.",
      "ModSec نىڭ inline EPS ئەمەس؛ CDN L3/L4 نى سىڭدۈرىدۇ. Origin دا بىرلەشتۈرۈش + سۈرئەت.",
      "Fail2ban، ModSecurity، CrowdSec ئايرىم ئەمەس — چەكلەش + WAF + SOC بىر مەھسۇلاتتا.",
      "ئوتتۇرا چەكلەش ~17 مىللىسېكۇنت — Fail2ban/CrowdSec سېكۇنت–مىنۇت دەرىجىسىدە؛ 5 ئۆلچەنگەن نەمۇنە.",
      "JA3 توپلام recall 100% — 80 IP جانلىق سىناق؛ IP بويىچە چەكلەش + توپلام بايقاش.",
      "Telegram ئاگاھلاندۇرۇش + بىر بېسىپ ack، SOC ۋاقىت سىزىقى، tenant مېترىكىلىرى — ئورناتقاندىن كېيىن :8443.",
    ],
    merge_bodies: [
      "ئايرىم Fail2ban يوق. خاتىرە قۇرىدىن ipset/XDP يادرو چەكلىشىگە ~17 مىللىسېكۇنت — سىياسەت، tenant، FP trust بىر quburدا.",
      "ئايرىم ModSecurity مودۇلى يوق. OWASP CRS 121 قائىدە، PCRE2 JIT — nginx خاتىرە قۇرىدىن بىر ئۆتۈش.",
      "پارچە CrowdSec سىتاك يوق. Prometheus، SOC ۋاقىت سىزىقى، 75 سىناق، 14 ئىسپات ھۆججىتى، Telegram باشقۇرۇش — بىر تاختا.",
    ],
  },
  sah: {
    hero_side_body:
      "nginx киирии лог строкатыттан ipset баҥҥа тиийэ биир сиэп: parser, OWASP CRS/WAF сыаналааһын уонна ~17 мс kernel бан. Күрэхтэһээччилэр аҥаардас архитектураны тэлэллэр — биһиги барытын кээмэйдэммит, хат оҥоһуллар PDF/JSON туоһунан биир сиэпкэ холбуубут. Турцияҕа оҥоһуллубут, MIT аһаҕас код, толору self-hosted.",
    about_paragraphs: [
      "Fail2ban эрэ бан оҥорор, ModSecurity WAF туспа модуль, CrowdSec аҥаардас стеги ирдиир. Log Guardian кинилэри холбуур: лог строката → parser → CRS/WAF (PCRE2 JIT) → бан pipeline (политика + tenant) → ipset/XDP kernel → Prometheus метриктэрэ уонна панель SOC кэм линията.",
      "Түмүктэр кээмэйдэнэллэр уонна хат оҥоһуллаллар: чахчы саба түһүү корпуһугар recall 100%, OWASP CRS паритета 100%, 0.2% сымыйа позитив, ~17 мс медиана бан хойутааһына уонна 72 чаас VM soak иһигэр 864 холобурга 0 алҕас.",
      "Бу сайт — аһаҕас билиһиннэрии уонна хачайдааһын сирэйэ — статичнай ис хоһоон. Программа эн бэйэҥ Linux серверыгар үлэлиир; дааннайдарыҥ эйиэхэ хаалаллар.",
    ],
    pkg_hero:
      "Fail2ban, ModSecurity уонна CrowdSec-ы туспа олохтооһун оннугар, Log Guardian үһүнү биир self-hosted пакеккэ холбуур.",
    why_bodies: [
      "nginx лога → OWASP CRS → ~17 мс kernel бан. Fail2ban + ModSec + скрипт бөҕө суох.",
      "competitive-proof PDF, 75 тест, 72 чаас soak — күрэхтэһээччилэргэ суох эбэтэр аҥаардас.",
      "Аһаҕас код, түүрдүү докумуоннар, self-hosted — вендорга сыһыаны суох.",
      "ModSec inline EPS буолбатах; CDN L3/L4-у ыҥырар. Origin-га интеграция + түргэн.",
      "Fail2ban, ModSecurity, CrowdSec туспа буолбатах — бан + WAF + SOC биир бородууксуйаҕа.",
      "Медиана бан ~17 мс — Fail2ban/CrowdSec сөкүүндэ–мүнүөтэ таһымыгар; 5 кээмэйдэммит холобур.",
      "JA3 кластер recall 100% — 80 IP тыыннаах тест; IP аайы бан + кластеры булуу.",
      "Telegram alert + биир баттаан ack, SOC кэм линията, tenant метриктэрэ — олохтообутуҥ кэнниттэн :8443.",
    ],
    merge_bodies: [
      "Туспа Fail2ban суох. Лог строкатыттан ipset/XDP kernel баҥҥа ~17 мс — политика, tenant, FP trust биир pipeline-га.",
      "Туспа ModSecurity модуль суох. OWASP CRS 121 быраабыла, PCRE2 JIT — nginx лог строкатыттан биир ааһыы.",
      "Аҥаардас CrowdSec стеги суох. Prometheus, SOC кэм линията, 75 тест, 14 туоһу файла, Telegram салайыы — биир панель.",
    ],
  },
};

function applyOverride(base: SectionCopy, o: ShortOverride): SectionCopy {
  const { why_titles, stats_labels, ...scalars } = o;
  return {
    ...base,
    ...scalars,
    why_cards: why_titles
      ? base.why_cards.map((c, i) => ({ title: why_titles[i] ?? c.title, body: c.body }))
      : base.why_cards,
    stats: stats_labels
      ? base.stats.map((s, i) => ({ value: s.value, label: stats_labels[i] ?? s.label }))
      : base.stats,
  };
}

// Full body prose (Hero side, About paragraphs, Why-card bodies, package /
// 3-in-1 merge bodies) per locale. Any field left undefined keeps the base.
type SectionBody = {
  hero_side_body?: string;
  about_paragraphs?: string[];
  pkg_hero?: string;
  why_bodies?: string[]; // 8
  merge_bodies?: string[]; // 3
};

function applyBody(base: SectionCopy, b: SectionBody): SectionCopy {
  return {
    ...base,
    hero_side_body: b.hero_side_body ?? base.hero_side_body,
    about_paragraphs: b.about_paragraphs ?? base.about_paragraphs,
    pkg_hero: b.pkg_hero ?? base.pkg_hero,
    why_cards: b.why_bodies
      ? base.why_cards.map((c, i) => ({ title: c.title, body: b.why_bodies![i] ?? c.body }))
      : base.why_cards,
    merge: b.merge_bodies
      ? base.merge.map((m, i) => ({ ...m, body: b.merge_bodies![i] ?? m.body }))
      : base.merge,
  };
}

export function getSections(locale: Locale): SectionCopy {
  if (locale === "tr") return TR;
  if (locale === "en") return EN;
  const base = TURKIC.includes(locale) ? TR : EN;
  const override = SHORT_OVERRIDES[locale];
  let copy = override ? applyOverride(base, override) : base;
  const body = SECTION_BODIES[locale];
  if (body) copy = applyBody(copy, body);
  return copy;
}

export function metricLabel(locale: Locale, label: string): string {
  const s = getSections(locale);
  return s.metric_labels[label] ?? label;
}

/** METRICS items stay numeric — only group labels translate via metric_groups */
export { TR as METRICS_TR };
