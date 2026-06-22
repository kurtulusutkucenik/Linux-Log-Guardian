import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import path from "path";
import { getJwtSecret } from "@/lib/authSecrets";

export const dynamic = "force-dynamic";

/** Herkese acik kanit dosyalari (/competitive-proof sayfasi) */
const PUBLIC_FILES = new Set(["competitive-proof.pdf", "competitive-proof.json"]);

const ALLOWED: Record<string, string> = {
  "competitive-proof.pdf": "application/pdf",
  "competitive-proof.json": "application/json",
  "soak-report.json": "application/json",
  "MANIFEST.json": "application/json",
};

async function dataRoomAuthOk(): Promise<boolean> {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

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

  const contentType = ALLOWED[file];
  if (!contentType) {
    return NextResponse.json({ error: "not allowed" }, { status: 404 });
  }

  if (!PUBLIC_FILES.has(file) && !(await dataRoomAuthOk())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
