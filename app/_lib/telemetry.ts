export type TelemetryEvent = {
  ts: number;
  type: 'request' | 'request-complete';
  detail: any;
};

// Tiny client for emitting mock metadata envelopes during demos
export function emitMockMetadata({ reasoning, diff, tab }: { reasoning?: any; diff?: any; tab?: 'summary'|'trace'|'json'|'diff'|'memory' }) {
  const payload = { type: 'metadata', reasoning, diff, tab };
  const text = JSON.stringify(payload) + '\n';
  try {
    const ev = new CustomEvent('chat:mock-stream-chunk', { detail: { text } });
    window.dispatchEvent(ev);
  } catch {}
}

