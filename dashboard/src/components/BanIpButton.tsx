"use client";

import { useState } from "react";
import { ShieldBan, ShieldCheck, Loader2 } from "lucide-react";
import axios from "axios";
import { useLanguage } from "./LanguageProvider";

type Props = {
  ip: string;
  reason?: string;
  variant?: "ban" | "unban";
  /** IP zaten ipset/XDP listesinde */
  banned?: boolean;
  compact?: boolean;
  readOnly?: boolean;
  className?: string;
  onDone?: (ok: boolean, message: string) => void;
  onRefresh?: () => void;
};

export function BanIpButton({
  ip,
  reason = "dashboard-ban",
  variant = "ban",
  banned = false,
  compact = false,
  readOnly = false,
  className = "",
  onDone,
  onRefresh,
}: Props) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [flashErr, setFlashErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const showUnban = !readOnly && (variant === "unban" || (variant === "ban" && banned));
  const showBannedBadge = variant === "ban" && banned && !busy;

  if (readOnly) {
    return (
      <span
        className={`text-[10px] uppercase tracking-wide text-amber-400/80 px-2 py-1 rounded border border-amber-500/25 bg-amber-500/10 ${className}`}
      >
        {t("bannedIpsProofOnly")}
      </span>
    );
  }

  const run = async () => {
    if (busy || !ip) return;
    if (!showUnban) {
      const prompt = t("banConfirm").replace("{ip}", ip);
      if (typeof window !== "undefined" && !window.confirm(prompt)) return;
    }
    setBusy(true);
    setFlashErr(false);
    setErrMsg("");
    const action = showUnban ? "unban" : "ban";
    try {
      const res = await axios.post(
        "/api/guardian/ban",
        { ip, action, reason },
        { withCredentials: true },
      );
      const ok = res.data?.success === true;
      const msg =
        (typeof res.data?.message === "string" && res.data.message) ||
        (ok
          ? showUnban
            ? t("unbanSuccess")
            : t("banSuccess")
          : t("banFailed"));
      if (!ok) {
        setFlashErr(true);
        setErrMsg(msg);
      }
      onDone?.(ok, msg);
      if (ok) onRefresh?.();
      if (!ok) setTimeout(() => { setFlashErr(false); setErrMsg(""); }, 8000);
    } catch (err: unknown) {
      setFlashErr(true);
      let msg = t("banFailed");
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { error?: string; message?: string } | undefined;
        msg = d?.error || d?.message || msg;
      }
      setErrMsg(msg);
      onDone?.(false, msg);
      setTimeout(() => { setFlashErr(false); setErrMsg(""); }, 8000);
    } finally {
      setBusy(false);
    }
  };

  if (showBannedBadge) {
    return (
      <button
        type="button"
        onClick={run}
        disabled={busy}
        title={`${ip} — ${t("ipBannedHint")}`}
        className={
          className ||
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 bg-green-600/25 text-green-300 border border-green-500/40 hover:bg-green-600/35"
        }
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5" />
        )}
        {compact ? t("ipBannedShort") : t("ipBanned")}
      </button>
    );
  }

  const label = showUnban
    ? compact
      ? t("unbanShort")
      : t("unbanIp")
    : compact
      ? t("banShort")
      : t("executeBan");

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={busy || !ip}
        title={errMsg || ip}
        className={
          className ||
          `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            showUnban
              ? "bg-slate-700 text-white hover:bg-slate-600"
              : flashErr
                ? "bg-amber-600 text-white"
                : "bg-red-600 text-white hover:bg-red-500"
          }`
        }
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ShieldBan className="w-3.5 h-3.5" />
        )}
        {label}
      </button>
      {errMsg && (
        <span className="text-[10px] text-amber-300 max-w-[14rem] text-right leading-tight">
          {errMsg}
        </span>
      )}
    </span>
  );
}
