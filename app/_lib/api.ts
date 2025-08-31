export type ChatStreamInfo = {
  stream: ReadableStream<Uint8Array> | null;
  trace: string;
  status: number;
  startedAt: number;
  requestModel?: string | null;
  responseModel?: string | null;
};

export async function sendChat({
  messages,
  model,
  signal
}: { messages: { role: string; content: string }[]; model?: string; signal?: AbortSignal }): Promise<ChatStreamInfo> {
  const start = Date.now();
  const trace = `${start}-${Math.random().toString(36).slice(2)}`;
  let edition = (process.env.NEXT_PUBLIC_BRAHM_EDITION || 'basic').toLowerCase();
  try {
    const saved = (typeof window !== 'undefined') ? localStorage.getItem('brahm:edition') : null;
    if (saved === 'advanced' || saved === 'basic') edition = saved;
  } catch {}
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-App": "chat",
      "X-Trace-Id": trace,
      "X-Brahm-Edition": edition,
    },
    body: JSON.stringify({ messages, model }),
    signal
  });
  const ok = res.ok;
  const status = res.status;
  const end = Date.now();
  const clientLatencyMs = end - start;
  let respModel: string | null = null;
  try {
    const h = res.headers;
    respModel = h.get('x-llm-model') || h.get('x-model');
    const costUsd = Number(h.get('x-llm-cost-usd'));
    const detail: any = { trace, url: '/api/chat', ok, status, clientLatencyMs, serverLatencyMs: null, costUsd: Number.isFinite(costUsd) ? costUsd : null, requestModel: model || null, responseModel: respModel || null, app: 'chat' };
    window.dispatchEvent(new CustomEvent('telemetry:request', { detail }));
  } catch {}
  if (!ok) {
    try {
      const detail: any = { trace, url: '/api/chat', ok, status, clientLatencyMs, bytesStreamed: 0, charsStreamed: 0, requestModel: model || null, responseModel: respModel || null, app: 'chat' };
      window.dispatchEvent(new CustomEvent('telemetry:request-complete', { detail }));
    } catch {}
    throw new Error(await res.text());
  }
  return { stream: res.body, trace, status, startedAt: start, requestModel: model || null, responseModel: respModel || null };
}

