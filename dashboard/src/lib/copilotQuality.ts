import type { Locale } from "@/lib/i18n";

/** Kucuk Ollama modellerinin Turkce ciktisini tespit eder (Ingilizce karisim, anlamsiz kelimeler). */
export function isCopilotReplyLowQuality(content: string, locale: Locale): boolean {
  const t = content.trim();
  if (t.length < 40) return true;

  if (locale !== "tr") return false;

  const englishHits = t.match(
    /\b(successful|unavailable|detailed|available|data|obtain|normal|activity|risk|agent|alert|tree)\b/gi,
  );
  if (englishHits && englishHits.length >= 2) return true;

  if (/[àáâãäåèéêëìíîïòóôõùúûü]/i.test(t)) return true;

  const garbage = /egr[eé]|epsyon|gardyan agent|ransomware egr/i.test(t);
  if (garbage) return true;

  const words = t.split(/\s+/);
  const latinOnly = words.filter((w) => /^[a-zA-Z]+$/.test(w) && w.length > 3).length;
  if (latinOnly / words.length > 0.25) return true;

  return false;
}

/** Turkce/Rusca icin yapilandirilmis mod (kucuk LLM yerel dili bozar). COPILOT_FORCE_LLM=1 ile acilir. */
export function shouldPreferStructuredReply(locale: Locale, _model: string): boolean {
  if (process.env.COPILOT_FORCE_LLM === "1") return false;
  if (locale === "tr") return process.env.COPILOT_STRUCTURED_TR !== "0";
  if (locale === "ru") return process.env.COPILOT_STRUCTURED_RU !== "0";
  return false;
}

export function pickCopilotModel(availableHint?: string): string {
  const env =
    process.env.COPILOT_MODEL || process.env.OLLAMA_MODEL || availableHint || "llama3.2:3b";
  if (process.env.COPILOT_MODEL) return env;
  if (env.includes("llama3.2:3b")) {
    return process.env.COPILOT_MODEL_TR || "qwen2.5-coder:7b";
  }
  return env;
}

export function turkishSocPrompt(): string {
  return `KRITIK KURALLAR (Log Guardian Turkce asistani):
- Yalnizca Log Guardian platformu hakkinda konus (filo, tehdit, RCE, ban, uyumluluk, dashboard).
- Log Guardian disi konulara yanit verme.
- Yalnizca duzgun Turkce yaz. Ingilizce kelime KULLANMA (RCE, EPS, SIEM, IP, BAN_IP haric).
- Verilen rakamlari degistirme, uydurma.
- 4-6 cumle veya madde; net, profesyonel, kisa.`;
}
