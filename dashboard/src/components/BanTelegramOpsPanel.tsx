"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, ClipboardCopy, MessageSquare, RotateCcw } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type Props = {
  ip: string;
  ack?: { operator: string; ts: number };
};

function fmtTs(ts: number): string {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BanTelegramOpsPanel({ ip, ack }: Props) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [banned, setBanned] = useState<boolean | null>(null);
  const undoCmd = `bash scripts/telegram_operator_undo.sh ${ip}`;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/bans?search=${encodeURIComponent(ip)}&limit=5`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { bans?: { ip: string }[] };
        if (!cancelled) {
          setBanned((data.bans ?? []).some((b) => b.ip === ip));
        }
      } catch {
        if (!cancelled) setBanned(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [ip]);

  const copyCmd = async () => {
    try {
      await navigator.clipboard.writeText(undoCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-4 py-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <MessageSquare className="w-4 h-4 text-violet-300" />
        <h3 className="text-sm font-semibold text-violet-200">{t("bansTelegramOpsTitle")}</h3>
        <span className="font-mono text-xs text-white/50">{ip}</span>
      </div>
      <p className="text-xs text-white/45">{t("bansTelegramOpsDesc")}</p>
      {ack ? (
        <p className="text-xs text-emerald-300/90 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          {t("bansTelegramAcked")} · {ack.operator}
          {ack.ts > 0 && <span className="text-white/35">({fmtTs(ack.ts)})</span>}
        </p>
      ) : (
        <p className="text-xs text-white/40">{t("bansTelegramNoAck")}</p>
      )}
      {banned === true && (
        <p className="text-xs text-red-300/90 flex items-center gap-1.5">
          <Ban className="w-3.5 h-3.5 shrink-0" />
          {t("bansTelegramLiveBan")}
        </p>
      )}
      {banned === false && (
        <p className="text-xs text-white/35">{t("bansTelegramNotBanned")}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <code className="text-[11px] font-mono text-white/60 bg-black/30 px-2 py-1 rounded border border-white/10">
          {undoCmd}
        </code>
        <button
          type="button"
          onClick={() => void copyCmd()}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-white/10 text-white/60 hover:text-white hover:border-white/25"
        >
          <ClipboardCopy className="w-3 h-3" />
          {copied ? t("bansTelegramCopied") : t("bansTelegramCopy")}
        </button>
        <span className="text-[10px] text-white/30 inline-flex items-center gap-1">
          <RotateCcw className="w-3 h-3" />
          {t("bansTelegramUndoHint")}
        </span>
      </div>
      <p className="text-[10px] text-white/30">
        <Link href="/#soc-timeline" className="text-cyan-400/70 hover:text-cyan-300 hover:underline">
          {t("attackMapSocLink")}
        </Link>
        {" · "}
        <Link href="/#webhook-ops" className="text-violet-400/70 hover:text-violet-300 hover:underline">
          {t("grafanaTelegramLinkOps")}
        </Link>
        {" · "}
        <Link href="/tests" className="text-violet-400/70 hover:text-violet-300 hover:underline">
          {t("testsViewAll")}
        </Link>
      </p>
    </div>
  );
}
