"use client";

import { Fragment } from "react";
import Reveal from "@/components/ui/Reveal";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";
import { getPipelineDeep } from "@/lib/i18n/pipelineDeep";

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

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PipelineSection() {
  const { locale } = useI18n();
  const PIPELINE = getCopy(locale).pipeline;
  const deep = getPipelineDeep(locale);
  const top = PIPELINE.steps.slice(0, 3);
  const bottom = PIPELINE.steps.slice(3, 6);
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
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch">
            {top.map((step, i) => (
              <Fragment key={step.n}>
                <StepCard {...step} />
                {i < top.length - 1 && <ArrowRight />}
              </Fragment>
            ))}
          </div>

          <ArrowDownFromRight />

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

      <div className="mt-20 border-t border-neutral-900 pt-20">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
              {deep.sectionEyebrow}
            </p>
            <h3 className="mt-4 font-display text-2xl font-extrabold tracking-tighter text-white md:text-4xl">
              {deep.sectionTitle}
            </h3>
            <p className="mt-5 text-base leading-relaxed text-neutral-400">{deep.sectionSub}</p>
          </div>
        </Reveal>

        <div className="mt-16 space-y-16">
          {PIPELINE.steps.map((step, i) => {
            const dive = deep.steps[i];
            if (!dive) return null;
            const flip = i % 2 === 1;

            return (
              <Reveal key={step.n} delay={i * 40}>
                <article
                  id={`pipeline-${step.n}`}
                  className="scroll-mt-28 rounded-2xl border border-neutral-800 bg-panel/30 p-6 md:p-10"
                >
                  <div
                    className={`grid gap-10 lg:grid-cols-2 lg:items-start ${flip ? "lg:[direction:rtl]" : ""}`}
                  >
                    <div className={`min-w-0 ${flip ? "lg:[direction:ltr]" : ""}`}>
                      <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-neon/50 bg-black font-mono text-lg font-bold text-neon">
                          {step.n}
                        </span>
                        <h4 className="font-display text-xl font-bold text-white md:text-2xl">
                          {step.label}
                        </h4>
                      </div>
                      <p className="mt-2 font-mono text-[11px] text-neutral-500">{step.hint}</p>
                      <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-neon">
                        {deep.whatLabel}
                      </p>
                      <p className="mt-2 text-base leading-[1.75] text-neutral-300">{dive.what}</p>
                      {dive.proof && (
                        <p className="mt-4 inline-block rounded-md border border-neon/30 bg-neon/5 px-3 py-1.5 font-mono text-[11px] text-neon">
                          {dive.proof}
                        </p>
                      )}
                    </div>

                    <div className={`min-w-0 space-y-6 ${flip ? "lg:[direction:ltr]" : ""}`}>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-white">
                          {deep.advantagesLabel}
                        </p>
                        <ul className="mt-3 space-y-2.5">
                          {dive.advantages.map((adv) => (
                            <li key={adv.slice(0, 32)} className="flex gap-2.5 text-sm leading-relaxed text-neutral-400">
                              <CheckIcon />
                              <span>{adv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-neutral-800 bg-panel-alt p-5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                          {deep.compareLabel}
                        </p>
                        <div className="mt-4 space-y-4">
                          <div className="rounded-lg border border-neon/30 bg-neon/5 p-4">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-neon">
                              {deep.lgLabel}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-200">{dive.lg}</p>
                          </div>
                          <div className="rounded-lg border border-neutral-700 bg-black/40 p-4">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                              {deep.rivalsLabel}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-500">{dive.rivals}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
