// Core types for Phase 1 of the Conscious Kernel. These are intentionally
// lightweight and compatible with Next.js API routes. Extend in later phases.

export type EnhancedConsciousState =
  | "dormant"
  | "pre_conscious"
  | "attention_capture"
  | "focused_attention"
  | "conscious_access"
  | "reflective"
  | "flow_state"
  | "transcendent"
  | "fragmented"
  | "integrating";

export type ConsciousnessLevel = {
  phi: number;
  attention_strength: number;
  self_awareness_depth: number;
  phenomenal_richness: number;
  temporal_coherence: number;
  embodiment_integration: number;
  meaning_generation: number;
};

export type AttentionState = {
  focused_content: string;
  attention_strength: number; // 0..1
  focus_duration_ms: number;
  peripheral_awareness: string[];
  attention_switching_cost: number; // 0..1
  binding_coherence: number; // 0..1
  // Phase 1 additions
  focus_sharpness?: number;
  stability?: number;
  peripheral_richness?: number;
  effort_level?: number;
  flow_level?: number;
};

export type PhiMeasurement = {
  phi_value: number; // 0..10 (scaled)
  components: {
    information: number;
    integration: number;
    exclusion: number;
    intrinsic_existence: number;
    unification: number;
  };
  method: "gwt" | "heuristic";
  confidence: number; // 0..1
};

export type Proposal = {
  id: string;
  summary: string;
  rationale: string;
  confidence: number; // 0..1
};

export type Broadcast = {
  summary: string;
  details?: string;
  confidence: number;
};

export type LearningOutcome = {
  pattern_notes: string[];
  value_notes: string[];
  improvement_hint?: string;
};

export type StabilityAssessment = {
  stability_score: number; // 0..1
  risk_level: "low" | "elevated" | "high" | "critical";
  notes?: string[];
  recommendations?: string[];
};

export type ConsciousExperience = {
  id: string;
  timestamp: number;
  main_content: string;
  phi_level: number;
  qualia_count: number;
  duration_ms: number;
};

export type KernelEvent =
  | { type: "run:start"; runId: string; goal: string }
  | { type: "perception"; snapshot: string }
  | { type: "attention"; state: AttentionState }
  | { type: "salience"; score: number; components: Record<string, number> }
  | { type: "proposals"; proposals: Proposal[] }
  | { type: "phi"; measurement: PhiMeasurement }
  | { type: "ethics"; evaluation: any }
  | { type: "conscious_access"; has_access: boolean }
  | { type: "broadcast"; broadcast: Broadcast }
  | { type: "experience"; experience: ConsciousExperience }
  | { type: "learning"; outcome: LearningOutcome }
  | { type: "stability"; assessment: StabilityAssessment }
  | { type: "tool"; name: string; result: any }
  | { type: "action"; description: string }
  | { type: "cips:coalitions"; items: Array<{ id: string; content: string; novelty: number; information_gain: number; value: number }> }
  | { type: "cips:workspace_winner"; coalition: { id: string; content: string } }
  | { type: "cips:qualia"; qualia: { sensory: number; emotional: number; cognitive: number } }
  | { type: "cips:prediction"; error: number; predicted: any }
  | { type: "cips:self_model"; confidence: number; meta: string[] }
  | { type: "cips:evolution"; improvements: string[]; accepted: string[] }
  | { type: "cips:weights"; weights: { gwt?: number; causal?: number; pp?: number } }
  | { type: "run:end"; runId: string; success: boolean };

export type RunSummary = {
  runId: string;
  goal: string;
  steps: number;
  lastPhi: number;
  lastAttention: number;
  proposalsSample: string[];
};

export type KernelOptions = {
  maxSteps?: number; // default 6
  targetPhi?: number; // 0..10
  seed?: number;
  enableEthics?: boolean;
  enableTools?: boolean;
  enableSalience?: boolean;
  phiWeights?: { gwt?: number; causal?: number; pp?: number };
  enableCIPS?: boolean;
  enableCIPSApplyEvolution?: boolean;
  moduleProfile?: 'basic' | 'enhanced' | 'custom';
};

// Subsystem interfaces (public contracts) for Phase 7 P1
export interface AttentionSystemContract {
  focusAttention(stimuli: { goal: string; novelty?: number }): Promise<AttentionState>
  bindFeatures(features: Array<{ salience?: number }>): Promise<{ binding_coherence: number; features: any[] }>
}
export interface SalienceEngineContract {
  computeSalience(
    stimulus: { intensity?: number; emotional?: number; aesthetic?: number },
    context: { goalMatch?: number; uncertainty?: number; infoGain?: number; memorySimilarity?: number; ethicalWeight?: number },
  ): Promise<{ total_salience: number; components: Record<string, number>; confidence: number }>
}
export interface PhiCalculatorContract {
  calculatePhi(system: { goal: string; att: AttentionState }): Promise<{
    phi_value: number; components: PhiMeasurement['components']; method: string; confidence: number
  }>
}
export interface EthicsSystemContract {
  evaluateEthics(action: { harmPotential?: number; appropriation?: number }, context: { truthfulness?: number; selfControl?: number; attachment?: number; utility?: number }): Promise<any>
}
export interface ToolSystemContract {
  executeConsciously(call: { tool: string; args: any; rationale?: string }, consciousness: { att: AttentionState; phi: PhiMeasurement }): Promise<any>
}
export interface SafetySystemContract {
  monitorConsciousnessStability(state: { phi: PhiMeasurement; att: AttentionState; goal: string }): Promise<StabilityAssessment>
}

