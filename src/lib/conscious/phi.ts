import type { AttentionState, PhiMeasurement } from '@/types/Conscious';

export interface AdvancedPhiCalculator {
  calculatePhi(system: { goal?: string; att: AttentionState; weights?: { gwt?: number; causal?: number; pp?: number }; predictionError?: number }): Promise<{ phi_value: number, components: PhiMeasurement['components'], method: string, confidence: number }>
}

export class NoopPhiCalculator implements AdvancedPhiCalculator {
  async calculatePhi(_system: { goal?: string; att: AttentionState; weights?: { gwt?: number; causal?: number; pp?: number }; predictionError?: number }) {
    return { phi_value: 4.2, components: { information: 0.6, integration: 0.6, exclusion: 0.5, intrinsic_existence: 0.5, unification: 0.6 }, method: 'heuristic', confidence: 0.7 }
  }
}

// A simple weighted calculator combining multiple conceptual measures
export class WeightedPhiCalculator implements AdvancedPhiCalculator {
  async calculatePhi(system: { goal?: string; att: AttentionState; weights?: { gwt?: number; causal?: number; pp?: number }; predictionError?: number }) {
    const att = system?.att || {} as AttentionState;
    const focus = clamp(Number(att.attention_strength ?? 0.5), 0, 1);
    const bind = clamp(Number(att.binding_coherence ?? 0.5), 0, 1);
    // GWT-like: broadcast reach approximated by focus, integration by binding
    const gwt = Math.sqrt(Math.max(0, focus) * Math.max(0, bind)) * 6; // 0..6 approx
    // Causal-structure proxy: product of coherence and switching cost complement
    const switchCost = clamp(1 - Number(att.attention_switching_cost ?? 0.4), 0, 1);
    const causal = Math.pow(bind * switchCost, 0.5) * 5; // 0..5
    // Predictive-processing proxy: stability and flow as low prediction error proxy
    const stability = clamp(Number(att.stability ?? 0.5), 0, 1);
    const flow = clamp(Number(att.flow_level ?? 0.5), 0, 1);
    let pp = Math.sqrt(stability * (0.6 + 0.4 * flow)) * 4; // 0..4
    // Modulate PP component directly by active-inference prediction error if provided
    if (typeof system?.predictionError === 'number' && Number.isFinite(system.predictionError)) {
      const e = clamp(system.predictionError, 0, 1);
      pp = pp * (1 - e);
    }

    // Combine with weights (normalized)
    const raw = system?.weights || {};
    const has = (v: any) => typeof v === 'number' && Number.isFinite(v);
    const rw = { gwt: has(raw.gwt) ? Number(raw.gwt) : 0.5, causal: has(raw.causal) ? Number(raw.causal) : 0.3, pp: has(raw.pp) ? Number(raw.pp) : 0.2 };
    const sum = Math.max(1e-6, rw.gwt + rw.causal + rw.pp);
    const weights = { gwt: rw.gwt / sum, causal: rw.causal / sum, pp: rw.pp / sum };
    const phi = weights.gwt * gwt + weights.causal * causal + weights.pp * pp;
    const info = 0.5 + 0.4 * focus;
    const integration = 0.4 + 0.5 * bind;
    const exclusion = 0.4 + 0.3 * switchCost;
    const intrinsic = 0.4 + 0.3 * stability;
    const unification = 0.5 + 0.3 * Math.min(focus, bind);
    return {
      phi_value: clamp(phi, 0, 10),
      components: { information: info, integration, exclusion, intrinsic_existence: intrinsic, unification },
      method: 'weighted',
      confidence: 0.65 + 0.25 * stability,
    };
  }
}

function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }
