import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED: Record<string, string> = {
  "competitive-proof.pdf": "application/pdf",
  "competitive-proof.json": "application/json",
  "soak-report.json": "application/json",
  "MANIFEST.json": "application/json",
};

async function resolveFile(name: string): Promise<string | null> {
  const dir = process.env.BENCH_DATA_DIR;
  const candidates = [
    ...(dir ? [path.join(dir, name)] : []),
    path.join("/data/lg", name),
    path.join(process.cwd(), "data-room", name),
    path.join(process.cwd(), name),
    path.join(process.cwd(), "..", name),
    path.join(process.cwd(), "..", "data-room", name),
  ];
  for (const p of candidates) {
    try {
      await readFile(p);
      return p;
    } catch {
      /* next */
    }
  }
  return null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ file: string }> },
) {
  const { file } = await ctx.params;

  if (file === "competitive-proof.pdf") {
    const accept = req.headers.get("accept") || "";
    const wantsHtml =
      accept.includes("text/html") &&
      !accept.includes("application/pdf") &&
      req.nextUrl.searchParams.get("raw") !== "1";
    if (wantsHtml) {
      return NextResponse.redirect(new URL("/competitive-proof", req.nextUrl));
    }
  }

  const contentType = ALLOWED[file];
  if (!contentType) {
    return NextResponse.json({ error: "not allowed" }, { status: 404 });
  }

  const filePath = await resolveFile(file);
  if (!filePath) {
    return NextResponse.json(
      { error: "file not found", hint: "bash scripts/competitive_proof.sh" },
      { status: 404 },
    );
  }

  const body = await readFile(filePath);
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (file.endsWith(".pdf")) {
    headers["Content-Disposition"] = `inline; filename="${file}"`;
  }
  return new NextResponse(body, { headers });
}
