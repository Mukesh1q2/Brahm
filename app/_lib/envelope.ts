import type { MetadataEnvelope } from '@/types/Envelope';

export type EnvelopeParser = {
  push: (chunk: string) => void;
  reset: () => void;
};

/**
 * Very forgiving parser for newline-delimited JSON envelope objects that
 * may be interleaved in a normal text stream. Any line that looks like a
 * JSON object will be parsed; if it contains { type: "metadata", ... },
 * onMetadata is called.
 */
export function createEnvelopeParser(onMetadata: (m: MetadataEnvelope) => void): EnvelopeParser {
  let buffer = '';
  const tryParseLine = (line: string) => {
    const t = line.trim();
    if (!t) return;
    if (!(t.startsWith('{') && t.endsWith('}'))) return;
    if (!t.includes('"type"')) return;
    try {
      const obj = JSON.parse(t);
      if (obj && obj.type === 'metadata') onMetadata(obj as MetadataEnvelope);
    } catch {}
  };
  return {
    push: (chunk: string) => {
      buffer += chunk;
      // Split by newlines; keep last partial in buffer
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() || '';
      for (const p of parts) tryParseLine(p);
    },
    reset: () => { buffer = ''; },
  };
}
