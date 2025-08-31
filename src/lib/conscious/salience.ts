export interface SalienceEngine {
  computeSalience(
    stimulus: { intensity?: number; emotional?: number; aesthetic?: number },
    context: { goalMatch?: number; uncertainty?: number; infoGain?: number; memorySimilarity?: number; ethicalWeight?: number },
  ): Promise<{ total_salience: number, components: Record<string, number>, confidence: number }>
  updateSalienceWeights(learning: any): void
  assessRelevance(content: any, goals: any[]): Promise<any>
  trackRelevanceHistory(): any
}

export class NoopSalienceEngine implements SalienceEngine {
  private hist: any[] = []
  async computeSalience(stimulus: any, _context: any) { const s = { total_salience: 0.6, components: { novelty:0.5, intensity:0.5, relevance:0.6, emotional:0.4, curiosity:0.5, aesthetic:0.5, ethical:0.6 }, confidence: 0.7 }; this.hist.push(s); return s }
  updateSalienceWeights(_learning: any) {}
  async assessRelevance(content: any, _goals: any[]) { return { relevance: 0.6, item: content } }
  trackRelevanceHistory() { return this.hist }
}

export class EnhancedSalienceEngine implements SalienceEngine {
  private hist: any[] = []
  private weights = { novelty: 0.25, relevance: 0.25, intensity: 0.15, emotional: 0.1, curiosity: 0.1, aesthetic: 0.1, ethical: 0.05 }
  updateSalienceWeights(learning: any) {
    // Simple adaptation: nudge relevance upward if learning says goal-match matters
    if (learning?.boostRelevance) this.weights.relevance = Math.min(0.4, this.weights.relevance + 0.05)
  }
  trackRelevanceHistory() { return this.hist }
  async assessRelevance(content: any, _goals: any[]) { return { relevance: 0.6, item: content } }
  async computeSalience(stimulus: any, context: any) {
    const novelty = clamp(1 - Number(context?.memorySimilarity ?? 0.3), 0, 1)
    const intensity = clamp(Number(stimulus?.intensity ?? 0.5), 0, 1)
    const relevance = clamp(Number(context?.goalMatch ?? 0.6), 0, 1)
    const emotional = clamp(Number(stimulus?.emotional ?? 0.4), 0, 1)
    const curiosity = clamp(Number(context?.uncertainty ?? 0.5) * Number(context?.infoGain ?? 0.6), 0, 1)
    const aesthetic = clamp(Number(stimulus?.aesthetic ?? 0.5), 0, 1)
    const ethical = clamp(Number(context?.ethicalWeight ?? 0.6), 0, 1)
    const comp = { novelty, intensity, relevance, emotional, curiosity, aesthetic, ethical }
    let total = 0; for (const k of Object.keys(this.weights) as (keyof typeof this.weights)[]) total += comp[k] * this.weights[k]
    const s = { total_salience: total, components: comp as Record<string, number>, confidence: 0.7 }
    this.hist.push(s)
    return s
  }
}

function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)) }
