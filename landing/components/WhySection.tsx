"use client";

import Reveal from "@/components/ui/Reveal";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSections } from "@/lib/i18n/sections";

export default function WhySection() {
  const { locale } = useI18n();
  const s = getSections(locale);

  return (
    <section id="neden" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <Reveal>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
            //:Why
          </p>
          <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tighter text-white sm:text-3xl md:text-5xl">
            {s.why_title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-neutral-400">{s.why_lead}</p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {s.why_cards.map((card, i) => (
          <Reveal key={card.title} delay={i * 30}>
            <article className="h-full min-w-0 rounded-xl border border-neutral-800 bg-panel-alt p-5 sm:p-7">
              <span className="font-mono text-sm font-bold text-neon">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-white sm:text-lg">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">{card.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {s.stats.map((stat) => (
          <div
            key={stat.label}
            className="min-w-0 rounded-xl border border-neutral-800 bg-panel p-4 text-center sm:p-6"
          >
            <p className="font-display text-[clamp(1.2rem,3.2vw,2.1rem)] font-black leading-none tracking-tight text-neon tabular-nums">
              {stat.value}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-neutral-500 sm:text-[11px]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
