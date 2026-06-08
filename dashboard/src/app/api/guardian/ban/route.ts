import { NextResponse } from "next/server";
import { executeGuardianBan, IPV4_RE } from "@/lib/guardianBanExec";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userRole = request.headers.get("x-user-role") || "";
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const ip = String(body.ip || "").trim();
    const reason = String(body.reason || "dashboard-ban");
    const action = body.action === "unban" ? "unban" : "ban";

    if (!IPV4_RE.test(ip)) {
      return NextResponse.json({ error: "Invalid IPv4" }, { status: 400 });
    }

    const result = await executeGuardianBan({ ip, action, reason });
    if (!result.ok) {
      return NextResponse.json({ error: result.message, ...result }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Guardian ban error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
