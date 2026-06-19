/* Linux Log Guardian — statik site çevirileri */
/*__I18N__*/



const LANG_KEY = "lg_website_lang";
const DEFAULT_LANG = "tr";
const __lgExpected = typeof document !== "undefined"
  ? (document.querySelector('meta[name="lg-integrity-i18n"]')?.getAttribute("content") || "")
  : "";
const __lgCssExpected = typeof document !== "undefined"
  ? (document.querySelector('meta[name="lg-integrity-css"]')?.getAttribute("content") || "")
  : "";
const __lgScript = typeof document !== "undefined"
  ? (document.currentScript || document.querySelector('script[src*="i18n.js"]'))
  : null;
const __lgCssLink = typeof document !== "undefined" ? document.getElementById("lg-site-css") : null;
const __lgSriOk = !!(
  __lgScript &&
  __lgExpected &&
  __lgCssExpected &&
  __lgCssLink &&
  __lgScript.integrity &&
  __lgScript.integrity === __lgExpected &&
  __lgCssLink.integrity === __lgCssExpected &&
  __lgScript.getAttribute("crossorigin") === "anonymous" &&
  !__lgCssLink.hasAttribute("crossorigin")
);
const ALLOWED_LANGS = new Set(Object.keys(I18N));
const ALLOWED_HTML_TAGS = new Set([
  "P", "STRONG", "EM", "B", "I", "UL", "OL", "LI", "CODE", "BR", "SPAN", "A"
]);
const MAX_I18N_HTML_LEN = 8192;
const UNSAFE_HTML_RE = /(<script|<iframe|<object|<embed|<link|<meta|<style|javascript:|vbscript:|data:text\/html|on[a-z]+\s*=|&#x?[0-9a-f]+;)/i;
const HTML_HINT_RE = /<[a-z!/]/i;

let ttPolicy = null;
let __lgApplyingI18n = false;
if (typeof window !== "undefined" && window.trustedTypes && window.trustedTypes.createPolicy) {
  try {
    ttPolicy = window.trustedTypes.createPolicy("lgI18n", {
      createHTML: (input) => sanitizeHtml(String(input)),
    });
  } catch (_) {}
}

function sanitizeHtml(html) {
  if (!html) return "";
  if (html.length > MAX_I18N_HTML_LEN) return "";
  if (/\0/.test(html)) return "";
  if (UNSAFE_HTML_RE.test(html)) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");
  const out = document.createElement("div");

  function appendSafe(parent, node) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(node.textContent));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName;
    if (!ALLOWED_HTML_TAGS.has(tag)) {
      node.childNodes.forEach((child) => appendSafe(parent, child));
      return;
    }

    const el = document.createElement(tag.toLowerCase());
    if (tag === "A") {
      const href = (node.getAttribute("href") || "").trim();
      const lower = href.toLowerCase();
      if (!lower.startsWith("mailto:") || lower.includes("javascript:")) return;
      el.setAttribute("href", href);
      el.setAttribute("rel", "noopener noreferrer");
    }
    node.childNodes.forEach((child) => appendSafe(el, child));
    parent.appendChild(el);
  }

  doc.body.childNodes.forEach((child) => appendSafe(out, child));
  return out.innerHTML;
}

function stripHtmlToText(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function setSafeHtml(el, html) {
  const cleaned = sanitizeHtml(html);
  const payload = cleaned || stripHtmlToText(html);
  if (!payload) return;
  if (ttPolicy) {
    el.innerHTML = ttPolicy.createHTML(payload);
  } else {
    el.innerHTML = payload;
  }
}

function applyI18nElement(el, lang) {
  const key = el.getAttribute("data-i18n");
  if (!key || !/^[a-z0-9_.]+$/i.test(key)) return;
  const text = t(lang, key);
  if (text === undefined) return;
  if (el.tagName === "PRE") {
    el.textContent = text;
  } else if (HTML_HINT_RE.test(text)) {
    setSafeHtml(el, text);
  } else {
    el.textContent = text;
  }
}

function applyI18nAlt(lang) {
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    if (!key || !/^[a-z0-9_.]+$/i.test(key)) return;
    const text = t(lang, key);
    if (text) el.setAttribute("alt", stripHtmlToText(text));
  });
}

function isAllowedLang(lang) {
  return typeof lang === "string" && ALLOWED_LANGS.has(lang);
}

Object.freeze(ALLOWED_HTML_TAGS);
Object.freeze(ALLOWED_LANGS);
Object.freeze(I18N);
for (const lang of Object.keys(I18N)) {
  Object.freeze(I18N[lang]);
}

function t(lang, key) {
  return I18N[lang]?.[key] ?? I18N.en?.[key] ?? I18N.tr?.[key];
}

function setLang(lang) {
  if (!isAllowedLang(lang)) lang = DEFAULT_LANG;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    const desc = t(lang, "meta.description");
    if (desc) meta.setAttribute("content", desc);
  }
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const on = btn.dataset.lang === lang;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  __lgApplyingI18n = true;
  try {
    Array.from(document.querySelectorAll("[data-i18n]")).forEach((el) => {
      try {
        applyI18nElement(el, lang);
      } catch (_) {
        const key = el.getAttribute("data-i18n");
        const text = t(lang, key);
        if (text !== undefined) el.textContent = stripHtmlToText(text);
      }
    });
    applyI18nAlt(lang);
  } finally {
    __lgApplyingI18n = false;
  }
  try { sessionStorage.setItem(LANG_KEY, lang); } catch (_) {}
}

function getInitialLang() {
  let initial = DEFAULT_LANG;
  let hasSaved = false;
  try {
    const saved = sessionStorage.getItem(LANG_KEY);
    if (saved && isAllowedLang(saved)) { initial = saved; hasSaved = true; }
  } catch (_) {}
  if (!hasSaved) {
    const nav = (navigator.language || "").toLowerCase();
    const map = [
      ["zh", "zh"], ["ar", "ar"], ["ru", "ru"], ["pt", "pt"],
      ["es", "es"], ["fr", "fr"], ["de", "de"], ["en", "en"], ["tr", "tr"]
    ];
    for (const [prefix, code] of map) {
      if (nav.startsWith(prefix)) { initial = code; break; }
    }
  }
  return initial;
}

function purgeServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
}

function installDomGuard() {
  if (!__lgSriOk || installDomGuard.done) return;
  installDomGuard.done = true;
  const blocked = new Set(["SCRIPT", "IFRAME", "OBJECT", "EMBED", "BASE"]);
  new MutationObserver((mutations) => {
    if (__lgApplyingI18n) return;
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (blocked.has(node.tagName)) { node.remove(); continue; }
        if (node.tagName === "LINK" && node.id !== "lg-site-css") { node.remove(); continue; }
        node.querySelectorAll?.("script,iframe,object,embed,base,link:not(#lg-site-css)")
          .forEach((el) => el.remove());
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}

function bootI18n() {
  if (!__lgSriOk || bootI18n.done) return;
  bootI18n.done = true;
  purgeServiceWorkers();
  installDomGuard();
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-btn");
    if (!btn || !isAllowedLang(btn.dataset.lang)) return;
    e.preventDefault();
    setLang(btn.dataset.lang);
  });
  setLang(getInitialLang());
}

Object.freeze(bootI18n);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootI18n);
} else {
  bootI18n();
}
