"use client";

import { useEffect } from "react";
import { RefreshCw, ShieldBan } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import { BanIpButton } from "./BanIpButton";
import { useBanPreview } from "@/context/BannedIpsContext";

type Props = {
  compact?: boolean;
  className?: string;
};

const PREVIEW_LIMIT = 15;

export function BannedIpsPanel({ compact = false, className = "" }: Props) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const highlightIp = searchParams.get("ip")?.trim() || "";
  const { bans, totalCount, truncated, source, preview, loading, refreshing, refresh } =
    useBanPreview(PREVIEW_LIMIT);
  const spinning = loading || refreshing;

  useEffect(() => {
    if (!highlightIp) return;
    const el = document.getElementById(`ban-ip-${highlightIp}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightIp, bans.length]);

  return (
    <div
      className={`glass-panel border border-red-500/20 ${compact ? "p-4" : "p-5"} ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2
          className={`font-semibold flex items-center gap-2 text-red-400 ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          <ShieldBan className="w-5 h-5" />
          {t("bannedIpsTitle")}
          <span className="text-sm font-normal text-white/40">
            ({totalCount.toLocaleString()}
            {truncated ? "+" : ""})
          </span>
        </h2>
        <div className="flex items-center gap-1">
          {preview && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 bg-amber-500/10">
              {t("bannedIpsProofMode")}
            </span>
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={spinning}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 disabled:opacity-50"
            title={t("bannedIpsRefresh")}
            aria-label={t("bannedIpsRefresh")}
          >
            <RefreshCw className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} />
          </button>
          {!compact && (
            <Link href="/bans" className="text-xs text-primary hover:underline px-2">
              {t("navBans")} →
            </Link>
          )}
        </div>
      </div>

      {preview && (
        <p className="text-xs text-amber-400/70 mb-3">{t("bannedIpsProofDesc")}</p>
      )}

      {source && (
        <p className="text-xs text-white/35 mb-3 font-mono">
          {t("bannedIpsSource")}: {source}
        </p>
      )}

      {loading && bans.length === 0 ? (
        <p className="text-sm text-white/45">{t("bannedIpsLoading")}</p>
      ) : totalCount === 0 ? (
        <p className="text-sm text-white/45">{t("bannedIpsEmpty")}</p>
      ) : (
        <>
          {truncated && (
            <p className="text-xs text-white/40 mb-2">
              {t("bannedIpsPreview")} ({bans.length}/{totalCount.toLocaleString()}) —{" "}
              <Link href="/bans" className="text-primary hover:underline">
                {t("navBans")}
              </Link>
            </p>
          )}
          <ul className={`space-y-2 overflow-y-auto ${compact ? "max-h-40" : "max-h-56"}`}>
            {bans.map((b) => (
              <li
                key={b.ip}
                id={`ban-ip-${b.ip}`}
                className={`flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-black/30 border transition-colors ${
                  highlightIp === b.ip
                    ? "border-primary ring-1 ring-primary/40"
                    : "border-white/10 hover:border-red-500/15"
                }`}
              >
                <div className="min-w-0">
                  <span className="font-mono text-sm text-red-300 truncate block">{b.ip}</span>
                  {b.reason && (
                    <span className="text-[10px] text-white/35 truncate block">{b.reason}</span>
                  )}
                </div>
                <BanIpButton
                  ip={b.ip}
                  variant="unban"
                  compact
                  readOnly={preview}
                  reason="dashboard-unban"
                  onRefresh={() => void refresh()}
                  onDone={() => void refresh()}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
