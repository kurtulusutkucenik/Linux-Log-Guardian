"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBannedIps } from "@/context/BannedIpsContext";
import { useLanguage } from "./LanguageProvider";

export function BanNavBadge() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { totalCount, preview, dataMode, source } = useBannedIps();
  const active = pathname === "/bans";
  const liveIpset =
    !preview && dataMode === "live" && source === "ipset" && totalCount > 0;
  const title = liveIpset
    ? `${t("bannedIpsLiveMode")}: ${totalCount}`
    : preview
      ? t("bannedIpsProofMode")
      : totalCount > 0
        ? `${t("navBans")}: ${totalCount}`
        : t("navBans");

  return (
    <Link
      href="/bans"
      className={`nav-link relative ${active ? "nav-link-active" : ""}`}
      id="nav-bans"
      title={title}
    >
      {liveIpset && (
        <span
          className="absolute -top-0.5 left-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0f1a]"
          aria-hidden
        />
      )}
      {t("navBans")}
      {totalCount > 0 && (
        <span
          className={`ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-white text-[10px] font-bold ${
            liveIpset ? "bg-red-500 ring-1 ring-emerald-400/40" : "bg-red-500/90"
          }`}
        >
          {totalCount > 99 ? "99+" : totalCount}
        </span>
      )}
    </Link>
  );
}
