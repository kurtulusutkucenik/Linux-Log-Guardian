"use client";

import { ShieldBan, RefreshCw, ChevronLeft, ChevronRight, Search, Globe2, CheckCircle2, FlaskConical, Clock3 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import axios from "axios";
import { useLanguage } from "@/components/LanguageProvider";
import { BanIpButton } from "@/components/BanIpButton";
import { BanTelegramOpsPanel } from "@/components/BanTelegramOpsPanel";
import { useBannedIps, type BanRow } from "@/context/BannedIpsContext";

const PAGE_SIZE = 50;

function isIpv4(s: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(s.trim());
}

function BansPageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const {
    refresh: refreshGlobal,
    source: ctxSource,
    dataMode: ctxDataMode,
    preview: ctxPreview,
  } = useBannedIps();
  const [manualIp, setManualIp] = useState("");
  const [filter, setFilter] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [bans, setBans] = useState<BanRow[]>([]);
  const [source, setSource] = useState("");
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [ackByIp, setAckByIp] = useState<Record<string, { operator: string; ts: number }>>({});
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBoot = useRef(true);

  const loadPage = useCallback(
    async (off: number, search?: string) => {
      setRefreshing(true);
      const q = search?.trim() || undefined;
      try {
        const res = await axios.get("/api/bans", {
          params: {
            limit: PAGE_SIZE,
            offset: off,
            bust: Date.now(),
            ...(q ? { search: q } : {}),
          },
        });
        setTotalCount(res.data.count ?? 0);
        setBans(res.data.bans || []);
        setSource(res.data.source || ctxSource || "");
        setPreview(Boolean(res.data.preview));
        setOffset(off);
        setActiveSearch(q || "");
      } catch {
        setBans([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [ctxSource],
  );

  useEffect(() => {
    let cancelled = false;
    const loadAcks = async () => {
      try {
        const res = await axios.get("/api/telegram-acks", { params: { bust: Date.now() } });
        if (!cancelled) setAckByIp(res.data.by_ip ?? {});
      } catch {
        if (!cancelled) setAckByIp({});
      }
    };
    void loadAcks();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchBoot.current) {
      searchBoot.current = false;
      const q = searchParams.get("search")?.trim();
      if (q) setFilter(q);
      void loadPage(0, q || undefined);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      void loadPage(0, filter);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [filter, loadPage, searchParams]);

  const spinning = loading || refreshing;
  const pageEnd = Math.min(offset + bans.length, totalCount);
  const hasPrev = offset > 0;
  const hasNext = pageEnd < totalCount;
  const filtering = Boolean(activeSearch);
  const opsIp = isIpv4(activeSearch) ? activeSearch.trim() : "";

  const handleRefresh = () => {
    void loadPage(offset, activeSearch || filter);
    void refreshGlobal();
  };

  const onBanDone = (ok: boolean, msg: string) => {
    setStatusMsg(msg);
    if (ok) handleRefresh();
    setTimeout(() => setStatusMsg(""), ok ? 4000 : 10000);
  };

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <header className="glass-panel p-6 border border-red-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/25">
            <ShieldBan className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {t("bannedIpsTitle")}
            </h1>
            <p className="text-white/45 text-sm mt-1">{t("bannedIpsPageDesc")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {totalCount > 0 && (
            <span className="text-sm font-mono px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-300">
              {totalCount.toLocaleString()}{" "}
              {filtering ? t("bannedIpsSearchMatches") : t("bannedIpsTotalActive")}
            </span>
          )}
          {preview && (
            <span className="text-xs px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
              {t("bannedIpsProofMode")}
            </span>
          )}
          {!preview &&
            !ctxPreview &&
            ctxDataMode === "live" &&
            (source || ctxSource) === "ipset" &&
            totalCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                {t("bannedIpsLiveMode")}
              </span>
            )}
          {source && (
            <span className="text-xs font-mono px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/40">
              {source}
            </span>
          )}
          <Link
            href="/#soc-ban"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 border border-violet-500/25 text-sm text-violet-200 hover:bg-violet-500/15 transition-colors"
          >
            <Clock3 className="w-4 h-4" />
            {t("bannedIpsSocLink")}
          </Link>
          <Link
            href="/#attack-world-map"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-sm text-cyan-200 hover:bg-cyan-500/15 transition-colors"
          >
            <Globe2 className="w-4 h-4" />
            {t("navAttackMap")}
          </Link>
          <Link
            href="/tests"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-sm text-emerald-200 hover:bg-emerald-500/15 transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            {t("bannedIpsTestsLink")}
          </Link>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={spinning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} />
            {refreshing ? t("bannedIpsRefreshing") : t("bannedIpsRefresh")}
          </button>
        </div>
      </header>

      <div className="glass-panel border border-red-500/20 p-5 space-y-4">
        {preview && (
          <p className="text-xs text-amber-400/75 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            {t("bannedIpsProofDesc")}
          </p>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("bannedIpsSearchPlaceholder")}
            className="w-full pl-10 pr-3 py-2 text-sm rounded-lg bg-black/40 border border-white/10 text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-red-500/40"
          />
        </div>

        {opsIp && (
          <BanTelegramOpsPanel ip={opsIp} ack={ackByIp[opsIp]} />
        )}

        {loading && bans.length === 0 ? (
          <p className="text-sm text-white/45 py-8 text-center">{t("bannedIpsLoading")}</p>
        ) : totalCount === 0 && !filtering ? (
          <div className="py-12 text-center">
            <ShieldBan className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/45">{t("bannedIpsEmpty")}</p>
          </div>
        ) : bans.length === 0 ? (
          <p className="text-sm text-white/45 py-8 text-center">
            {filtering ? t("bannedIpsSearchEmpty") : t("bannedIpsEmpty")}
          </p>
        ) : (
          <>
            {totalCount > bans.length && !filtering && (
              <p className="text-xs text-white/40 mb-2">{t("bannedIpsScrollHint")}</p>
            )}
            <ul className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
            {bans.map((b) => (
              <li
                key={b.ip}
                className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-black/30 border border-white/10 hover:border-red-500/20 transition-colors"
              >
                <div className="min-w-0">
                  <span className="font-mono text-sm text-red-300 block truncate flex items-center gap-1.5">
                    {b.ip}
                    {ackByIp[b.ip] && (
                      <span
                        title={`${t("bansTelegramAcked")} · ${ackByIp[b.ip].operator}`}
                        className="inline-flex"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </span>
                    )}
                  </span>
                  {b.reason && (
                    <span className="text-[10px] text-white/35 truncate block mt-0.5">
                      {b.reason}
                    </span>
                  )}
                </div>
                <BanIpButton
                  ip={b.ip}
                  variant="unban"
                  readOnly={preview}
                  reason="dashboard-bans-page"
                  onRefresh={handleRefresh}
                  onDone={onBanDone}
                />
              </li>
            ))}
          </ul>
          </>
        )}

        {!filtering && totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              disabled={!hasPrev || spinning}
              onClick={() => loadPage(Math.max(0, offset - PAGE_SIZE), activeSearch)}
              className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> {t("paginationPrev")}
            </button>
            <span className="text-xs text-white/40 font-mono">
              {offset + 1}–{pageEnd} / {totalCount}
            </span>
            <button
              type="button"
              disabled={!hasNext || spinning}
              onClick={() => loadPage(offset + PAGE_SIZE, activeSearch)}
              className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white disabled:opacity-40"
            >
              {t("paginationNext")} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {statusMsg && (
        <p className="text-sm px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white/80 font-mono">
          {statusMsg}
        </p>
      )}

      <div className="glass-panel p-5 border border-white/10">
        <h2 className="text-sm font-semibold text-white/70 mb-3">{t("bannedIpsManualBan")}</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={manualIp}
            onChange={(e) => setManualIp(e.target.value)}
            placeholder="203.0.113.55"
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-red-500/40"
          />
          <BanIpButton
            ip={manualIp.trim()}
            reason="dashboard-bans-page"
            onRefresh={handleRefresh}
            onDone={(ok, msg) => {
              onBanDone(ok, msg);
              if (ok) {
                const ip = manualIp.trim();
                if (ip) setFilter(ip);
                setManualIp("");
              }
            }}
          />
        </div>
      </div>

      {source === "empty" && !loading && !preview && (
        <p className="text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
          {t("bannedIpsEmptyHint")}
        </p>
      )}

      <p className="text-xs text-white/35">
        {t("bannedIpsAlsoOn")}{" "}
        <Link href="/" className="text-primary hover:underline">
          {t("navFleet")}
        </Link>
        {" · "}
        <Link href="/attack-tree" className="text-primary hover:underline">
          {t("navLineage")}
        </Link>
      </p>
    </div>
  );
}

export default function BansPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-8 flex items-center justify-center text-white/50">
          …
        </div>
      }
    >
      <BansPageContent />
    </Suspense>
  );
}
