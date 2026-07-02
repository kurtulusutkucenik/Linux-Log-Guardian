/** SaaS tier — runtime feature gate (Community / Pro / Enterprise). */

export type SaasTier = "community" | "pro" | "enterprise";

const TIER_ORDER: Record<SaasTier, number> = {
  community: 0,
  pro: 1,
  enterprise: 2,
};

export function resolveSaasTier(): SaasTier {
  const raw = (process.env.LOG_GUARDIAN_TIER || "community").toLowerCase();
  if (raw === "pro" || raw === "enterprise") return raw;
  return "community";
}

export function tierAtLeast(required: SaasTier): boolean {
  return TIER_ORDER[resolveSaasTier()] >= TIER_ORDER[required];
}

export function tierStatus() {
  const tier = resolveSaasTier();
  return {
    tier,
    features: {
      fleet: tierAtLeast("pro"),
      compliance: tierAtLeast("pro"),
      multiTenant: tierAtLeast("pro"),
      wasmSignedMarketplace: tierAtLeast("enterprise"),
      ebpfMandatoryRunbook: tierAtLeast("enterprise"),
    },
    env: "LOG_GUARDIAN_TIER",
    hint:
      tier === "community"
        ? "Pro: LOG_GUARDIAN_TIER=pro — fleet + compliance"
        : tier === "pro"
          ? "Enterprise: LOG_GUARDIAN_TIER=enterprise — imzali Wasm marketplace"
          : "Enterprise tier aktif",
  };
}

/** Pro+ routes blocked for Community tier (/reports sayfasi demo icin acik; export Pro) */
export function isProRoute(pathname: string): boolean {
  if (pathname === "/fleet" || pathname.startsWith("/fleet/")) return true;
  if (pathname.startsWith("/api/fleet")) return true;
  if (pathname.startsWith("/api/tenants/isolation")) return true;
  if (pathname === "/api/reports/export" || pathname.startsWith("/api/reports/export/"))
    return true;
  return false;
}

/** Enterprise-only routes */
export function isEnterpriseRoute(pathname: string): boolean {
  return pathname.startsWith("/api/marketplace/signed");
}
