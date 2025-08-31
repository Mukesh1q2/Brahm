export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Minimal WS transport that simulates consciousness metrics when connected.
// Usage: connect to ws(s)://<host>/api/consciousness/ws?rate_ms=200&session_id=...
// Messages sent are JSON: { ts, phi, qualia: { valence, coherence }, session_id, source: 'ws-sim' }

export async function GET(req: Request) {
  const upgrade = req.headers.get('upgrade') || '';
  if (upgrade.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  // @ts-ignore WebSocketPair is available in Edge runtime
  const pair = new WebSocketPair();
  // @ts-ignore
  const client = pair[0];
  // @ts-ignore
  const server = pair[1];

  const url = new URL(req.url);
  const rateMs = Math.max(50, Number(url.searchParams.get('rate_ms') || 200));
  const sessionId = url.searchParams.get('session_id');

  // @ts-ignore - Edge runtime
  server.accept();

  let timer: number | undefined;
  let t = 0;
  const send = (obj: any) => {
    try { /* @ts-ignore */ server.send(JSON.stringify(obj)); } catch {}
  };

  const tick = () => {
    t += (rateMs/1000);
    const phi = 1.0 + 0.4*Math.sin(t/1.8) + (Math.random()-0.5)*0.05;
    const val = 0.5 + 0.3*Math.sin(t/2.7+0.6) + (Math.random()-0.5)*0.03;
    const coh = 0.6 + 0.2*Math.cos(t/2.0-0.3) + (Math.random()-0.5)*0.02;
    const obj = { ts: new Date().toISOString(), phi: Number(phi.toFixed(3)), qualia: { valence: Number(val.toFixed(3)), coherence: Number(coh.toFixed(3)) }, session_id: sessionId || null, source: 'ws-sim' };
    send(obj);
    // @ts-ignore
    timer = setTimeout(tick, rateMs) as any;
  };

  // @ts-ignore - Edge runtime WebSocket events
  server.addEventListener('message', (ev: MessageEvent) => {
    // Optionally handle client messages, e.g., { type: 'ping' }
    try {
      const data = JSON.parse(String(ev.data||'{}'));
      if (data?.type === 'ping') {
        send({ type: 'pong', ts: new Date().toISOString() });
      }
    } catch { /* ignore */ }
  });

  // @ts-ignore
  server.addEventListener('close', () => { if (timer) clearTimeout(timer as any); });
  // @ts-ignore
  server.addEventListener('error', () => { if (timer) clearTimeout(timer as any); });

  // start loop
  tick();

  // @ts-ignore
  return new Response(null, { status: 101, webSocket: client });
}

