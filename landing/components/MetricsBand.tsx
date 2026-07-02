"use client";

import { METRICS } from "@/lib/content";
import Reveal from "@/components/ui/Reveal";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSections, metricLabel } from "@/lib/i18n/sections";

function MetricBox({
  value,
  unit,
  label,
}: {
  value: string;
  unit: string;
  label: string;
}) {
  const combined = unit ? `${value}${unit === "%" ? "" : " "}${unit === "%" ? "" : unit}` : value;
  const isPercent = unit === "%";
  const isLong = combined.length > 8;
  const numLen = value.length;

  return (
    <div className="flex min-h-[5.25rem] min-w-0 flex-col items-center justify-center rounded-xl border border-neutral-800 bg-black/40 px-2 py-3 text-center transition-all hover:border-neon/30 sm:min-h-[5.75rem] sm:px-3 sm:py-4">
      <div className="flex max-w-full items-center justify-center leading-none">
        {isPercent ? (
          <span className="inline-flex items-baseline justify-center gap-px">
            <span
              className={`font-display font-black tracking-tighter text-neon ${
                numLen >= 3
                  ? "text-[clamp(1rem,3.2vw,1.35rem)]"
                  : "text-[clamp(1.15rem,3.8vw,1.55rem)]"
              }`}
            >
              {value}
            </span>
            <span className="font-display text-[clamp(0.65rem,2vw,0.85rem)] font-black text-neon">
              %
            </span>
          </span>
        ) : (
          <span
            className={`max-w-full break-all font-display font-black tracking-tight text-neon sm:break-normal ${
              isLong
                ? "text-[clamp(0.75rem,2.4vw,1rem)]"
                : "text-[clamp(0.95rem,3vw,1.45rem)]"
            }`}
            title={combined}
          >
            {value}
            {unit && unit !== "%" && (
              <span className="ml-0.5 text-[0.6em] font-bold text-neutral-400">{unit}</span>
            )}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 max-w-full px-1 font-mono text-[9px] leading-snug text-neutral-500 sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}

export default function MetricsBand() {
  const { locale } = useI18n();
  const s = getSections(locale);

  return (
    <section id="sayilar" className="border-y border-neutral-900 bg-panel/50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
              //:Sayılar
            </p>
            <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tighter text-white sm:text-3xl md:text-5xl">
              {s.metrics_title}
            </h2>
            <p className="mt-6 text-xs leading-relaxed text-neutral-500 sm:text-sm">
              {s.metrics_sub}
            </p>
          </div>
        </Reveal>

        <div className="mt-12 space-y-10 sm:mt-16 sm:space-y-12">
          {METRICS.groups.map((group, gi) => (
            <Reveal key={group.label} delay={gi * 40}>
              <div className="min-w-0">
                <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
                  {s.metric_groups[group.label] ?? group.label}
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
                  {group.items.map((item) => (
                    <MetricBox
                      key={item.label}
                      value={item.value}
                      unit={item.unit}
                      label={metricLabel(locale, item.label)}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
