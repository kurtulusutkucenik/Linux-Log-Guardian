"use client";

import { useCallback, useEffect, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";

export default function CapabilitiesCarousel() {
  const { locale } = useI18n();
  const SELECTED = getCopy(locale).selected;
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(0);
  const total = SELECTED.cards.length;
  const card = SELECTED.cards[idx];

  const go = useCallback(
    (next: number) => {
      setDir(next > idx ? 1 : -1);
      setIdx((next + total) % total);
    },
    [idx, total],
  );

  useEffect(() => {
    const t = window.setInterval(() => go(idx + 1), 6000);
    return () => window.clearInterval(t);
  }, [idx, go]);

  return (
    <section id="secili" className="border-y border-neutral-900 bg-panel/40 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
              {SELECTED.eyebrow}
            </p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-5xl">
              {SELECTED.title}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-neutral-400">
              {SELECTED.lead}
            </p>
          </div>
        </Reveal>

        <Reveal delay={60} className="relative mx-auto mt-14 max-w-3xl">
          <article
            key={idx}
            className={`rounded-2xl border border-neutral-800 bg-panel-alt p-8 shadow-[0_0_40px_rgba(0,0,0,0.4)] transition-all duration-500 md:p-10 ${
              dir >= 0 ? "animate-[fadeSlideIn_0.45s_ease-out]" : "animate-[fadeSlideInRev_0.45s_ease-out]"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
                {card.tag}
              </span>
              <span className="rounded border border-neon/30 bg-black px-3 py-1 font-mono text-[10px] tracking-widest text-neon">
                {card.kicker}
              </span>
            </div>
            <h3 className="mt-6 font-display text-2xl font-bold text-white md:text-3xl">
              {card.title}
            </h3>
            <p className="mt-4 text-base leading-[1.8] text-neutral-400">{card.body}</p>
            <div className="mt-8 flex flex-wrap gap-2 border-t border-neutral-800 pt-6">
              {card.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-neutral-700 bg-black/50 px-3 py-1 font-mono text-xs text-neutral-300"
                >
                  {chip}
                </span>
              ))}
            </div>
          </article>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(idx - 1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 transition-all hover:border-neon hover:text-white"
              aria-label={SELECTED.prev}
            >
              ‹
            </button>
            <span className="min-w-[4rem] text-center font-mono text-sm tabular-nums text-neutral-500">
              {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => go(idx + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 transition-all hover:border-neon hover:text-white"
              aria-label={SELECTED.next}
            >
              ›
            </button>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {SELECTED.cards.map((c, i) => (
              <button
                key={c.kicker}
                type="button"
                onClick={() => {
                  setDir(i > idx ? 1 : -1);
                  setIdx(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-8 bg-neon" : "w-1.5 bg-neutral-700 hover:bg-neutral-500"
                }`}
                aria-label={`Kanıt ${i + 1}: ${c.kicker}`}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
