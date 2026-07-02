import { fetchFallbackAttackIps } from "./attackGeoFallback";
import type { BanEntry, BannedIpsResult, FetchBannedOpts } from "./fetchBannedIps";

function clampLimit(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 50;
  return Math.min(Math.floor(n), 200);
}

function packBanEntries(
  entries: BanEntry[],
  source: string,
  opts: FetchBannedOpts,
  extra: Partial<BannedIpsResult> = {},
): BannedIpsResult {
  const q = opts.search?.trim().toLowerCase();
  const filtered = q
    ? entries.filter((b) => b.ip.toLowerCase().includes(q))
    : entries;
  const total = filtered.length;

  if (opts.countOnly) {
    return {
      count: total,
      source,
      bans: [],
      data_mode: extra.data_mode,
      preview: extra.preview,
    };
  }

  const offset = Math.max(0, opts.offset ?? 0);
  const limit = clampLimit(opts.limit ?? 50);
  const page = filtered.slice(offset, offset + limit);

  return {
    count: total,
    source,
    bans: page,
    truncated: total > offset + page.length,
    limit,
    offset,
    data_mode: extra.data_mode,
    preview: extra.preview,
  };
}

/** Canli ipset bosken kanit raporlarindan ban listesi (harita ile ayni kaynak). */
export async function fetchProofBansResult(
  dataDir: string,
  opts: FetchBannedOpts,
): Promise<BannedIpsResult | null> {
  const all = await fetchFallbackAttackIps(dataDir);
  const entries: BanEntry[] = all
    .filter((m) => m.kind === "ban")
    .map((m) => ({
      ip: m.ip,
      reason: m.reason ? `proof · ${m.reason}` : "proof report",
    }));

  if (!entries.length) return null;

  return packBanEntries(entries, "proof-reports", opts, {
    data_mode: "preview",
    preview: true,
  });
}

/** Live demo — yalnizca dashboard_live_demo IP'leri (threat-intel ipset gürültüsü yok). */
export function fetchLiveDemoBansResult(
  ips: string[],
  opts: FetchBannedOpts,
): BannedIpsResult {
  const entries: BanEntry[] = ips.map((ip) => ({
    ip,
    reason: "dashboard-live-demo",
  }));
  return packBanEntries(entries, "live-demo", opts, { data_mode: "live" });
}
