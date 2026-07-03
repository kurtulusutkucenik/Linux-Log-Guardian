"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";

export default function HonestLimits() {
  const { locale } = useI18n();
  const { honest } = getCopy(locale);

  return (
    <section id="dogrusinir" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-400">
            {honest.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-4xl">
            {honest.title}
          </h2>
          <ul className="mt-8 space-y-4">
            {honest.items.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-lg border border-neutral-800 bg-panel-alt p-4 text-sm leading-relaxed text-neutral-400"
              >
                <span className="mt-0.5 shrink-0 font-mono text-amber-400">›</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
            {honest.layersEyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-4xl">
            {honest.layersTitle}
          </h2>
          <div className="mt-8 space-y-4">
            {honest.layers.map((layer, i) => (
              <div
                key={layer.tag}
                className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-panel-alt p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neon/30 bg-black font-mono text-xs font-bold text-neon">
                  0{i + 1}
                </span>
                <div>
                  <p className="font-display text-base font-bold text-white">
                    {layer.tag}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-neutral-500">
                    {layer.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-lg border border-neutral-800 bg-black/40 p-4 text-xs leading-relaxed text-neutral-500">
            {honest.layersNote}
          </p>
        </div>
      </div>
    </section>
  );
}
