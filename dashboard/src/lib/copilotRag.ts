import { readFile } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { readRepoJson, repoRoot } from "./repoJson";

const execFileAsync = promisify(execFile);

export type RagEvidenceLine = {
  type: string;
  detail: string;
  cite?: string;
};

export type CopilotRagContext = {
  generated_at?: string;
  evidence_lines?: string[];
  alerts?: {
    ts: number;
    ip: string;
    level: number;
    message: string;
    incident_id?: string;
    cite?: string;
  }[];
  bans?: { ts: number; ip: string; action: string; reason: string; cite?: string }[];
  attack_trees?: {
    pid: number;
    comm: string;
    risk: number;
    events?: { type: string; detail: string; comm?: string }[];
    cite?: string;
  }[];
  stats?: { alert_count: number; ban_count: number; tree_count: number; top_risk: number };
};

export async function loadCopilotRagContext(): Promise<CopilotRagContext | null> {
  const cached = await readRepoJson<CopilotRagContext>("copilot-rag-context.json");
  if (cached?.evidence_lines?.length) return cached;

  const root = repoRoot();
  const collect = path.join(root, "scripts", "copilot_rag_collect.py");
  const out = path.join(root, "copilot-rag-context.json");
  try {
    await execFileAsync("python3", [collect, "-o", out, "--root", root], {
      timeout: 15000,
      cwd: root,
    });
    const raw = await readFile(out, "utf8");
    return JSON.parse(raw) as CopilotRagContext;
  } catch {
    return cached;
  }
}

export function ragToEvidence(ctx: CopilotRagContext | null): RagEvidenceLine[] {
  if (!ctx) return [];
  const out: RagEvidenceLine[] = [];

  for (const line of ctx.evidence_lines ?? []) {
    out.push({ type: "rag_line", detail: line, cite: line });
  }
  for (const a of ctx.alerts ?? []) {
    out.push({
      type: "db_alert",
      detail: `[L${a.level}] ${a.ip}: ${a.message}`,
      cite: a.cite,
    });
  }
  for (const t of ctx.attack_trees ?? []) {
    const chain = (t.events ?? [])
      .map((e) => `${e.type}:${e.detail}`)
      .join(" → ");
    out.push({
      type: "attack_tree",
      detail: `pid=${t.pid} risk=${t.risk.toFixed(1)} ${t.comm} ${chain}`,
      cite: t.cite,
    });
  }
  return out.slice(0, 20);
}

export function ragPromptBlock(ctx: CopilotRagContext | null): string {
  if (!ctx) return "RAG: no events.db / attack tree context available.";
  const lines = ctx.evidence_lines ?? [];
  if (!lines.length) return "RAG: empty evidence (run copilot_rag_collect.py).";
  return (
    "RAG EVIDENCE (cite these rows only — do not invent):\n" +
    lines.map((l, i) => `${i + 1}. ${l}`).join("\n")
  );
}
