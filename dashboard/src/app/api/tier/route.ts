import { NextResponse } from "next/server";
import { tierStatus } from "@/lib/tier";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(tierStatus());
}
