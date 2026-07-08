"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCopy, Cloud, RefreshCw, Server } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type VpsPrepStatus = {
  at?: string | null;
  pass?: boolean;
  laptop_mode?: boolean;
  vps_available?: boolean;
  competitive_proof?: string | null;
  xdp_mode?: string | null;
  steps?: string[];
  doc?: string;
  setup?: { gate?: string; doc?: string; xdp?: string };
};

export function VpsPrepPanel() {
  const { t } = useLanguage();
  const [data, setData] = useState<VpsPrepStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const gateCmd = data?.setup?.gate ?? "bash scripts/vps_prep_gate.sh";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vps-prep-status", { cache: "no-store" });
      if (!res.ok) return;
      setData((await res.json()) as VpsPrepStatus);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const pass = data?.pass === true;

  return (
    <div className="rounded-lg border border-sky-500/25 bg-sky-500/5 px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Cloud className="w-4 h-4 text-sky-300" />
        <h3 className="text-sm font-semibold text-sky-200">{t("vpsPrepTitle")}</h3>
        <Link
          href="https://github.com/ceniklinux/log-guardian/blob/main/docs/VPS_SETUP.md"
          className="text-xs text-sky-300/80 hover:text-sky-200 underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("vpsPrepDocLink")}
        </Link>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-white/10 text-white/50 hover:text-white/80 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {t("vpsPrepRefresh")}
        </button>
      </div>
      <p className="text-xs text-white/45">{t("vpsPrepDesc")}</p>
      <div className="flex flex-wrap gap-2">
        <span
          className={`text-xs font-mono px-2 py-1 rounded-md border ${
            pass
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-200"
          }`}
        >
          gate: {pass ? "OK" : "WARN"}
        </span>
        <span className="text-xs font-mono px-2 py-1 rounded-md border bg-white/5 border-white/10 text-white/50">
          {data?.laptop_mode !== false ? "laptop" : "vps"} · proof {data?.competitive_proof ?? "—"}
        </span>
        {data?.xdp_mode && (
          <span className="text-xs font-mono px-2 py-1 rounded-md border bg-white/5 border-white/10 text-white/40">
            xdp: {data.xdp_mode}
          </span>
        )}
      </div>
      {data?.steps && data.steps.length > 0 && (
        <ul className="text-[11px] text-white/40 font-mono space-y-1 list-disc list-inside">
          {data.steps.slice(0, 4).map((s) => (
            <li key={s} className="truncate">
              {s}
            </li>
          ))}
          {data.steps.length > 4 && (
            <li className="text-white/30">+{data.steps.length - 4} …</li>
          )}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-[11px] text-white/50 font-mono bg-black/30 px-2 py-1 rounded border border-white/10">
          {gateCmd}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(gateCmd);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* ignore */
            }
          }}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-200 hover:bg-sky-500/25"
        >
          <ClipboardCopy className="w-3.5 h-3.5" />
          {copied ? t("vpsPrepCopied") : t("vpsPrepCopyGate")}
        </button>
        <span className="text-xs text-white/35 flex items-center gap-1">
          <Server className="w-3.5 h-3.5" />
          {t("vpsPrepPaused")}
        </span>
      </div>
    </div>
  );
}
