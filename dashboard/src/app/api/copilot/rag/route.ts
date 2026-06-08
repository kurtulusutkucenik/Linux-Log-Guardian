import { NextResponse } from "next/server";
import { loadCopilotRagContext } from "@/lib/copilotRag";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await loadCopilotRagContext();
    if (!ctx) {
      return NextResponse.json({
        available: false,
        hint: "bash scripts/copilot_rag_test.sh",
      });
    }
    return NextResponse.json({
      available: true,
      generated_at: ctx.generated_at,
      stats: ctx.stats,
      evidence_lines: ctx.evidence_lines ?? [],
      alerts: ctx.alerts ?? [],
      attack_trees: ctx.attack_trees ?? [],
    });
  } catch (error) {
    console.error("Copilot RAG API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
