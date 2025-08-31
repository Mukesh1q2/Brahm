import type { AttentionState } from '@/types/Conscious';

export interface AttentionSystem {
  focusAttention(stimuli: { goal: string; novelty?: number }): Promise<AttentionState>
  bindFeatures(features: Array<{ salience?: number }>): Promise<{ binding_coherence: number; features: any[] }>
  resolveCompetition(candidates: any[]): Promise<any>
  setAttentionPolicy(policy: any): void
  adaptAttentionWeights(performance: any): void
  broadcastAttention(content: any): Promise<void>
  getAttentionTrace(): any
}

export class NoopAttentionSystem implements AttentionSystem {
  private trace: any[] = []
  async focusAttention(stimuli: { goal: string; novelty?: number }) { const s = { focused_content: String(stimuli?.goal || 'goal'), attention_strength: 0.6, focus_duration_ms: 100, peripheral_awareness: [], attention_switching_cost: 0.4, binding_coherence: 0.6 }; this.trace.push({ type:'focus', s}); return s as any }
  async bindFeatures(features: Array<{ salience?: number }>) { const b = { binding_coherence: 0.6, features }; this.trace.push({ type:'bind', b}); return b }
  async resolveCompetition(candidates: any[]) { const winner = candidates?.[0] ?? null; this.trace.push({ type:'winner', winner }); return winner }
  setAttentionPolicy(_policy: any) {}
  adaptAttentionWeights(_performance: any) {}
  async broadcastAttention(content: any) { this.trace.push({ type:'broadcast', content }) }
  getAttentionTrace() { return this.trace }
}

export class EnhancedAttentionSystem implements AttentionSystem {
  private trace: any[] = []
  private policy = { focusWeight: 0.6, noveltyWeight: 0.4 }
  setAttentionPolicy(policy: any) { this.policy = { ...this.policy, ...(policy||{}) } }
  adaptAttentionWeights(performance: any) { if (performance?.flow) this.policy.focusWeight = Math.min(0.8, this.policy.focusWeight + 0.05) }
  getAttentionTrace() { return this.trace }
  async broadcastAttention(content: any) { this.trace.push({ type:'broadcast', content }) }
  async focusAttention(stimuli: { goal: string; novelty?: number }) {
    const goal = String(stimuli?.goal || 'goal')
    const novelty = Number(stimuli?.novelty ?? 0.5)
    const base = 0.4 + 0.4 * Math.tanh(goal.length/40)
    const attention_strength = clamp(base * this.policy.focusWeight + novelty * this.policy.noveltyWeight, 0, 1)
    const s = {
      focused_content: goal,
      attention_strength,
      focus_duration_ms: 80 + Math.floor(attention_strength*200),
      focus_sharpness: 0.5 + 0.4*attention_strength,
      peripheral_richness: 0.3 + 0.5*(1-attention_strength),
      peripheral_awareness: [],
      attention_switching_cost: 0.4,
      binding_coherence: 0.6,
    } as any
    this.trace.push({ type: 'focus', s })
    return s
  }
  async bindFeatures(features: Array<{ salience?: number }>) {
    const arr = Array.isArray(features) ? features : []
    const strengths = arr.map((f:any)=> Number(f?.salience ?? 0.5))
    const mean = strengths.length ? strengths.reduce((a:number,b:number)=>a+b,0)/strengths.length : 0.5
    const varc = strengths.length ? strengths.reduce((a:number,b:number)=> a + Math.pow(b-mean,2),0)/strengths.length : 0.0
    const coherence = clamp(mean * (1 - varc), 0, 1)
    const b = { binding_coherence: coherence, features: arr }
    this.trace.push({ type:'bind', b })
    return b
  }
  async resolveCompetition(candidates: any[]) {
    if (!Array.isArray(candidates) || candidates.length === 0) return null
    let best = candidates[0]; let bestScore = Number(best?.confidence ?? 0.5)
    for (const c of candidates) {
      const sc = Number(c?.confidence ?? 0.5)
      if (sc > bestScore) { best = c; bestScore = sc }
    }
    this.trace.push({ type:'winner', winner: best })
    return best
  }
}

function clamp(x:number, lo:number, hi:number){ return Math.max(lo, Math.min(hi, x)) }
