"use client";

import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import type { AttackMarker } from "@/lib/attackMapTypes";

type Props = {
  markers: AttackMarker[];
  onHover: (marker: AttackMarker | null) => void;
};

const GLOBE_H = 440;

export function AttackGlobe({ markers, onHover }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [width, setWidth] = useState(720);

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
        pointColor={(d) =>
          (d as AttackMarker).kind === "incident" ? "#ef4444" : "#f97316"
        }
        pointRadius={0.5}
        pointAltitude={0.04}
        onPointHover={(p) => onHover((p as AttackMarker | null) ?? null)}
        ringsData={markers}
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
