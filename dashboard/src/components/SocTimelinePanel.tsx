"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Ban,
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  GitBranch,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { useBannedIps } from "@/context/BannedIpsContext";
import { useSocKindFilter, scrollToAttackMap, type SocKindFilter } from "./SocKindFilterContext";
import type { SocTimelineEntry, SocTimelineKind, SocTimelineResponse } from "@/lib/socTimelineTypes";

const KIND_ORDER: SocTimelineKind[] = ["incident", "waf", "ban", "ack", "lineage"];

function csvCell(value: string | number | undefined | null): string {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadSocCsv(entries: SocTimelineEntry[], filename: string) {
  const header = "ts,kind,title,detail,ip,risk\n";
  const rows = entries
    .map((e) =>
      [e.ts, e.kind, e.title, e.detail, e.ip ?? "", e.risk ?? ""].map(csvCell).join(","),
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function kindIcon(kind: SocTimelineEntry["kind"]) {
  switch (kind) {
    case "incident":
      return <ShieldAlert className="w-4 h-4 text-amber-400" />;
    case "ban":
      return <Ban className="w-4 h-4 text-red-400" />;
    case "lineage":
      return <GitBranch className="w-4 h-4 text-violet-400" />;
    case "waf":
      return <Bell className="w-4 h-4 text-orange-400" />;
    case "ack":
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    default:
      return <Activity className="w-4 h-4 text-white/50" />;
  }
}

function kindRailClass(kind: SocTimelineEntry["kind"]) {
  switch (kind) {
    case "incident":
      return "from-amber-400/80 via-amber-500/30 to-transparent";
    case "ban":
      return "from-red-400/80 via-red-500/30 to-transparent";
    case "lineage":
      return "from-violet-400/80 via-violet-500/30 to-transparent";
    case "waf":
      return "from-orange-400/80 via-orange-500/30 to-transparent";
    case "ack":
      return "from-emerald-400/80 via-emerald-500/30 to-transparent";
    default:
      return "from-white/40 to-transparent";
  }
}

function kindDotClass(kind: SocTimelineEntry["kind"]) {
  switch (kind) {
    case "incident":
      return "bg-amber-400 border-amber-300/60 shadow-[0_0_8px_rgba(251,191,36,0.45)]";
    case "ban":
      return "bg-red-500 border-red-300/60 shadow-[0_0_8px_rgba(239,68,68,0.45)]";
    case "lineage":
      return "bg-violet-400 border-violet-300/60 shadow-[0_0_8px_rgba(167,139,250,0.45)]";
    case "waf":
      return "bg-orange-400 border-orange-300/60 shadow-[0_0_8px_rgba(251,146,60,0.45)]";
    case "ack":
      return "bg-emerald-400 border-emerald-300/60 shadow-[0_0_8px_rgba(52,211,153,0.45)]";
    default:
      return "bg-white/40 border-white/30";
  }
}

function kindChipClass(kind: SocTimelineKind, active: boolean): string {
  const base = active
    ? "border-white/25 bg-white/10 text-white"
    : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white/80 hover:border-white/20";
  const accent: Record<SocTimelineKind, string> = {
    incident: active ? "border-amber-400/40 text-amber-200" : "",
    waf: active ? "border-orange-400/40 text-orange-200" : "",
    ban: active ? "border-red-400/40 text-red-200" : "",
    ack: active ? "border-emerald-400/40 text-emerald-200" : "",
    lineage: active ? "border-violet-400/40 text-violet-200" : "",
  };
  return `text-xs px-3 py-1.5 rounded-full border transition-colors ${base} ${accent[kind]}`;
}

function fmtTs(ts: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SocTimelinePanel() {
  const { t } = useLanguage();
  const { kindFilter, setKindFilter } = useSocKindFilter();
  const { totalCount: navBanCount, preview, dataMode, source } = useBannedIps();
  const [data, setData] = useState<SocTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/soc-timeline", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as SocTimelineResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const timer = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const entries = data?.entries ?? [];

  const kindLabels: Record<SocTimelineKind, string> = {
    incident: t("socKindIncident"),
    ban: t("socKindBan"),
    lineage: t("socKindLineage"),
    waf: t("socKindWaf"),
    ack: t("socKindAck"),
  };

  const kindCounts = useMemo(() => {
    const counts: Record<SocTimelineKind, number> = {
      incident: 0,
      ban: 0,
      lineage: 0,
      waf: 0,
      ack: 0,
    };
    const banIps = new Set<string>();
    for (const entry of entries) {
      if (entry.kind === "ban" && entry.ip) banIps.add(entry.ip);
      else counts[entry.kind]++;
    }
    counts.ban += banIps.size;
    return counts;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (kindFilter === "all") return entries;
    return entries.filter((entry) => entry.kind === kindFilter);
  }, [entries, kindFilter]);

  const liveIpset =
    !preview && dataMode === "live" && source === "ipset" && navBanCount > 0;
  const banParityOk = liveIpset && kindCounts.ban > 0 && navBanCount === kindCounts.ban;

  if (loading) {
    return <div className="glass-panel h-48 animate-pulse" />;
  }

  if (entries.length === 0) {
    return (
      <div className="glass-panel p-5 border border-primary/15" id="soc-timeline">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">{t("socTimelineTitle")}</h2>
        </div>
        <p className="text-xs text-white/40 mb-2">{t("socTimelineSubtitle")}</p>
        <p className="text-sm text-white/50">{t("socTimelineEmpty")}</p>
        <Link
          href="/attack-tree"
          className="text-xs text-primary/80 hover:text-primary hover:underline mt-2 inline-block"
        >
          {t("socTimelineAttackTree")} →
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 border border-primary/15" id="soc-timeline">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">{t("socTimelineTitle")}</h2>
          <span className="text-xs font-mono text-white/40 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            {filteredEntries.length}/{entries.length}
          </span>
          {kindFilter !== "all" && (
            <>
              <span className="text-[10px] text-cyan-400/60 normal-case">{t("socFilterLinked")}</span>
              <button
                type="button"
                onClick={() => scrollToAttackMap()}
                className="text-[10px] text-cyan-400/70 hover:text-cyan-300 hover:underline normal-case"
              >
                {t("socFilterMapLink")}
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          {data?.data_mode === "live" && (
            <span className="px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
              {t("socTimelineLive")}
            </span>
          )}
          {data?.data_mode === "live_partial" && (
            <span className="px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-300 bg-cyan-500/10">
              {t("socTimelineLivePartial")}
            </span>
          )}
          {data?.data_mode === "preview" && (
            <span className="px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 bg-amber-500/10">
              {t("socTimelinePreview")}
            </span>
          )}
          <Link href="/attack-tree" className="text-primary/80 hover:text-primary hover:underline">
            {t("socTimelineAttackTree")} →
          </Link>
          {filteredEntries.length > 0 && (
            <button
              type="button"
              onClick={() =>
                downloadSocCsv(
                  filteredEntries,
                  `soc-timeline-${kindFilter === "all" ? "all" : kindFilter}.csv`,
                )
              }
              className="inline-flex items-center gap-1 text-primary/80 hover:text-primary hover:underline"
            >
              <Download className="w-3 h-3" />
              {t("socTimelineExportCsv")}
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-white/40 mb-2">{t("socTimelineSubtitle")}</p>
      {data?.sources && (
        <p className="text-[10px] text-white/30 mb-2 font-mono">
          {t("socTimelineSources")}: inc={data.sources.incidents} · ban={data.sources.bans} ·
          lg={data.sources.lineage}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          type="button"
          onClick={() => setKindFilter("all" as SocKindFilter)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            kindFilter === "all"
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white/80 hover:border-white/20"
          }`}
        >
          {t("socFilterAll")} {entries.length}
        </button>
        {KIND_ORDER.map((kind) => {
          const count = kindCounts[kind];
          if (count === 0) return null;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setKindFilter(kind)}
              className={kindChipClass(kind, kindFilter === kind)}
            >
              {kindLabels[kind]} {count}
            </button>
          );
        })}
      </div>

      {kindCounts.ack > 0 && (
        <p className="text-[10px] text-white/30 mb-2">{t("socAckChipHint")}</p>
      )}
      {kindFilter === "ban" && banParityOk && (
        <p className="text-[10px] text-emerald-400/70 mb-2">{t("socBanParityHint")}</p>
      )}
      {filteredEntries.length > 3 && (
        <p className="text-[10px] text-white/35 mb-2">
          {filteredEntries.length} {t("socScrollHint")}
        </p>
      )}

      <p className="text-[10px] uppercase tracking-wider text-white/30 mb-4 flex items-center gap-1">
        <ChevronDown className="w-3 h-3" />
        {t("socTimelineFlow")}
      </p>

      {filteredEntries.length === 0 ? (
        <p className="text-sm text-white/50 py-6 text-center">{t("socFilterNoMatch")}</p>
      ) : (
        <div className="relative max-h-80 overflow-y-auto pr-1 pl-1">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-white/15 via-white/10 to-transparent pointer-events-none" />
          <div className="space-y-1">
            {filteredEntries.map((entry, idx) => {
              const isLast = idx === filteredEntries.length - 1;
              const inner = (
                <div className="flex gap-3 items-stretch py-2 pl-8 pr-2 relative">
                  <div
                    className={`absolute left-[7px] top-4 z-10 w-2.5 h-2.5 rounded-full border ${kindDotClass(entry.kind)}`}
                  />
                  {!isLast && (
                    <div
                      className={`absolute left-[11px] top-7 w-px h-[calc(100%-4px)] bg-gradient-to-b ${kindRailClass(entry.kind)} pointer-events-none`}
                    />
                  )}
                  {!isLast && (
                    <div className="absolute left-[8px] bottom-0 text-[8px] text-white/25 leading-none pointer-events-none">
                      ▼
                    </div>
                  )}
                  <div className="mt-0.5 shrink-0">{kindIcon(entry.kind)}</div>
                  <div className="flex-1 min-w-0 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-white/35 font-semibold">
                        {kindLabels[entry.kind]}
                      </span>
                      <span className="text-xs text-white/35 font-mono">{fmtTs(entry.ts)}</span>
                      {entry.risk != null && entry.risk >= 70 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/25">
                          risk {entry.risk.toFixed(0)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white font-medium truncate">{entry.title}</p>
                    <p className="text-xs text-white/50 font-mono truncate">{entry.detail}</p>
                    {entry.ip && (
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Link
                          href={`/bans?search=${encodeURIComponent(entry.ip)}`}
                          className="text-[10px] text-cyan-400/60 font-mono truncate hover:text-cyan-300 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          IP · {entry.ip}
                        </Link>
                        {(entry.kind === "ban" || entry.kind === "ack") && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setKindFilter(entry.kind, { scroll: false });
                              scrollToAttackMap();
                            }}
                            className="text-[10px] text-orange-300/70 hover:text-orange-200 hover:underline"
                          >
                            {t("socShowOnMap")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
              if (entry.href) {
                return (
                  <Link
                    key={entry.id}
                    href={entry.href}
                    className="block rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {inner}
                  </Link>
                );
              }
              return (
                <div key={entry.id} className="rounded-lg">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
