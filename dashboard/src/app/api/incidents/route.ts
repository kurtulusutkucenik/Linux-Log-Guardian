import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { guardianApiAuthHeaders } from "@/lib/guardianApiAuth";
import { guardianApiBase } from "@/lib/guardianApiBase";

export const dynamic = "force-dynamic";

const GUARDIAN_API = guardianApiBase();

async function readSnapshot(): Promise<{
  incident_id: string;
  ip: string;
  active?: number;
} | null> {
  const candidates = [
    path.join(process.cwd(), "incidents-snapshot.json"),
    path.join(process.cwd(), "..", "incidents-snapshot.json"),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      const line = raw.trim().split("\n").pop() ?? raw;
      return JSON.parse(line);
    } catch {
      /* next */
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const url = id
    ? `${GUARDIAN_API}/api/v1/incidents?id=${encodeURIComponent(id)}`
    : `${GUARDIAN_API}/api/v1/incidents`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
      headers: guardianApiAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (id && data.incident_id) {
        return NextResponse.json({ incident: data, source: "guardian_api" });
      }
      if (data.count > 0 || (data.incidents && data.incidents.length > 0)) {
        return NextResponse.json({ ...data, source: "guardian_api" });
      }
    }
  } catch {
    /* fallback */
  }

  const snap = await readSnapshot();
  if (snap) {
    const risk = 72;
    return NextResponse.json({
      incidents: [
        {
          incident_id: snap.incident_id,
          ip: snap.ip,
          risk_score: risk,
          suggested_action: risk >= 85 ? "BAN_IP" : "MONITOR",
          primary_signal: "log_sqli+ebpf_execve",
          log_hits: 1,
        },
      ],
      count: 1,
      source: "snapshot",
    });
  }

  if (id) {
    return NextResponse.json({ error: "incident not found" }, { status: 404 });
  }

  return NextResponse.json({
    incidents: [],
    count: 0,
    source: "empty",
    hint: "Run bash scripts/competitive_suite.sh or ./log-guardian incident-sim",
  });
}
