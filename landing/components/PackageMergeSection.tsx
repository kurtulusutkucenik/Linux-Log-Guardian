"use client";

import Reveal from "@/components/ui/Reveal";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSections } from "@/lib/i18n/sections";

const COLOR = ["text-neon border-neon/30", "text-turq border-turq/30", "text-cyan border-cyan/30"];

export default function PackageMergeSection() {
  const { locale } = useI18n();
  const s = getSections(locale);

  return (
    <section id="birlesim" className="border-y border-neutral-900 bg-panel/30 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
              //:3Paket
            </p>
            <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tighter text-white sm:text-3xl md:text-5xl">
              {s.pkg_title}
            </h2>
            <p className="mt-4 font-mono text-xs uppercase tracking-wider text-neutral-500">
              {s.pkg_tagline}
            </p>
            <p className="mt-6 text-base leading-relaxed text-neutral-300 md:text-lg">
              {s.pkg_hero}
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {s.merge.map((p, i) => (
            <Reveal key={p.company} delay={i * 50}>
              <article className="flex h-full min-w-0 flex-col rounded-2xl border border-neutral-800 bg-black/50 p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 font-mono text-xs font-bold ${COLOR[i]}`}
                  >
                    {p.company}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
                    PAKET 0{i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-white sm:text-xl">
                  {p.name}
                </h3>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-neutral-500">
                  {s.pkg_instead}
                </p>
                <p className="mt-1 font-mono text-[11px] text-neutral-600 line-through decoration-neutral-700">
                  {p.replaces}
                </p>
                <p className="mt-4 flex-1 text-sm leading-[1.8] text-neutral-400">{p.body}</p>
                <ul className="mt-5 space-y-1.5 border-t border-neutral-800 pt-4">
                  {p.metrics.map((m) => (
                    <li
                      key={m}
                      className="break-words font-mono text-[11px] font-semibold leading-snug text-neon sm:text-xs"
                    >
                      {m}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-10 text-center">
          <p className="font-display text-xl font-black text-neon sm:text-2xl md:text-3xl">
            {s.pkg_footer}
          </p>
          <a
            href="/paketler"
            className="mt-6 inline-block font-mono text-sm text-neutral-500 transition-colors hover:text-neon"
          >
            {s.pkg_detail}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
