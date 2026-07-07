import { getProofMeta } from "@/lib/proofMeta";
import { TestsPageClient } from "./TestsPageClient";

export const dynamic = "force-dynamic";

export default async function TestsPage() {
  const proofMeta = await getProofMeta();
  const buildRev = process.env.NEXT_PUBLIC_DASHBOARD_BUILD_REV ?? null;
  return <TestsPageClient proofMeta={proofMeta} buildRev={buildRev} />;
}
