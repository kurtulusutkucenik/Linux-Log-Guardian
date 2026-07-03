"use client";

import { useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getTiers, type Tier, type TierStep } from "@/lib/tiers";

const ACCENT: Record<Tier["accent"], { text: string; border: string; bg: string; chip: string }> = {
  neon: { text: "text-neon", border: "border-neon/30", bg: "from-neon/[0.06]", chip: "border-neon/30 text-neon" },
  turq: { text: "text-turq", border: "border-turq/30", bg: "from-turq/[0.06]", chip: "border-turq/30 text-turq" },
  cyan: { text: "text-cyan", border: "border-cyan/30", bg: "from-cyan/[0.06]", chip: "border-cyan/30 text-cyan" },
};

function Step({ step }: { step: TierStep }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-black/40 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-neon/30 bg-black font-mono text-xs font-bold text-neon">
          {step.n}
        </span>
        <h4 className="font-display text-sm font-bold text-white">{step.title}</h4>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-neutral-500">{step.desc}</p>
      <pre className="mt-3 overflow-x-auto rounded-md border border-neutral-800 bg-black p-3 font-mono text-[11px] leading-relaxed text-neutral-300">
        {step.cmd}
      </pre>
      {step.out && (
        <pre className="mt-2 overflow-x-auto rounded-md border border-neutral-900 bg-panel p-3 font-mono text-[11px] leading-relaxed text-ok">
          {step.out}
        </pre>
      )}
    </div>
  );
}

function PackageCard({ tier, t }: { tier: Tier; t: ReturnType<typeof getTiers> }) {
  const a = ACCENT[tier.accent];
  return (
    <article
      className={`flex h-full min-w-0 flex-col rounded-2xl border ${a.border} bg-gradient-to-b ${a.bg} to-transparent p-5 sm:p-7`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 font-mono text-xs font-bold ${a.chip}`}>
          {tier.name}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
          {tier.badge}
        </span>
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-white sm:text-xl">{tier.fullName}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-400">{tier.tagline}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-800 bg-black/40 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">{t.ramLabel}</p>
          <p className={`mt-1 font-display text-sm font-black ${a.text}`}>{tier.ram}</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-black/40 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">{t.diskLabel}</p>
          <p className={`mt-1 font-display text-sm font-black ${a.text}`}>{tier.disk}</p>
        </div>
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-neutral-500">{t.chainLabel}</p>
      <p className="mt-1 font-mono text-[11px] leading-relaxed text-neutral-400">{tier.chain}</p>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-neutral-500">{t.includesLabel}</p>
      <ul className="mt-2 flex flex-1 flex-wrap gap-1.5">
        {tier.includes.map((inc) => (
          <li
            key={inc}
            className="rounded border border-neutral-800 bg-black/40 px-2 py-1 font-mono text-[10px] text-neutral-400"
          >
            {inc}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function TierGuide() {
  const { locale } = useI18n();
  const t = getTiers(locale);
  const [active, setActive] = useState(0);
  const activeTier = t.tiers[active];
  const a = ACCENT[activeTier.accent];

  return (
    <section id="kurulum" className="border-y border-neutral-900 bg-panel/40 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Sürüm paketleri */}
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">{t.eyebrow}</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-5xl">
              {t.title}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-neutral-400">{t.sub}</p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {t.tiers.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 50}>
              <PackageCard tier={tier} t={t} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={80}>
          <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-neutral-500">
            {t.protectionNote}
          </p>
        </Reveal>

        {/* Sorumluluk sınırı */}
        <Reveal delay={100}>
          <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-neutral-800 bg-black/40 p-6 sm:p-8">
            <h3 className="font-display text-lg font-bold text-white sm:text-xl">{t.respTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">{t.respBody}</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-neutral-800">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-panel">
                      {t.respCols.map((col, i) => (
                        <th
                          key={col}
                          className={`px-4 py-3 font-mono text-[11px] uppercase tracking-wider ${
                            i === 1 ? "text-neon" : "text-neutral-400"
                          }`}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.respRows.map((row) => (
                      <tr key={row.layer} className="border-b border-neutral-900">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-300">
                          {row.layer}
                        </td>
                        <td className="px-4 py-3 text-xs leading-relaxed text-neon">{row.ours}</td>
                        <td className="px-4 py-3 text-xs leading-relaxed text-neutral-500">
                          {row.third}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Sürüme göre kurulum */}
        <Reveal delay={120}>
          <div className="mx-auto mt-16 max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-turq">{t.installEyebrow}</p>
            <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tighter text-white md:text-4xl">
              {t.installTitle}
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-neutral-400">{t.installSub}</p>
          </div>
        </Reveal>

        {/* Sekme seçici */}
        <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-2">
          {t.tiers.map((tier, i) => {
            const on = i === active;
            const ta = ACCENT[tier.accent];
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setActive(i)}
                className={`rounded-full border px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                  on
                    ? `${ta.border} ${ta.text} bg-white/[0.03]`
                    : "border-neutral-800 text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {tier.name}
              </button>
            );
          })}
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <div className={`rounded-xl border ${a.border} bg-panel p-6`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`flex h-8 items-center rounded-md border px-3 font-display text-sm font-black ${a.chip}`}>
                {activeTier.name}
              </span>
              <h3 className="font-display text-lg font-bold text-white">{activeTier.fullName}</h3>
              <span className="ml-auto font-mono text-[11px] text-neutral-500">
                {activeTier.installSteps.length} {t.stepsWord}
              </span>
            </div>
            <p className="mt-3 rounded-lg border border-neutral-800 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-neutral-400">
              {t.selfContainedNote}
            </p>
            <div className="mt-5 space-y-4">
              {activeTier.installSteps.map((step) => (
                <Step key={activeTier.id + step.n} step={step} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
