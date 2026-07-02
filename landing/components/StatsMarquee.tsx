"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";

export default function StatsMarquee() {
  const { locale } = useI18n();
  const items = getCopy(locale).marquee;
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-neutral-900 bg-panel py-4">
      <div className="flex animate-marquee gap-12 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-neutral-500"
          >
            <span className="h-1 w-1 rounded-full bg-neon" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
