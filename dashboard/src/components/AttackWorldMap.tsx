"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Globe2, MapPin } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

export type AttackMarker = {
  ip: string;
  lat: number;
  lon: number;
  countryCode: string;
  country: string;
  kind: "ban" | "incident";
  reason?: string;
  risk?: number;
  source?: string;
};

type GeoResponse = {
  count: number;
  total_ips: number;
  geo_lookup: boolean;
  markers: AttackMarker[];
};

function project(lon: number, lat: number, w: number, h: number) {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return { x, y };
}

export function AttackWorldMap({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  const [markers, setMarkers] = useState<AttackMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<AttackMarker | null>(null);
  const [pulseTs, setPulseTs] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/attack-geo", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as GeoResponse;
      setMarkers(data.markers ?? []);
      setPulseTs(Date.now());
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

  const w = 720;
  const h = 360;

  const dots = useMemo(
    () =>
      markers.map((m) => ({
        ...m,
        ...project(m.lon, m.lat, w, h),
      })),
    [markers, w, h],
  );

  return (
    <div className={`glass-panel p-5 ${className}`} id="attack-world-map">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-cyan-300">
          <Globe2 className="w-5 h-5" />
          {t("attackMapTitle")}
          <span className="text-sm font-normal text-white/40">
            ({markers.length})
          </span>
        </h2>
        <button
          type="button"
          onClick={() => void load()}
          className="text-xs px-2 py-1 rounded border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-colors"
        >
          {t("attackMapRefresh")}
        </button>
      </div>

      <p className="text-xs text-white/45 mb-3">{t("attackMapSubtitle")}</p>

      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0a1628]">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-auto block"
          role="img"
          aria-label={t("attackMapTitle")}
        >
          <defs>
            <radialGradient id="ocean" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0f2847" />
              <stop offset="100%" stopColor="#071018" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width={w} height={h} fill="url(#ocean)" />
          {[-60, -30, 0, 30, 60].map((lat) => {
            const y = project(0, lat, w, h).y;
            return (
              <line
                key={`lat-${lat}`}
                x1={0}
                y1={y}
                x2={w}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}
          {[-120, -60, 0, 60, 120].map((lon) => {
            const x = project(lon, 0, w, h).x;
            return (
              <line
                key={`lon-${lon}`}
                x1={x}
                y1={0}
                x2={x}
                y2={h}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w * 0.48}
            ry={h * 0.46}
            fill="none"
            stroke="rgba(56,189,248,0.12)"
            strokeWidth={1.5}
          />
          {dots.map((d) => {
            const active = d.kind === "incident";
            const isHover = hover?.ip === d.ip;
            return (
              <g
                key={d.ip}
                onMouseEnter={() => setHover(d)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={isHover ? 9 : 6}
                  fill={active ? "#f87171" : "#fb923c"}
                  opacity={0.25}
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="r"
                    values="4;10;4"
                    dur="2.5s"
                    repeatCount="indefinite"
                    begin={`${(pulseTs % 3000) / 1000}s`}
                  />
                </circle>
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={isHover ? 4.5 : 3}
                  fill={active ? "#ef4444" : "#f97316"}
                  stroke="#fff"
                  strokeWidth={0.5}
                  opacity={0.95}
                />
              </g>
            );
          })}
        </svg>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-sm text-white/60">
            {t("attackMapLoading")}
          </div>
        )}

        {!loading && markers.length === 0 && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-white/50 p-6 text-center">
            <MapPin className="w-8 h-8 opacity-40" />
            <p>{t("attackMapEmpty")}</p>
          </div>
        )}

        {hover && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-72 rounded-lg border border-white/15 bg-black/75 backdrop-blur px-3 py-2 text-xs">
            <p className="font-mono text-orange-300">{hover.ip}</p>
            <p className="text-white/80 mt-0.5">
              {hover.country} ({hover.countryCode})
            </p>
            {hover.reason && (
              <p className="text-white/50 mt-1 truncate">{hover.reason}</p>
            )}
            <p className="text-white/35 mt-1 uppercase tracking-wide">
              {hover.kind === "incident" ? t("attackMapIncident") : t("attackMapBanned")}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-amber-400/80 mt-2">{t("attackMapError")}</p>
      )}
    </div>
  );
}
