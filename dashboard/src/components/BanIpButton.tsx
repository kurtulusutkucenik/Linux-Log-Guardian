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
  className = "",
  onDone,
  onRefresh,
}: Props) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [flashErr, setFlashErr] = useState(false);

  const showUnban = variant === "unban" || (variant === "ban" && banned);
  const showBannedBadge = variant === "ban" && banned && !busy;

  const run = async () => {
    if (busy || !ip) return;
    setBusy(true);
    setFlashErr(false);
    const action = showUnban ? "UNBAN_IP" : "BAN_IP";
    try {
      const res = await axios.post(
        "/api/fleet/commands",
        {
          commandType: action,
          payload: ip,
          reason,
        },
        { withCredentials: true },
      );
      const ib = res.data?.immediateBan as
        | { ok?: boolean; message?: string }
        | undefined;
      const ok = ib?.ok ?? res.data?.success;
      const msg =
        ib?.message ||
        (ok
          ? showUnban
            ? t("unbanSuccess")
            : t("banSuccess")
          : t("banQueuedOnly"));
      if (!ok) setFlashErr(true);
      onDone?.(!!ok, msg);
      if (ok) onRefresh?.();
      if (!ok) setTimeout(() => setFlashErr(false), 4000);
    } catch {
      setFlashErr(true);
      onDone?.(false, t("banFailed"));
      setTimeout(() => setFlashErr(false), 4000);
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
    <button
      type="button"
      onClick={run}
      disabled={busy || !ip}
      title={ip}
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
  );
}
