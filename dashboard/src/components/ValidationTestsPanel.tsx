"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FlaskConical,
  XCircle,
  ChevronRight,
  FileDown,
  Search,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";
import type { ValidationTestResult } from "@/lib/validationTests";

type Payload = {
  available: boolean;
  tests: ValidationTestResult[];
  summary?: { total: number; passed: number; failed: number; warned?: number; pending: number };
  hint?: string | null;
};

type FilterStatus = "all" | ValidationTestResult["status"];

function StatusBadge({ status }: { status: ValidationTestResult["status"] }) {
  const { t } = useLanguage();
  if (status === "pass") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3 h-3" />
        {t("testStatusPass")}
      </span>
    );
  }
  if (status === "fail") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <XCircle className="w-3 h-3" />
        {t("testStatusFail")}
      </span>
    );
  }
  if (status === "warn") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <AlertTriangle className="w-3 h-3" />
        {t("testStatusWarn")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/30">
      <Clock className="w-3 h-3" />
      {t("testStatusPending")}
    </span>
  );
}

function TestCard({ test }: { test: ValidationTestResult }) {
  const { t } = useLanguage();
  return (
    <article
      id={`test-${test.id}`}
      className="glass-panel p-5 flex flex-col gap-3 border border-white/5 hover:border-white/15 transition-colors h-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <FlaskConical className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white leading-snug">{test.title}</h3>
            <p className="text-xs text-white/45 mt-1 line-clamp-2">{test.purpose}</p>
          </div>
        </div>
        <StatusBadge status={test.status} />
      </div>

      <p className="text-sm text-white/80 bg-white/5 rounded-lg px-3 py-2 border border-white/5 leading-relaxed flex-1">
        {test.verdict}
      </p>

      {test.metrics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {test.metrics.map((m) => (
            <span
              key={`${test.id}-${m.label}`}
              className="text-xs font-mono px-2 py-1 rounded-md bg-black/30 border border-white/10 text-white/70"
            >
              <span className="text-white/40">{m.label}: </span>
              {m.value}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[10px] text-white/35">
        <span className="font-mono truncate">{test.script}</span>
        <span className="shrink-0">{test.date ?? t("testNoDate")}</span>
      </div>
    </article>
  );
}

function SummaryHero({
  passed,
  total,
}: {
  passed: number;
  total: number;
}) {
  const { t } = useLanguage();
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="glass-panel p-5 border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-transparent to-primary/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <Trophy className="w-7 h-7 text-emerald-400" />
          <span className="absolute -bottom-1 -right-1 text-[10px] font-bold font-mono bg-emerald-500 text-black px-1.5 py-0.5 rounded-full">
            {pct}%
          </span>
        </div>
        <div>
          <p className="text-base font-semibold text-emerald-300">{t("testsAllPassedTitle")}</p>
          <p className="text-sm text-white/55 mt-0.5">
            <span className="font-mono text-emerald-400">{passed}/{total}</span>{" "}
            {t("testsAllPassedSubtitle")}
          </p>
        </div>
      </div>
      <div className="sm:ml-auto w-full sm:w-48 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const FILTER_TABS: { id: FilterStatus; countKey: keyof NonNullable<Payload["summary"]> }[] = [
  { id: "all", countKey: "total" },
  { id: "pass", countKey: "passed" },
  { id: "warn", countKey: "warned" },
  { id: "fail", countKey: "failed" },
  { id: "pending", countKey: "pending" },
];

export function ValidationTestsPanel({
  compact = false,
  showHeaderLink = false,
}: {
  compact?: boolean;
  showHeaderLink?: boolean;
}) {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<Payload | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/tests?locale=${locale}`);
      setData(await res.json());
    } catch {
      setData({ available: false, tests: [] });
    }
  }, [locale]);

  useVisibleInterval(poll, 60000, true);

  const tests = data?.tests ?? [];
  const summary = data?.summary;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tests.filter((test) => {
      if (filter !== "all" && test.status !== filter) return false;
      if (!q) return true;
      return (
        test.id.toLowerCase().includes(q) ||
        test.title.toLowerCase().includes(q) ||
        test.purpose.toLowerCase().includes(q)
      );
    });
  }, [tests, filter, search]);

  const visible = compact ? filtered.slice(0, 4) : filtered;
  const allPassed =
    summary &&
    summary.total > 0 &&
    summary.passed === summary.total &&
    summary.failed === 0 &&
    (summary.warned ?? 0) === 0;

  const filterLabel = (id: FilterStatus) => {
    if (id === "all") return t("testsFilterAll");
    if (id === "pass") return t("testsFilterPass");
    if (id === "fail") return t("testsFilterFail");
    if (id === "warn") return t("testsFilterWarn");
    return t("testsFilterPending");
  };

  return (
    <section id="validation-tests" className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            {t("testsSectionTitle")}
          </h2>
          <p className="text-sm text-white/45 mt-1">{t("testsSectionSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {summary && summary.total > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono text-white/50 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span>{summary.total} {t("testsTotalLabel")}</span>
              <span className="text-emerald-400">{summary.passed} ✓</span>
              {(summary.warned ?? 0) > 0 && (
                <span className="text-amber-400">{summary.warned} ⚠</span>
              )}
              {summary.failed > 0 && <span className="text-rose-400">{summary.failed} ✗</span>}
              {summary.pending > 0 && <span className="text-amber-400">{summary.pending} …</span>}
            </div>
          )}
          {showHeaderLink && (
            <Link
              href="/tests"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1.5"
            >
              {t("testsViewAll")}
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
          <Link
            href="/competitive-proof"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/50 hover:text-primary inline-flex items-center gap-1 border border-white/10 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors"
          >
            <FileDown className="w-3 h-3" />
            {t("testsDownloadPdf")}
          </Link>
        </div>
      </div>

      {!compact && allPassed && summary && (
        <SummaryHero passed={summary.passed} total={summary.total} />
      )}

      {!compact && tests.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map(({ id, countKey }) => {
              const count = summary?.[countKey] ?? 0;
              if (id !== "all" && count === 0) return null;
              const active = filter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-white/5 border-white/10 text-white/55 hover:bg-white/10 hover:text-white/80"
                  }`}
                >
                  {filterLabel(id)}
                  <span className="ml-1.5 font-mono opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative sm:ml-auto sm:max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("testsSearchPlaceholder")}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40"
            />
          </div>
        </div>
      )}

      {!data && <div className="glass-panel h-32 animate-pulse" />}

      {data && !data.available && (
        <div className="glass-panel p-4 text-sm text-white/45">{data.hint ?? t("testsHint")}</div>
      )}

      {visible.length > 0 && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {visible.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      )}

      {!compact && filtered.length === 0 && tests.length > 0 && (
        <p className="text-sm text-white/40 text-center py-8 glass-panel">
          {t("testsNoResults")}
        </p>
      )}

      {compact && tests.length > 4 && (
        <Link
          href="/tests"
          className="glass-panel p-3 text-center text-sm text-primary hover:bg-white/5 transition-colors"
        >
          {t("testsViewAll")} ({tests.length})
        </Link>
      )}
    </section>
  );
}
