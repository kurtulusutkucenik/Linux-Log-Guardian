"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { PROOF_TEST_COUNT } from "@/lib/content";
import { getSectorCopy } from "@/lib/sectors";

export default function SectorUseCases() {
  const { locale } = useI18n();
  const s = getSectorCopy(locale);

  return (
    <section id="sektor" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400">{s.eyebrow}</p>
        <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-4xl">
          {s.title}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-neutral-500">{s.note}</p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {s.cards.map((card) => (
          <div
            key={card.tag}
            className="rounded-xl border border-neutral-800 bg-panel-alt p-6 transition-colors hover:border-neutral-700"
          >
            <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
              {card.tag}
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-white">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">{card.body}</p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-neutral-600">
              {card.proof}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/evidence/competitive-proof.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md border border-neutral-700 bg-panel px-5 py-2.5 text-sm font-medium text-neutral-300 transition-all hover:border-neon/40 hover:text-white"
        >
          {locale === "tr" ? "Rakip karşılaştırma PDF" : "Competitive proof PDF"}
        </Link>
        <Link
          href="/testler"
          className="inline-flex items-center justify-center rounded-md bg-neon/10 px-5 py-2.5 text-sm font-semibold text-neon ring-1 ring-neon/30 hover:bg-neon/20"
        >
          {PROOF_TEST_COUNT} {locale === "tr" ? "test" : "tests"} →
        </Link>
      </div>
    </section>
  );
}
