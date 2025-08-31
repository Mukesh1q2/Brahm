import { getMemory } from './memorySingleton';

export type DreamInsight = { idea: string; sources: string[] };
export type DreamSession = {
  started_at: number;
  duration_ms: number;
  memories_consolidated: number;
  creative_insights: DreamInsight[];
  notes?: string[];
};

function sample<T>(arr: T[], n: number): T[] {
  const a = arr.slice();
  const out: T[] = [];
  for (let i = 0; i < n && a.length; i++) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a[idx]);
    a.splice(idx, 1);
  }
  return out;
}

export class DreamSimulationEngine {
  async enterDreamState(duration_ms = 1500): Promise<DreamSession> {
    const mem = getMemory();
    // Retrieve latest episodes for consolidation
    const episodes = await mem.retrieveEpisodes({ limit: 50 });
    const chosen = sample(episodes, Math.min(6, episodes.length));
    // Consolidate: trivial no-op but could mark as consolidated in future
    const memories_consolidated = chosen.length;

    // Creative synthesis: combine disparate contents into novel ideas
    const creative_insights: DreamInsight[] = [];
    for (let i = 0; i < Math.max(1, Math.floor(chosen.length / 2)); i++) {
      const parts = sample(chosen, Math.min(3, chosen.length)).map((e: any) => String(e?.experience?.main_content || '').slice(0, 60));
      const idea = parts.filter(Boolean).join(' ⟂ ');
      if (idea) creative_insights.push({ idea, sources: parts });
    }

    // Simulate duration (non-blocking wait is omitted in server context)
    return {
      started_at: Date.now(),
      duration_ms,
      memories_consolidated,
      creative_insights,
      notes: ['phase1_stub', 'memory_consolidation', 'creative_combination'],
    };
  }
}

