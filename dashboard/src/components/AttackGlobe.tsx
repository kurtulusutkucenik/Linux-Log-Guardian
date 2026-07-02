"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import type { AttackMarker } from "@/lib/attackMapTypes";

type Props = {
  markers: AttackMarker[];
  defender?: { lat: number; lng: number };
  defenderLabel?: string;
  arcToLabel?: string;
  defenderTargetHint?: string;
  onHover: (marker: AttackMarker | null) => void;
  onPointClick?: (marker: AttackMarker) => void;
};

const GLOBE_H = 440;
const DEFAULT_DEFENDER = { lat: 41.0082, lng: 28.9784 };

type ArcLink = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  sourceIp: string;
  kind: AttackMarker["kind"];
  dashOffset: number;
};

export function AttackGlobe({
  markers,
  defender,
  defenderLabel = "Server",
  arcToLabel,
  defenderTargetHint = "◀ target",
  onHover,
  onPointClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [width, setWidth] = useState(720);
  const hub = defender ?? DEFAULT_DEFENDER;
  const targetLabel = arcToLabel ?? defenderLabel;

  const arcs = useMemo<ArcLink[]>(
    () =>
      markers
        .filter((m) => m.kind !== "ack")
        .map((m, i) => ({
          startLat: m.lat,
          startLng: m.lon,
          endLat: hub.lat,
          endLng: hub.lng,
          sourceIp: m.ip,
          kind: m.kind,
          dashOffset: (i % 5) * 0.08,
        })),
    [markers, hub.lat, hub.lng],
  );

  const hubObject = useMemo(
    () => [{ lat: hub.lat, lng: hub.lng, label: defenderLabel }],
    [hub.lat, hub.lng, defenderLabel],
  );

  const defenderBadgeEl = useCallback((d: object) => {
    const label = (d as { label: string }).label;
      const el = document.createElement("div");
      el.style.cssText =
        "display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;user-select:none;";
      const dot = document.createElement("div");
      dot.style.cssText =
        "width:14px;height:14px;border-radius:50%;background:#22d3ee;box-shadow:0 0 14px #22d3ee,0 0 28px rgba(34,211,238,0.35);border:2px solid rgba(255,255,255,0.85);";
      const title = document.createElement("span");
      title.textContent = label;
      title.style.cssText =
        "font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#a5f3fc;background:rgba(0,0,0,0.72);padding:2px 6px;border-radius:4px;border:1px solid rgba(34,211,238,0.35);white-space:nowrap;";
      const hint = document.createElement("span");
      hint.textContent = defenderTargetHint;
      hint.style.cssText = "font-size:8px;color:rgba(34,211,238,0.75);letter-spacing:0.04em;";
      el.appendChild(dot);
      el.appendChild(title);
      el.appendChild(hint);
      return el;
  }, [defenderTargetHint]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(320, el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const ctrl = g.controls();
    ctrl.autoRotate = false;
    ctrl.enablePan = false;
    ctrl.minDistance = 160;
    ctrl.maxDistance = 420;
    g.pointOfView({ lat: 28, lng: 18, altitude: 2.15 }, 0);
  }, [width]);

  return (
    <div
      ref={containerRef}
      className="w-full cursor-grab active:cursor-grabbing"
      style={{ height: GLOBE_H }}
    >
      <Globe
        ref={globeRef}
        width={width}
        height={GLOBE_H}
        globeImageUrl="/globe/earth-night.jpg"
        bumpImageUrl="/globe/earth-topology.png"
        backgroundColor="rgba(6,16,36,0)"
        atmosphereColor="#22d3ee"
        atmosphereAltitude={0.14}
        showAtmosphere
        pointsData={markers}
        pointLat="lat"
        pointLng="lon"
        pointColor={(d) => {
          const k = (d as AttackMarker).kind;
          if (k === "incident") return "#ef4444";
          if (k === "ack") return "#34d399";
          return "#f97316";
        }}
        pointRadius={0.5}
        pointAltitude={0.04}
        onPointHover={(p) => onHover((p as AttackMarker | null) ?? null)}
        onPointClick={(p) => {
          if (p) onPointClick?.(p as AttackMarker);
        }}
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={(d: object) => {
          const k = (d as ArcLink).kind;
          const src =
            k === "incident"
              ? "rgba(239,68,68,0.95)"
              : "rgba(251,146,60,0.95)";
          return [src, "rgba(34,211,238,0.85)"];
        }}
        arcAltitude={0.18}
        arcStroke={0.55}
        arcDashLength={0.35}
        arcDashGap={0.18}
        arcDashInitialGap={(d) => (d as ArcLink).dashOffset}
        arcDashAnimateTime={2200}
        arcLabel={(d) => {
          const a = d as ArcLink;
          return `<div style="font-family:monospace;font-size:11px;padding:4px 6px;">
            <span style="color:#fb923c">${a.sourceIp}</span>
            <span style="color:#94a3b8"> → </span>
            <span style="color:#22d3ee">${targetLabel}</span>
          </div>`;
        }}
        arcsTransitionDuration={400}
        htmlElementsData={hubObject}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.02}
        htmlElement={defenderBadgeEl}
        ringsData={markers.filter((m) => m.kind !== "ack")}
        ringLat="lat"
        ringLng="lon"
        ringColor={() => (t: number) => `rgba(251,146,60,${1 - t})`}
        ringMaxRadius={2.8}
        ringPropagationSpeed={2.2}
        ringRepeatPeriod={1500}
      />
    </div>
  );
}
