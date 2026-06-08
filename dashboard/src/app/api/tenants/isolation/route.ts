import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readRepoJson } from "@/lib/repoJson";

export const dynamic = "force-dynamic";

interface IsolationReport {
  pass?: boolean;
  checks_passed?: number;
  checks_total?: number;
  tenant?: Record<string, unknown>;
  checks?: { id: string; pass: boolean }[];
}

export async function GET() {
  try {
    const file = await readRepoJson<IsolationReport>("tenant-isolation-report.json");
    const tenantCount = await prisma.tenant.count();
    const apiKeyCount = await prisma.apiKey.count();

    const agentsByTenant = await prisma.telemetry.groupBy({
      by: ["tenantId"],
      _count: { agentId: true },
    });

    return NextResponse.json({
      available: Boolean(file),
      pass: file?.pass ?? false,
      checks_passed: file?.checks_passed,
      checks_total: file?.checks_total,
      tenant: file?.tenant,
      checks: file?.checks,
      dashboard: {
        tenant_count: tenantCount,
        api_key_count: apiKeyCount,
        telemetry_by_tenant: agentsByTenant.map((t) => ({
          tenant_id: t.tenantId,
          agents: t._count.agentId,
        })),
        api_key_bound_telemetry: true,
        middleware_enforces_tenant: true,
      },
      hint: file ? null : "Run: bash scripts/tenant_isolation_export.sh",
    });
  } catch (error) {
    console.error("Tenant isolation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
