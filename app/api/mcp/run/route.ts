import { NextRequest, NextResponse } from "next/server";
import { recordAudit, latest } from "@/lib/auditStore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { command, stage, approval_token } = await req.json();
    const user = "demo";
    // Simple allow/deny logic: approve/execute require token "APPROVE"
    let allowed = true;
    let reason = "ok";
    if ((stage === "approve" || stage === "execute") && approval_token !== "APPROVE") {
      allowed = false;
      reason = "approval token invalid";
    }
    const sandbox = { output: `stub ${stage}: ${command}` };
    const entry = recordAudit({ user, command, stage, allowed, reason, sandbox });
    return NextResponse.json({
      id: entry.id,
      stage,
      allowed,
      reason,
      sandbox,
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "bad request" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") || 50);
  return NextResponse.json({ entries: latest(limit) });
}

