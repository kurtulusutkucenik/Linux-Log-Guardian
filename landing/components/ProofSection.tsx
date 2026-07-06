"use client";

import Link from "next/link";
import { TESTS } from "@/lib/tests";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";

export default function ProofSection() {
  const { locale } = useI18n();
  const { proof } = getCopy(locale);
  const passed = TESTS.filter((t) => t.status === "pass").length;
  const total = TESTS.length;
  const pct = Math.round((passed / total) * 100);

  const stats = [
    { value: `${total}`, label: proof.statLabels[0], color: "text-white" },
    { value: `${passed}`, label: proof.statLabels[1], color: "text-ok" },
    { value: "72h", label: proof.statLabels[2], color: "text-neon" },
    { value: "~20ms", label: proof.statLabels[3], color: "text-cyan" },
  ];

  return (
    <section id="proof" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
            {proof.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-4xl">
            {total} {proof.testsSuffix}
            <br />
            <span className="text-gradient-hero">%{pct} {proof.passedSuffix}</span>
          </h2>
          <p className="mt-6 text-base leading-[1.8] text-neutral-400">
            {proof.body} Dashboard{" "}
            <code className="text-cyan">/tests</code> {proof.bodyMatrix}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/testler"
              className="inline-flex items-center justify-center rounded-md bg-neon px-6 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,59,59,0.25)] transition-all hover:shadow-[0_0_35px_rgba(255,59,59,0.5)]"
            >
              {proof.ctaAll}
            </Link>
            <a
              href="/evidence/competitive-proof.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-neutral-700 bg-panel px-6 py-3 text-sm font-medium text-neutral-300 transition-all hover:border-neutral-500 hover:text-white"
            >
              {proof.ctaPdf}
            </a>
            <code className="inline-flex items-center rounded-md border border-neon/30 bg-black/60 px-4 py-3 font-mono text-[11px] text-neon">
              {proof.fullPackCmd}
            </code>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-neutral-800 bg-panel-alt p-6 transition-all hover:border-neutral-700"
            >
              <p className={`font-display text-3xl font-black tracking-tight ${stat.color}`}>
                {stat.value}
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-4 border-t border-neutral-900 pt-10">
        {proof.badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-neutral-800 bg-black px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-neutral-500"
          >
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}
