"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Globe2, MapPin } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";
import type { AttackGeoResponse, AttackMarker } from "@/lib/attackMapTypes";

const AttackGlobe = dynamic(
  () => import("./AttackGlobe").then((m) => m.AttackGlobe),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full flex items-center justify-center text-sm text-white/50"
        style={{ height: 440 }}
      >
        …
      </div>
    ),
  },
);

export type { AttackMarker };

export function AttackWorldMap({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [markers, setMarkers] = useState<AttackMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<AttackMarker | null>(null);
  const [dataSource, setDataSource] = useState<"live" | "report" | null>(null);
  const [totalIps, setTotalIps] = useState(0);
  const [geoLookup, setGeoLookup] = useState(true);
  const [bansSource, setBansSource] = useState<string | null>(null);
  const [defender, setDefender] = useState<{ lat: number; lng: number } | undefined>();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/attack-geo", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as AttackGeoResponse;
      setMarkers(data.markers ?? []);
      setTotalIps(data.total_ips ?? data.count ?? data.markers?.length ?? 0);
      setDataSource(data.data_source ?? null);
      setGeoLookup(data.geo_lookup !== false);
      setBansSource(data.bans_source ?? null);
      setDefender(data.defender);
      setError(null);
    } catch {
      setError("load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useVisibleInterval(load, 12000);

  const onPointClick = useCallback(
    (marker: AttackMarker) => {
      router.push(`/bans?search=${encodeURIComponent(marker.ip)}`);
    },
    [router],
  );

  return (
    <div className={`glass-panel p-5 ${className}`} id="attack-world-map">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-cyan-300">
          <Globe2 className="w-5 h-5" />
          {t("attackMapTitle")}
          <span className="text-sm font-normal text-white/40">
            ({markers.length}
            {totalIps > markers.length ? ` / ${totalIps}` : ""})
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {dataSource === "live" && (
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
              {t("attackMapLive")}
            </span>
          )}
          <Link
            href="#soc-timeline"
            className="text-xs text-cyan-400/70 hover:text-cyan-300 hover:underline"
          >
            {t("attackMapSocLink")} ↓
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs px-2 py-1 rounded border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-colors"
          >
            {t("attackMapRefresh")}
          </button>
        </div>
      </div>

      <p className="text-xs text-white/45 mb-1">{t("attackMapSubtitle")}</p>
      <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-wide text-white/35 mb-2">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          {t("attackMapLegendBan")}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {t("attackMapLegendIncident")}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {t("attackMapLegendAck")}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-400 ring-1 ring-orange-300/50" />
          {t("attackMapLegendSource")}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-cyan-400/30" />
          {t("attackMapLegendDefender")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span className="w-8 h-0.5 rounded bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 relative overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </span>
          {t("attackMapLegendArc")}
        </span>
        {!geoLookup && (
          <span className="text-amber-400/70 normal-case">{t("attackMapGeoOff")}</span>
        )}
        {bansSource && (
          <span className="normal-case text-white/30">
            {t("attackMapBansFrom")}: {bansSource}
          </span>
        )}
      </div>
      {totalIps > markers.length && markers.length > 0 && (
        <p className="text-xs text-amber-400/60 mb-1">
          {t("attackMapGeoPartial")
            .replace("{shown}", String(markers.length))
            .replace("{total}", String(totalIps))}
        </p>
      )}
      <p className="text-xs text-cyan-400/50 mb-3">
        {t("attackMapDragHint")} · {t("attackMapArcFlow")}
      </p>

      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#060f24]">
        {!loading && (
          <AttackGlobe
            markers={markers}
            defender={defender}
            defenderLabel={t("attackMapDefenderLabel")}
            arcToLabel={t("attackMapDefenderLabel")}
            defenderTargetHint={t("attackMapDefenderHint")}
            onHover={setHover}
            onPointClick={onPointClick}
          />
        )}

        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-[#060f24] text-sm text-white/60"
            style={{ minHeight: 440 }}
          >
            {t("attackMapLoading")}
          </div>
        )}

        {!loading && markers.length === 0 && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-white/50 p-6 text-center pointer-events-none">
            <MapPin className="w-8 h-8 opacity-40" />
            <p>{t("attackMapEmpty")}</p>
          </div>
        )}

        {hover && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-72 rounded-lg border border-white/15 bg-black/75 backdrop-blur px-3 py-2 text-xs z-10 pointer-events-none">
            <p className="font-mono text-orange-300">{hover.ip}</p>
            <p className="text-white/80 mt-0.5">
              {hover.country} ({hover.countryCode})
            </p>
            {hover.reason && (
              <p className="text-white/50 mt-1 truncate">{hover.reason}</p>
            )}
            {typeof hover.risk === "number" && hover.risk > 0 && (
              <p className="text-amber-300/80 mt-1">{t("attackMapRisk")}: {hover.risk.toFixed(0)}</p>
            )}
            <p className="text-white/35 mt-1 uppercase tracking-wide">
              {hover.kind === "incident"
                ? t("attackMapIncident")
                : hover.kind === "ack"
                  ? t("attackMapAck")
                  : t("attackMapBanned")}
            </p>
            {hover.operator && (
              <p className="text-emerald-300/80 mt-1">{hover.operator}</p>
            )}
            <p className="text-cyan-400/70 mt-1.5">
              {hover.ip} → {t("attackMapDefenderLabel")}
            </p>
            <p className="text-white/30 mt-1">{t("attackMapClickBans")}</p>
          </div>
        )}

        {dataSource === "report" && markers.length > 0 && (
          <div className="absolute top-3 left-3 text-[10px] uppercase tracking-wide text-white/35 bg-black/40 px-2 py-1 rounded border border-white/10 pointer-events-none">
            {t("attackMapReportSource")}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-amber-400/80 mt-2">{t("attackMapError")}</p>
      )}
    </div>
  );
}
