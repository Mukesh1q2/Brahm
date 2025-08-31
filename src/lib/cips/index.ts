import type { QuantumCoreContract, QuantumState, ConsciousnessVector, NeuromorphicContract, GlobalWorkspaceContract, Coalition, PhenomenalGeneratorContract, ActiveInferenceContract, EvolutionContract, KoshaContract, QualiaBundle } from '@/types/cips';

export class NoopQuantumCore implements QuantumCoreContract {
  async prepareConsciousnessState(input: { sensory: string; context: string }): Promise<QuantumState> {
    return { prep: `${input.sensory}|${input.context}`.slice(0,64), coherence: 0.6 };
  }
  async createUnifiedExperience(state: QuantumState): Promise<QuantumState> {
    return { ...state, coherence: Math.min(1, state.coherence * 1.05) };
  }
  async collapseToClassical(state: QuantumState): Promise<ConsciousnessVector> {
    return { features: { coherence: state.coherence, prep_len: state.prep.length } };
  }
}

export class NoopNeuromorphic implements NeuromorphicContract {
  async step(state: { size: number; modulator?: number }) {
    const mod = typeof state.modulator === 'number' ? state.modulator : 0.5;
    return { consciousness_factor: 0.5 + 0.4 * mod, binding_hint: 0.5 + 0.2 * mod };
  }
}

export class SimpleWorkspace implements GlobalWorkspaceContract {
  async formCoalitions(inputs: string[]): Promise<Coalition[]> {
    return inputs.map((c, i) => ({
      id: `c${i}`,
      content: c,
      novelty: 0.4 + (i % 3) * 0.2,
      information_gain: 0.5 + ((i+1) % 3) * 0.15,
      value: 0.5 + ((i+2) % 3) * 0.1,
    }));
  }
  async selectWinner(coalitions: Coalition[], seed: number): Promise<Coalition | null> {
    if (!coalitions.length) return null;
    let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
    // Score by weighted sum + small randomness for tie-breaking
    const scored = coalitions.map(c => ({ c, score: 0.4*c.novelty + 0.35*c.information_gain + 0.25*c.value + 0.01*rnd() }));
    scored.sort((a,b)=> b.score - a.score);
    return scored[0].c;
  }
  async broadcast(_coalition: Coalition, _qualia: QualiaBundle): Promise<void> { /* no-op */ }
}

export class SimplePhenomenal implements PhenomenalGeneratorContract {
  async generate(content: string) {
    const h = Math.min(1, content.length / 40);
    return { sensory: 0.4 + 0.4*h, emotional: 0.5, cognitive: 0.5 + 0.3*h };
  }
}

export class SimpleActiveInference implements ActiveInferenceContract {
  async predict(beliefs: Record<string, number>) { return { ...beliefs, pred: (beliefs.pred ?? 0.5) * 0.98 }; }
  async error(observed: Record<string, number>, predicted: Record<string, number>) {
    const o = observed.value ?? 0.5; const p = predicted.pred ?? 0.5; return Math.abs(o - p);
  }
  async update(beliefs: Record<string, number>, error: number) { return { ...beliefs, pred: Math.max(0, Math.min(1, (beliefs.pred ?? 0.5) + (0.5 - error)*0.1)) }; }
  async selfModel(beliefs: Record<string, number>, error: number) { return { confidence: Math.max(0, 1 - error), meta: [error < 0.2 ? 'low_error' : 'high_error'] }; }
}

export class SimpleEvolution implements EvolutionContract {
  async analyze(traces: Array<{ type: string; data: any }>) {
    const improvements = [] as string[]; const risks = [] as string[];
    const hadHighError = traces.some(t => t.type==='prediction' && (t.data?.error ?? 0) > 0.3);
    if (hadHighError) improvements.push('increase_pp_weight');
    return { improvements, risks };
  }
  async propose(improvements: string[]) { return improvements.map(x => `apply:${x}`); }
  async validate(changes: string[]) { return changes.filter(x => !x.includes('unsafe')); }
}

export class NoopKosha implements KoshaContract {
  async integrate(payload: any) { return { ...payload, kosha: { integrated: true } }; }
}

