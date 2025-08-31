import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ConsciousKernel } from "@/lib/conscious/kernel";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const goal = searchParams.get("goal") || "Explore consciousness";
  const maxSteps = Number(searchParams.get("steps") || 6);
  const seed = searchParams.get('seed') ? Number(searchParams.get('seed')) : undefined;
  const targetPhi = searchParams.get('targetPhi') ? Number(searchParams.get('targetPhi')) : undefined;
  const enableEthics = searchParams.get('enableEthics') ? searchParams.get('enableEthics') !== 'false' : undefined;
  const enableTools = searchParams.get('enableTools') ? searchParams.get('enableTools') !== 'false' : undefined;
  const enableSalience = searchParams.get('enableSalience') ? searchParams.get('enableSalience') !== 'false' : undefined;
  const enableCIPS = searchParams.get('enableCIPS') ? searchParams.get('enableCIPS') !== 'false' : undefined;
  const enableCIPSApplyEvolution = searchParams.get('enableCIPSApplyEvolution') ? searchParams.get('enableCIPSApplyEvolution') !== 'false' : undefined;
  const weightGwt = searchParams.get('weightGwt') ? Number(searchParams.get('weightGwt')) : undefined;
  const weightCausal = searchParams.get('weightCausal') ? Number(searchParams.get('weightCausal')) : undefined;
  const weightPp = searchParams.get('weightPp') ? Number(searchParams.get('weightPp')) : undefined;
  const moduleProfile = (searchParams.get('profile') as any) || undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const enhanced = searchParams.get('enhanced') ? searchParams.get('enhanced') !== 'false' : false;
      const kernel = enhanced
        ? new (await import('@/lib/conscious/kernel-enhanced')).EnhancedConsciousKernel({ maxSteps, seed, targetPhi, enableEthics, enableTools, enableSalience, enableCIPS, enableCIPSApplyEvolution, phiWeights: { gwt: weightGwt, causal: weightCausal, pp: weightPp }, moduleProfile })
        : new ConsciousKernel({ maxSteps, seed, targetPhi, enableEthics, enableTools, enableSalience, enableCIPS, enableCIPSApplyEvolution, phiWeights: { gwt: weightGwt, causal: weightCausal, pp: weightPp }, moduleProfile });
      let keepAlive: any;
      const send = (obj: any) => {
        controller.enqueue(enc.encode(`event: ev\n`));
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      const heartbeat = () => {
        try {
          controller.enqueue(enc.encode(`: ping\n\n`));
        } catch {}
      };
      try {
        // Start heartbeat every 15s to keep proxies from closing idle connections
        keepAlive = setInterval(heartbeat, 15000);
        if ((kernel as any).runEnhanced && enhanced) {
          for await (const ev of (kernel as any).runEnhanced(goal)) {
            send(ev);
            try { const { pushKernelEvent } = await import('@/lib/agentEvents'); pushKernelEvent(ev); } catch {}
          }
        } else {
          for await (const ev of (kernel as any).run(goal)) {
            send(ev);
            try { const { pushKernelEvent } = await import('@/lib/agentEvents'); pushKernelEvent(ev); } catch {}
          }
        }
      } catch (e: any) {
        controller.enqueue(enc.encode(`event: error\n`));
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: e?.message || "stream error" })}\n\n`));
      } finally {
        try { clearInterval(keepAlive); } catch {}
        controller.close();
      }
    },
    cancel() {
      // allow cleanup
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

