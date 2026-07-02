import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { fetchBannedIps } from "@/lib/fetchBannedIps";
import { lookupManyIps } from "@/lib/ipGeoLookup";
import { guardianApiAuthHeaders } from "@/lib/guardianApiAuth";
import { guardianApiBase } from "@/lib/guardianApiBase";
import { fetchFallbackAttackIps } from "@/lib/attackGeoFallback";

export const dynamic = "force-dynamic";

const GUARDIAN_API = guardianApiBase();
const BENCH_DATA_DIR = process.env.BENCH_DATA_DIR || "/data/lg";
const GEO_LIMIT = 64;
const DEFENDER_LAT = Number(process.env.ATTACK_MAP_DEFENDER_LAT ?? "41.0082");
const DEFENDER_LNG = Number(process.env.ATTACK_MAP_DEFENDER_LNG ?? "28.9784");

type IncidentRow = { ip?: string; incident_id?: string; risk_score?: number };

type StatusAck = { ack_key?: string; operator?: string };

function isPublicIp(ip?: string): boolean {
  return Boolean(ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip));
}

async function readTelegramAckIps(): Promise<StatusAck[]> {
  const candidates = [
    path.join(BENCH_DATA_DIR, "guardian-status.json"),
    path.join(process.cwd(), "guardian-status.json"),
    path.join(process.cwd(), "..", "guardian-status.json"),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      const data = JSON.parse(raw) as { recent_telegram_acks?: StatusAck[] };
      return (data.recent_telegram_acks ?? []).filter((a) => isPublicIp(a.ack_key));
    } catch {
      /* next */
    }
  }
  return [];
}

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
  const [bans, incidents, acks] = await Promise.all([
    fetchBannedIps({ limit: 40, offset: 0 }),
    fetchIncidents(),
    readTelegramAckIps(),
  ]);

  const meta = new Map<
    string,
    { reason?: string; kind: "ban" | "incident" | "ack"; risk?: number; operator?: string }
  >();

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
  for (const ack of acks) {
    const ip = ack.ack_key!;
    if (meta.has(ip)) continue;
    const op = ack.operator?.trim() || "operator";
    meta.set(ip, {
      kind: "ack",
      reason: `Gördüm · ${op}`,
      operator: op,
    });
  }

  let dataSource: "live" | "report" = "live";
  if (meta.size === 0) {
    const fallback = await fetchFallbackAttackIps(BENCH_DATA_DIR);
    for (const f of fallback) {
      meta.set(f.ip, { reason: f.reason, kind: f.kind });
    }
    if (fallback.length > 0) dataSource = "report";
  }

  const ips = [...meta.keys()];
  const geoEnabled = process.env.ATTACK_GEO_LOOKUP !== "0";
  const geos = geoEnabled ? await lookupManyIps(ips, GEO_LIMIT) : [];

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
      operator: m?.operator,
    };
  });

  return NextResponse.json({
    count: markers.length,
    total_ips: ips.length,
    geo_lookup: geoEnabled,
    bans_source: bans.source,
    data_source: dataSource,
    defender: { lat: DEFENDER_LAT, lng: DEFENDER_LNG },
    markers,
  });
}
