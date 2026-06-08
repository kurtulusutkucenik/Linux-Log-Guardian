"use client";

import { useMemo, useState } from "react";
import type { LineageGraphElements } from "@/lib/lineageGraph";
import { eventColor } from "@/lib/lineageGraph";

type Props = {
  graph: LineageGraphElements;
  height?: number;
  className?: string;
};

type LayoutNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  risk?: number;
};

type LayoutEdge = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  detail?: string;
  eventType?: string;
  labelX: number;
  labelY: number;
};

function shortEventLabel(label: string): string {
  return label
    .replace("EXEC SHELL", "EXEC")
    .replace("FILE WRITE", "WRITE")
    .replace("FILE READ", "READ")
    .replace("NET CONNECT", "CONN")
    .replace("NET RECV", "RECV");
}

/** Ayni source→target kenarlarda etiketleri dagit (cakisma onleme). */
function spreadEdgeLabels(edges: LayoutEdge[]): LayoutEdge[] {
  const groups = new Map<string, LayoutEdge[]>();
  for (const e of edges) {
    const key = `${Math.round(e.x1)}:${Math.round(e.y1)}→${Math.round(e.x2)}:${Math.round(e.y2)}`;
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  return edges.map((e) => {
    const key = `${Math.round(e.x1)}:${Math.round(e.y1)}→${Math.round(e.x2)}:${Math.round(e.y2)}`;
    const group = groups.get(key) ?? [e];
    const idx = group.indexOf(e);
    const n = group.length;

    const x1 = e.x1;
    const y1 = e.y1 + 28;
    const x2 = e.x2;
    const y2 = e.y2 - 28;
    const edx = x2 - x1;
    const edy = y2 - y1;
    const len = Math.hypot(edx, edy) || 1;
    const nx = -edy / len;
    const ny = edx / len;

    const t = n === 1 ? 0.5 : 0.22 + ((idx + 1) / (n + 1)) * 0.56;
    const spread = (idx - (n - 1) / 2) * 16;
    const mx = x1 + edx * t;
    const my = y1 + edy * t;

    return {
      ...e,
      labelX: mx + nx * spread,
      labelY: my + ny * spread,
    };
  });
}

function layoutGraph(graph: LineageGraphElements): {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
} {
  const nodeMap = new Map(
    graph.nodes.map((n) => [
      n.data.id,
      {
        id: n.data.id,
        label: n.data.label,
        risk: n.data.risk,
        x: 0,
        y: 0,
      },
    ]),
  );

  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  for (const n of graph.nodes) {
    adj.set(n.data.id, []);
    inDeg.set(n.data.id, 0);
  }
  for (const e of graph.edges) {
    adj.get(e.data.source)?.push(e.data.target);
    inDeg.set(e.data.target, (inDeg.get(e.data.target) ?? 0) + 1);
  }

  const roots = [...inDeg.entries()]
    .filter(([, d]) => d === 0)
    .map(([id]) => id);
  const rank = new Map<string, number>();
  const queue = [...roots];
  roots.forEach((r) => rank.set(r, 0));
  while (queue.length) {
    const u = queue.shift()!;
    const r = rank.get(u) ?? 0;
    for (const v of adj.get(u) ?? []) {
      rank.set(v, Math.max(rank.get(v) ?? 0, r + 1));
      queue.push(v);
    }
  }

  const byRank = new Map<number, string[]>();
  for (const [id, r] of rank) {
    if (!byRank.has(r)) byRank.set(r, []);
    byRank.get(r)!.push(id);
  }

  const colW = 140;
  const rowH = 100;
  const pad = 48;
  let maxCol = 0;
  let maxRow = 0;

  for (const [r, ids] of byRank) {
    maxRow = Math.max(maxRow, r);
    maxCol = Math.max(maxCol, ids.length);
    ids.forEach((id, i) => {
      const n = nodeMap.get(id);
      if (!n) return;
      n.x = pad + i * colW + colW / 2;
      n.y = pad + r * rowH + 36;
    });
  }

  const orphan = graph.nodes
    .map((n) => n.data.id)
    .filter((id) => !rank.has(id));
  orphan.forEach((id, i) => {
    const n = nodeMap.get(id);
    if (!n) return;
    n.x = pad + i * colW + colW / 2;
    n.y = pad + (maxRow + 1) * rowH + 36;
  });

  const nodes = [...nodeMap.values()];
  const rawEdges: LayoutEdge[] = graph.edges.map((e) => {
    const a = nodeMap.get(e.data.source);
    const b = nodeMap.get(e.data.target);
    return {
      id: e.data.id,
      x1: a?.x ?? 0,
      y1: a?.y ?? 0,
      x2: b?.x ?? 0,
      y2: b?.y ?? 0,
      label: e.data.label,
      detail: e.data.detail,
      eventType: e.data.eventType,
      labelX: 0,
      labelY: 0,
    };
  });
  const edges = spreadEdgeLabels(rawEdges);

  const width = Math.max(320, pad * 2 + Math.max(maxCol, 1) * colW);
  const heightPx = pad * 2 + (maxRow + 2) * rowH;

  return { nodes, edges, width, height: heightPx };
}

export function LineageGraph({ graph, height = 420, className = "" }: Props) {
  const [tip, setTip] = useState<string | null>(null);
  const layout = useMemo(() => layoutGraph(graph), [graph]);

  if (graph.nodes.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-white/40 text-sm border border-white/10 rounded-xl bg-black/20 ${className}`}
        style={{ height }}
      >
        —
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-xl border border-white/10 bg-[#0a0e14] overflow-auto ${className}`}
      style={{ height, minHeight: height }}
    >
      {tip && (
        <div className="absolute top-2 left-2 right-2 z-10 text-xs font-mono text-white/80 bg-black/80 border border-white/10 rounded-lg px-3 py-2 truncate">
          {tip}
        </div>
      )}
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="w-full min-w-[320px]"
        style={{ minHeight: layout.height }}
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
          </marker>
        </defs>
        {layout.edges.map((e) => {
          const col = eventColor(e.eventType ?? "");
          const short = shortEventLabel(e.label);
          const tw = Math.max(short.length * 5.8 + 8, 28);
          return (
            <g key={e.id}>
              <line
                x1={e.x1}
                y1={e.y1 + 28}
                x2={e.x2}
                y2={e.y2 - 28}
                stroke={col}
                strokeWidth={2}
                markerEnd="url(#arrow)"
                opacity={0.85}
              />
              <rect
                x={e.labelX - tw / 2}
                y={e.labelY - 9}
                width={tw}
                height={14}
                rx={3}
                fill="#0a0e14"
                fillOpacity={0.92}
                stroke="rgba(255,255,255,0.08)"
              />
              <text
                x={e.labelX}
                y={e.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={col}
                fontSize="9"
                fontWeight="600"
                fontFamily="ui-monospace, monospace"
              >
                {short}
              </text>
              {e.detail && <title>{e.label}: {e.detail}</title>}
            </g>
          );
        })}
        {layout.nodes.map((n) => {
          const border =
            n.risk != null && n.risk >= 85
              ? "#ef4444"
              : n.risk != null && n.risk >= 60
                ? "#f97316"
                : "#475569";
          return (
            <g
              key={n.id}
              onMouseEnter={() => setTip(n.label.replace("\n", " · "))}
              onMouseLeave={() => setTip(null)}
              className="cursor-default"
            >
              <rect
                x={n.x - 52}
                y={n.y - 28}
                width={104}
                height={56}
                rx={10}
                fill="#0f172a"
                stroke={border}
                strokeWidth={n.risk != null ? 3 : 2}
              />
              {n.label.split("\n").map((line, i) => (
                <text
                  key={i}
                  x={n.x}
                  y={n.y - 6 + i * 14}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="11"
                  fontFamily="ui-monospace, monospace"
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
