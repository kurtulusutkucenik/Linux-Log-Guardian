"use client";

import LineChart from "@/components/ui/LineChart";
import { type LineSeries } from "@/lib/content";
import Reveal from "@/components/ui/Reveal";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";

const DASH_STYLE: Record<string, string> = {
  solid: "0",
  dash: "7 5",
  dot: "1 7",
};

function LegendItem({ s }: { s: LineSeries }) {
  const color = s.us ? "#1ff5df" : "#71717a";
  return (
    <span className="flex items-center gap-2 text-[11px] text-neutral-400">
      <svg width="26" height="10" aria-hidden="true">
        <line
          x1="0"
          y1="5"
          x2="26"
          y2="5"
          stroke={color}
          strokeWidth={s.us ? 3 : 2}
          strokeDasharray={DASH_STYLE[s.dash ?? "solid"]}
          style={s.us ? { filter: "drop-shadow(0 0 4px rgba(31,245,223,0.8))" } : undefined}
        />
      </svg>
      <span className={s.us ? "font-semibold text-turq" : ""}>{s.name}</span>
    </span>
  );
}

type ChartBlock = {
  title: string;
  hint: string;
  labels: string[];
  yMax: number;
  series: LineSeries[];
  unit?: string;
  target?: number;
  honest?: boolean;
};

function ChartCard({
  chart,
  honestBadge,
  targetLabel,
}: {
  chart: ChartBlock;
  honestBadge: string;
  targetLabel: string;
}) {
  return (
    <article
      className={`rounded-xl border bg-panel-alt p-6 ${
        chart.honest ? "border-neon/20" : "border-neutral-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-bold text-white">{chart.title}</h3>
        {chart.honest && (
          <span className="shrink-0 rounded-full border border-neon/30 bg-neon/[0.06] px-2 py-0.5 font-mono text-[9px] uppercase text-neon">
            {honestBadge}
          </span>
        )}
      </div>
      <p className="mt-1 font-mono text-[11px] text-neutral-500">{chart.hint}</p>
      <div className="mt-5">
        <LineChart
          categories={chart.labels}
          yMax={chart.yMax}
          series={chart.series}
          target={chart.target}
          unit={chart.unit}
        />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-neutral-800 pt-4">
        {chart.series.map((s) => (
          <LegendItem key={s.name} s={s} />
        ))}
        {chart.target != null && (
          <span className="flex items-center gap-2 text-[11px] text-neutral-400">
            <svg width="26" height="10" aria-hidden="true">
              <line x1="0" y1="5" x2="26" y2="5" stroke="#ff3b3b" strokeWidth={2} strokeDasharray="5 5" />
            </svg>
            {targetLabel} {chart.target}
            {chart.unit ?? ""}
          </span>
        )}
      </div>
    </article>
  );
}

export default function VsCharts() {
  const { locale } = useI18n();
  const CHARTS = getCopy(locale).charts;
  const badge = CHARTS.honestBadge;
  const target = CHARTS.targetLabel;
  const extra: ChartBlock[] = [
    CHARTS.soak,
    CHARTS.fp,
    CHARTS.eps,
    CHARTS.recall,
  ];

  return (
    <section id="grafikler" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <Reveal>
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-turq">
            {CHARTS.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tighter text-white md:text-5xl">
            {CHARTS.title}
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-neutral-500">{CHARTS.sub}</p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <Reveal delay={40}>
          <ChartCard
            chart={{ ...CHARTS.profile, labels: CHARTS.profile.categories }}
            honestBadge={badge}
            targetLabel={target}
          />
        </Reveal>
        <Reveal delay={80}>
          <ChartCard chart={CHARTS.latency} honestBadge={badge} targetLabel={target} />
        </Reveal>
        {extra.map((c, i) => (
          <Reveal key={c.title} delay={120 + i * 40}>
            <ChartCard chart={c} honestBadge={badge} targetLabel={target} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
