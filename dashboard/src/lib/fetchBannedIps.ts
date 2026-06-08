import { readFile, stat } from "fs/promises";

export type BanEntry = { ip: string; reason?: string; ts?: number };

export type BannedIpsFile = {
  ips?: string[];
  total_count?: number;
  truncated?: boolean;
  source?: string;
};

export type FetchBannedOpts = {
  countOnly?: boolean;
  limit?: number;
  offset?: number;
};

export type BannedIpsResult = {
  count: number;
  source: string;
  bans: BanEntry[];
  truncated?: boolean;
  limit?: number;
  offset?: number;
};

const BAN_FILE_PATHS = [
  "/run/log-guardian/active_bans.json",
  "/data/lg/active_bans.json",
];

const LARGE_BAN_FILE_BYTES = 65536;

function parseMeta(raw: string): { total?: number; truncated?: boolean; source: string } {
  const sourceM = raw.match(/"source"\s*:\s*"([^"]+)"/);
  const totalM = raw.match(/"total_count"\s*:\s*(\d+)/);
  const truncatedM = raw.match(/"truncated"\s*:\s*(true|false)/);
  return {
    total: totalM ? parseInt(totalM[1], 10) : undefined,
    truncated: truncatedM ? truncatedM[1] === "true" : undefined,
    source: sourceM?.[1] ?? "ipset",
  };
}

function clampLimit(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 50;
  return Math.min(Math.floor(n), 200);
}

function sliceBans(ips: string[], offset: number, limit: number): BanEntry[] {
  return ips.slice(offset, offset + limit).map((ip) => ({ ip }));
}

function packResult(
  ips: string[],
  total: number,
  source: string,
  opts: FetchBannedOpts,
): BannedIpsResult {
  const truncated = total > ips.length || (total > (opts.limit ?? ips.length) + (opts.offset ?? 0));
  if (opts.countOnly) {
    return { count: total, source, bans: [], truncated: total > 0 };
  }
  const offset = Math.max(0, opts.offset ?? 0);
  const limit = clampLimit(opts.limit ?? 50);
  const pageIps = ips.slice(offset, offset + limit);
  return {
    count: total,
    source,
    bans: pageIps.map((ip) => ({ ip })),
    truncated: total > offset + pageIps.length,
    limit,
    offset,
  };
}

async function readBanFile(path: string, opts: FetchBannedOpts): Promise<BannedIpsResult | null> {
  try {
    const st = await stat(path);
    const raw = await readFile(path, "utf8");
    const meta = parseMeta(raw);

    if (meta.total != null && (opts.countOnly || st.size > LARGE_BAN_FILE_BYTES)) {
      if (opts.countOnly) {
        return {
          count: meta.total,
          source: meta.source,
          bans: [],
          truncated: meta.truncated ?? meta.total > (opts.limit ?? 50),
        };
      }
      const data = JSON.parse(raw) as BannedIpsFile;
      const ips = data.ips || [];
      return packResult(ips, meta.total, meta.source, opts);
    }

    const data = JSON.parse(raw) as BannedIpsFile;
    if (!data?.ips?.length && data?.total_count == null) return null;
    const ips = data.ips || [];
    const total = data.total_count ?? ips.length;
    const source = data.source || "ipset";
    return packResult(ips, total, source, opts);
  } catch {
    return null;
  }
}

export async function fetchBannedIps(opts: FetchBannedOpts = {}): Promise<BannedIpsResult> {
  const apiBase = (
    process.env.GUARDIAN_BAN_URL ||
    process.env.GUARDIAN_API_URL ||
    ""
  ).replace(/\/$/, "");

  const dataDir = process.env.BENCH_DATA_DIR || "/data/lg";
  const filePaths = [`${dataDir}/active_bans.json`, ...BAN_FILE_PATHS];

  if (apiBase) {
    try {
      const q = new URLSearchParams();
      if (opts.countOnly) q.set("count_only", "1");
      if (opts.limit != null) q.set("limit", String(opts.limit));
      if (opts.offset != null) q.set("offset", String(opts.offset));
      const qs = q.toString();
      const res = await fetch(`${apiBase}/api/v1/bans${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = (await res.json()) as BannedIpsFile & {
          count?: number;
          bans?: BanEntry[];
        };
        if (Array.isArray(data.bans)) {
          return {
            count: data.count ?? data.total_count ?? data.bans.length,
            source: data.source || "ipset",
            bans: data.bans,
            truncated: data.truncated,
            limit: opts.limit,
            offset: opts.offset,
          };
        }
        const ips = data.ips || [];
        const total = data.total_count ?? data.count ?? ips.length;
        return packResult(ips, total, data.source || "ipset", opts);
      }
    } catch {
      /* fallback files */
    }
  }

  for (const p of filePaths) {
    const result = await readBanFile(p, opts);
    if (result) return result;
  }

  return { count: 0, source: "empty", bans: [] };
}
