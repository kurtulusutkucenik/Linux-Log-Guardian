"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSections } from "@/lib/i18n/sections";

export default function AboutSection() {
  const { locale } = useI18n();
  const s = getSections(locale);

  return (
    <section id="nedir" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start lg:gap-12">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
            {s.about_eyebrow}
          </p>
          <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tighter text-white sm:text-3xl md:text-5xl">
            {s.about_title}
          </h2>
          <p className="mt-6 text-base leading-[1.75] text-neutral-300 sm:text-lg">
            {s.about_intro}
          </p>
          <div className="mt-6 space-y-4">
            {s.about_paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="text-sm leading-[1.85] text-neutral-400">
                {p}
              </p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {s.about_highlights.map((h) => (
            <div
              key={h.k}
              className="min-w-0 rounded-xl border border-neutral-800 bg-panel-alt p-4 transition-all hover:border-neutral-700 sm:p-5"
            >
              <p className="font-display text-base font-black tracking-tight text-neon sm:text-lg">
                {h.k}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">{h.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
