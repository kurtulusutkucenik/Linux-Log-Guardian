import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { collectCopilotChat, copilotOllamaStatus, checkOllamaReachable } from "@/lib/ollama";
import { detectTextLocale, localeInstruction, Locale } from "@/lib/i18n";
import {
  loadCopilotRagContext,
  ragPromptBlock,
  ragToEvidence,
} from "@/lib/copilotRag";
import { buildCopilotFallbackReply } from "@/lib/copilotFallback";
import { fetchBannedIps } from "@/lib/fetchBannedIps";
import {
  isCopilotReplyLowQuality,
  shouldPreferStructuredReply,
  turkishSocPrompt,
} from "@/lib/copilotQuality";
import {
  isLogGuardianTopic,
  logGuardianScopeRule,
  offTopicReply,
} from "@/lib/copilotScope";

export const dynamic = "force-dynamic";

const DEFAULT_MODEL =
  process.env.COPILOT_MODEL || process.env.OLLAMA_MODEL || "llama3.2:3b";

function buildFleetContext(
  agents: {
    agentId: string;
    eps: number | null;
    rceDetections: number | null;
    tarpitActive: number | null;
    alertsTotal: number | null;
    attackTreeJson?: string | null;
  }[],
  isAdmin: boolean,
  userTenant: string | null
) {
  const totalAgents = agents.length;
  let totalRce = 0;
  let totalTarpit = 0;
  let totalAlerts = 0;
  let totalEps = 0;

  for (const agent of agents) {
    totalRce += agent.rceDetections || 0;
    totalTarpit += agent.tarpitActive || 0;
    totalAlerts += agent.alertsTotal || 0;
    totalEps += agent.eps || 0;
  }

  const fleetSummary = `Agents: ${totalAgents}, EPS: ${totalEps.toFixed(1)}, RCE blocked: ${totalRce}, tarpits: ${totalTarpit}, alerts: ${totalAlerts}`;

  let lineageSummary = "No attack tree data.";
  let topRisk = 0;
  for (const agent of agents) {
    const raw = agent.attackTreeJson;
    if (!raw) continue;
    try {
      const trees = JSON.parse(raw) as {
        risk?: number;
        comm?: string;
        pid?: number;
      }[];
      if (!Array.isArray(trees)) continue;
      for (const tree of trees) {
        const r = tree.risk ?? 0;
        if (r > topRisk) {
          topRisk = r;
          lineageSummary = `Agent ${agent.agentId}: max risk ${r.toFixed(1)}, comm=${tree.comm ?? "?"}, pid=${tree.pid ?? 0}, ${trees.length} trees.`;
        }
      }
    } catch {
      /* ignore */
    }
  }
  if (topRisk >= 85) {
    lineageSummary += " CRITICAL: review attack tree; request BAN_IP approval if needed.";
  }

  const scope = isAdmin
    ? "Scope: full fleet (admin)."
    : `Scope: tenant ${userTenant ?? "unknown"}.`;

  return { fleetSummary, lineageSummary, topRisk, scope };
}

type CopilotEvidence = {
  type: string;
  detail: string;
};

function buildCopilotPayload(
  content: string,
  source: string,
  agents: Parameters<typeof buildFleetContext>[0],
  topRisk: number,
  fleetSummary: string,
  lineageSummary: string,
  ragEvidence: { type: string; detail: string; cite?: string }[] = [],
  llm?: { provider: string; model: string },
  bannedIps: string[] = [],
) {
  const evidence: CopilotEvidence[] = [
    { type: "fleet_telemetry", detail: fleetSummary },
    { type: "lineage", detail: lineageSummary },
    ...ragEvidence.map((e) => ({
      type: e.type,
      detail: e.cite ? `${e.detail} (${e.cite})` : e.detail,
    })),
  ];
  for (const a of agents.slice(0, 5)) {
    if ((a.alertsTotal ?? 0) > 0) {
      evidence.push({
        type: "agent_alerts",
        detail: `${a.agentId}: alerts=${a.alertsTotal}, rce=${a.rceDetections ?? 0}`,
      });
    }
  }
  if (bannedIps?.length) {
    evidence.push({
      type: "active_bans",
      detail: bannedIps.join(", "),
    });
  }
  let suggested_action: string | null = null;
  if (topRisk >= 85) suggested_action = "BAN_IP";
  else if (topRisk >= 50) suggested_action = "MONITOR";
  return {
    content,
    source,
    evidence,
    suggested_action,
    llm_provider: llm?.provider,
    llm_model: llm?.model,
  };
}

function agentOnline(lastSeen: Date): boolean {
  return Date.now() - lastSeen.getTime() < 15000;
}

function toFallbackAgents(
  agents: {
    agentId: string;
    eps: number | null;
    rceDetections: number | null;
    tarpitActive: number | null;
    alertsTotal: number | null;
    incidentsActive?: number | null;
    incidentsCorrelated?: number | null;
    lastSeen: Date;
  }[],
) {
  return agents.map((a) => ({
    agentId: a.agentId,
    eps: a.eps,
    rceDetections: a.rceDetections,
    tarpitActive: a.tarpitActive,
    alertsTotal: a.alertsTotal,
    incidentsActive: a.incidentsActive,
    incidentsCorrelated: a.incidentsCorrelated,
    status: agentOnline(a.lastSeen) ? "Online" : "Offline",
  }));
}

function makeFallbackReply(
  locale: Locale,
  message: string,
  fleetSummary: string,
  lineageSummary: string,
  topRisk: number,
  agents: Parameters<typeof toFallbackAgents>[0],
  bannedIps: string[] = [],
  banSource = "",
) {
  return buildCopilotFallbackReply(locale, message, {
    fleetSummary,
    lineageSummary,
    topRisk,
    agents: toFallbackAgents(agents),
    bannedIps,
    banSource,
  });
}

export async function GET() {
  const st = copilotOllamaStatus();
  const reachable = await checkOllamaReachable();
  return NextResponse.json({
    llm: {
      provider: st.provider,
      model: st.model,
      base_url: st.baseUrl,
      optional: st.optional,
      reachable,
      hint: st.hint,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body?.message;
    const uiLocale = body?.locale as Locale | undefined;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userRole = request.headers.get("x-user-role");
    const userTenant = request.headers.get("x-user-tenant");
    const isAdmin = userRole === "admin";
    const whereClause = isAdmin ? {} : { tenantId: userTenant as string };

    const agents = await prisma.telemetry.findMany({ where: whereClause });
    const banData = await fetchBannedIps();
    const bannedIps = banData.bans.map((b) => b.ip);
    const banListSummary =
      bannedIps.length > 0
        ? `ACTIVE BANNED IPs (${banData.source}): ${bannedIps.join(", ")}`
        : "ACTIVE BANNED IPs: none (see /bans page)";
    const ragCtx = await loadCopilotRagContext();
    const ragBlock = ragPromptBlock(ragCtx);
    const ragEvidence = ragToEvidence(ragCtx);
    const ragTopRisk = ragCtx?.stats?.top_risk ?? 0;

    const { fleetSummary, lineageSummary, topRisk, scope } = buildFleetContext(
      agents as Parameters<typeof buildFleetContext>[0],
      isAdmin,
      userTenant
    );
    const effectiveTopRisk = Math.max(topRisk, ragTopRisk);
    const agentList = agents as Parameters<typeof buildFleetContext>[0];

    const detected = detectTextLocale(message);
    const replyLocale: Locale =
      uiLocale === "tr" ||
      uiLocale === "en" ||
      uiLocale === "de" ||
      uiLocale === "fr" ||
      uiLocale === "ru"
        ? message.trim().length < 4
          ? uiLocale
          : detected
        : detected;

    const langRule = localeInstruction(replyLocale);
    const trExtra = replyLocale === "tr" ? `\n${turkishSocPrompt()}` : "";
    const scopeRule = logGuardianScopeRule(replyLocale);

    if (!isLogGuardianTopic(message)) {
      return NextResponse.json(
        buildCopilotPayload(
          offTopicReply(replyLocale),
          "scope",
          agentList,
          effectiveTopRisk,
          fleetSummary,
          lineageSummary,
          ragEvidence,
        ),
      );
    }

    const systemPrompt = `You are the Log Guardian security assistant ONLY. You do not answer questions outside Log Guardian.

${scopeRule}

${scope}

LIVE FLEET (use only this data):
- ${fleetSummary}
- ${lineageSummary}
- ${banListSummary}

${ragBlock}

${langRule}
${trExtra}

RULES:
- Keep answers short (3–8 sentences or bullets).
- Do not invent numbers or events not in the data above.
- Do NOT invent IP addresses for bans; only list IPs from ACTIVE BANNED IPs line above.
- When citing alerts or lineage, reference RAG EVIDENCE line numbers.
- If risk >= 85, suggest concrete steps (IP ban, WAF, pod kill) and ask approval before destructive actions.
- No repetitive filler words or product marketing.
- Focus on the user's question about Log Guardian.`;

    const ollamaCfg = copilotOllamaStatus();
    const preferStructured = shouldPreferStructuredReply(replyLocale, ollamaCfg.model);

    if (preferStructured) {
      const fb = makeFallbackReply(
        replyLocale,
        message,
        fleetSummary,
        lineageSummary,
        effectiveTopRisk,
        agents,
        bannedIps,
        banData.source,
      );
      return NextResponse.json(
        buildCopilotPayload(
          fb,
          "structured",
          agentList,
          effectiveTopRisk,
          fleetSummary,
          lineageSummary,
          ragEvidence,
        ),
      );
    }

    const chatMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    try {
      const llm = await collectCopilotChat(chatMessages);

      if (!llm.content || isCopilotReplyLowQuality(llm.content, replyLocale)) {
        const fb = makeFallbackReply(
          replyLocale,
          message,
          fleetSummary,
          lineageSummary,
          effectiveTopRisk,
          agents,
          bannedIps,
          banData.source,
        );
        return NextResponse.json(
          buildCopilotPayload(
            fb,
            llm.content ? "fallback" : "fallback",
            agentList,
            effectiveTopRisk,
            fleetSummary,
            lineageSummary,
            ragEvidence,
            llm.content ? { provider: llm.provider, model: llm.model } : undefined,
          ),
        );
      }

      return NextResponse.json(
        buildCopilotPayload(
          llm.content,
          llm.provider,
          agentList,
          effectiveTopRisk,
          fleetSummary,
          lineageSummary,
          ragEvidence,
          { provider: llm.provider, model: llm.model }
        )
      );
    } catch (llmErr) {
      console.error("Copilot LLM error:", llmErr);
      const fb = makeFallbackReply(
        replyLocale,
        message,
        fleetSummary,
        lineageSummary,
        effectiveTopRisk,
        agents,
        bannedIps,
        banData.source,
      );
      return NextResponse.json(
        buildCopilotPayload(
          fb,
          "fallback",
          agentList,
          effectiveTopRisk,
          fleetSummary,
          lineageSummary,
          ragEvidence,
          { provider: copilotOllamaStatus().provider, model: DEFAULT_MODEL }
        )
      );
    }
  } catch (error) {
    console.error("Copilot API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
