import type { Locale } from "@/lib/i18n";

/** Log Guardian / SOC kapsami disi sorular. */
const LG_TOPIC =
  /log[\s-]?guardian|guardian|tehdit|threat|rce|execve|ban|engelle|filo|fleet|agent|alarm|eps|siem|ebpf|xdp|waf|attack.?tree|saldiri|uyumluluk|compliance|kvkk|pci|soc2|iso.?270|dashboard|daemon|telemetri|telemetry|olay|incident|mesh|tarpit|reports|copilot|node-|guard|waf|audit|ihlal|koruma|guvenlik|security|mitre|lineage|pod kill|ip[\s/]|banned|shell/i;

const OFF_TOPIC =
  /hava durumu|hava nasil|hava nolur|yarin hava|bugun hava|bugün hava|yemek tarif|film oner|dizi oner|futbol|basketbol|siyaset|secim|bitcoin|kripto fiyat|borsa|hisse|python ogren|javascript ogren|kod yaz|siir yaz|hikaye yaz|felsefe|psikoloji|iliski|ask |evlilik|tanisma|flort|oyun oner|minecraft|fortnite|gpt nedir|chatgpt|openai nedir|kim kazandi|mac skor/i;

const GREETING = /^(merhaba|selam|hey|hi|hello|günaydın|gunaydin|iyi günler)[\s!.?]*$/i;

export function isGreetingMessage(message: string): boolean {
  return GREETING.test(message.trim());
}

export function isLogGuardianTopic(message: string): boolean {
  const t = message.trim();
  if (!t) return false;
  if (GREETING.test(t)) return true;
  if (OFF_TOPIC.test(t)) return false;
  if (LG_TOPIC.test(t)) return true;
  return false;
}

export function logGuardianScopeRule(locale: Locale): string {
  const rules: Partial<Record<Locale, string>> = {
    tr: `KAPSAM KURALI (ZORUNLU):
- Sen yalnizca Log Guardian platformunun guvenlik asistanisin.
- Sadece su konularda konus: filo/agent telemetrisi, tehdit ozeti, RCE/execve, IP ban (BAN_IP), attack tree, SIEM, eBPF/XDP/WAF, uyumluluk raporlari (SOC2/PCI/KVKK), dashboard sayfalari (/fleet, /reports, /attack-tree, /copilot).
- Log Guardian disi sorulara (hava, yemek, genel sohbet, baska yazilimlar) yanit verme; nazikce kapsam disi oldugunu soyle ve LG ornek sorulari oner.`,
    en: `SCOPE RULE (MANDATORY):
- You are ONLY the Log Guardian security assistant.
- Discuss: fleet telemetry, threats, RCE, BAN_IP, attack tree, SIEM, eBPF, compliance reports, dashboard pages.
- Refuse off-topic questions; redirect to Log Guardian capabilities.`,
    de: `GULTIGKEITSBEREICH: Nur Log Guardian — Flotte, Bedrohungen, RCE, Compliance. Keine Off-Topic-Antworten.`,
    fr: `PERIMETRE: Uniquement Log Guardian — flotte, menaces, RCE, conformite. Refusez les sujets hors scope.`,
    ru: `ОБЛАСТЬ (ОБЯЗАТЕЛЬНО):
- Вы только ассистент безопасности Log Guardian.
- Темы: телеметрия флота, угрозы, RCE, BAN_IP, attack tree, SIEM, eBPF/XDP/WAF, отчёты соответствия, страницы dashboard.
- На вопросы вне Log Guardian отвечайте отказом и предложите примеры запросов по LG.`,
  };
  return rules[locale] ?? rules.en ?? "";
}

export function offTopicReply(locale: Locale): string {
  const replies: Partial<Record<Locale, string>> = {
    tr: [
      "Log Guardian Asistani",
      "",
      "Bu konuda yardimci olamam — yalnizca Log Guardian guvenlik platformu hakkinda konusabilirim.",
      "",
      "Yardimci olabilecegim konular:",
      "• Filo / agent telemetrisi ve tehdit ozeti",
      "• RCE ve execve engelleme analizi",
      "• IP engelleme (BAN_IP) onerisi",
      "• Attack tree ve SIEM olaylari",
      "• Uyumluluk raporu (/reports)",
      "",
      "Ornek: \"Mevcut tehdit ozetini cikar\" veya \"RCE analizi yap\"",
    ].join("\n"),
    en: [
      "Log Guardian Assistant",
      "",
      "I can only help with the Log Guardian security platform — fleet telemetry, threats, RCE, bans, compliance, and dashboard features.",
      "",
      "Try: \"Summarize current threats\" or \"RCE analysis\"",
    ].join("\n"),
    de: [
      "Log Guardian Assistent",
      "",
      "Ich beantworte nur Fragen zu Log Guardian (Flotte, Bedrohungen, Compliance).",
    ].join("\n"),
    fr: [
      "Assistant Log Guardian",
      "",
      "Je ne reponds qu'aux sujets Log Guardian (flotte, menaces, conformite).",
    ].join("\n"),
    ru: [
      "Ассистент Log Guardian",
      "",
      "Я помогаю только по платформе Log Guardian — флот, угрозы, RCE, баны, соответствие.",
      "",
      "Примеры: «Сводка угроз» или «Анализ RCE»",
    ].join("\n"),
  };
  return replies[locale] ?? replies.en ?? "";
}

export function greetingReply(locale: Locale): string {
  const replies: Partial<Record<Locale, string>> = {
    tr: [
      "Log Guardian Guvenlik Asistani",
      "",
      "Merhaba. Filo telemetrinize erisebilirim; yalnizca Log Guardian kapsaminda yardimci olurum.",
      "",
      "Ornek sorular:",
      "• Mevcut tehdit ozetini cikar",
      "• RCE analizi yap",
      "• Yonetici ozeti olustur",
      "• Uyumluluk raporu hakkinda bilgi ver",
    ].join("\n"),
    en: [
      "Log Guardian Security Assistant",
      "",
      "Hello. I have access to your fleet telemetry and only answer Log Guardian security topics.",
      "",
      "Try: threat summary, RCE analysis, executive summary, or compliance info.",
    ].join("\n"),
    de: "Log Guardian Sicherheitsassistent — Fragen zu Flotte, Bedrohungen, Compliance.",
    fr: "Assistant securite Log Guardian — flotte, menaces, conformite.",
    ru: [
      "Ассистент безопасности Log Guardian",
      "",
      "Здравствуйте. Доступна телеметрия флота; отвечаю только по Log Guardian.",
      "",
      "Примеры: сводка угроз, анализ RCE, исполнительная сводка, соответствие.",
    ].join("\n"),
  };
  return replies[locale] ?? replies.en ?? "";
}
