"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";

export default function Contact() {
  const { locale } = useI18n();
  const { contact } = getCopy(locale);

  return (
    <section
      id="iletisim"
      className="relative overflow-hidden border-t border-neutral-900"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,rgba(255,59,59,0.1),transparent)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
            {contact.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-4xl">
            {contact.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-400">
            {contact.body}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center justify-center rounded-md bg-neon px-6 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,59,59,0.3)] transition-all hover:shadow-[0_0_35px_rgba(255,59,59,0.6)]"
            >
              {contact.ctaEmail}
            </a>
            <a
              href={contact.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-neutral-700 bg-panel px-6 py-3 text-sm font-medium text-neutral-300 transition-all hover:border-neutral-500 hover:text-white"
            >
              {contact.ctaGithub}
            </a>
          </div>
          <a
            href={`mailto:${contact.email}`}
            className="mt-6 inline-block font-mono text-sm text-neutral-400 transition-colors hover:text-neon"
          >
            {contact.email}
          </a>
        </div>
      </div>
    </section>
  );
}
