"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

type Summary = {
  morning?: { pass?: boolean; proof?: string | null } | null;
  fleet?: { pass?: boolean; online?: string } | null;
  vps?: { pass?: boolean; hands_off?: boolean } | null;
  e9?: { pass?: boolean; proof?: string | null } | null;
  relay_lan?: { pass?: boolean } | null;
  eps_smoke?: {
    pass?: boolean;
    peak_eps?: number | null;
    derived_eps?: number | null;
    lines_delta?: number | null;
  } | null;
};

type LiveMetrics = {
  reachable?: boolean;
  eps?: number;
  eps_peak?: number;
  lines_total?: number;
};

function pill(ok: boolean | undefined, label: string, href: string) {
  const cls =
    ok === true
      ? "border-emerald-500/35 text-emerald-300/90 bg-emerald-500/10"
      : ok === false
        ? "border-amber-500/35 text-amber-200/90 bg-amber-500/10"
        : "border-white/10 text-white/45 bg-white/5";
  return (
    <Link
      href={href}
      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border hover:opacity-90 transition-opacity ${cls}`}
    >
      {label}
    </Link>
  );
}

export function OpsGatesStrip() {
  const { t } = useLanguage();
  const [data, setData] = useState<Summary | null>(null);
  const [liveEps, setLiveEps] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [gatesRes, liveRes] = await Promise.all([
          fetch("/api/operator-gates-summary", { cache: "no-store" }),
          fetch("/api/metrics/live", { cache: "no-store" }),
        ]);
        if (gatesRes.ok) setData((await gatesRes.json()) as Summary);
        if (liveRes.ok) {
          const live = (await liveRes.json()) as LiveMetrics;
          if (live.reachable && (live.eps ?? 0) > 0) {
            setLiveEps(live.eps ?? 0);
          } else if (live.reachable && (live.eps_peak ?? 0) > 0) {
            setLiveEps(live.eps_peak ?? 0);
          } else {
            setLiveEps(null);
          }
        }
      } catch {
        /* ignore */
      }
    })();
    const timer = setInterval(() => {
      void Promise.all([
        fetch("/api/metrics/live", { cache: "no-store" }),
        fetch("/api/operator-gates-summary", { cache: "no-store" }),
      ])
        .then(async ([liveRes, gatesRes]) => {
          if (gatesRes.ok) setData((await gatesRes.json()) as Summary);
          if (!liveRes.ok) return;
          const live = (await liveRes.json()) as LiveMetrics;
          if (live.reachable && (live.eps ?? 0) > 0) setLiveEps(live.eps ?? 0);
          else if (live.reachable && (live.eps_peak ?? 0) > 0) setLiveEps(live.eps_peak ?? 0);
          else setLiveEps(null);
        })
        .catch(() => undefined);
    }, 15_000);
    return () => clearInterval(timer);
  }, []);

  if (!data) return null;

  const morningLabel = data.morning?.proof
    ? `${t("opsStripMorning")} ${data.morning.proof}`
    : t("opsStripMorning");
  const fleetLabel = data.fleet?.online
    ? `${t("opsStripFleet")} ${data.fleet.online}`
    : t("opsStripFleet");
  const vpsLabel = data.vps?.hands_off ? t("opsStripVpsHandsOff") : t("opsStripVps");
  const e9Label = data.e9?.proof
    ? `${t("opsStripE9")} ${data.e9.proof}`
    : t("opsStripE9");
  const relayLabel = t("opsStripRelay");
  const smokePeak = data.eps_smoke?.peak_eps ?? 0;
  const epsLabel =
    liveEps != null && liveEps > 0
      ? smokePeak > liveEps + 0.5
        ? t("opsStripEpsLivePeak")
            .replace("{live}", liveEps.toFixed(1))
            .replace("{peak}", smokePeak.toFixed(1))
        : `${t("opsStripEps")} ${liveEps.toFixed(1)}`
      : smokePeak > 0
        ? `${t("opsStripEpsSmoke")} ${smokePeak.toFixed(1)}`
        : data.eps_smoke?.derived_eps != null && (data.eps_smoke.derived_eps ?? 0) > 0
          ? `${t("opsStripEpsSmoke")} ~${data.eps_smoke.derived_eps?.toFixed(1)}`
          : t("opsStripEps");

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pill(data.morning?.pass, morningLabel, "#operator-gates-morning")}
      {pill(data.fleet?.pass, fleetLabel, "#operator-gates-fleet")}
      {pill(data.vps?.pass, vpsLabel, "#operator-gates-vps")}
      {pill(data.e9?.pass, e9Label, "#operator-gates-e9")}
      {data.relay_lan && pill(data.relay_lan.pass, relayLabel, "/tests#test-edge-protection-gate")}
      {pill(liveEps != null && liveEps > 0 ? true : data.eps_smoke?.pass, epsLabel, "#live-ops-metrics")}
    </div>
  );
}
