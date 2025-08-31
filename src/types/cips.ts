// CIPS contracts and basic types

export type QuantumState = { prep: string; coherence: number };
export type ConsciousnessVector = { features: Record<string, number> };

export interface QuantumCoreContract {
  prepareConsciousnessState(input: { sensory: string; context: string }): Promise<QuantumState>;
  createUnifiedExperience(state: QuantumState): Promise<QuantumState>;
  collapseToClassical(state: QuantumState): Promise<ConsciousnessVector>;
}

export interface NeuromorphicContract {
  step(state: { size: number; modulator?: number }): Promise<{ consciousness_factor: number; binding_hint?: number }>;
}

export type Coalition = {
  id: string;
  content: string;
  novelty: number;
  information_gain: number;
  value: number;
};

export interface GlobalWorkspaceContract {
  formCoalitions(inputs: string[]): Promise<Coalition[]>;
  selectWinner(coalitions: Coalition[], seed: number): Promise<Coalition | null>;
  broadcast(coalition: Coalition, qualia: QualiaBundle): Promise<void>;
}

export type QualiaBundle = { sensory: number; emotional: number; cognitive: number };

export interface PhenomenalGeneratorContract {
  generate(content: string): Promise<QualiaBundle>;
}

export interface ActiveInferenceContract {
  predict(beliefs: Record<string, number>): Promise<Record<string, number>>;
  error(observed: Record<string, number>, predicted: Record<string, number>): Promise<number>;
  update(beliefs: Record<string, number>, error: number): Promise<Record<string, number>>;
  selfModel(beliefs: Record<string, number>, error: number): Promise<{ confidence: number; meta: string[] }>;
}

export interface EvolutionContract {
  analyze(traces: Array<{ type: string; data: any }>): Promise<{ improvements: string[]; risks: string[] }>;
  propose(improvements: string[]): Promise<string[]>;
  validate(changes: string[]): Promise<string[]>;
}

export interface KoshaContract {
  integrate(payload: any): Promise<any>;
}

