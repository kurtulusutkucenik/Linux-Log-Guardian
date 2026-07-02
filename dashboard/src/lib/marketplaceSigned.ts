import { createHmac } from "crypto";
import { readFile } from "fs/promises";
import path from "path";

export type MarketplacePackage = {
  id: string;
  name?: string;
  version?: string;
  author?: string;
  description?: string;
  sha256?: string;
  signature?: string;
  signed?: boolean;
};

export type MarketplaceManifest = {
  version?: number;
  marketplace?: string;
  packages?: MarketplacePackage[];
};

function signKey(): string {
  return process.env.MARKETPLACE_SIGN_KEY || "log-guardian-marketplace-dev-key";
}

export function verifyPackageSignature(pkg: MarketplacePackage): boolean {
  const digest = pkg.sha256?.trim();
  const expected = pkg.signature?.trim();
  if (!digest || !expected) return false;
  const calc = createHmac("sha256", signKey()).update(digest).digest("hex");
  return calc === expected;
}

async function manifestCandidates(): Promise<string[]> {
  const dir = process.env.BENCH_DATA_DIR;
  return [
    ...(dir ? [path.join(dir, "marketplace-manifest.json")] : []),
    path.join("/data/lg", "marketplace-manifest.json"),
    path.join(process.cwd(), "..", "rules", "marketplace", "manifest.json"),
    path.join(process.cwd(), "rules", "marketplace", "manifest.json"),
  ];
}

export async function loadMarketplaceManifest(): Promise<MarketplaceManifest | null> {
  for (const p of await manifestCandidates()) {
    try {
      const raw = await readFile(p, "utf8");
      const data = JSON.parse(raw) as MarketplaceManifest;
      const packages = (data.packages ?? []).map((pkg) => ({
        ...pkg,
        signed: verifyPackageSignature(pkg),
      }));
      return { ...data, packages };
    } catch {
      /* next */
    }
  }
  return null;
}

export function requireSigEnforced(): boolean {
  return (process.env.MARKETPLACE_REQUIRE_SIG || "1") !== "0";
}
