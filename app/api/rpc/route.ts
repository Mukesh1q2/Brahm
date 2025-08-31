import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type RpcReq = { id: string | number; method: string; params?: any };

const methods: Record<string, (params: any) => Promise<any>> = {
  "ping": async () => ({ pong: true }),
  "tools.echo": async (params) => ({ echo: params }),
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RpcReq | RpcReq[];
    const list = Array.isArray(body) ? body : [body];
    const out = [] as any[];
    for (const call of list) {
      const fn = methods[call.method];
      if (!fn) {
        out.push({ id: call.id, error: { code: -32601, message: "Method not found" } });
        continue;
      }
      try {
        const result = await fn(call.params);
        out.push({ id: call.id, result });
      } catch (e: any) {
        out.push({ id: call.id, error: { code: -32000, message: e?.message || String(e) } });
      }
    }
    const headers = new Headers({
      "x-llm-model": req.headers.get("x-model") || "auto",
      "x-llm-cost-usd": "0.0001",
      "x-server-latency-ms": String(Math.floor(Math.random() * 6) + 2),
    });
    return new NextResponse(JSON.stringify(Array.isArray(body) ? out : out[0]), { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }
}

