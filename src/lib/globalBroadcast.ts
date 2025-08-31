import { useGlobalWorkspace } from '@/store/globalWorkspace';

export type BroadcastCandidate = {
  id: string;
  source: string; // e.g., 'chat' | 'terminal' | 'canvas' | 'agent'
  confidence?: number;
  uncertainty?: number;
  ethicsDecision?: 'allow'|'revise'|'veto';
  summary?: string;
  score?: number; // optional precomputed
};

type Queue = { items: BroadcastCandidate[] };

function getQueue(): Queue {
  const g = globalThis as any;
  if (!g.__broadcast_q) g.__broadcast_q = { items: [] } as Queue;
  return g.__broadcast_q as Queue;
}

function computeScore(c: BroadcastCandidate): number {
  // Simple composite: prioritize high confidence, low uncertainty; penalize ethics issues
  const conf = typeof c.confidence === 'number' ? c.confidence : 0.6;
  const unc = typeof c.uncertainty === 'number' ? c.uncertainty : 0.4;
  const ethicsPenalty = c.ethicsDecision === 'veto' ? 0.6 : c.ethicsDecision === 'revise' ? 0.25 : 0;
  let score = 0.6 * conf + 0.4 * (1 - unc) - ethicsPenalty;
  return Math.max(0, Math.min(1, score));
}

export function submitCandidate(c: BroadcastCandidate) {
  const q = getQueue();
  q.items.push(c);
  // Evaluate immediately for now
  evaluateAndPublish();
}

export function evaluateAndPublish() {
  const q = getQueue();
  if (!q.items.length) return;
  // Pick best by score
  let best = null as (BroadcastCandidate & { scoreFinal: number }) | null;
  for (const item of q.items) {
    const s = typeof item.score === 'number' ? item.score : computeScore(item);
    if (!best || s > best.scoreFinal) best = { ...item, scoreFinal: s };
  }
  // Clear queue (single-winner cycle)
  q.items.length = 0;
  if (!best) return;
  const pub = useGlobalWorkspace.getState().publishBroadcast;
  pub({
    id: best.id,
    source: best.source,
    score: best.scoreFinal,
    summary: best.summary,
    at: Date.now(),
    confidence: best.confidence,
    uncertainty: best.uncertainty,
    ethics: best.ethicsDecision,
  });
  // Telemetry event for Console timeline (best-effort)
  try {
    const detail = { kind: 'broadcast', id: best.id, source: best.source, score: best.scoreFinal };
    window.dispatchEvent(new CustomEvent('workspace:broadcast', { detail }));
  } catch {}
}

