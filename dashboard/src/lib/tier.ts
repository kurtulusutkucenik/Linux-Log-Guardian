/** SaaS tier — runtime feature gate (Community / Pro / Pro Plus / Enterprise). */

export type SaasTier = "community" | "pro" | "pro_plus" | "enterprise";

const TIER_ORDER: Record<SaasTier, number> = {
  community: 0,
  pro: 1,
  pro_plus: 2,
  enterprise: 3,
};

/** LOG_GUARDIAN_TIER aliases: pro-plus, proplus → pro_plus */
export function normalizeSaasTier(raw: string): SaasTier {
  const s = raw.trim().toLowerCase().replace(/-/g, "_");
  if (s === "proplus") return "pro_plus";
  if (s === "community" || s === "pro" || s === "pro_plus" || s === "enterprise") {
    return s;
  }
  return "community";
}

export function resolveSaasTier(): SaasTier {
  return normalizeSaasTier(process.env.LOG_GUARDIAN_TIER || "community");
}

export function tierAtLeast(required: SaasTier): boolean {
  return TIER_ORDER[resolveSaasTier()] >= TIER_ORDER[required];
}

export function tierStatus() {
  const tier = resolveSaasTier();
  return {
    tier,
    displayName:
      tier === "pro_plus"
        ? "Pro Plus"
        : tier === "enterprise"
          ? "Enterprise"
          : tier === "pro"
            ? "Pro"
            : "Community",
    features: {
      fleet: tierAtLeast("pro"),
      compliance: tierAtLeast("pro"),
      multiTenant: tierAtLeast("pro"),
      k8sKindCluster: tierAtLeast("pro_plus"),
      helmChart: tierAtLeast("pro_plus"),
      k8sOperator: tierAtLeast("pro_plus"),
      wasmSignedMarketplace: tierAtLeast("enterprise"),
      ebpfMandatoryRunbook: tierAtLeast("enterprise"),
    },
    resources: {
      coreRamMb: 120,
      proStackRamMb: 730,
      proPlusStackRamMb: 1900,
      coreDiskMb: 4,
      proStackDiskGb: 5,
      proPlusStackDiskGb: 8,
    },
    env: "LOG_GUARDIAN_TIER",
    hint:
      tier === "community"
        ? "Pro: LOG_GUARDIAN_TIER=pro — fleet + compliance"
        : tier === "pro"
          ? "Pro Plus: LOG_GUARDIAN_TIER=pro_plus — K8s/Helm kaniti (bash scripts/pro_plus_stack.sh)"
          : tier === "pro_plus"
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
