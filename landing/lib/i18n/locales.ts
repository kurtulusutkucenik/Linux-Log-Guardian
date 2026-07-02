export type Locale =
  | "tr"
  | "en"
  | "ru"
  | "zh"
  | "ar"
  | "es"
  | "de"
  | "fr"
  | "pt"
  | "nl"
  | "ko"
  | "ja"
  | "az"
  | "kk"
  | "uz"
  | "ky"
  | "tk"
  | "ug"
  | "tt"
  | "ba"
  | "cv"
  | "crh"
  | "gag"
  | "sah";

export interface LocaleInfo {
  code: Locale;
  label: string;
  native: string;
  group: "turkic" | "other";
}

export const LOCALES: LocaleInfo[] = [
  { code: "tr", label: "Türkçe", native: "Türkçe", group: "turkic" },
  { code: "az", label: "Azerbaycanca", native: "Azərbaycan", group: "turkic" },
  { code: "kk", label: "Kazakça", native: "Қазақша", group: "turkic" },
  { code: "uz", label: "Özbekçe", native: "Oʻzbek", group: "turkic" },
  { code: "ky", label: "Kırgızca", native: "Кыргызча", group: "turkic" },
  { code: "tk", label: "Türkmence", native: "Türkmen", group: "turkic" },
  { code: "ug", label: "Uygurca", native: "ئۇيغۇرچە", group: "turkic" },
  { code: "tt", label: "Tatarca", native: "Татарча", group: "turkic" },
  { code: "ba", label: "Başkurtça", native: "Башҡортса", group: "turkic" },
  { code: "cv", label: "Çuvaşça", native: "Чăвашла", group: "turkic" },
  { code: "crh", label: "Kırım Tatarcası", native: "Qırımtatarca", group: "turkic" },
  { code: "gag", label: "Gagavuzca", native: "Gagauz", group: "turkic" },
  { code: "sah", label: "Yakutça", native: "Саха", group: "turkic" },
  { code: "en", label: "English", native: "English", group: "other" },
  { code: "ru", label: "Rusça", native: "Русский", group: "other" },
  { code: "zh", label: "Çince", native: "中文", group: "other" },
  { code: "ko", label: "Korece", native: "한국어", group: "other" },
  { code: "ja", label: "Japonca", native: "日本語", group: "other" },
  { code: "nl", label: "Felemenkçe", native: "Nederlands", group: "other" },
  { code: "ar", label: "Arapça", native: "العربية", group: "other" },
  { code: "es", label: "İspanyolca", native: "Español", group: "other" },
  { code: "de", label: "Almanca", native: "Deutsch", group: "other" },
  { code: "fr", label: "Fransızca", native: "Français", group: "other" },
  { code: "pt", label: "Portekizce", native: "Português", group: "other" },
];

export type Messages = {
  nav_home: string;
  nav_about: string;
  nav_pipeline: string;
  nav_rivals: string;
  nav_setup: string;
  nav_tests: string;
  nav_contact: string;
  cta_setup: string;
  hero_badge: string;
  hero_tagline: string;
  lang_label: string;
  turk_made: string;
};

const TR: Messages = {
  nav_home: "Ana sayfa",
  nav_about: "Nedir",
  nav_pipeline: "Pipeline",
  nav_rivals: "Rakipler",
  nav_setup: "Kurulum",
  nav_tests: "Testler",
  nav_contact: "İletişim",
  cta_setup: "15 dk kurulum",
  hero_badge: "//:LOG→BAN · SYSTEM ONLINE",
  hero_tagline: "nginx access log → WAF/CRS → kernel ban · tek zincir · self-hosted",
  lang_label: "Dil",
  turk_made: "TÜRK YAPIMI",
};

const EN: Messages = {
  nav_home: "Home",
  nav_about: "About",
  nav_pipeline: "Pipeline",
  nav_rivals: "Compare",
  nav_setup: "Setup",
  nav_tests: "Tests",
  nav_contact: "Contact",
  cta_setup: "15 min setup",
  hero_badge: "//:LOG→BAN · SYSTEM ONLINE",
  hero_tagline: "nginx access log → WAF/CRS → kernel ban · single chain · self-hosted",
  lang_label: "Language",
  turk_made: "MADE IN TURKEY",
};

const RU: Messages = {
  ...EN,
  nav_home: "Главная",
  nav_about: "О проекте",
  nav_rivals: "Сравнение",
  nav_setup: "Установка",
  nav_tests: "Тесты",
  nav_contact: "Контакт",
  cta_setup: "Установка 15 мин",
  lang_label: "Язык",
  turk_made: "СДЕЛАНО В ТУРЦИИ",
};

const ZH: Messages = {
  ...EN,
  nav_home: "首页",
  nav_about: "简介",
  nav_rivals: "对比",
  nav_setup: "安装",
  nav_tests: "测试",
  nav_contact: "联系",
  cta_setup: "15分钟安装",
  lang_label: "语言",
  turk_made: "土耳其制造",
};

const AR: Messages = {
  ...EN,
  nav_home: "الرئيسية",
  nav_about: "ما هو",
  nav_rivals: "المقارنة",
  nav_setup: "التثبيت",
  nav_tests: "الاختبارات",
  nav_contact: "اتصل",
  cta_setup: "تثبيت 15 دقيقة",
  lang_label: "اللغة",
  turk_made: "صنع في تركيا",
};

const ES: Messages = {
  ...EN,
  nav_home: "Inicio",
  nav_about: "Qué es",
  nav_rivals: "Rivales",
  nav_setup: "Instalación",
  nav_tests: "Pruebas",
  nav_contact: "Contacto",
  cta_setup: "Instalación 15 min",
  lang_label: "Idioma",
  turk_made: "HECHO EN TURQUÍA",
};

const DE: Messages = {
  ...EN,
  nav_home: "Start",
  nav_about: "Über",
  nav_rivals: "Vergleich",
  nav_setup: "Installation",
  nav_tests: "Tests",
  nav_contact: "Kontakt",
  cta_setup: "15 Min Setup",
  lang_label: "Sprache",
  turk_made: "AUS TÜRKEI",
};

const FR: Messages = {
  ...EN,
  nav_home: "Accueil",
  nav_about: "À propos",
  nav_rivals: "Comparaison",
  nav_setup: "Installation",
  nav_tests: "Tests",
  nav_contact: "Contact",
  cta_setup: "Installation 15 min",
  lang_label: "Langue",
  turk_made: "FABRIQUÉ EN TURQUIE",
};

const PT: Messages = {
  ...EN,
  nav_home: "Início",
  nav_about: "Sobre",
  nav_rivals: "Comparar",
  nav_setup: "Instalação",
  nav_tests: "Testes",
  nav_contact: "Contato",
  cta_setup: "Instalação 15 min",
  lang_label: "Idioma",
  turk_made: "FEITO NA TURQUIA",
};

const NL: Messages = {
  ...EN,
  nav_home: "Home",
  nav_about: "Over",
  nav_rivals: "Vergelijk",
  nav_setup: "Installatie",
  nav_tests: "Tests",
  nav_contact: "Contact",
  cta_setup: "15 min installatie",
  lang_label: "Taal",
  turk_made: "GEMAAKT IN TURKIJE",
};

const KO: Messages = {
  ...EN,
  nav_home: "홈",
  nav_about: "소개",
  nav_rivals: "비교",
  nav_setup: "설치",
  nav_tests: "테스트",
  nav_contact: "연락",
  cta_setup: "15분 설치",
  lang_label: "언어",
  turk_made: "터키 제조",
};

const JA: Messages = {
  ...EN,
  nav_home: "ホーム",
  nav_about: "概要",
  nav_rivals: "比較",
  nav_setup: "セットアップ",
  nav_tests: "テスト",
  nav_contact: "連絡",
  cta_setup: "15分セットアップ",
  lang_label: "言語",
  turk_made: "トルコ製",
};

const AZ: Messages = {
  ...TR,
  nav_home: "Ana səhifə",
  nav_about: "Nədir",
  nav_rivals: "Rəqiblərlə",
  nav_setup: "Quraşdırma",
  nav_tests: "Testlər",
  nav_contact: "Əlaqə",
  cta_setup: "15 dəq quraşdırma",
  lang_label: "Dil",
  turk_made: "TÜRK İSTEHSALI",
  hero_tagline: "nginx access log → WAF/CRS → kernel ban · tək zəncir · self-hosted",
};

const KK: Messages = {
  ...TR,
  nav_home: "Басты бет",
  nav_about: "Не",
  nav_rivals: "Салыстыру",
  nav_setup: "Орнату",
  nav_tests: "Тесттер",
  nav_contact: "Байланыс",
  cta_setup: "15 мин орнату",
  lang_label: "Тіл",
  turk_made: "ТҮРКИЯДА ЖАСАЛҒАН",
};

const UZ: Messages = {
  ...TR,
  nav_home: "Bosh sahifa",
  nav_about: "Nima",
  nav_rivals: "Raqobatchilar",
  nav_setup: "O'rnatish",
  nav_tests: "Testlar",
  nav_contact: "Aloqa",
  cta_setup: "15 daq o'rnatish",
  lang_label: "Til",
  turk_made: "TURKIYADA ISHLAB CHIQARILGAN",
};

const KY: Messages = {
  ...TR,
  nav_home: "Башкы бет",
  nav_about: "Эмне",
  nav_rivals: "Салыштыруу",
  nav_setup: "Орнотуу",
  nav_tests: "Тесттер",
  nav_contact: "Байланыш",
  cta_setup: "15 мүн орнотуу",
  lang_label: "Тил",
  turk_made: "ТҮРКИЯДА ЖАСАЛГАН",
};

const TK: Messages = {
  ...TR,
  nav_home: "Baş sahypa",
  nav_about: "Näme",
  nav_rivals: "Bäsdeşler",
  nav_setup: "Gurnama",
  nav_tests: "Testler",
  nav_contact: "Aragatnaşyk",
  cta_setup: "15 min gurnama",
  lang_label: "Dil",
  turk_made: "TÜRKIÝADA ÖNDÜRILEN",
};

const UG: Messages = { ...TR, lang_label: "تىل", turk_made: "تۈركىيەدە ياسالغان" };
const TT: Messages = { ...TR, nav_home: "Баш бит", lang_label: "Тел", turk_made: "ТӨРКИЯДӘ ЯСАЛГАН" };
const BA: Messages = { ...TR, nav_home: "Баш бит", lang_label: "Тел", turk_made: "ТӨРКИЯЛА ЭШЛӘНГӘН" };
const CV: Messages = { ...TR, lang_label: "Чĕлхе", turk_made: "ТУРЦИРӐ ХӐТЛӨНӖ" };
const CRH: Messages = { ...TR, nav_home: "Baş saife", lang_label: "Til", turk_made: "TÜRKİYEDE YASALĞAN" };
const GAG: Messages = { ...TR, nav_home: "Baş sayfa", lang_label: "Liman", turk_made: "TÜRKIYADAN" };
const SAH: Messages = { ...TR, nav_home: "Сүрүн", lang_label: "Тыл", turk_made: "ТУРКИЯТТАҒЫ" };

export const MESSAGES: Record<Locale, Messages> = {
  tr: TR,
  en: EN,
  ru: RU,
  zh: ZH,
  ar: AR,
  es: ES,
  de: DE,
  fr: FR,
  pt: PT,
  nl: NL,
  ko: KO,
  ja: JA,
  az: AZ,
  kk: KK,
  uz: UZ,
  ky: KY,
  tk: TK,
  ug: UG,
  tt: TT,
  ba: BA,
  cv: CV,
  crh: CRH,
  gag: GAG,
  sah: SAH,
};

export const DEFAULT_LOCALE: Locale = "tr";

export function isLocale(v: string): v is Locale {
  return v in MESSAGES;
}
