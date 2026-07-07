import { readFile } from "fs/promises";
import path from "path";

export type ProofMeta = {
  expected: number;
  passed: number;
  testIds: string[];
};

async function readProofJson(filePath: string): Promise<ProofMeta | null> {
  try {
    const raw = JSON.parse(await readFile(filePath, "utf8")) as {
      validationTests?: { id?: string; status?: string }[];
    };
    const tests = raw.validationTests;
    if (!Array.isArray(tests) || tests.length === 0) return null;
    const testIds = tests.map((t) => String(t.id ?? "")).filter(Boolean);
    return {
      expected: tests.length,
      passed: tests.filter((t) => t.status === "pass").length,
      testIds,
    };
  } catch {
    return null;
  }
}

/** competitive-proof.json — SSR / tests sayfasi kanonik sayi (88 drift onleme) */
export async function getProofMeta(): Promise<ProofMeta | null> {
  const dir = process.env.BENCH_DATA_DIR;
  const candidates = [
    ...(dir ? [path.join(dir, "competitive-proof.json")] : []),
    path.join("/data/lg", "competitive-proof.json"),
    path.join(process.cwd(), "competitive-proof.json"),
    path.join(process.cwd(), "..", "competitive-proof.json"),
  ];
  for (const p of candidates) {
    const meta = await readProofJson(p);
    if (meta) return meta;
  }
  return null;
}
