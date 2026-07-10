"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, ClipboardCopy, RefreshCw, XCircle } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type E9Check = {
  id: string;
  ok: boolean;
  detail?: string | null;
};

type E9Status = {
  pass?: boolean | null;
  at?: string | null;
  competitive_proof?: string | null;
  fail_count?: number | null;
  checks?: E9Check[];
  run_cmd?: string;
  doc?: string;
};

const CHECK_LABEL_KEYS: Record<string, "e9CheckCompetitiveProof" | "e9CheckEnterpriseEscalation" | "e9CheckEdgeChecklist" | "e9CheckRelayLan" | "e9CheckMorningOperator" | "e9CheckDocsConsistency" | "e9CheckVpsPrep" | "e9CheckVpsRemote"> = {
  competitive_proof: "e9CheckCompetitiveProof",
  enterprise_escalation: "e9CheckEnterpriseEscalation",
  edge_checklist: "e9CheckEdgeChecklist",
  relay_lan_exposure: "e9CheckRelayLan",
  morning_operator: "e9CheckMorningOperator",
  docs_consistency: "e9CheckDocsConsistency",
  vps_prep: "e9CheckVpsPrep",
  vps_remote: "e9CheckVpsRemote",
};

export function E9RunbookPanel() {
  const { t } = useLanguage();
  const [data, setData] = useState<E9Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const runCmd = data?.run_cmd ?? "bash scripts/enterprise_e9_verify.sh";
  const doc = data?.doc ?? "docs/ENTERPRISE_SUPPORT.md";
  const checks = data?.checks ?? [];
  const passN = checks.filter((c) => c.ok).length;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/e9-status", { cache: "no-store" });
      if (!res.ok) return;
      setData((await res.json()) as E9Status);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 60_000);
    return () => clearInterval(timer);
  }, []);

  const copyCmd = async () => {
    try {
      await navigator.clipboard.writeText(runCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="glass-panel p-4 border border-violet-500/15">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-violet-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">{t("e9RunbookTitle")}</h2>
            <p className="text-[11px] text-white/45">{t("e9RunbookSubtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.pass === true && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              {t("e9RunbookPass")}
            </span>
          )}
          {data?.pass === false && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/25">
              {t("e9RunbookFail")}
            </span>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
            title={t("fleetOpsCopyRefresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {checks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
          {checks.map((check) => {
            const labelKey = CHECK_LABEL_KEYS[check.id];
            return (
              <div
                key={check.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/20 px-2.5 py-1.5 text-xs"
              >
                <span className="text-white/60 truncate">
                  {labelKey ? t(labelKey) : check.id}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {check.detail && (
                    <span className="text-white/35 font-mono text-[10px]">{check.detail}</span>
                  )}
                  {check.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-white/40 mb-3">{t("e9RunbookEmpty")}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/35">
        <span>
          {checks.length > 0 ? `${passN}/${checks.length}` : "—"}
          {data?.competitive_proof ? ` · ${data.competitive_proof}` : ""}
          {data?.at ? ` · ${new Date(data.at).toLocaleString()}` : ""}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void copyCmd()}
            className="inline-flex items-center gap-1 hover:text-white/60"
          >
            <ClipboardCopy className="w-3 h-3" />
            {copied ? t("fleetOpsCopied") : runCmd}
          </button>
          <Link href="/tests" className="text-violet-300/80 hover:text-violet-200 hover:underline">
            /tests
          </Link>
          <span className="text-white/25">·</span>
          <span className="font-mono">{doc}</span>
        </div>
      </div>
    </section>
  );
}
