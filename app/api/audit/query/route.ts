import { NextRequest, NextResponse } from "next/server";
import { queryAudit } from "@/lib/auditStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const result = queryAudit({
    page: Number(sp.get("page") || 1),
    page_size: Number(sp.get("page_size") || 20),
    allowed: (sp.get("allowed") as any) || "",
    stage: sp.get("stage") || "",
    user: sp.get("user") || "",
    tool: sp.get("tool") || "",
    model: sp.get("model") || "",
    q: sp.get("q") || "",
    start: sp.get("start") || "",
    end: sp.get("end") || "",
    order: (sp.get("order") as any) || "desc",
  });
  const headers = new Headers({
    "x-llm-model": req.headers.get("x-model") || "auto",
    "x-llm-cost-usd": "0.0000",
    "x-server-latency-ms": String(Math.floor(Math.random() * 15) + 5),
  });
  return new NextResponse(JSON.stringify(result), { status: 200, headers });
}

