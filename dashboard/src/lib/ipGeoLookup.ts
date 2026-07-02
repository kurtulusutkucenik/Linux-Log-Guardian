import { centroidForCountry } from "./countryCentroids";
import { IPV4_RE } from "./banUtils";

export type IpGeo = {
  ip: string;
  countryCode: string;
  country: string;
  lat: number;
  lon: number;
  source: "lookup" | "centroid" | "private";
};

/** RFC5737 test IPs — demo icin kuresel saldiri kaynaklari (hedefe yay gosterimi). */
const RFC5737_ATTACK_REGIONS = [
  { cc: "US", country: "United States", lat: 40.7128, lon: -74.006 },
  { cc: "US", country: "US West", lat: 37.7749, lon: -122.4194 },
  { cc: "CA", country: "Canada", lat: 43.6532, lon: -79.3832 },
  { cc: "GB", country: "United Kingdom", lat: 51.5074, lon: -0.1278 },
  { cc: "DE", country: "Germany", lat: 52.52, lon: 13.405 },
  { cc: "FR", country: "France", lat: 48.8566, lon: 2.3522 },
  { cc: "NL", country: "Netherlands", lat: 52.3676, lon: 4.9041 },
  { cc: "RU", country: "Russia", lat: 55.7558, lon: 37.6173 },
  { cc: "CN", country: "China", lat: 39.9042, lon: 116.4074 },
  { cc: "IN", country: "India", lat: 28.6139, lon: 77.209 },
  { cc: "BR", country: "Brazil", lat: -23.5505, lon: -46.6333 },
  { cc: "SG", country: "Singapore", lat: 1.3521, lon: 103.8198 },
  { cc: "AU", country: "Australia", lat: -33.8688, lon: 151.2093 },
  { cc: "JP", country: "Japan", lat: 35.6762, lon: 139.6503 },
  { cc: "KR", country: "South Korea", lat: 37.5665, lon: 126.978 },
  { cc: "IR", country: "Iran", lat: 35.6892, lon: 51.389 },
  { cc: "UA", country: "Ukraine", lat: 50.4501, lon: 30.5234 },
  { cc: "ZA", country: "South Africa", lat: -26.2041, lon: 28.0473 },
  { cc: "MX", country: "Mexico", lat: 19.4326, lon: -99.1332 },
  { cc: "PL", country: "Poland", lat: 52.2297, lon: 21.0122 },
] as const;

function rfc5737SpreadGeo(ip: string): { lat: number; lon: number; country: string; cc: string } {
  const octets = ip.split(".").map((x) => parseInt(x, 10));
  const o3 = Number.isFinite(octets[2]) ? octets[2]! : 0;
  const o4 = Number.isFinite(octets[3]) ? octets[3]! : 0;
  const idx = (o3 * 7 + o4) % RFC5737_ATTACK_REGIONS.length;
  const base = RFC5737_ATTACK_REGIONS[idx]!;
  const jitterLat = ((o4 % 9) - 4) * 0.38;
  const jitterLon = ((o3 % 11) - 5) * 0.42;
  return {
    lat: base.lat + jitterLat,
    lon: base.lon + jitterLon,
    country: `Demo · ${base.country}`,
    cc: base.cc,
  };
}

function isRfc5737TestIp(ip: string): boolean {
  return (
    ip.startsWith("203.0.113.") ||
    ip.startsWith("198.51.100.") ||
    ip.startsWith("192.0.2.")
  );
}

const cache = new Map<string, IpGeo | null>();
const MAX_CACHE = 512;

function isPrivateIpv4(ip: string): boolean {
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const a = +m[1];
  const b = +m[2];
  const c = +m[3];
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  /* RFC 5737 documentation / test nets (webhook E2E, bench) */
  if (a === 192 && b === 0 && c === 2) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  return false;
}

function trimCache() {
  if (cache.size <= MAX_CACHE) return;
  const drop = cache.size - MAX_CACHE;
  const keys = [...cache.keys()].slice(0, drop);
  for (const k of keys) cache.delete(k);
}

async function fetchIpApi(ip: string): Promise<IpGeo | null> {
  if (!IPV4_RE.test(ip)) return null;
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
  if (!key || key.length > 45) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  let result: IpGeo | null = null;
  if (isRfc5737TestIp(key)) {
    const spread = rfc5737SpreadGeo(key);
    result = {
      ip: key,
      countryCode: spread.cc,
      country: spread.country,
      lat: spread.lat,
      lon: spread.lon,
      source: "private",
    };
  } else if (isPrivateIpv4(key) || key.startsWith("::") || key === "::1") {
    const doc = { lat: 39.0, lon: 35.0, label: "Private" };
    const octets = key.split(".").map((x) => parseInt(x, 10));
    const last = Number.isFinite(octets[3]) ? octets[3]! : 0;
    const hash = octets.reduce((a, p) => (a * 31 + p) | 0, 0);
    const angle = ((hash * 137.508) % 360) * (Math.PI / 180);
    const radius = 0.18 + (last % 16) * 0.11;
    result = {
      ip: key,
      countryCode: "PRV",
      country: doc.label,
      lat: doc.lat + radius * Math.cos(angle),
      lon: doc.lon + radius * Math.sin(angle),
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

export async function lookupManyIps(ips: string[], limit = 48): Promise<IpGeo[]> {
  const uniq = [...new Set(ips.map((x) => x.trim()).filter(Boolean))].slice(0, limit);
  const out: IpGeo[] = [];
  for (const ip of uniq) {
    const geo = await lookupIpGeo(ip);
    if (geo) out.push(geo);
    await new Promise((r) => setTimeout(r, 30));
  }
  return out;
}
