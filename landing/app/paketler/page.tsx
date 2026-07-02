import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/ui/Reveal";
import { PACKAGES } from "@/lib/content";

export const metadata: Metadata = {
  title: "3 Paket Birleşimi — Linux Log Guardian",
  description:
    "Log Guardian: Fail2ban ban motoru + ModSecurity WAF/CRS + SOC/kanıt katmanını tek self-hosted zincirde birleştirir. Core · Pro · Opsiyonel.",
};

const COLOR: Record<string, string> = {
  neon: "border-neon/40 text-neon",
  turq: "border-turq/40 text-turq",
  cyan: "border-cyan/40 text-cyan",
};

export default function PaketlerPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="relative overflow-hidden px-6 py-24 lg:px-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,59,59,0.12),transparent)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-5xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-neon">
              {PACKAGES.eyebrow}
            </p>
            <h1 className="mt-6 font-display text-4xl font-black tracking-tighter text-white md:text-6xl lg:text-7xl">
              {PACKAGES.title}
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-[1.8] text-neutral-300 md:text-xl">
              {PACKAGES.hero}
            </p>
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              {PACKAGES.result.big.map((b) => (
                <div
                  key={b.l}
                  className="rounded-2xl border border-neutral-800 bg-panel-alt p-6"
                >
                  <p className="font-display text-4xl font-black text-neon md:text-5xl">{b.v}</p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                    {b.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-neutral-900 bg-panel/40 px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="text-center font-display text-3xl font-extrabold text-white md:text-4xl">
                Hangi 3 paket birleşiyor?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-400">
                Üretimde ayrı kurulan araçlar — Log Guardian&apos;da tek hat.
              </p>
            </Reveal>
            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {PACKAGES.merge.map((p, i) => (
                <Reveal key={p.name} delay={i * 60}>
                  <article className="flex h-full flex-col rounded-2xl border border-neutral-800 bg-black/50 p-8">
                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1 font-mono text-xs font-bold ${COLOR[p.color]}`}
                    >
                      PAKET {p.n}
                    </span>
                    <h3 className="mt-5 font-display text-2xl font-bold text-white">{p.name}</h3>
                    <p className="mt-2 font-mono text-xs text-neutral-500">
                      Yerine geçer: {p.replaces}
                    </p>
                    <p className="mt-5 flex-1 text-sm leading-[1.85] text-neutral-400">{p.body}</p>
                    <ul className="mt-6 space-y-2 border-t border-neutral-800 pt-6">
                      {p.metrics.map((m) => (
                        <li key={m} className="font-mono text-sm font-semibold text-neon">
                          {m}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={80} className="mt-16 rounded-2xl border border-neon/20 bg-neon/[0.04] p-8 md:p-10">
              <h3 className="font-display text-2xl font-bold text-white">
                {PACKAGES.result.title}
              </h3>
              <ul className="mt-6 grid gap-3 md:grid-cols-2">
                {PACKAGES.result.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-sm leading-relaxed text-neutral-300">
                    <span className="text-neon">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="text-center font-display text-3xl font-extrabold text-white">
                {PACKAGES.tiers.title}
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {PACKAGES.tiers.items.map((t, i) => (
                <Reveal key={t.tag} delay={i * 50}>
                  <div className="rounded-xl border border-neutral-800 bg-panel-alt p-7">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-xl font-black text-neon">{t.tag}</span>
                      <span className="font-mono text-[10px] text-neutral-500">{t.time}</span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-neutral-400">{t.body}</p>
                    <ul className="mt-5 space-y-1.5 border-t border-neutral-800 pt-4">
                      {t.includes.map((inc) => (
                        <li key={inc} className="font-mono text-[11px] text-neutral-500">
                          · {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-neutral-900 bg-panel/30 px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="text-center font-display text-3xl font-extrabold text-white">
                Övülecek taraflarımız
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 sm:grid-cols-2">
              {PACKAGES.strengths.map((s, i) => (
                <Reveal key={s.title} delay={i * 40}>
                  <article className="rounded-2xl border border-neutral-800 bg-black/40 p-8">
                    <p className="font-display text-5xl font-black text-neon">{s.stat}</p>
                    <h3 className="mt-4 font-display text-xl font-bold text-white">{s.title}</h3>
                    <p className="mt-3 text-sm leading-[1.85] text-neutral-400">{s.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
            <div className="mt-16 flex flex-wrap justify-center gap-4">
              <Link
                href="/#kurulum"
                className="rounded-md bg-neon px-8 py-3.5 text-sm font-semibold text-black shadow-[0_0_25px_rgba(255,59,59,0.35)]"
              >
                15 dk kurulum
              </Link>
              <Link
                href="/testler"
                className="rounded-md border border-neutral-700 px-8 py-3.5 text-sm font-medium text-neutral-300 hover:text-white"
              >
                68 testi gör
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
