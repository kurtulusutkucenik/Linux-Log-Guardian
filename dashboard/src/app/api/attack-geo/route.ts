import { NextResponse } from "next/server";
import { fetchBannedIps } from "@/lib/fetchBannedIps";
import { lookupManyIps } from "@/lib/ipGeoLookup";
import { guardianApiAuthHeaders } from "@/lib/guardianApiAuth";

export const dynamic = "force-dynamic";

const GUARDIAN_API = process.env.GUARDIAN_API_URL || "http://127.0.0.1:8080";

type IncidentRow = { ip?: string; incident_id?: string; risk_score?: number };

async function fetchIncidents(): Promise<IncidentRow[]> {
  try {
    const res = await fetch(`${GUARDIAN_API}/api/v1/incidents`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
      headers: guardianApiAuthHeaders(),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { incidents?: IncidentRow[] };
    return data.incidents ?? [];
  } catch {
    return [];
  }
}

export async function GET() {
  const [bans, incidents] = await Promise.all([
    fetchBannedIps({ limit: 40, offset: 0 }),
    fetchIncidents(),
  ]);

  const meta = new Map<string, { reason?: string; kind: "ban" | "incident"; risk?: number }>();

  for (const b of bans.bans) {
    if (!b.ip) continue;
    meta.set(b.ip, { reason: b.reason, kind: "ban" });
  }
  for (const inc of incidents) {
    if (!inc.ip) continue;
    const prev = meta.get(inc.ip);
    meta.set(inc.ip, {
      reason: prev?.reason ?? inc.incident_id,
      kind: "incident",
      risk: inc.risk_score,
    });
  }

  const ips = [...meta.keys()];
  const geoEnabled = process.env.ATTACK_GEO_LOOKUP !== "0";
  const geos = geoEnabled ? await lookupManyIps(ips, 24) : [];

  const markers = geos.map((g) => {
    const m = meta.get(g.ip);
    return {
      ip: g.ip,
      lat: g.lat,
      lon: g.lon,
      countryCode: g.countryCode,
      country: g.country,
      kind: m?.kind ?? "ban",
      reason: m?.reason,
      risk: m?.risk,
      source: g.source,
    };
  });

  return NextResponse.json({
    count: markers.length,
    total_ips: ips.length,
    geo_lookup: geoEnabled,
    bans_source: bans.source,
    markers,
  });
}
