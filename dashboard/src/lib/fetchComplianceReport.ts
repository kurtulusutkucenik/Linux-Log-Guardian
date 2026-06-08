import { prisma } from "@/lib/db";
import { loadComplianceReport } from "@/lib/complianceReport";

/** Rapor sayfasi ve export API icin ortak veri kaynagi (Docker'da Python gerekmez). */
export async function fetchComplianceReportForRequest(request: Request) {
  const userRole = request.headers.get("x-user-role");
  const userTenant = request.headers.get("x-user-tenant");
  const isAdmin = userRole === "admin";
  const whereClause = isAdmin ? {} : { tenantId: userTenant as string };

  let agents: Awaited<ReturnType<typeof prisma.telemetry.findMany>> = [];
  try {
    agents = await prisma.telemetry.findMany({ where: whereClause });
  } catch (err) {
    console.warn("Compliance report: telemetry DB unavailable, file-only fallback", err);
  }

  return loadComplianceReport(agents);
}
