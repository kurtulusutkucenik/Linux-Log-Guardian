"use client";

import { type SetupStep } from "@/lib/content";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";

function Step({ step }: { step: SetupStep }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-black/40 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-neon/30 bg-black font-mono text-xs font-bold text-neon">
          {step.number}
        </span>
        <h4 className="font-display text-sm font-bold text-white">{step.title}</h4>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        {step.description}
      </p>
      <pre className="mt-3 overflow-x-auto rounded-md border border-neutral-800 bg-black p-3 font-mono text-[11px] leading-relaxed text-neutral-300">
        {step.command}
      </pre>
      {step.output && (
        <pre className="mt-2 overflow-x-auto rounded-md border border-neutral-900 bg-panel p-3 font-mono text-[11px] leading-relaxed text-ok">
          {step.output}
        </pre>
      )}
    </div>
  );
}

export default function SetupGuide() {
  const { locale } = useI18n();
  const SETUP = getCopy(locale).setup;
  return (
    <section
      id="kurulum"
      className="border-y border-neutral-900 bg-panel/40 py-24"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
            {SETUP.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-5xl">
            {SETUP.title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-neutral-400">
            {SETUP.sub}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-500">
            {SETUP.intro}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-neutral-800 bg-panel-alt p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">
            {SETUP.requirementsTitle}
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {SETUP.requirements.map((req) => (
              <li key={req} className="flex gap-2 text-sm text-neutral-400">
                <span className="mt-0.5 shrink-0 text-neon">✓</span>
                {req}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {SETUP.paths.map((path) => (
            <div
              key={path.id}
              className="flex flex-col rounded-xl border border-neutral-800 bg-panel p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neon font-display text-sm font-black text-black">
                  {path.id}
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  {path.title}
                </h3>
                <span className="ml-auto rounded-full border border-neutral-700 px-3 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  {path.badge}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">
                {path.note}
              </p>
              <div className="mt-5 space-y-4">
                {path.steps.map((step) => (
                  <Step key={path.id + step.number} step={step} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-neutral-800 bg-panel p-6">
          <h3 className="font-display text-lg font-bold text-white">
            {SETUP.common.title}
          </h3>
          <div className="mt-5 space-y-4">
            {SETUP.common.steps.map((step) => (
              <Step key={"common" + step.number} step={step} />
            ))}
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-neutral-800 bg-panel p-6">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-lg font-bold text-white">
              {SETUP.dashboard.title}
            </h3>
            <span className="rounded-full border border-cyan/30 px-3 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan">
              {SETUP.dashboardBadge}
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-neutral-500">
            {SETUP.dashboard.note}
          </p>
          <div className="mt-5 space-y-4">
            {SETUP.dashboard.steps.map((step) => (
              <Step key={"dash" + step.number} step={step} />
            ))}
          </div>
          <p className="mt-6 rounded-lg border border-neon/20 bg-neon/[0.04] p-4 font-mono text-xs leading-relaxed text-neutral-400">
            {SETUP.tip}
          </p>
        </div>
      </div>
    </section>
  );
}
