"use client";

import { useState, useRef, useEffect } from "react";
import {
  Terminal,
  Send,
  Activity,
  ShieldAlert,
  Zap,
  Loader2,
  BarChart3,
} from "lucide-react";
import axios from "axios";
import { useLanguage } from "@/components/LanguageProvider";
import { CopilotMessageBody } from "@/components/CopilotMessageBody";
import { Locale } from "@/lib/i18n";

interface Message {
  role: "user" | "assistant";
  content: string;
  evidence?: { type: string; detail: string }[];
  suggested_action?: string | null;
}

const QUICK_PROMPTS: Partial<
  Record<
    Locale,
    { key: "copilotSummarize" | "copilotRce" | "copilotExec"; text: string }[]
  >
> = {
  tr: [
    {
      key: "copilotSummarize",
      text: "Mevcut tehdit özetini çıkar.",
    },
    {
      key: "copilotRce",
      text: "Son RCE girişimlerini analiz et ve önlem öner.",
    },
    {
      key: "copilotExec",
      text: "Bugünkü olaylar için yönetici özeti oluştur.",
    },
  ],
  en: [
    {
      key: "copilotSummarize",
      text: "Summarize the current threat landscape.",
    },
    {
      key: "copilotRce",
      text: "Analyze the latest RCE attempts and suggest mitigation.",
    },
    {
      key: "copilotExec",
      text: "Generate an executive summary of today's events.",
    },
  ],
  de: [
    {
      key: "copilotSummarize",
      text: "Fasse die aktuelle Bedrohungslage zusammen.",
    },
    {
      key: "copilotRce",
      text: "Analysiere die letzten RCE-Versuche und schlage Gegenmaßnahmen vor.",
    },
    {
      key: "copilotExec",
      text: "Erstelle eine Management-Zusammenfassung der heutigen Ereignisse.",
    },
  ],
  fr: [
    {
      key: "copilotSummarize",
      text: "Résume le paysage de menaces actuel.",
    },
    {
      key: "copilotRce",
      text: "Analyse les dernières tentatives RCE et propose des mesures.",
    },
    {
      key: "copilotExec",
      text: "Génère un résumé exécutif des événements du jour.",
    },
  ],
  ru: [
    {
      key: "copilotSummarize",
      text: "Сформируй сводку по текущим угрозам.",
    },
    {
      key: "copilotRce",
      text: "Проанализируй последние попытки RCE и предложи меры.",
    },
    {
      key: "copilotExec",
      text: "Подготовь исполнительную сводку по сегодняшним событиям.",
    },
  ],
};

export default function CopilotPage() {
  const { locale, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fleetStats, setFleetStats] = useState({ eps: 0, alerts: 0, rce: 0 });
  const [lineageRisk, setLineageRisk] = useState(0);
  const [pendingBanIp, setPendingBanIp] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [ragStats, setRagStats] = useState<{
    lines: number;
    alerts: number;
    trees: number;
    topRisk: number;
  } | null>(null);
  const [llmReachable, setLlmReachable] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/copilot")
      .then((r) => r.json())
      .then((d) => setLlmReachable(Boolean(d?.llm?.reachable)))
      .catch(() => setLlmReachable(false));
  }, []);

  useEffect(() => {
    setMessages([{ role: "assistant", content: t("copilotWelcome") }]);
  }, [locale, t]);

  useEffect(() => {
    axios.get("/api/copilot/rag").then((res) => {
      if (res.data?.available && res.data.stats) {
        setRagStats({
          lines: res.data.evidence_lines?.length ?? 0,
          alerts: res.data.stats.alert_count ?? 0,
          trees: res.data.stats.tree_count ?? 0,
          topRisk: res.data.stats.top_risk ?? 0,
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    axios
      .get("/api/fleet")
      .then((res) => {
        let eps = 0,
          alerts = 0,
          rce = 0;
        res.data.fleet.forEach(
          (a: {
            eps: number;
            alerts_total: number;
            rce_detections: number;
          }) => {
            eps += a.eps || 0;
            alerts += a.alerts_total || 0;
            rce += a.rce_detections || 0;
          }
        );
        setFleetStats({ eps, alerts, rce });
      })
      .catch(console.error);

    fetch("/api/attack-tree?min_risk=85")
      .then((r) => r.json())
      .then((data) => {
        const trees = data.trees || [];
        if (trees.length > 0) {
          const top = trees.reduce(
            (a: { risk: number }, b: { risk: number }) =>
              b.risk > a.risk ? b : a,
            trees[0]
          );
          setLineageRisk(top.risk || 0);
        }
      })
      .catch(console.error);
  }, []);

  const approveBan = async (ip: string, reason: string) => {
    setActionBusy(true);
    try {
      const res = await fetch("/api/copilot/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
          "x-user-tenant": "default",
        },
        body: JSON.stringify({
          executeNow: true,
          targetAgentId: undefined,
          action: {
            action: "BAN_IP",
            params: { ip },
            reason,
          },
        }),
      });
      const data = await res.json();
      const okMsg =
        locale === "en"
          ? data.executedNow
            ? `IP ${ip} ban applied. ${data.message}`
            : `Queued OK, immediate ban failed: ${data.executionError || "unknown"}`
          : data.executedNow
            ? `IP ${ip} ban uygulandı. ${data.message}`
            : `Kuyruk OK, anında ban başarısız: ${data.executionError || "unknown"}`;
      setMessages((prev) => [...prev, { role: "assistant", content: okMsg }]);
      setPendingBanIp(null);
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent, customMsg?: string) => {
    e.preventDefault();
    const msg = customMsg || input;
    if (!msg.trim() || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, locale }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Copilot request failed");
      }

      const reply =
        typeof data.content === "string" && data.content.trim()
          ? data.content
          : locale === "en"
            ? "No response received."
            : "Yanıt alınamadı.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          evidence: Array.isArray(data.evidence) ? data.evidence : undefined,
          suggested_action: data.suggested_action ?? null,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("copilotOffline") },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6 h-[calc(100vh-72px)]">
      <div className="w-1/4 hidden lg:flex flex-col gap-6">
        <div className="glass-panel p-6 border-l-4 border-primary/40">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-base">{t("copilotContext")}</h2>
          </div>
          <p className="text-sm text-white/55 leading-relaxed">
            {llmReachable
              ? locale === "tr"
                ? "Turkce icin optimize edilmis filo analizi aktif (Ollama kucuk modellerde devre disi)."
                : "Ollama bagli — dogal dil yanitlari aktif."
              : locale === "tr"
                ? "Filo telemetrisine dayali akilli ozet modu aktif."
                : "Ollama offline — smart fleet telemetry summaries active."}
          </p>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
            {t("copilotRagTitle")}
          </h3>
          {ragStats ? (
            <div className="flex flex-col gap-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-white/50">{t("copilotRagLines")}</span>
                <span className="text-primary font-bold">{ragStats.lines}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">{t("globalAlerts")}</span>
                <span className="text-warning">{ragStats.alerts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">{t("lineageTrees")}</span>
                <span>{ragStats.trees}</span>
              </div>
              {ragStats.topRisk >= 85 && (
                <p className="text-xs text-danger mt-1">{t("lineageCritical")} ({ragStats.topRisk.toFixed(0)})</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-white/40">{t("copilotRagEmpty")}</p>
          )}
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45 mb-4">
            {t("copilotContext")}
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-white/70">
                <Activity className="w-4 h-4 text-primary" />
                {t("globalEps")}
              </span>
              <span className="font-mono font-bold text-primary">
                {fleetStats.eps.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-white/70">
                <Zap className="w-4 h-4 text-warning" />
                {t("globalAlerts")}
              </span>
              <span className="font-mono font-bold text-warning">
                {fleetStats.alerts}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-white/70">
                <ShieldAlert className="w-4 h-4 text-danger" />
                {t("globalRceKills")}
              </span>
              <span className="font-mono font-bold text-danger">
                {fleetStats.rce}
              </span>
            </div>
          </div>
        </div>

        {lineageRisk >= 85 && (
          <div className="glass-panel p-6 border-l-4 border-danger/50">
            <p className="text-xs text-danger font-semibold uppercase mb-2">
              {t("lineageCritical")}
            </p>
            <p className="text-sm text-white/65 mb-3">
              Attack tree risk {lineageRisk.toFixed(0)}.
            </p>
            <button
              disabled={actionBusy}
              onClick={() => setPendingBanIp("AUTO_LINEAGE")}
              className="w-full text-sm bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 py-2 rounded-lg"
            >
              {t("banApprove")}
            </button>
          </div>
        )}

        {pendingBanIp && (
          <div className="glass-panel p-4 border border-warning/30">
            <p className="text-sm text-warning mb-2">{t("banApprove")}</p>
            <input
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm mb-2 font-mono"
              placeholder={t("banIpPlaceholder")}
              defaultValue={pendingBanIp === "AUTO_LINEAGE" ? "" : pendingBanIp}
              id="copilot-ban-ip"
            />
            <div className="flex gap-2">
              <button
                disabled={actionBusy}
                className="flex-1 text-xs bg-danger/25 text-danger py-2 rounded-lg"
                onClick={() => {
                  const el = document.getElementById(
                    "copilot-ban-ip"
                  ) as HTMLInputElement;
                  if (el?.value)
                    approveBan(el.value, "Copilot lineage remediation");
                }}
              >
                {t("approveBan")}
              </button>
              <button
                className="text-xs px-3 py-2 bg-white/5 rounded-lg"
                onClick={() => setPendingBanIp(null)}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}

        <div className="glass-panel p-6 flex flex-col gap-2 mt-auto">
          <p className="text-xs text-white/40 uppercase font-semibold mb-2">
            {t("copilotQuick")}
          </p>
          {(QUICK_PROMPTS[locale] ?? QUICK_PROMPTS.en ?? []).map((q) => (
            <button
              key={q.key}
              onClick={(e) => handleSubmit(e, q.text)}
              className="text-left text-sm bg-white/5 hover:bg-white/10 p-2.5 rounded-lg transition-colors text-white/80 border border-white/8"
            >
              {t(q.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 glass-panel flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-black/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full ${
                llmReachable ? "bg-success" : llmReachable === false ? "bg-warning" : "bg-white/30"
              }`}
            />
            <h2 className="font-semibold text-white">{t("copilotTitle")}</h2>
          </div>
          <Terminal className="w-5 h-5 text-white/25" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl p-4 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary/15 border border-primary/25 text-white"
                    : "bg-black/35 border border-white/10 text-white/85"
                }`}
              >
                {m.role === "assistant" ? (
                  <CopilotMessageBody content={m.content || "…"} />
                ) : (
                  m.content || <span className="opacity-50">…</span>
                )}
                {m.role === "assistant" && m.evidence && m.evidence.length > 0 && (
                  <details className="mt-3 text-xs text-white/50">
                    <summary className="cursor-pointer">{t("copilotEvidence")} ({m.evidence.length})</summary>
                    <ul className="mt-2 space-y-1.5 list-none pl-0">
                      {m.evidence.map((e, j) => (
                        <li key={j} className="border-l-2 border-primary/30 pl-2 py-0.5">
                          <span className={`text-[10px] uppercase font-bold px-1 rounded ${
                            e.type === "db_alert" || e.type === "rag_line"
                              ? "bg-primary/20 text-primary"
                              : e.type === "attack_tree"
                                ? "bg-danger/20 text-danger"
                                : "bg-white/10 text-white/50"
                          }`}>
                            {e.type}
                          </span>
                          <span className="block mt-0.5 text-white/60">{e.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {m.role === "assistant" && m.suggested_action && (
                  <p className="mt-2 text-xs text-primary/90">
                    {t("copilotSuggested")}: {m.suggested_action}
                  </p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-black/35 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-xs text-white/50">
                  {t("copilotProcessing")}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={(e) => handleSubmit(e)}
          className="p-4 bg-black/40 border-t border-white/10"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("copilotPlaceholder")}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3.5 pl-4 pr-12 text-white placeholder:text-white/35 focus:outline-none focus:border-primary/40 text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-primary/20 hover:bg-primary/35 text-primary rounded-md transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
