"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function LangSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const current = LOCALES.find((l) => l.code === locale);

  const turkic = LOCALES.filter((l) => l.group === "turkic");
  const other = LOCALES.filter((l) => l.group === "other");

  const pick = (code: Locale) => {
    setLocale(code);
    setOpen(false);
    const label = LOCALES.find((l) => l.code === code)?.native ?? code;
    setToast(label);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
    const birlesim = document.getElementById("birlesim");
    if (birlesim) {
      birlesim.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div ref={ref} className="relative">
      {toast && (
        <div
          role="status"
          className="pointer-events-none absolute -bottom-10 right-0 z-[110] whitespace-nowrap rounded-md border border-neon/40 bg-black/95 px-2.5 py-1 font-mono text-[10px] text-neon shadow-lg sm:-bottom-11"
        >
          ✓ {toast}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-black/60 px-2.5 py-1.5 font-mono text-[11px] text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="text-neutral-600">{t.lang_label}:</span>
        <span className="font-semibold text-white">{current?.native ?? locale}</span>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[100] mt-2 max-h-[min(70vh,420px)] w-56 overflow-y-auto rounded-xl border border-neutral-800 bg-black/95 py-2 shadow-2xl backdrop-blur-xl"
          role="listbox"
        >
          <p className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-neutral-600">
            Türk dilleri
          </p>
          {turkic.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={locale === l.code}
              onClick={() => pick(l.code)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-900 ${
                locale === l.code ? "text-neon" : "text-neutral-300"
              }`}
            >
              <span>{l.native}</span>
              <span className="font-mono text-[10px] text-neutral-600">{l.code}</span>
            </button>
          ))}
          <p className="mt-2 border-t border-neutral-800 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-neutral-600">
            Diğer diller
          </p>
          {other.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={locale === l.code}
              onClick={() => pick(l.code)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-900 ${
                locale === l.code ? "text-neon" : "text-neutral-300"
              }`}
            >
              <span>{l.native}</span>
              <span className="font-mono text-[10px] text-neutral-600">{l.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
