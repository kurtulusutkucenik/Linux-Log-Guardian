"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCopy, RefreshCw, Sun, XCircle } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type MorningCheck = {
  id: string;
  ok: boolean;
  detail?: string | null;
};

type MorningStatus = {
  pass?: boolean | null;
  at?: string | null;
  fail_reason?: string | null;
  checks?: MorningCheck[];
  proof_pass?: number | null;
  proof_tests?: number | null;
  proof_stale_ids?: string[];
  run_cmd?: string;
  chain_cmd?: string;
  dash_url?: string;
  eps_smoke_ok?: boolean;
  eps_smoke_peak?: number | null;
  eps_smoke_lines_delta?: number | null;
};

const CHECK_LABEL_KEYS: Record<
  string,
  | "morningCheckCore"
  | "morningCheckShip"
  | "morningCheckDashboard"
  | "morningCheckAttackMap"
  | "morningCheckTelegram"
  | "morningCheckProofFresh"
  | "morningCheckEpsSmoke"
> = {
  laptop_core: "morningCheckCore",
  presentation_ship: "morningCheckShip",
  dashboard: "morningCheckDashboard",
  attack_map: "morningCheckAttackMap",
  telegram_soc: "morningCheckTelegram",
  proof_freshness: "morningCheckProofFresh",
  eps_smoke: "morningCheckEpsSmoke",
};

export function MorningOperatorPanel() {
  const { t } = useLanguage();
  const [data, setData] = useState<MorningStatus | null>(null);
  const [epsSmoke, setEpsSmoke] = useState<{
    pass?: boolean | null;
    peak_eps?: number | null;
    lines_delta?: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"gate" | "chain" | "smoke" | null>(null);

  const runCmd = data?.run_cmd ?? "bash scripts/morning_operator_gate.sh";
  const chainCmd = data?.chain_cmd ?? "bash scripts/morning_operator_chain.sh";
  const smokeCmd = "sudo bash scripts/webhook_nginx_eps_smoke.sh";
  const checks = data?.checks ?? [];
  const passN = checks.filter((c) => c.ok).length;
  const staleIds = data?.proof_stale_ids ?? [];

  const load = async () => {
    setLoading(true);
    try {
      const [morningRes, epsRes] = await Promise.all([
        fetch("/api/morning-operator-status", { cache: "no-store" }),
        fetch("/api/eps-smoke-status", { cache: "no-store" }),
      ]);
      if (morningRes.ok) setData((await morningRes.json()) as MorningStatus);
      if (epsRes.ok) setEpsSmoke((await epsRes.json()) as typeof epsSmoke);
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

  const copy = async (which: "gate" | "chain" | "smoke") => {
    const text = which === "gate" ? runCmd : which === "chain" ? chainCmd : smokeCmd;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="glass-panel p-4 border border-amber-500/20">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">{t("morningOpsTitle")}</h2>
            <p className="text-[11px] text-white/45">{t("morningOpsSubtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.pass === true && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              {t("morningOpsPass")}
            </span>
          )}
          {data?.pass === false && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/25">
              {t("morningOpsFail")}
            </span>
          )}
          <Link
            href="/tests#test-morning-operator-gate"
            className="text-[10px] text-amber-300/80 hover:text-amber-200 hover:underline"
          >
            /tests
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
            title={t("morningOpsRefresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {data?.fail_reason && data.pass === false && (
        <p className="text-xs text-amber-200/90 mb-2 font-mono">{data.fail_reason}</p>
      )}

      {checks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 mb-3">
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
        <p className="text-xs text-white/40 mb-3">{t("morningOpsEmpty")}</p>
      )}

      {staleIds.length > 0 && (
        <p className="text-[10px] text-amber-300/80 mb-2 font-mono truncate" title={staleIds.join(", ")}>
          {t("morningOpsStale")}: {staleIds.slice(0, 4).join(", ")}
          {staleIds.length > 4 ? ` +${staleIds.length - 4}` : ""}
        </p>
      )}

      <p className="text-[10px] text-cyan-300/70 mb-2 font-mono whitespace-nowrap overflow-x-auto">
        <Link
          href="#live-ops-metrics"
          className="hover:text-cyan-200 hover:underline"
          title={
            (epsSmoke?.pass || data?.eps_smoke_ok)
              ? `peak ${(epsSmoke?.peak_eps ?? data?.eps_smoke_peak ?? 0).toFixed(2)} · lines+${epsSmoke?.lines_delta ?? data?.eps_smoke_lines_delta ?? 0}`
              : undefined
          }
        >
          {epsSmoke?.pass || data?.eps_smoke_ok
            ? `${t("morningOpsEpsOkPrefix")} ${(epsSmoke?.peak_eps ?? data?.eps_smoke_peak ?? 0).toFixed(2)} · lines+${epsSmoke?.lines_delta ?? data?.eps_smoke_lines_delta ?? 0}`
            : t("morningOpsEpsHint")}
        </Link>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/35">
        <span>
          {checks.length > 0 ? `${passN}/${checks.length}` : "—"}
          {data?.proof_pass != null && data?.proof_tests != null
            ? ` · proof ${data.proof_pass}/${data.proof_tests}`
            : ""}
          {data?.at ? ` · ${new Date(data.at).toLocaleString()}` : ""}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copy("gate")}
            className="inline-flex items-center gap-1 hover:text-white/60"
          >
            <ClipboardCopy className="w-3 h-3" />
            {copied === "gate" ? t("fleetOpsCopied") : runCmd}
          </button>
          <button
            type="button"
            onClick={() => void copy("chain")}
            className="inline-flex items-center gap-1 hover:text-white/60"
          >
            <ClipboardCopy className="w-3 h-3" />
            {copied === "chain" ? t("fleetOpsCopied") : chainCmd}
          </button>
          <button
            type="button"
            onClick={() => void copy("smoke")}
            className="inline-flex items-center gap-1 hover:text-cyan-300/80"
            title={smokeCmd}
          >
            <ClipboardCopy className="w-3 h-3" />
            {copied === "smoke" ? t("fleetOpsCopied") : "eps-smoke"}
          </button>
        </div>
      </div>
    </section>
  );
}
