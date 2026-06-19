"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES } from "@/lib/i18n";
import { useLanguage } from "./LanguageProvider";
import { BanNavBadge } from "./BanNavBadge";

export function SiteNav() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLanguage();

  const linkClass = (href: string) => {
    const active =
      href === "/"
        ? pathname === "/" || pathname === "/fleet"
        : pathname === href || pathname.startsWith(`${href}/`);
    return `nav-link ${active ? "nav-link-active" : ""}`;
  };

  if (pathname === "/login" || pathname === "/competitive-proof") return null;

  return (
    <nav className="sticky top-0 z-50 nav-bar print:hidden">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0 min-w-0">
          <img
            src="/brand-logo-circle.png"
            alt={t("brand")}
            width={512}
            height={512}
            className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 object-contain"
            decoding="async"
          />
          <div className="hidden md:block">
            <span className="font-semibold text-white text-sm tracking-wide block leading-tight">
              {t("brand")}
            </span>
            <span className="text-white/40 text-xs">v2.0</span>
          </div>
        </Link>

        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 overflow-x-auto">
          <Link href="/" className={linkClass("/")} id="nav-fleet">
            {t("navFleet")}
          </Link>
          <BanNavBadge />
          <Link href="/reports" className={linkClass("/reports")} id="nav-reports">
            {t("navReports")}
          </Link>
          <Link href="/tests" className={linkClass("/tests")} id="nav-tests">
            {t("navTests")}
          </Link>
          <Link href="/copilot" className={linkClass("/copilot")} id="nav-copilot">
            {t("navCopilot")}
          </Link>
          <Link href="/attack-tree" className={linkClass("/attack-tree")} id="nav-lineage">
            {t("navLineage")}
          </Link>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="sr-only">Language</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as typeof locale)}
            className="bg-black/40 border border-white/15 rounded-lg px-2 py-1.5 text-sm text-white/90 focus:outline-none focus:border-primary/40 cursor-pointer"
            aria-label="Site language"
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <span className="siem-badge hidden md:inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
            {t("siemLive")}
          </span>
        </div>
      </div>
    </nav>
  );
}
