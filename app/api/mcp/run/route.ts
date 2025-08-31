import { NextRequest, NextResponse } from "next/server";
import { recordAudit, latest } from "@/lib/auditStore";
import { insertDiarySafe } from "@/app/api/_lib/pg";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const t0 = Date.now();
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
    const latency_ms = Math.max(1, Date.now() - t0);
    const sandbox = { output: `stub ${stage}: ${command}` , latency_ms };
    const analysis = { cost_usd: 0.0 };
    const entry = recordAudit({ user, command, stage, allowed, reason, sandbox, analysis });
    // Best-effort memory writeback for approve/execute success
    try {
      if (allowed && (stage === "approve" || stage === "execute")) {
        await insertDiarySafe({ role: 'system', text: `MCP ${stage}: ${command}`, ts: Date.now(), messageId: `mcp:${entry.id}` });
      }
    } catch {}
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

