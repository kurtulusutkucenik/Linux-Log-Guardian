import { NextRequest, NextResponse } from "next/server";
import {
  loadMarketplaceManifest,
  requireSigEnforced,
  verifyPackageSignature,
} from "@/lib/marketplaceSigned";

export const dynamic = "force-dynamic";

/** Enterprise tier — imzali marketplace katalog + dogrulama (E3). */
export async function GET() {
  const manifest = await loadMarketplaceManifest();
  if (!manifest?.packages?.length) {
    return NextResponse.json(
      { error: "marketplace manifest not found", hint: "bash scripts/sync_dashboard_data.sh" },
      { status: 503 },
    );
  }
  const signed = manifest.packages.filter((p) => p.signed).length;
  return NextResponse.json({
    marketplace: manifest.marketplace ?? "log-guardian-rules",
    require_sig: requireSigEnforced(),
    packages: manifest.packages,
    packages_signed: signed,
    packages_total: manifest.packages.length,
  });
}

export async function POST(request: NextRequest) {
  let body: { package_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const packageId = body.package_id?.trim();
  if (!packageId) {
    return NextResponse.json({ error: "package_id required" }, { status: 400 });
  }

  const manifest = await loadMarketplaceManifest();
  const pkg = manifest?.packages?.find((p) => p.id === packageId);
  if (!pkg) {
    return NextResponse.json({ error: "package not found", package_id: packageId }, { status: 404 });
  }
  if (requireSigEnforced() && !verifyPackageSignature(pkg)) {
    return NextResponse.json(
      { error: "signature invalid or missing", package_id: packageId },
      { status: 403 },
    );
  }

  return NextResponse.json({
    ok: true,
    package_id: packageId,
    name: pkg.name,
    version: pkg.version,
    sha256: pkg.sha256,
    verified: true,
    hint: "Host kurulum: MARKETPLACE_REQUIRE_SIG=1 python3 scripts/marketplace_install.py " + packageId,
  });
}
