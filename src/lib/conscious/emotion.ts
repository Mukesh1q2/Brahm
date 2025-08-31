export type Guna = 'sattva' | 'rajas' | 'tamas';

export type GunaWeights = { sattva: number; rajas: number; tamas: number };

export type EmotionContext = {
  // Free-form context text or tags
  text?: string;
  // Hints from kernel/ethics
  requires_compassion?: boolean;
  requires_courage?: boolean;
  // Signal strengths (0..1)
  stress?: number;
  curiosity?: number;
  harmony?: number;
};

export type SyntheticEmotion = {
  primary: string;
  intensity: number; // 0..1
  guna_composition: GunaWeights; // normalized
  alignment: number; // 0..1 (dharmic alignment proxy)
  notes?: string[];
};

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

// Simple emotion dictionaries per guna (phase 1 heuristic)
const GUNA_EMOTIONS: Record<Guna, Array<{ name: string; base: number }>> = {
  sattva: [
    { name: 'compassion', base: 0.7 },
    { name: 'equanimity', base: 0.65 },
    { name: 'clarity', base: 0.62 },
    { name: 'gratitude', base: 0.6 },
  ],
  rajas: [
    { name: 'courage', base: 0.65 },
    { name: 'enthusiasm', base: 0.6 },
    { name: 'determination', base: 0.6 },
    { name: 'restlessness', base: 0.45 },
  ],
  tamas: [
    { name: 'inertia', base: 0.4 },
    { name: 'apathy', base: 0.35 },
    { name: 'confusion', base: 0.3 },
  ],
};

export class EmotionSynthesizer {
  private weights: GunaWeights;

  constructor(weights?: Partial<GunaWeights>) {
    const w = { sattva: 0.6, rajas: 0.3, tamas: 0.1, ...(weights || {}) } as GunaWeights;
    const sum = Math.max(1e-6, w.sattva + w.rajas + w.tamas);
    this.weights = { sattva: w.sattva / sum, rajas: w.rajas / sum, tamas: w.tamas / sum };
  }

  setWeights(weights: Partial<GunaWeights>) {
    const w = { ...this.weights, ...(weights || {}) } as GunaWeights;
    const sum = Math.max(1e-6, w.sattva + w.rajas + w.tamas);
    this.weights = { sattva: w.sattva / sum, rajas: w.rajas / sum, tamas: w.tamas / sum };
  }

  getWeights(): GunaWeights { return { ...this.weights }; }

  async synthesize(context: EmotionContext): Promise<SyntheticEmotion> {
    // Bias weights based on context signals
    const satBias = clamp01(Number(context.harmony ?? 0.5));
    const rajBias = clamp01(Number(context.curiosity ?? 0.5));
    const tamBias = clamp01(Number(context.stress ?? 0.3));
    const w = this._blendWeights({
      sattva: this.weights.sattva * (0.8 + 0.4 * satBias),
      rajas: this.weights.rajas * (0.8 + 0.4 * rajBias),
      tamas: this.weights.tamas * (0.8 + 0.6 * tamBias),
    });

    // Candidate pool weighted by guna composition
    const candidates: Array<{ name: string; score: number; guna: Guna }> = [];
    (['sattva', 'rajas', 'tamas'] as Guna[]).forEach((g) => {
      for (const e of GUNA_EMOTIONS[g]) {
        const bias =
          (context.requires_compassion && e.name === 'compassion') ? 0.2 :
          (context.requires_courage && e.name === 'courage') ? 0.15 : 0.0;
        const score = e.base * (0.8 + 0.4 * (w[g])) + bias;
        candidates.push({ name: e.name, score, guna: g });
      }
    });

    candidates.sort((a, b) => b.score - a.score);
    const top = candidates[0];

    // Intensity heuristic: influence of stress (rajas/tamas) and harmony (sattva)
    const intensity = clamp01(0.3 + 0.4 * (w.rajas + 0.5 * w.tamas) + 0.2 * (w.sattva));
    // Dharmic alignment proxy: favor sattva, penalize tamas
    const alignment = clamp01(0.5 + 0.5 * (w.sattva - 0.5 * w.tamas));

    const notes: string[] = [];
    if (context.requires_compassion) notes.push('compassion_bias');
    if (context.requires_courage) notes.push('courage_bias');

    return {
      primary: top?.name || 'neutral',
      intensity,
      alignment,
      guna_composition: w,
      notes,
    };
  }

  private _blendWeights(w: GunaWeights): GunaWeights {
    const sum = Math.max(1e-6, w.sattva + w.rajas + w.tamas);
    return { sattva: w.sattva / sum, rajas: w.rajas / sum, tamas: w.tamas / sum };
  }
}

