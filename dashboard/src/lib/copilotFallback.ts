import type { Locale } from "@/lib/i18n";
import {
  greetingReply,
  isGreetingMessage,
  isLogGuardianTopic,
  offTopicReply,
} from "@/lib/copilotScope";

export type FallbackAgent = {
  agentId: string;
  eps?: number | null;
  rceDetections?: number | null;
  tarpitActive?: number | null;
  alertsTotal?: number | null;
  incidentsActive?: number | null;
  incidentsCorrelated?: number | null;
  status?: string | null;
};

type CopilotIntent = "threat_summary" | "rce" | "executive" | "ban" | "compliance" | "general";

type FallbackContext = {
  fleetSummary: string;
  lineageSummary: string;
  agents: FallbackAgent[];
  topRisk: number;
  bannedIps?: string[];
  banSource?: string;
};

function detectIntent(message: string): CopilotIntent {
  const m = message.toLowerCase();
  if (/tehdit|threat|ozet|özet|summarize|landscape|bedrohung|menace|paysage|угроз|сводк|обзор/.test(m)) {
    return "threat_summary";
  }
  if (/rce|execve|shell spawn|komut calistir|komut çalıştır/.test(m)) return "rce";
  if (/yonetici|yönetici|executive|management|bugunku olay|bugünkü olay|bugunun olay|today's events|heute|aujourd|руковод|исполнит/.test(m)) {
    return "executive";
  }
  if (/ban|engelle|block ip|sperr|bloquer|блок|заблок/.test(m)) return "ban";
  if (/uyumluluk|compliance|kvkk|pci|soc2|iso|соответств|комплаенс/.test(m)) return "compliance";
  return "general";
}

function aggregate(agents: FallbackAgent[]) {
  let eps = 0;
  let alerts = 0;
  let rce = 0;
  let tarpit = 0;
  let incActive = 0;
  let incCorr = 0;
  for (const a of agents) {
    eps += a.eps ?? 0;
    alerts += a.alertsTotal ?? 0;
    rce += a.rceDetections ?? 0;
    tarpit += a.tarpitActive ?? 0;
    incActive += a.incidentsActive ?? 0;
    incCorr += a.incidentsCorrelated ?? 0;
  }
  return { eps, alerts, rce, tarpit, incActive, incCorr };
}

function agentDetailLines(agents: FallbackAgent[], locale: Locale): string[] {
  if (!agents.length) {
    if (locale === "tr") return ["Kayitli agent bulunmuyor."];
    if (locale === "ru") return ["Нет зарегистрированных агентов."];
    return ["No registered agents."];
  }
  return agents.slice(0, 8).map((a) => {
    const st = a.status ?? "unknown";
    if (locale === "tr") {
      return `• ${a.agentId} (${st}): ${a.alertsTotal ?? 0} alarm, ${a.rceDetections ?? 0} RCE engeli, EPS ${(a.eps ?? 0).toFixed(1)}`;
    }
    if (locale === "ru") {
      return `• ${a.agentId} (${st}): ${a.alertsTotal ?? 0} оповещ., ${a.rceDetections ?? 0} RCE блок., EPS ${(a.eps ?? 0).toFixed(1)}`;
    }
    return `• ${a.agentId} (${st}): ${a.alertsTotal ?? 0} alerts, ${a.rceDetections ?? 0} RCE blocks, EPS ${(a.eps ?? 0).toFixed(1)}`;
  });
}

function threatSummary(locale: Locale, ctx: FallbackContext): string {
  const { eps, alerts, rce, tarpit, incActive, incCorr } = aggregate(ctx.agents);
  const online = ctx.agents.filter((a) => (a.status ?? "").toLowerCase() === "online").length;
  const rceNode = ctx.agents.find((a) => (a.rceDetections ?? 0) > 0);

  if (locale === "tr") {
    const lead =
      online === 0 && ctx.agents.length > 0
        ? `Filo kayitlarinda ${ctx.agents.length} agent var ancak hicbiri su an online degil. Asagidaki rakamlar son senkronize telemetriden geliyor; canli akis icin agent/daemon servislerini kontrol edin.`
        : `Filo ${ctx.agents.length} agent ile izleniyor; ${online} tanesi online.`;

    const bullets = [
      `${alerts} guvenlik alarmi`,
      incActive > 0 ? `${incActive} aktif olay` : null,
      incCorr > 0 ? `${incCorr} korelasyon` : null,
      rce > 0 ? `${rce} RCE girisimi engellendi` : "RCE engeli kaydi yok",
      `${tarpit} aktif tarpit`,
      `birlesik EPS ${eps.toFixed(1)}`,
    ].filter(Boolean);

    return [
      "Tehdit Ozeti",
      "",
      lead,
      "",
      "Durum:",
      ...bullets.map((b) => `• ${b}`),
      "",
      "Agent detayi:",
      ...agentDetailLines(ctx.agents, locale),
      "",
      rceNode
        ? `Dikkat: ${rceNode.agentId} uzerinde RCE engeli var. Attack tree ve kaynak IP incelemesi yapin; tekrar eden kaynak icin BAN_IP onerilir.`
        : alerts > 0
          ? "Alarmlar mevcut — /attack-tree ve SIEM loglariyla capraz dogrulama yapin."
          : "Kritik tehdit sinyali dusuk; filo baglantisi kurulunca telemetriyi yenileyin.",
    ].join("\n");
  }

  if (locale === "ru") {
    const lead =
      online === 0 && ctx.agents.length > 0
        ? `Все ${ctx.agents.length} агентов offline — цифры из последней синхронизации.`
        : `${online}/${ctx.agents.length} агентов online.`;

    return [
      "Сводка по угрозам",
      "",
      lead,
      "",
      `• ${alerts} оповещений, ${rce} блокировок RCE, суммарный EPS ${eps.toFixed(1)}`,
      incActive > 0 ? `• ${incActive} активных инцидентов, ${incCorr} корреляций` : "",
      "",
      ...agentDetailLines(ctx.agents, locale),
      "",
      rce > 0
        ? "Проверьте attack tree на узле; при повторении источника — BAN_IP."
        : "Сверьте оповещения в /attack-tree и логах SIEM.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const lead =
    online === 0 && ctx.agents.length > 0
      ? `All ${ctx.agents.length} agents are offline — figures below are from the last sync.`
      : `${online}/${ctx.agents.length} agents online.`;

  return [
    "Threat Summary",
    "",
    lead,
    "",
    `• ${alerts} alerts, ${rce} RCE blocks, combined EPS ${eps.toFixed(1)}`,
    incActive > 0 ? `• ${incActive} active incidents, ${incCorr} correlated` : "",
    "",
    ...agentDetailLines(ctx.agents, locale),
    "",
    rce > 0
      ? "Review attack tree on the affected node; consider BAN_IP if the source repeats."
      : "Cross-check alerts in /attack-tree and SIEM logs.",
  ]
    .filter(Boolean)
    .join("\n");
}

function rceAnalysis(locale: Locale, ctx: FallbackContext): string {
  const withRce = ctx.agents.filter((a) => (a.rceDetections ?? 0) > 0);
  const { rce } = aggregate(ctx.agents);

  if (locale === "tr") {
    if (rce === 0) {
      return [
        "RCE Analizi",
        "",
        "Mevcut telemetride engellenmis RCE/execve olayi gorunmuyor.",
        "Agent offline ise yeni olay gelmemis olabilir.",
        "",
        "Kontrol listesi:",
        "• systemctl status log-guardian-daemon",
        "• log-guardian --status --db events.db",
        "• Dashboard /attack-tree sayfasini yenileyin",
      ].join("\n");
    }
    return [
      "RCE Analizi",
      "",
      `Toplam ${rce} RCE engelleme kaydi var.`,
      "",
      "Etkilenen node'lar:",
      ...withRce.map(
        (a) =>
          `• ${a.agentId}: ${a.rceDetections} engelleme, ${a.alertsTotal ?? 0} alarm, EPS ${(a.eps ?? 0).toFixed(1)}`,
      ),
      "",
      "Onerilen adimlar:",
      "1. Attack tree'de parent PID ve komut satirini inceleyin",
      "2. Kaynak IP'yi threat feed ile eslestirin",
      "3. Tekrarlayan saldirgan icin Filo uzerinden BAN_IP (onayli)",
      "4. EXECVE_GUARD ve WAF kurallarinin guncel oldugunu dogrulayin",
    ].join("\n");
  }

  if (locale === "ru") {
    if (rce === 0) {
      return [
        "Анализ RCE",
        "",
        "В текущей телеметрии заблокированных RCE/execve не видно.",
        "Проверьте: systemctl status log-guardian-daemon, log-guardian --status.",
      ].join("\n");
    }
    return [
      "Анализ RCE",
      "",
      `Всего ${rce} блокировок RCE.`,
      ...withRce.map(
        (a) =>
          `• ${a.agentId}: ${a.rceDetections} блок., ${a.alertsTotal ?? 0} оповещ., EPS ${(a.eps ?? 0).toFixed(1)}`,
      ),
      "",
      "Рекомендации: attack tree → IP источника → BAN_IP при повторении.",
    ].join("\n");
  }

  if (rce === 0) {
    return "No blocked RCE events in current telemetry. Check daemon status and refresh /attack-tree.";
  }

  return [
    "RCE Analysis",
    "",
    `${rce} blocked RCE event(s).`,
    ...withRce.map((a) => `• ${a.agentId}: ${a.rceDetections} blocks`),
    "",
    "Review attack tree lineage and approve BAN_IP if the source repeats.",
  ].join("\n");
}

function executiveSummary(locale: Locale, ctx: FallbackContext): string {
  const { eps, alerts, rce, incActive } = aggregate(ctx.agents);
  const online = ctx.agents.filter((a) => (a.status ?? "").toLowerCase() === "online").length;

  if (locale === "tr") {
    return [
      "Yonetici Ozeti",
      "",
      `Guvenlik durumu: ${ctx.agents.length} agent'tan ${online} tanesi online. ${alerts} alarm, ${rce} kritik RCE engeli, ${incActive} aktif olay.`,
      `Islem hacmi: birlesik EPS ${eps.toFixed(1)}.`,
      "",
      "Risk degerlendirmesi:",
      online === 0 && ctx.agents.length > 0
        ? "• Operasyonel risk: tum agentlar offline — gorunurluk kaybi."
        : "• Filo baglantisi aktif.",
      rce > 0 ? "• Yetkisiz shell/execve girisimi tespit edildi ve engellendi." : "• RCE girisimi kaydi yok.",
      alerts >= 5 ? `• Alarm hacmi yuksek (${alerts}) — SOC incelemesi onerilir.` : "",
      "",
      "Aksiyonlar:",
      "• Offline node'lari yeniden baglayin",
      "• /reports uzerinden uyumluluk raporunu arsivleyin",
      ctx.topRisk >= 85 ? "• Acil: attack tree riski yuksek — BAN_IP degerlendirin." : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (locale === "ru") {
    return [
      "Исполнительная сводка",
      "",
      `${online}/${ctx.agents.length} агентов online; ${alerts} оповещений; ${rce} блокировок RCE.`,
      `Суммарный EPS ${eps.toFixed(1)}.`,
      rce > 0 ? "Зафиксирована попытка shell/execve — заблокирована." : "",
      "Восстановите offline-узлы; архивируйте отчёт соответствия в /reports.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "Executive Summary",
    "",
    `${online}/${ctx.agents.length} agents online; ${alerts} alerts; ${rce} RCE blocks.`,
    `Combined EPS ${eps.toFixed(1)}.`,
    rce > 0 ? "Unauthorized shell spawn was blocked." : "",
    "Restore offline agents and archive compliance report from /reports.",
  ]
    .filter(Boolean)
    .join("\n");
}

function banAdvice(locale: Locale, ctx: FallbackContext): string {
  const list = ctx.bannedIps ?? [];
  const listBlock =
    list.length > 0
      ? locale === "tr"
        ? ["", "Aktif engellenen IP'ler (ipset/XDP — /bans sayfasi):", ...list.map((ip) => `• ${ip}`)].join("\n")
        : locale === "ru"
          ? ["", "Активные заблокированные IP (ipset/XDP — /bans):", ...list.map((ip) => `• ${ip}`)].join("\n")
          : ["", "Active banned IPs (ipset/XDP — /bans page):", ...list.map((ip) => `• ${ip}`)].join("\n")
      : locale === "tr"
        ? "\n\nSu an aktif ban kaydi yok. Filo veya /bans sayfasindan IP ekleyin."
        : locale === "ru"
          ? "\n\nНет активных банов. Добавьте IP через флот или /bans."
          : "\n\nNo active bans. Add via Fleet or /bans page.";

  if (locale === "tr") {
    return [
      "IP Engelleme",
      "",
      ctx.topRisk >= 85
        ? `Risk skoru ${ctx.topRisk.toFixed(0)} — IP ban degerlendirmesi uygun.`
        : "Once alarm detayini dogrulayin; risk dusukse izlemeye devam edin.",
      listBlock,
      "",
      "Adimlar:",
      "1. Ust menuden **Banli IP'ler** (/bans) sayfasini acin",
      "2. Attack tree'deki saldirgan IP icin Ban tusuna basin",
      "3. Filo uzerinden BAN_IP (audit log'a yazilir)",
    ].join("\n");
  }

  if (locale === "ru") {
    return [
      "Блокировка IP",
      "",
      ctx.topRisk >= 85
        ? `Риск ${ctx.topRisk.toFixed(0)} — блокировка IP уместна.`
        : "Сначала проверьте детали оповещения.",
      listBlock,
      "Откройте **Заблокированные IP** (/bans) в меню.",
    ].join("\n");
  }

  return [
    "IP Ban",
    "",
    ctx.topRisk >= 85 ? `Risk ${ctx.topRisk.toFixed(0)} — ban may be appropriate.` : "Verify alert details first.",
    listBlock,
    "Open **Banned IPs** (/bans) in the nav bar for the live list.",
  ].join("\n");
}

function complianceHint(locale: Locale): string {
  if (locale === "tr") {
    return [
      "Uyumluluk",
      "",
      "SOC2, PCI-DSS, KVKK ve ISO 27001 raporu Reports sayfasindan JSON veya PDF olarak indirilebilir.",
      "12 kontrol maddesi canli telemetri ve audit kanitlariyla otomatik doldurulur.",
    ].join("\n");
  }
  if (locale === "ru") {
    return [
      "Соответствие",
      "",
      "Отчёты SOC2, PCI-DSS, KVKK и ISO 27001 — на странице Reports (JSON или PDF).",
      "12 контролей заполняются из live-телеметрии и audit.",
    ].join("\n");
  }
  return "Download SOC2 / PCI / KVKK compliance report from Reports as JSON or PDF.";
}

function generalReply(locale: Locale, ctx: FallbackContext, message: string): string {
  const { alerts, rce } = aggregate(ctx.agents);
  if (locale === "tr") {
    return [
      "Log Guardian kapsaminda yanit:",
      "",
      ctx.fleetSummary,
      ctx.lineageSummary !== "No attack tree data." ? ctx.lineageSummary : "",
      alerts > 0 ? `${alerts} alarm kayitli.` : "Aktif alarm yok.",
      rce > 0 ? `${rce} RCE engeli var — 'RCE analizi' yazarak detay alabilirsiniz.` : "",
      "",
      "Ornek: tehdit ozeti | RCE analizi | yonetici ozeti | uyumluluk",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (locale === "ru") {
    return [
      "Ответ Log Guardian:",
      "",
      ctx.fleetSummary,
      ctx.lineageSummary !== "No attack tree data." ? ctx.lineageSummary : "",
      alerts > 0 ? `${alerts} оповещений.` : "Нет активных оповещений.",
      rce > 0 ? `${rce} блокировок RCE — напишите «Анализ RCE» для деталей.` : "",
      "",
      "Примеры: сводка угроз | анализ RCE | исполнительная сводка | соответствие",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    ctx.fleetSummary,
    ctx.lineageSummary !== "No attack tree data." ? ctx.lineageSummary : "",
    `You asked: "${message.slice(0, 80)}"`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Ollama yokken soruya gore anlamli yanit uretir. Yalnizca Log Guardian kapsami. */
export function buildCopilotFallbackReply(
  locale: Locale,
  userMessage: string,
  ctx: FallbackContext,
): string {
  const trimmed = userMessage.trim();
  if (isGreetingMessage(trimmed)) {
    return greetingReply(locale);
  }
  if (!isLogGuardianTopic(trimmed)) {
    return offTopicReply(locale);
  }

  const intent = detectIntent(userMessage);
  switch (intent) {
    case "threat_summary":
      return threatSummary(locale, ctx);
    case "rce":
      return rceAnalysis(locale, ctx);
    case "executive":
      return executiveSummary(locale, ctx);
    case "ban":
      return banAdvice(locale, ctx);
    case "compliance":
      return complianceHint(locale);
    default:
      return generalReply(locale, ctx, userMessage);
  }
}
