import { NoopAttentionSystem } from '@/lib/conscious/attention';
import { NoopSalienceEngine } from '@/lib/conscious/salience';
import { NoopPhiCalculator, WeightedPhiCalculator } from '@/lib/conscious/phi';
import { NoopEthicsSystem } from '@/lib/conscious/ethics';
import { NoopConsciousToolSystem } from '@/lib/conscious/tools';
import { NoopConsciousnessSafety } from '@/lib/conscious/safety';

// Basic contract sanity tests

describe('Conscious subsystem contracts', () => {
  test('attention returns AttentionState shape', async () => {
    const att = new NoopAttentionSystem();
    const s = await att.focusAttention({ goal: 'x' });
    expect(typeof s.focused_content).toBe('string');
    expect(typeof s.attention_strength).toBe('number');
    expect(typeof s.focus_duration_ms).toBe('number');
  });

  test('salience returns components and total', async () => {
    const sal = new NoopSalienceEngine();
    const res = await sal.computeSalience({ intensity: 0.5 }, { goalMatch: 0.6 });
    expect(typeof res.total_salience).toBe('number');
    expect(res.components).toBeTruthy();
  });

  test('phi calculators return bounded phi', async () => {
    const noop = new NoopPhiCalculator();
    const weighted = new WeightedPhiCalculator();
    const att = { focused_content: 'x', attention_strength: 0.6, focus_duration_ms: 100, peripheral_awareness: [], attention_switching_cost: 0.4, binding_coherence: 0.6 } as any;
    const r1 = await noop.calculatePhi({ att });
    const r2 = await weighted.calculatePhi({ att });
    expect(r1.phi_value).toBeGreaterThanOrEqual(0);
    expect(r2.phi_value).toBeLessThanOrEqual(10);
  });

  test('ethics returns overall score', async () => {
    const eth = new NoopEthicsSystem();
    const e = await eth.evaluateEthics({ harmPotential: 0.1 }, { truthfulness: 0.9 });
    expect(typeof e.overall_score).toBe('number');
  });

  test('tools executeConsciously returns ok', async () => {
    const tools = new NoopConsciousToolSystem();
    const res = await tools.executeConsciously({ tool: 'echo', args: {} }, { att: { focused_content: 'x', attention_strength: 0.5, focus_duration_ms: 100, peripheral_awareness: [], attention_switching_cost: 0.4, binding_coherence: 0.5 } as any, phi: { phi_value: 5, components: { information:0.5, integration:0.5, exclusion:0.5, intrinsic_existence:0.5, unification:0.5 }, method: 'heuristic', confidence: 0.7 } });
    expect(res.ok).toBe(true);
  });

  test('safety monitors stability and returns risk level', async () => {
    const safety = new NoopConsciousnessSafety();
    const res = await safety.monitorConsciousnessStability({ phi: { phi_value: 5, components: { information:0.5, integration:0.5, exclusion:0.5, intrinsic_existence:0.5, unification:0.5 }, method: 'heuristic', confidence: 0.7 }, att: { focused_content: 'x', attention_strength: 0.5, focus_duration_ms: 100, peripheral_awareness: [], attention_switching_cost: 0.4, binding_coherence: 0.5 }, goal: 'x' } as any);
    expect(['low','elevated','high','critical']).toContain(res.risk_level);
  });
});

