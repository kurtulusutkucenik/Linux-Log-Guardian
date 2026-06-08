import type { NextRequest } from "next/server";

/** Non-admin kullanicilar icin Prisma where filtresi. */
export function tenantWhere(request: NextRequest | Request) {
  const userRole = request.headers.get("x-user-role");
  const userTenant = request.headers.get("x-user-tenant");
  const isAdmin = userRole === "admin";
  return isAdmin ? {} : { tenantId: userTenant as string };
}

export function requireTenantId(request: NextRequest | Request): string | null {
  const userRole = request.headers.get("x-user-role");
  const userTenant = request.headers.get("x-user-tenant");
  if (userRole === "admin") return null;
  return userTenant;
}

/** Admin haric baska tenant'a erisim denemesi. */
export function tenantAccessDenied(
  request: NextRequest | Request,
  targetTenantId: string,
): boolean {
  const userRole = request.headers.get("x-user-role");
  if (userRole === "admin") return false;
  const userTenant = request.headers.get("x-user-tenant");
  return Boolean(userTenant && targetTenantId && userTenant !== targetTenantId);
}
