import { centroidForCountry } from "./countryCentroids";

export type IpGeo = {
  ip: string;
  countryCode: string;
  country: string;
  lat: number;
  lon: number;
  source: "lookup" | "centroid" | "private";
};

const cache = new Map<string, IpGeo | null>();
const MAX_CACHE = 512;

function isPrivateIpv4(ip: string): boolean {
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const a = +m[1];
  const b = +m[2];
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function trimCache() {
  if (cache.size <= MAX_CACHE) return;
  const drop = cache.size - MAX_CACHE;
  const keys = [...cache.keys()].slice(0, drop);
  for (const k of keys) cache.delete(k);
}

async function fetchIpApi(ip: string): Promise<IpGeo | null> {
  const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,lat,lon`;
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(2500),
    headers: { "User-Agent": "Log-Guardian-Dashboard/1.0" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status?: string;
    country?: string;
    countryCode?: string;
    lat?: number;
    lon?: number;
  };
  if (data.status !== "success" || !data.countryCode) return null;
  const cc = data.countryCode.toUpperCase();
  const lat = typeof data.lat === "number" ? data.lat : centroidForCountry(cc)?.[1];
  const lon = typeof data.lon === "number" ? data.lon : centroidForCountry(cc)?.[0];
  if (lat == null || lon == null) return null;
  return {
    ip,
    countryCode: cc,
    country: data.country || cc,
    lat,
    lon,
    source: typeof data.lat === "number" ? "lookup" : "centroid",
  };
}

export async function lookupIpGeo(ip: string): Promise<IpGeo | null> {
  const key = ip.trim();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  let result: IpGeo | null = null;
  if (isPrivateIpv4(key) || key.startsWith("::") || key === "::1") {
    result = {
      ip: key,
      countryCode: "LAN",
      country: "Private",
      lat: 39.0,
      lon: 35.0,
      source: "private",
    };
  } else {
    try {
      result = await fetchIpApi(key);
    } catch {
      result = null;
    }
    if (!result) {
      const cc = process.env[`GEOIP_CC_${key.replace(/\./g, "_")}`];
      if (cc) {
        const c = centroidForCountry(cc);
        if (c) {
          result = {
            ip: key,
            countryCode: cc.toUpperCase(),
            country: cc.toUpperCase(),
            lat: c[1],
            lon: c[0],
            source: "centroid",
          };
        }
      }
    }
  }

  cache.set(key, result);
  trimCache();
  return result;
}

export async function lookupManyIps(ips: string[], limit = 24): Promise<IpGeo[]> {
  const uniq = [...new Set(ips.map((x) => x.trim()).filter(Boolean))].slice(0, limit);
  const out: IpGeo[] = [];
  for (const ip of uniq) {
    const geo = await lookupIpGeo(ip);
    if (geo) out.push(geo);
    await new Promise((r) => setTimeout(r, 30));
  }
  return out;
}
