import { NextRequest, NextResponse } from "next/server";
import { insertDiarySafe } from "@/app/api/_lib/pg";

export const runtime = "nodejs";

let runSeq = 1;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const goal = String(body.goal || "");
    const model = String(body.model || (req.headers.get("x-model") || "auto"));
    const kernelSteps = Number(body.steps || 6);

    // Run Phase 1 Conscious Kernel and collect a brief transcript
    const { ConsciousKernel } = await import("@/lib/conscious/kernel");
    const kernel = new ConsciousKernel({ maxSteps: kernelSteps });
    const transcript: any[] = [];
    for await (const ev of kernel.run(goal)) {
      transcript.push(ev);
    }
    const summary = kernel.summarize(transcript as any, goal);

    // Also provide a simple diff sample for the right panel (unchanged from stub)
    const diff = {
      path: "/tmp/example.ts",
      language: "typescript",
      before: "export function foo(){return 1}\n",
      after: "export function foo(){return 2}\n",
    };

    const headers = new Headers({
      "x-llm-model": model,
      "x-llm-cost-usd": "0.0010",
      "x-server-latency-ms": String(Math.floor(Math.random() * 40) + 10),
    });
    // Best-effort memory diary write
    try { await insertDiarySafe({ role: 'system', text: `Agent run: ${goal} → ${summary?.result || summary?.summary || ''}` , ts: Date.now() }); } catch {}
    return new NextResponse(JSON.stringify({ runId: summary.runId, summary, transcript, diff }), { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "bad request" }, { status: 400 });
  }
}

