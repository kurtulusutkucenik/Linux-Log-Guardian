"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";
import type { ValidationTestResult } from "@/lib/validationTests";
import type { ProofMeta } from "@/lib/proofMeta";

type Payload = {
  available: boolean;
  tests: ValidationTestResult[];
  summary?: { total: number; passed: number; failed: number; warned?: number; pending: number };
  proof_expected?: number;
  proof_test_ids?: string[];
  parity_ok?: boolean;
  hint?: string | null;
};

function proofAlignedTests(
  list: ValidationTestResult[],
  proofExpected?: number,
  proofIds?: string[],
): ValidationTestResult[] {
  if (!proofExpected || !proofIds?.length || list.length <= proofExpected) return list;
  const order = new Map(proofIds.map((id, i) => [id, i]));
  return list
    .filter((t) => order.has(t.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

function normalizeTestsPayload(raw: Payload, proofMeta?: ProofMeta | null): Payload {
  const expected = raw.proof_expected ?? proofMeta?.expected;
  const ids =
    raw.proof_test_ids?.length ? raw.proof_test_ids : proofMeta?.testIds;
  if (!expected || !ids?.length || !raw.tests?.length || raw.tests.length <= expected) {
    return raw;
  }
  const tests = proofAlignedTests(raw.tests, expected, ids);
  const passed = tests.filter((t) => t.status === "pass").length;
  const failed = tests.filter((t) => t.status === "fail").length;
  const warned = tests.filter((t) => t.status === "warn").length;
  const pending = tests.filter((t) => t.status === "pending").length;
  return {
    ...raw,
    tests,
    summary: { total: tests.length, passed, failed, warned, pending },
    parity_ok: tests.length === expected,
  };
}

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
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-white leading-snug">{test.title}</h3>
              {test.badge && (
                <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-300">
                  {test.badge}
                </span>
              )}
            </div>
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
        <div className="flex items-center gap-2 shrink-0">
          {test.docHref && (
            <a
              href={test.docHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/80 hover:text-primary hover:underline max-w-[10rem] truncate"
              title={test.docLabel ?? test.docHref}
            >
              {test.docLabel ?? t("testGateDocLink")}
            </a>
          )}
          <span>{test.date ?? t("testNoDate")}</span>
        </div>
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

const FILTER_TABS: FilterStatus[] = ["all", "pass", "warn", "fail", "pending"];

export function ValidationTestsPanel({
  compact = false,
  showHeaderLink = false,
  proofMeta = null,
}: {
  compact?: boolean;
  showHeaderLink?: boolean;
  proofMeta?: ProofMeta | null;
}) {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<Payload | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [proofCopied, setProofCopied] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")?.trim();
    if (q) setSearch(q);
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/tests?locale=${locale}&_=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      if (!res.ok) return;
      setData(normalizeTestsPayload(await res.json(), proofMeta));
    } catch {
      setData({ available: false, tests: [] });
    }
  }, [locale, proofMeta]);

  useVisibleInterval(poll, 60000, true);

  const tests = useMemo(
    () =>
      proofAlignedTests(
        data?.tests ?? [],
        data?.proof_expected ?? proofMeta?.expected,
        data?.proof_test_ids?.length ? data.proof_test_ids : proofMeta?.testIds,
      ),
    [data?.tests, data?.proof_expected, data?.proof_test_ids, proofMeta?.expected, proofMeta?.testIds],
  );

  /** competitive-proof kanonik — passed/total ayni listeden (88 drift UI'da gorunmez) */
  const displayStats = useMemo(() => {
    const list = tests;
    const expected = data?.proof_expected ?? proofMeta?.expected;
    const total = expected && expected > 0 ? expected : list.length;
    const passed = list.filter((t) => t.status === "pass").length;
    const failed = list.filter((t) => t.status === "fail").length;
    const warned = list.filter((t) => t.status === "warn").length;
    const pending = list.filter((t) => t.status === "pending").length;
    const cappedPassed =
      expected && expected > 0 && passed > expected ? Math.min(passed, expected) : passed;
    return { total, passed: cappedPassed, failed, warned, pending };
  }, [tests, data?.proof_expected, proofMeta?.expected]);

  const buildRev = process.env.NEXT_PUBLIC_DASHBOARD_BUILD_REV;

  /** Eski JS bundle: API/proof 80 iken kart listesi 88 — tek seferlik reload */
  useEffect(() => {
    const expected = data?.proof_expected ?? proofMeta?.expected;
    if (!expected || expected <= 0) return;
    const rawLen = data?.tests?.length ?? 0;
    if (rawLen <= expected) return;
    const key = "lg-tests-stale-reload";
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
    window.location.reload();
  }, [data?.proof_expected, data?.tests?.length, proofMeta?.expected]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash.startsWith("test-") || tests.length === 0) return;
    const id = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
    return () => window.clearTimeout(id);
  }, [tests.length]);

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
    displayStats.total > 0 &&
    displayStats.passed === displayStats.total &&
    displayStats.failed === 0 &&
    displayStats.warned === 0;

  const filterLabel = (id: FilterStatus) => {
    if (id === "all") return t("testsFilterAll");
    if (id === "pass") return t("testsFilterPass");
    if (id === "fail") return t("testsFilterFail");
    if (id === "warn") return t("testsFilterWarn");
    return t("testsFilterPending");
  };

  const copyProofPack = () => {
    const cmd = t("testsProofPackCmd");
    void navigator.clipboard.writeText(cmd).then(() => {
      setProofCopied(true);
      window.setTimeout(() => setProofCopied(false), 2000);
    });
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
          {displayStats.total > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono text-white/50 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span>
                {displayStats.total} {t("testsTotalLabel")}
                {data?.proof_expected && data.proof_expected === displayStats.total ? (
                  <span className="text-cyan-400/80 ml-1">proof</span>
                ) : null}
              </span>
              <span className="text-emerald-400">{displayStats.passed} ✓</span>
              {displayStats.warned > 0 && (
                <span className="text-amber-400">{displayStats.warned} ⚠</span>
              )}
              {displayStats.failed > 0 && (
                <span className="text-rose-400">{displayStats.failed} ✗</span>
              )}
              {displayStats.pending > 0 && (
                <span className="text-amber-400">{displayStats.pending} …</span>
              )}
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
          <button
            type="button"
            onClick={copyProofPack}
            title={t("testsProofPackTitle")}
            className="text-xs text-white/50 hover:text-primary inline-flex items-center gap-1 border border-white/10 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors max-w-[min(100%,18rem)]"
          >
            <Terminal className="w-3 h-3 shrink-0" />
            <span className="truncate font-mono">
              {proofCopied ? t("testsProofPackCopied") : t("testsProofPackCmd")}
            </span>
          </button>
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

      {!compact && allPassed && (
        <SummaryHero passed={displayStats.passed} total={displayStats.total} />
      )}

      {!compact && tests.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map((id) => {
              const count =
                id === "all"
                  ? displayStats.total
                  : id === "pass"
                    ? displayStats.passed
                    : id === "warn"
                      ? displayStats.warned
                      : id === "fail"
                        ? displayStats.failed
                        : displayStats.pending;
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
          {t("testsViewAll")} ({displayStats.total})
        </Link>
      )}

      {!compact && (data?.proof_expected ?? proofMeta?.expected) && displayStats.total > 0 && (
        <p className="text-[10px] text-center font-mono text-cyan-400/60">
          competitive-proof {displayStats.passed}/{data?.proof_expected ?? proofMeta?.expected}
          {data?.parity_ok === false ? ` · ${t("testsProofDriftFixed")}` : ""}
          {buildRev && buildRev !== "unknown" ? ` · build ${buildRev}` : ""}
        </p>
      )}
    </section>
  );
}
