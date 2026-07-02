"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "@/lib/content";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { brandName } from "@/lib/i18n/copy";
import LangSwitcher from "@/components/ui/LangSwitcher";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useI18n();
  const name = brandName(locale);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (href: string) => (e: React.MouseEvent) => {
    setOpen(false);
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;
    const id = href.slice(hashIndex + 1);
    if (pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${id}`);
      }
    } else {
      e.preventDefault();
      router.push(`/#${id}`);
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[90] transition-all duration-300 ${
        scrolled
          ? "border-b border-neutral-900 bg-black/80 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-8">
        <Link
          href="/#hero"
          onClick={go("/#hero")}
          className="flex shrink-0 items-center gap-2"
        >
          <Image
            src="/logo-cenik.png"
            alt={name}
            width={80}
            height={80}
            priority
            className="h-9 w-9 object-contain"
          />
          <span className="hidden font-mono text-[13px] font-bold tracking-wide text-white sm:inline lg:text-sm">
            {name}
          </span>
          <span className="ml-1 hidden items-center gap-1.5 rounded-full border border-neutral-800 px-2 py-0.5 font-mono text-[9px] tracking-widest text-neutral-400 xl:inline-flex">
            <Image src="/flag-tr.svg" alt="TR" width={16} height={11} className="h-2.5 w-auto rounded-[1px]" />
            {t.turk_made}
          </span>
        </Link>

        <ul className="hidden items-center gap-4 xl:flex">
          {NAV.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={go(link.href)}
                className="text-sm text-neutral-400 transition-colors hover:text-white"
              >
                {t[link.i18n]}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <LangSwitcher />
          <Link
            href="#kurulum"
            onClick={go("#kurulum")}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-semibold text-neutral-200 shadow-[0_0_15px_rgba(255,59,59,0.18)] transition-all hover:border-neon hover:text-white hover:shadow-[0_0_25px_rgba(255,59,59,0.4)]"
          >
            {t.cta_setup}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LangSwitcher />
          <button
            type="button"
            aria-label="Menü"
            aria-expanded={open}
            className="text-neutral-300"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-neutral-900 bg-black/95 px-6 py-4 backdrop-blur-xl xl:hidden">
          <ul className="flex flex-col gap-4">
            {NAV.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={go(link.href)}
                  className="text-sm text-neutral-300"
                >
                  {t[link.i18n]}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="#kurulum"
                onClick={go("#kurulum")}
                className="inline-block rounded-md bg-neon px-4 py-2 text-sm font-semibold text-black"
              >
                {t.cta_setup}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
