"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, FileText } from "lucide-react";
import { TESTS, type TestEntry, type TestStatus } from "@/lib/tests";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getCopy } from "@/lib/i18n/copy";

const STATUS_META: Record<
  TestStatus,
  { ring: string; text: string; Icon: typeof CheckCircle2 }
> = {
  pass: { ring: "border-ok/25", text: "text-ok", Icon: CheckCircle2 },
  warn: { ring: "border-amber-400/25", text: "text-amber-400", Icon: AlertTriangle },
  fail: { ring: "border-coral/30", text: "text-coral", Icon: XCircle },
  pending: { ring: "border-neutral-800", text: "text-neutral-500", Icon: AlertTriangle },
};

type Filter = "all" | "gate" | "proof";

function Card({
  t,
  statusLabel,
  isEn,
}: {
  t: TestEntry;
  statusLabel: string;
  isEn: boolean;
}) {
  const meta = STATUS_META[t.status];
  const { Icon } = meta;
  const title = isEn ? t.titleEn ?? t.title : t.title;
  const purpose = isEn ? t.purposeEn ?? t.purpose : t.purpose;
  const verdict = isEn ? t.verdictEn ?? t.verdict : t.verdict;
  return (
    <li
      className={`group relative flex flex-col overflow-hidden rounded-xl border ${meta.ring} bg-panel-alt p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-700`}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.text}`} strokeWidth={1.5} />
          <h3 className="font-display text-sm font-bold leading-snug text-white">
            {title}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-widest ${meta.ring} ${meta.text}`}
        >
          {statusLabel}
        </span>
      </div>

      {purpose && (
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">{purpose}</p>
      )}
      {verdict && (
        <p className="mt-3 rounded-lg border border-neutral-800 bg-black/50 p-2.5 font-mono text-[11px] leading-relaxed text-neutral-300">
          {verdict}
        </p>
      )}

      {t.metrics && t.metrics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {t.metrics.map((m) => (
            <span
              key={m.label + m.value}
              className="rounded border border-neutral-800 bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400"
            >
              <span className="text-cyan/80">{m.label}:</span> {m.value}
            </span>
          ))}
        </div>
      )}

      {(t.script || t.date) && (
        <div className="mt-auto flex items-center justify-between gap-2 pt-4 font-mono text-[10px] text-neutral-600">
          <span className="truncate">{t.script}</span>
          {t.date && <time dateTime={t.date}>{t.date}</time>}
        </div>
      )}
    </li>
  );
}

export default function TestMatrix() {
  const { locale } = useI18n();
  const c = getCopy(locale).tests;
  const isEn = locale !== "tr";
  const [filter, setFilter] = useState<Filter>("all");

  const statusLabels: Record<TestStatus, string> = {
    pass: c.statusPass,
    warn: c.statusWarn,
    fail: c.statusFail,
    pending: c.statusPending,
  };

  const stats = useMemo(() => {
    const passed = TESTS.filter((t) => t.status === "pass").length;
    const warned = TESTS.filter((t) => t.status === "warn").length;
    const failed = TESTS.filter((t) => t.status === "fail").length;
    return { passed, warned, failed, total: TESTS.length };
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? TESTS : TESTS.filter((t) => t.group === filter)),
    [filter]
  );

  const gate = filtered.filter((t) => t.group === "gate");
  const proof = filtered.filter((t) => t.group === "proof");
  const pct = Math.round((stats.passed / stats.total) * 100);

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-28 pt-32">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-neon">
        {c.eyebrow}
      </p>
      <h1 className="font-display text-4xl font-extrabold tracking-tighter text-gradient-hero md:text-6xl">
        {c.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-400">
        {c.intro}
      </p>

      <p className="mt-4 max-w-3xl rounded-lg border border-neon/20 bg-neon/[0.04] px-4 py-3 font-mono text-xs leading-relaxed text-neutral-300">
        {c.researcherBanner}
      </p>

      <div className="mt-10 flex flex-col gap-6 rounded-xl border border-neutral-800 bg-panel p-6 md:flex-row md:items-center">
        <div className="flex items-center gap-5">
          <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xl border border-ok/30 bg-black shadow-[0_0_20px_rgba(34,197,94,0.15)]">
            <span className="font-display text-[1.65rem] font-black leading-none tracking-tighter text-ok">
              {pct}
            </span>
            <span className="font-display text-sm font-black leading-none text-ok">%</span>
          </div>
          <div>
            <div className="font-display text-lg font-bold text-white">
              {stats.failed === 0 ? c.allPassed : c.summary}
            </div>
            <div className="mt-1 font-mono text-sm text-neutral-400">
              {stats.passed}/{stats.total} {c.passedWord}
              {stats.warned ? ` · ${stats.warned} ${c.warnWord}` : ""}
              {stats.failed ? ` · ${stats.failed} ${c.failWord}` : ""}
            </div>
            <div className="mt-2 h-1 w-56 overflow-hidden rounded-full bg-neutral-900">
              <div
                className="h-full rounded-full bg-ok shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <a
          href="/evidence/competitive-proof.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-black px-5 py-2.5 font-mono text-sm font-semibold text-neutral-300 transition-all hover:border-neon hover:text-neon"
        >
          <FileText className="h-4 w-4" strokeWidth={1.5} /> {c.ctaPdf}
        </a>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["all", `${c.filterAll} (${stats.total})`],
            ["gate", c.filterGate],
            ["proof", c.filterProof],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full border px-4 py-2 font-mono text-xs tracking-wide transition-colors ${
              filter === key
                ? "border-neon bg-neon/10 text-neon"
                : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {gate.length > 0 && (
        <>
          <h2 className="mb-4 mt-12 font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
            {c.gateHeading} · {gate.length}
          </h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gate.map((t) => (
              <Card key={t.id} t={t} statusLabel={statusLabels[t.status]} isEn={isEn} />
            ))}
          </ul>
        </>
      )}

      {proof.length > 0 && (
        <>
          <h2 className="mb-4 mt-12 font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
            {c.proofHeading} · {proof.length}
          </h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {proof.map((t) => (
              <Card key={t.id} t={t} statusLabel={statusLabels[t.status]} isEn={isEn} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
