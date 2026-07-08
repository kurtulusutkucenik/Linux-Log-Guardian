import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Prometheus scrape — fleet agent online/offline (auth yok; yalnız aggregate + agent_id label)
 *  Online eşiği 15 dk (Grafana alert / P2 #22) — UI badge 15s ayrı kalır.
 */
export async function GET() {
  const now = Date.now();
  const ONLINE_MS = 15 * 60 * 1000;

  try {
    const agents = await prisma.telemetry.findMany({
      select: {
        agentId: true,
        tenantId: true,
        lastSeen: true,
      },
    });

    const byTenant = new Map<string, { online: number; total: number }>();
    const ageLines: string[] = [];

    for (const a of agents) {
      const tid = a.tenantId || "default";
      const ageSec = Math.max(0, (now - new Date(a.lastSeen).getTime()) / 1000);
      const online = ageSec * 1000 < ONLINE_MS;
      const cur = byTenant.get(tid) || { online: 0, total: 0 };
      cur.total += 1;
      if (online) cur.online += 1;
      byTenant.set(tid, cur);
      const aid = String(a.agentId).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const tesc = tid.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      ageLines.push(
        `loganalyzer_fleet_agent_last_seen_age_seconds{tenant_id="${tesc}",agent_id="${aid}"} ${ageSec.toFixed(1)}`,
      );
    }

    const lines: string[] = [
      "# HELP loganalyzer_fleet_agent_online Agents with last_seen < 15m (Grafana fleet heartbeat)",
      "# TYPE loganalyzer_fleet_agent_online gauge",
      "# HELP loganalyzer_fleet_agent_total Telemetry agents in dashboard DB",
      "# TYPE loganalyzer_fleet_agent_total gauge",
      "# HELP loganalyzer_fleet_agent_last_seen_age_seconds Seconds since last telemetry heartbeat",
      "# TYPE loganalyzer_fleet_agent_last_seen_age_seconds gauge",
    ];

    if (byTenant.size === 0) {
      lines.push('loganalyzer_fleet_agent_online{tenant_id="default"} 0');
      lines.push('loganalyzer_fleet_agent_total{tenant_id="default"} 0');
    } else {
      for (const [tid, v] of byTenant) {
        const tesc = tid.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        lines.push(`loganalyzer_fleet_agent_online{tenant_id="${tesc}"} ${v.online}`);
        lines.push(`loganalyzer_fleet_agent_total{tenant_id="${tesc}"} ${v.total}`);
      }
    }
    lines.push(...ageLines);
    lines.push("");

    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("fleet metrics error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
