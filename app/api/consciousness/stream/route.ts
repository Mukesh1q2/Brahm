export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Note: lazy-load DB helpers to avoid importing pg module during dev/E2E when DB is disabled

function normalizeEvt(input: any, sessionId: string | null) {
  const tsRaw = input?.ts || input?.timestamp || Date.now();
  const tsIso = new Date(typeof tsRaw === 'number' ? tsRaw : String(tsRaw)).toISOString();
  const phi = input?.phi != null ? Number(input.phi)
    : input?.phi_level != null ? Number(input.phi_level)
    : input?.metrics?.phi != null ? Number(input.metrics.phi) : 0;
  const val = input?.qualia?.valence != null ? Number(input.qualia.valence)
    : input?.valence != null ? Number(input.valence) : null;
  const coh = input?.qualia?.coherence != null ? Number(input.qualia.coherence)
    : input?.coherence != null ? Number(input.coherence) : null;
  return {
    ts: tsIso,
    phi: Number.isFinite(phi) ? phi : 0,
    qualia: { valence: Number.isFinite(val) ? val : null, coherence: Number.isFinite(coh) ? coh : null },
    session_id: sessionId,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  const forceSim = url.searchParams.get('sim') === 'true' || process.env.BRAHM_CONSCIOUSNESS_SIM === 'true';
  const rateMs = Math.max(50, Number(url.searchParams.get('rate_ms') || process.env.BRAHM_CONSCIOUSNESS_RATE_MS || 200));
  const persistFlag = ['1','true','yes'].includes(String(url.searchParams.get('persist')||'').toLowerCase());
  const persistEveryMs = Math.max(500, Number(url.searchParams.get('persist_every') || 5000));
  const isAdvanced = (req.headers.get('x-brahm-edition') || '').toLowerCase() === 'advanced' || (process.env.BRAHM_EDITION || '').toLowerCase() === 'advanced';

  const base = process.env.MIND_BASE_URL || process.env.NEXT_PUBLIC_MIND_BASE_URL || '';
  const upstreamUrl = base ? `${String(base).replace(/\/$/, '')}/consciousness/stream${url.search ? url.search : ''}` : '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const write = (obj: any) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      const ping = () => controller.enqueue(enc.encode(`event: ping\ndata: {}\n\n`));
      let lastPersist = 0;
      const maybePersist = async (obj: any) => {
        if (!persistFlag) return;
        const now = Date.now();
        if (now - lastPersist < persistEveryMs) return;
        lastPersist = now;
        const payload = { phi_level: obj.phi, valence: obj?.qualia?.valence ?? null, coherence: obj?.qualia?.coherence ?? null, session_id: obj?.session_id ?? null, raw_metrics: obj };
        // fire-and-forget; do not await to avoid blocking the stream
        try {
          const { insertConsciousnessStateSafe } = await import("../../_lib/pg");
          insertConsciousnessStateSafe(payload).catch(()=>{});
        } catch {}
      };

      // heartbeat every 15s
      const hb = setInterval(ping, 15000);

      // Helper: start local simulation
      const runSim = () => {
        let t = 0;
        const timer = setInterval(() => {
          t += (rateMs/1000);
          const phi = 1.0 + 0.4*Math.sin(t/1.8) + (Math.random()-0.5)*0.05;
          const val = 0.5 + 0.3*Math.sin(t/2.7+0.6) + (Math.random()-0.5)*0.03;
          const coh = 0.6 + 0.2*Math.cos(t/2.0-0.3) + (Math.random()-0.5)*0.02;
          const base = { ts: new Date().toISOString(), phi: Number(phi.toFixed(3)), qualia: { valence: Number(val.toFixed(3)), coherence: Number(coh.toFixed(3)) }, session_id: sessionId || null, source: 'sim' };
          const adv = isAdvanced ? {
            phi_components: {
              information: Number((0.5 + 0.1*Math.sin(t/2)).toFixed(2)),
              integration: Number((0.5 + 0.1*Math.cos(t/3)).toFixed(2)),
              exclusion: Number((0.45 + 0.08*Math.sin(t/1.7)).toFixed(2)),
              intrinsic_existence: Number((0.48 + 0.07*Math.cos(t/2.2)).toFixed(2)),
              unification: Number((0.52 + 0.09*Math.sin(t/2.5)).toFixed(2)),
            },
            attention_strength: Number((0.5 + 0.2*Math.sin(t/1.5)).toFixed(2)),
            binding_coherence: Number((0.55 + 0.15*Math.cos(t/1.8)).toFixed(2)),
          } : {};
          const obj = { ...base, ...adv } as any;
          write(obj);
          maybePersist(obj);
        }, rateMs);
        return () => clearInterval(timer);
      };

      if (!forceSim && upstreamUrl) {
        try {
          const upstream = await fetch(upstreamUrl, { headers: { 'Accept': 'text/event-stream' }, cache: 'no-store' });
          if (upstream?.ok && upstream.body) {
            const reader = upstream.body.getReader();
            const dec = new TextDecoder();
            let buffer = '';
            const pump = async (): Promise<void> => {
              const { value, done } = await reader.read();
              if (done) return;
              buffer += dec.decode(value, { stream: true });
              let idx: number;
              while ((idx = buffer.indexOf('\n\n')) !== -1) {
                const rawEvent = buffer.slice(0, idx);
                buffer = buffer.slice(idx + 2);
                // Extract data: lines only
                const dataLines = rawEvent.split('\n').filter(l => l.startsWith('data:'));
                for (const line of dataLines) {
                  const payloadRaw = line.replace(/^data:\s?/, '');
                  try {
                    const parsed = JSON.parse(payloadRaw);
                    const norm = normalizeEvt(parsed, sessionId);
                    const obj = { ...norm, source: 'upstream' };
                    write(obj);
                    maybePersist(obj);
                  } catch {
                    // ignore malformed JSON lines
                  }
                }
              }
              return pump();
            };
            pump().then(()=>{ try { controller.close(); } catch {} }).catch(()=>{ try { controller.close(); } catch {} });
            return () => { try { reader.cancel(); } catch {}; };
          }
        } catch {
          // fall through to simulation
        }
      }

      // Upstream unavailable or sim forced: run simulation
      const stopSim = runSim();

      // On abort, cleanup timers and close
      const onAbort = () => { try { stopSim(); } catch {}; clearInterval(hb); try { controller.close(); } catch {} };
      // @ts-ignore - standard fetch Request has signal in Node runtime
      req.signal?.addEventListener?.('abort', onAbort);
    },
    cancel() {
      // nothing; most cleanups are attached to abort handler
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
