"use client";

import { useEffect, useState } from "react";
import { MorningOperatorPanel } from "./MorningOperatorPanel";
import { FleetOpsPanel } from "./FleetOpsPanel";
import { VpsPrepPanel } from "./VpsPrepPanel";
import { E9RunbookPanel } from "./E9RunbookPanel";
import { useLanguage } from "./LanguageProvider";

export type OperatorGateTab = "morning" | "fleet" | "vps" | "e9";

type GateSummary = {
  morning?: { pass?: boolean; proof?: string | null } | null;
  fleet?: { pass?: boolean; online?: string } | null;
  vps?: {
    pass?: boolean;
    hands_off?: boolean;
    ssh_ok?: boolean;
    soak_72h?: boolean;
    proof?: string | null;
  } | null;
  e9?: { pass?: boolean; proof?: string | null } | null;
  relay_lan?: { pass?: boolean } | null;
  eps_smoke?: {
    pass?: boolean;
    peak_eps?: number | null;
    lines_delta?: number | null;
  } | null;
};

function tabChipClass(ok: boolean | undefined, active: boolean) {
  if (active) {
    return ok === true
      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
      : ok === false
        ? "bg-amber-500/20 border-amber-500/40 text-amber-200"
        : "bg-primary/15 border-primary/40 text-primary";
  }
  return ok === true
    ? "bg-white/5 border-white/10 text-white/60 hover:border-emerald-500/30 hover:text-emerald-200/90"
    : ok === false
      ? "bg-white/5 border-white/10 text-amber-200/70 hover:border-amber-500/30"
      : "bg-white/5 border-white/10 text-white/45 hover:border-white/25 hover:text-white/70";
}

export function OperatorGatesTabs({
  initialTab = "morning",
}: {
  initialTab?: OperatorGateTab;
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<OperatorGateTab>(initialTab);
  const [summary, setSummary] = useState<GateSummary | null>(null);

  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "operator-gates-morning") setTab("morning");
      else if (h === "operator-gates-fleet") setTab("fleet");
      else if (h === "operator-gates-vps") setTab("vps");
      else if (h === "operator-gates-e9") setTab("e9");
      else if (h === "operator-gates") setTab("morning");
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/operator-gates-summary", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as GateSummary;
        setSummary(data);
        if (data.morning?.pass === false) setTab("morning");
        else if (data.fleet?.pass === false) setTab("fleet");
        else if (data.vps?.pass === false) setTab("vps");
        else if (data.e9?.pass === false) setTab("e9");
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const tabs: { id: OperatorGateTab; label: string; ok?: boolean; hint?: string }[] = [
    {
      id: "morning",
      label: t("opsTabMorning"),
      ok: summary?.morning?.pass,
      hint: summary?.morning?.proof ?? undefined,
    },
    {
      id: "fleet",
      label: t("opsTabFleet"),
      ok: summary?.fleet?.pass,
      hint: summary?.fleet?.online,
    },
    {
      id: "vps",
      label: summary?.vps?.hands_off ? t("opsTabVpsLive") : t("opsTabVps"),
      ok: summary?.vps?.pass,
      hint: summary?.vps?.hands_off
        ? "72h"
        : summary?.vps?.proof ?? undefined,
    },
    {
      id: "e9",
      label: t("opsTabE9"),
      ok: summary?.e9?.pass,
      hint: summary?.e9?.proof ?? undefined,
    },
  ];

  return (
    <section id="operator-gates" className="flex flex-col gap-3 scroll-mt-24">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40 mr-1">
          {t("opsGatesTitle")}
        </span>
        {summary?.relay_lan && (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
              summary.relay_lan.pass
                ? "border-emerald-500/30 text-emerald-300/80"
                : "border-amber-500/30 text-amber-200/80"
            }`}
          >
            relay LAN: {summary.relay_lan.pass ? "OK" : "FAIL"}
          </span>
        )}
        {summary?.eps_smoke && (
          <a
            href="#live-ops-metrics"
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border hover:opacity-90 ${
              summary.eps_smoke.pass
                ? "border-cyan-500/30 text-cyan-300/85"
                : "border-amber-500/30 text-amber-200/80"
            }`}
          >
            eps smoke
            {(summary.eps_smoke.peak_eps ?? 0) > 0
              ? ` ${summary.eps_smoke.peak_eps?.toFixed(1)}`
              : summary.eps_smoke.pass
                ? " OK"
                : " —"}
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(item.id);
                window.history.replaceState(null, "", `#operator-gates-${item.id}`);
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${tabChipClass(item.ok, active)}`}
            >
              {item.label}
              {item.hint ? (
                <span className="ml-1 opacity-60 font-mono text-[10px]">{item.hint}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {tab === "morning" && <MorningOperatorPanel />}
        {tab === "fleet" && <FleetOpsPanel />}
        {tab === "vps" && <VpsPrepPanel />}
        {tab === "e9" && <E9RunbookPanel />}
      </div>
    </section>
  );
}
