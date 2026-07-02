"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV } from "@/lib/content";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /** Smart navigation: hash → smooth scroll (on home) or route+hash; else route. */
  const go = (href: string) => (e: React.MouseEvent) => {
    setOpen(false);
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return; // plain route → let <Link> handle it

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
      className={`fixed inset-x-0 top-0 z-[90] transition-all duration-500 ${
        scrolled
          ? "border-b border-white/5 bg-[#05070f]/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/#hero"
          onClick={go("/#hero")}
          className="interactive flex items-center gap-2.5 font-display text-sm font-bold tracking-tight"
        >
          <Image
            src="/logo-cenik.png"
            alt="Cenik Linux Log Guardian logosu"
            width={120}
            height={72}
            priority
            className="h-9 w-auto object-contain"
          />
          <span className="hidden text-slate-100 sm:inline">Linux Log Guardian</span>
          <span className="ml-1 hidden items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-slate-400 lg:inline-flex">
            <img src="/flag-tr.svg" alt="Türk bayrağı" className="h-2.5 w-3.5" />
            TÜRK YAPIMI
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={go(n.href)}
              className="interactive text-xs font-medium tracking-wide text-slate-400 transition-colors hover:text-white"
            >
              {n.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex">
          <Link
            href="/#kurulum"
            onClick={go("/#kurulum")}
            className="interactive rounded-full bg-[#e8eaed] px-4 py-2 font-display text-xs font-bold text-black transition-transform hover:scale-105"
          >
            15 dk kurulum
          </Link>
        </div>

        <button
          type="button"
          aria-label="Menü"
          onClick={() => setOpen((v) => !v)}
          className="interactive md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 bg-[#05070f]/95 px-6 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={go(n.href)}
                className="text-sm text-slate-300"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
