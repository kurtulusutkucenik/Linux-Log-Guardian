"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBannedIps } from "@/context/BannedIpsContext";
import { useLanguage } from "./LanguageProvider";

export function BanNavBadge() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { totalCount } = useBannedIps();
  const active = pathname === "/bans";

  return (
    <Link
      href="/bans"
      className={`nav-link relative ${active ? "nav-link-active" : ""}`}
      id="nav-bans"
    >
      {t("navBans")}
      {totalCount > 0 && (
        <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500/90 text-white text-[10px] font-bold">
          {totalCount > 99 ? "99+" : totalCount}
        </span>
      )}
    </Link>
  );
}
