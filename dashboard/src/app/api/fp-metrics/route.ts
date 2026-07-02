import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

async function readFpReport() {
  const candidates = [
    process.env.FP_REPORT_JSON,
    process.env.BENCH_DATA_DIR && path.join(process.env.BENCH_DATA_DIR, "fp-report.json"),
    path.join("/data/lg", "fp-report.json"),
    path.join(process.cwd(), "fp-report.json"),
    path.join(process.cwd(), "..", "fp-report.json"),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      return JSON.parse(raw);
    } catch {
      /* next */
    }
  }
  return null;
}

export async function GET() {
  const data = await readFpReport();
  if (!data) {
    return NextResponse.json({
      available: false,
      message: "Run: bash scripts/fp_report.sh",
    });
  }
  return NextResponse.json({ available: true, ...data });
}
