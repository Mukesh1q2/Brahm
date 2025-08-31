import { WeightedPhiCalculator } from '@/lib/conscious/phi';

// Jest tests for WeightedPhiCalculator default weights with mid-range attention

describe('WeightedPhiCalculator defaults smoke', () => {
  test('returns finite phi for mid-range attention', async () => {
    const calc = new WeightedPhiCalculator();
    const att = {
      focused_content: 'x',
      attention_strength: 0.5,
      focus_duration_ms: 150,
      peripheral_awareness: [],
      attention_switching_cost: 0.4,
      binding_coherence: 0.5,
      stability: 0.5,
      flow_level: 0.5,
    } as any;
    const r = await calc.calculatePhi({ att });
    expect(Number.isFinite(r.phi_value)).toBe(true);
    expect(r.phi_value).toBeGreaterThanOrEqual(0);
    expect(r.phi_value).toBeLessThanOrEqual(10);
  });
});

