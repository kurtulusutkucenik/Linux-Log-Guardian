type PromVector = { metric: Record<string, string>; value: [number, string] };
type PromMatrix = { metric: Record<string, string>; values: [number, string][] };

type PromQueryResult = {
  resultType: string;
  result: PromVector[] | PromMatrix[];
};

type PromResponse = {
  status: string;
  data?: PromQueryResult;
  error?: string;
};

export function prometheusBaseUrl(): string {
  return (
    process.env.PROMETHEUS_URL ||
    process.env.PROMETHEUS_QUERY_URL ||
    "http://host.docker.internal:9090"
  ).replace(/\/$/, "");
}

function num(s: string | undefined): number {
  if (s == null || s === "NaN") return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export async function promInstant(query: string): Promise<number | null> {
  const url = new URL(`${prometheusBaseUrl()}/api/v1/query`);
  url.searchParams.set("query", query);
  const res = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as PromResponse;
  if (body.status !== "success" || !body.data?.result?.length) return null;
  const row = body.data.result[0] as PromVector;
  return num(row.value?.[1]);
}

export type TsPoint = { ts: number; label: string; v: number };

export async function promRange(
  query: string,
  rangeSec = 3600,
  step = 30,
): Promise<TsPoint[]> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - rangeSec;
  const url = new URL(`${prometheusBaseUrl()}/api/v1/query_range`);
  url.searchParams.set("query", query);
  url.searchParams.set("start", String(start));
  url.searchParams.set("end", String(end));
  url.searchParams.set("step", String(step));

  const timeoutMs = rangeSec > 7200 ? 15000 : rangeSec > 3600 ? 12000 : 8000;

  const res = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) return [];
  const body = (await res.json()) as PromResponse;
  if (body.status !== "success" || !body.data?.result?.length) return [];

  const row = body.data.result[0] as PromMatrix;
  return (row.values || []).map(([ts, val]) => ({
    ts: ts * 1000,
    label: new Date(ts * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    v: num(val),
  }));
}

/** Coklu seri — timestamp birlestirme (Grafana timeseries). */
export async function promRangeMulti(
  series: { key: string; query: string }[],
  rangeSec = 3600,
  step = 30,
): Promise<Record<string, string | number>[]> {
  const maps = await Promise.all(
    series.map(async (s) => {
      const pts = await promRange(s.query, rangeSec, step);
      return { key: s.key, pts };
    }),
  );

  const byTs = new Map<number, Record<string, string | number>>();
  for (const { key, pts } of maps) {
    for (const p of pts) {
      const row = byTs.get(p.ts) || { ts: p.ts, t: p.label };
      row[key] = p.v;
      byTs.set(p.ts, row);
    }
  }
  return [...byTs.values()].sort((a, b) => Number(a.ts) - Number(b.ts));
}

export async function promReachable(): Promise<boolean> {
  try {
    const url = `${prometheusBaseUrl()}/api/v1/query?query=up`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
