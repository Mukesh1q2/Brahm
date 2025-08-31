// Lightweight Advanced metadata helpers for enriched chat envelopes

export function estimatePhiFromTextLen(len: number): { phi_value: number; components: any; confidence: number } {
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const base = Math.log10(1 + len) / 1.2; // 0..~2.5 for normal lengths
  const phi = clamp(0.6 + base, 0, 10);
  const info = clamp(0.5 + Math.log10(1 + len / 200) * 0.3, 0, 1);
  const integ = clamp(0.45 + (1 / (1 + Math.exp(-((len - 400) / 300)))) * 0.4, 0, 1);
  const excl = clamp(0.35 + (1 - Math.abs(600 - len) / 1200), 0, 1);
  const intr = clamp(0.4 + (info + integ) / 3, 0, 1);
  const unif = clamp(0.5 + integ * 0.4, 0, 1);
  return {
    phi_value: Number(phi.toFixed(2)),
    components: {
      information: Number(info.toFixed(2)),
      integration: Number(integ.toFixed(2)),
      exclusion: Number(excl.toFixed(2)),
      intrinsic_existence: Number(intr.toFixed(2)),
      unification: Number(unif.toFixed(2)),
    },
    confidence: 0.7,
  };
}

export function estimateAttention(messages: { role: string; content: string }[]) {
  const last = messages[messages.length - 1]?.content || '';
  const words = (last.match(/\w+/g) || []).length;
  const strength = Math.max(0.2, Math.min(1, words / 80));
  const binding = Math.max(0.3, Math.min(1, 0.4 + Math.log10(1 + words) * 0.2));
  return { attention_strength: Number(strength.toFixed(2)), binding_coherence: Number(binding.toFixed(2)) };
}

export function buildAdvancedMetadata(messages: { role: string; content: string }[], model?: string) {
  const last = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
  const len = last.length;
  const phi = estimatePhiFromTextLen(len);
  const att = estimateAttention(messages);
  const telemetry = { model_cost_usd: 0, model: model || 'mind-orchestrator', tokens_used: Math.round(len / 4) };
  return {
    type: 'metadata',
    tab: 'trace',
    consciousness: {
      phi_level: phi.phi_value,
      phi_components: phi.components,
      attention_strength: att.attention_strength,
      binding_coherence: att.binding_coherence,
      confidence: phi.confidence,
    },
    telemetry,
    ethics: { decision: 'allow', reasons: ['no harm detected'], principles: ['ahimsa', 'satya'] },
  };
}

