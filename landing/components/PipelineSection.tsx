"use client";

import { Fragment } from "react";
import Reveal from "@/components/ui/Reveal";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";

function StepCard({
  n,
  label,
  hint,
}: {
  n: string;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-neutral-800 bg-panel-alt p-6 transition-all hover:border-neutral-600">
      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-neon/40 bg-black font-mono text-sm font-bold text-neon">
        {n}
      </span>
      <h3 className="mt-4 font-display text-base font-bold text-white">{label}</h3>
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-neutral-500">{hint}</p>
    </div>
  );
}

function ArrowRight() {
  return (
    <div className="flex items-center justify-center px-1" aria-hidden="true">
      <span className="font-mono text-2xl text-neon">→</span>
    </div>
  );
}

function ArrowLeft() {
  return (
    <div className="flex items-center justify-center px-1" aria-hidden="true">
      <span className="font-mono text-2xl text-neon">←</span>
    </div>
  );
}

/** 3'ten 4'e: sağ sütundan aşağı */
function ArrowDownFromRight() {
  return (
    <div
      className="flex justify-end pr-[calc(8.33%-4px)] py-2 md:pr-[calc(8.33%-2px)]"
      aria-hidden="true"
    >
      <span className="font-mono text-2xl text-neon">↓</span>
    </div>
  );
}

export default function PipelineSection() {
  const { locale } = useI18n();
  const PIPELINE = getCopy(locale).pipeline;
  const top = PIPELINE.steps.slice(0, 3);
  const bottom = PIPELINE.steps.slice(3, 6);
  // Alt sıra sağdan sola: 6 ← 5 ← 4 (akış 3↓4 sonra 4→5→6 sağdan sola numara artar)
  const bottomReversed = [...bottom].reverse();

  return (
    <section id="pipeline" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <Reveal>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
            {PIPELINE.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-5xl">
            {PIPELINE.title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-neutral-400">{PIPELINE.sub}</p>
        </div>
      </Reveal>

      <Reveal delay={80} className="mt-16">
        <div className="flex flex-col items-center gap-2 md:hidden">
          {PIPELINE.steps.map((step, i) => (
            <Fragment key={step.n}>
              <div className="w-full max-w-sm">
                <StepCard {...step} />
              </div>
              {i < PIPELINE.steps.length - 1 && (
                <span className="font-mono text-xl text-neon" aria-hidden="true">
                  ↓
                </span>
              )}
            </Fragment>
          ))}
        </div>

        <div className="hidden md:block">
          {/* Üst: 1 → 2 → 3 */}
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch">
            {top.map((step, i) => (
              <Fragment key={step.n}>
                <StepCard {...step} />
                {i < top.length - 1 && <ArrowRight />}
              </Fragment>
            ))}
          </div>

          <ArrowDownFromRight />

          {/* Alt: 6 ← 5 ← 4  (sağdan sola artan numara: 4 sağda, 6 solda) */}
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch">
            {bottomReversed.map((step, i) => (
              <Fragment key={step.n}>
                <StepCard {...step} />
                {i < bottomReversed.length - 1 && <ArrowLeft />}
              </Fragment>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <p className="mx-auto mt-10 max-w-3xl text-center text-sm leading-relaxed text-neutral-500">
          {PIPELINE.note}
        </p>
      </Reveal>
    </section>
  );
}
