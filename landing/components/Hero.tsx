"use client";

import Link from "next/link";
import Image from "next/image";
import TerminalInstall from "@/components/ui/TerminalInstall";
import Reveal from "@/components/ui/Reveal";
import { HERO } from "@/lib/content";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSections } from "@/lib/i18n/sections";
import { brandName } from "@/lib/i18n/copy";

function PraiseValue({ value }: { value: string }) {
  if (value === "100") {
    return (
      <span className="inline-flex items-baseline justify-center gap-0.5">
        <span className="font-display text-[clamp(1.5rem,4vw,2.25rem)] font-black text-neon">
          {value}
        </span>
        <span className="font-display text-[clamp(0.9rem,2.5vw,1.25rem)] font-black text-neon">
          %
        </span>
      </span>
    );
  }
  return (
    <p className="font-display text-[clamp(1.5rem,4vw,2.25rem)] font-black leading-none text-neon">
      {value}
    </p>
  );
}

export default function Hero() {
  const { locale } = useI18n();
  const s = getSections(locale);
  const name = brandName(locale);

  return (
    <section
      id="hero"
      className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8 lg:pt-28"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(720px,100%)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,59,59,0.08),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-panel px-4 py-1.5 font-mono text-xs uppercase tracking-[0.3em] text-neon">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon" />
          </span>
          {s.hero_badge}
        </p>

        <div className="relative mt-6 flex flex-col items-center">
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,59,59,0.18),transparent_65%)]"
            aria-hidden="true"
          />
          <Image
            src="/logo-cenik.png"
            alt={name}
            width={400}
            height={400}
            priority
            className="h-32 w-32 object-contain drop-shadow-[0_0_35px_rgba(255,59,59,0.25)] sm:h-40 sm:w-40 md:h-48 md:w-48"
          />
          <Image
            src="/flag-tr.svg"
            alt="Türk bayrağı"
            width={72}
            height={48}
            className="mt-5 h-7 w-auto rounded-sm border border-white/10 shadow-[0_0_18px_rgba(227,10,23,0.35)] sm:h-8"
          />
        </div>

        <h1 className="mt-8 font-display text-4xl font-extrabold uppercase leading-[1.0] tracking-tighter text-gradient-hero sm:text-6xl md:text-7xl">
          {name}
        </h1>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-sm text-neutral-300">
          {s.hero_bullets.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-neon" />
              {b}
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-8 max-w-2xl text-base leading-[1.7] text-neutral-400 md:text-lg">
          {s.hero_tagline}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {s.hero_chips.map((c) => (
            <span
              key={c}
              className="rounded-full border border-neutral-800 bg-panel px-3 py-1 font-mono text-[11px] text-neutral-400"
            >
              {c}
            </span>
          ))}
        </div>

        <p className="mt-6 font-mono text-xs text-neutral-600">{s.hero_reach}</p>
      </div>

      <Reveal className="relative mx-auto mt-12 max-w-5xl sm:mt-16">
        <div className="rounded-2xl border border-neon/20 bg-gradient-to-b from-neon/[0.06] to-transparent p-6 sm:p-8 md:p-10">
          <p className="text-center font-display text-lg font-bold leading-snug text-white sm:text-xl md:text-2xl">
            {s.hero_praise_lead}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {s.hero_praise_bold.map((b) => (
              <div key={b.l} className="min-w-0 rounded-lg border border-neutral-800/60 bg-black/30 px-2 py-4 text-center">
                <PraiseValue value={b.v} />
                <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-neutral-500 sm:text-[10px]">
                  {b.l}
                </p>
              </div>
            ))}
          </div>
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {s.hero_praise_highlights.map((h) => (
              <li
                key={h}
                className="flex gap-2 rounded-lg border border-neutral-800/80 bg-black/40 px-4 py-3 text-sm leading-relaxed text-neutral-300"
              >
                <span className="shrink-0 font-bold text-neon">✓</span>
                <span className="min-w-0">{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <div className="relative mt-12 grid gap-10 lg:mt-14 lg:grid-cols-2 lg:items-center">
        <div className="flex min-w-0 flex-col gap-6">
          <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl">
            {s.hero_side_title}
          </h2>
          <p className="text-base leading-[1.75] text-neutral-400">{s.hero_side_body}</p>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link
              href="#kurulum"
              className="inline-flex items-center justify-center rounded-md bg-neon px-5 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,59,59,0.3)] transition-all hover:shadow-[0_0_35px_rgba(255,59,59,0.6)] sm:px-6 sm:py-3.5"
            >
              {s.hero_cta_setup}
            </Link>
            <a
              href={HERO.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-neutral-700 bg-panel px-5 py-3 text-sm font-medium text-neutral-300 transition-all hover:border-neutral-500 hover:text-white sm:px-6 sm:py-3.5"
            >
              {s.hero_cta_github}
            </a>
            <Link
              href="/testler"
              className="inline-flex items-center justify-center rounded-md border border-neutral-800 px-5 py-3 text-sm font-medium text-neutral-400 transition-all hover:border-neutral-600 hover:text-white sm:px-6 sm:py-3.5"
            >
              {s.hero_cta_tests}
            </Link>
          </div>
        </div>
        <TerminalInstall />
      </div>
    </section>
  );
}
