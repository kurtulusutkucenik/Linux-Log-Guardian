"use client";

import { useState } from "react";
import type { LineSeries } from "@/lib/content";

const W = 760;
const H = 340;
const PAD = { l: 46, r: 18, t: 24, b: 42 };
const PLOT_W = W - PAD.l - PAD.r;
const PLOT_H = H - PAD.t - PAD.b;

const DASH: Record<NonNullable<LineSeries["dash"]>, string> = {
  solid: "0",
  dash: "7 5",
  dot: "1 7",
};

function xAt(i: number, n: number) {
  if (n <= 1) return PAD.l + PLOT_W / 2;
  return PAD.l + (i / (n - 1)) * PLOT_W;
}
function yAt(v: number, yMax: number) {
  return PAD.t + (1 - v / yMax) * PLOT_H;
}

type Tip = {
  x: number;
  y: number;
  label: string;
  value: string;
};

export default function LineChart({
  categories,
  yMax,
  series,
  target,
  unit = "",
}: {
  categories: string[];
  yMax: number;
  series: LineSeries[];
  target?: number;
  unit?: string;
}) {
  const [tip, setTip] = useState<Tip | null>(null);
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * yMax));
  const n = categories.length;

  const fmt = (v: number) => {
    if (Number.isInteger(v)) return String(v);
    return v < 10 ? v.toFixed(2) : v.toLocaleString("tr-TR");
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setTip(null)}
      >
        {gridVals.map((gv) => {
          const y = yAt(gv, yMax);
          return (
            <g key={gv}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#1f1f1f" strokeWidth={1} />
              <text
                x={PAD.l - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-neutral-600"
                fontSize={10}
                fontFamily="monospace"
              >
                {gv}
              </text>
            </g>
          );
        })}

        {typeof target === "number" && (
          <g>
            <line
              x1={PAD.l}
              y1={yAt(target, yMax)}
              x2={W - PAD.r}
              y2={yAt(target, yMax)}
              stroke="#ff3b3b"
              strokeWidth={1.25}
              strokeDasharray="5 5"
              opacity={0.8}
            />
            <text
              x={W - PAD.r}
              y={yAt(target, yMax) - 6}
              textAnchor="end"
              className="fill-neon"
              fontSize={10}
              fontFamily="monospace"
            >
              hedef {target}
              {unit}
            </text>
          </g>
        )}

        {categories.map((c, i) => (
          <text
            key={c + i}
            x={xAt(i, n)}
            y={H - PAD.b + 18}
            textAnchor="middle"
            className="fill-neutral-500"
            fontSize={9.5}
            fontFamily="monospace"
          >
            {c}
          </text>
        ))}

        {series.map((s) => {
          const pts = s.values
            .map((v, i) => `${xAt(i, n)},${yAt(v, yMax)}`)
            .join(" ");
          const color = s.us ? "#1ff5df" : "#71717a";
          return (
            <g key={s.name}>
              <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth={s.us ? 3 : 1.75}
                strokeDasharray={DASH[s.dash ?? "solid"]}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={
                  s.us
                    ? { filter: "drop-shadow(0 0 6px rgba(31,245,223,0.75))" }
                    : undefined
                }
              />
              {s.values.map((v, i) => (
                <circle
                  key={s.name + i}
                  cx={xAt(i, n)}
                  cy={yAt(v, yMax)}
                  r={10}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() =>
                    setTip({
                      x: xAt(i, n),
                      y: yAt(v, yMax),
                      label: `${s.name} · ${categories[i]}`,
                      value: `${fmt(v)}${unit}`,
                    })
                  }
                />
              ))}
              {s.values.map((v, i) => (
                <circle
                  key={`dot-${s.name}-${i}`}
                  cx={xAt(i, n)}
                  cy={yAt(v, yMax)}
                  r={s.us ? 4 : 2.5}
                  fill={s.us ? "#1ff5df" : "#0a0a0a"}
                  stroke={color}
                  strokeWidth={1.5}
                  pointerEvents="none"
                  style={
                    s.us
                      ? { filter: "drop-shadow(0 0 4px rgba(31,245,223,0.9))" }
                      : undefined
                  }
                />
              ))}
            </g>
          );
        })}
      </svg>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-turq/40 bg-black/95 px-3 py-2 shadow-[0_0_20px_rgba(31,245,223,0.25)]"
          style={{
            left: `${(tip.x / W) * 100}%`,
            top: `${(tip.y / H) * 100}%`,
            transform: "translate(-50%, -120%)",
          }}
        >
          <p className="font-mono text-[10px] text-neutral-500">{tip.label}</p>
          <p className="font-display text-lg font-black text-turq">{tip.value}</p>
        </div>
      )}
    </div>
  );
}
