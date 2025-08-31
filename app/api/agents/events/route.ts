import { NextRequest, NextResponse } from "next/server";
import { pushRunStart, pushRunEnd, pushTrace, pushPatch } from "@/lib/agentEvents";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { goal, model } = await req.json();
    const runId = `api_${Math.random().toString(36).slice(2, 10)}`;
    // Emit events into the in-memory bus for UI (if running on client this won’t persist, but okay for demo)
    pushRunStart(runId, "planner");
    pushTrace(runId, `Planning for: ${goal}`, { goal, steps: ["analyze", "draft", "refine"], model });
    pushPatch(runId, "export const x=1\n", "export const x=2\n", "typescript");
    pushRunEnd(runId, true);
    return NextResponse.json({ ok: true, runId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, detail: e?.message || "bad request" }, { status: 400 });
  }
}

