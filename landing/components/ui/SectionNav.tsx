"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "hero", label: "Ana" },
  { id: "nedir", label: "Nedir" },
  { id: "birlesim", label: "3 Paket" },
  { id: "sayilar", label: "Sayılar" },
  { id: "pipeline", label: "Pipeline" },
  { id: "secili", label: "Kanıt" },
  { id: "neden", label: "Neden" },
  { id: "rakipler", label: "Rakip" },
  { id: "grafikler", label: "Grafik" },
  { id: "kurulum", label: "Kurulum" },
  { id: "iletisim", label: "İletişim" },
];

export default function SectionNav() {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = SECTIONS.findIndex((s) => s.id === e.target.id);
            if (i >= 0) setIdx(i);
          }
        });
      },
      { threshold: 0.25, rootMargin: "-80px 0px -40% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const go = (next: number) => {
    const i = Math.max(0, Math.min(SECTIONS.length - 1, next));
    const el = document.getElementById(SECTIONS[i].id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${SECTIONS[i].id}`);
    }
  };

  if (!show) return null;

  return (
        <div
          className="fixed bottom-4 right-4 z-[80] flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-black/90 p-1.5 shadow-[0_0_24px_rgba(0,0,0,0.6)] backdrop-blur-md sm:bottom-6 sm:right-6 sm:p-2"
          aria-label="Bölüm gezintisi"
        >
      <button
        type="button"
        onClick={() => go(idx - 1)}
        disabled={idx === 0}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-25"
        aria-label="Önceki bölüm"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <span className="px-1 font-mono text-[10px] tabular-nums text-neutral-500">
        {String(idx + 1).padStart(2, "0")}/{String(SECTIONS.length).padStart(2, "0")}
      </span>
      <span className="max-w-[72px] truncate px-1 text-center font-mono text-[9px] uppercase tracking-wider text-neon">
        {SECTIONS[idx].label}
      </span>
      <button
        type="button"
        onClick={() => go(idx + 1)}
        disabled={idx === SECTIONS.length - 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-25"
        aria-label="Sonraki bölüm"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
