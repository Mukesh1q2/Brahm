import { WeightedPhiCalculator } from '@/lib/conscious/phi';

// Simple clamp utility (mirrors internal behavior indirectly through outcomes)
function expectBetween(x: number, lo: number, hi: number) {
  expect(x).toBeGreaterThanOrEqual(lo);
  expect(x).toBeLessThanOrEqual(hi);
}

describe('WeightedPhiCalculator', () => {
  const baseAtt = {
    focused_content: 'x',
    attention_strength: 0.8, // high focus
    focus_duration_ms: 200,
    peripheral_awareness: [],
    attention_switching_cost: 0.1, // low cost -> high switch complement
    binding_coherence: 0.9, // high coherence
    stability: 0.9,
    flow_level: 0.8,
  } as any;

  test('normalizes weights that do not sum to 1', async () => {
    const calc = new WeightedPhiCalculator();
    const r1 = await calc.calculatePhi({ att: baseAtt, weights: { gwt: 2, causal: 2, pp: 2 } }); // sums to 6
    const r2 = await calc.calculatePhi({ att: baseAtt, weights: { gwt: 1, causal: 1, pp: 1 } }); // sums to 3
    // With the same ratios, phi should be identical (after normalization)
    expect(Math.abs(r1.phi_value - r2.phi_value)).toBeLessThan(1e-6);
    expectBetween(r1.phi_value, 0, 10);
  });

  test('defaults are applied when weights are missing', async () => {
    const calc = new WeightedPhiCalculator();
    const r1 = await calc.calculatePhi({ att: baseAtt }); // default 0.5/0.3/0.2
    const r2 = await calc.calculatePhi({ att: baseAtt, weights: { } });
    expect(Math.abs(r1.phi_value - r2.phi_value)).toBeLessThan(1e-6);
  });

  test('increasing gwt weight increases phi when gwt component dominates', async () => {
    const calc = new WeightedPhiCalculator();
    // Set attention to favor GWT term (high focus & bind)
    const att = { ...baseAtt, attention_strength: 0.95, binding_coherence: 0.95 } as any;
    const lowGwt = await calc.calculatePhi({ att, weights: { gwt: 0.1, causal: 0.6, pp: 0.3 } });
    const highGwt = await calc.calculatePhi({ att, weights: { gwt: 0.8, causal: 0.1, pp: 0.1 } });
    expect(highGwt.phi_value).toBeGreaterThan(lowGwt.phi_value);
  });

  test('increasing causal weight increases phi when causal component dominates', async () => {
    const calc = new WeightedPhiCalculator();
    // Favor causal via high bind and low switch cost
    const att = { ...baseAtt, binding_coherence: 0.95, attention_switching_cost: 0.05 } as any;
    const lowCausal = await calc.calculatePhi({ att, weights: { gwt: 0.2, causal: 0.2, pp: 0.6 } });
    const highCausal = await calc.calculatePhi({ att, weights: { gwt: 0.1, causal: 0.8, pp: 0.1 } });
    expect(highCausal.phi_value).toBeGreaterThan(lowCausal.phi_value);
  });

  test('increasing pp weight increases phi when pp component dominates', async () => {
    const calc = new WeightedPhiCalculator();
    // Make PP component dominate by reducing GWT and causal contributions
    const att = {
      ...baseAtt,
      attention_strength: 0.2,
      binding_coherence: 0.2,
      attention_switching_cost: 0.9, // high cost -> low causal
      stability: 0.99,
      flow_level: 1.0,
    } as any;
    const lowPp = await calc.calculatePhi({ att, weights: { gwt: 0.6, causal: 0.3, pp: 0.1 } });
    const highPp = await calc.calculatePhi({ att, weights: { gwt: 0.1, causal: 0.1, pp: 0.8 } });
    expect(highPp.phi_value).toBeGreaterThan(lowPp.phi_value);
  });

  test('PP modulation reduces phi when predictionError is high given the same att and weights', async () => {
    const calc = new WeightedPhiCalculator();
    // Choose attention that gives a meaningful PP component but avoids saturation
    const att = {
      focused_content: 'x',
      attention_strength: 0.8,
      focus_duration_ms: 150,
      peripheral_awareness: [],
      attention_switching_cost: 0.2, // switch complement = 0.8
      binding_coherence: 0.8,
      stability: 0.9,
      flow_level: 0.8,
    } as any;
    const weights = { gwt: 0.1, causal: 0.1, pp: 0.8 };

    const lowErr = await calc.calculatePhi({ att, weights, predictionError: 0.0 });
    const highErr = await calc.calculatePhi({ att, weights, predictionError: 0.9 });

    expect(highErr.phi_value).toBeLessThan(lowErr.phi_value);
  });

  test('phi components respond monotonically to attention parameters', async () => {
    const calc = new WeightedPhiCalculator();
    // Base state
    const base = {
      focused_content: 'x',
      attention_strength: 0.5,
      focus_duration_ms: 100,
      peripheral_awareness: [],
      attention_switching_cost: 0.5,
      binding_coherence: 0.5,
      stability: 0.5,
      flow_level: 0.5,
    } as any;

    // information increases with focus (attention_strength)
    const lowFocus = await calc.calculatePhi({ att: { ...base, attention_strength: 0.2 } });
    const highFocus = await calc.calculatePhi({ att: { ...base, attention_strength: 0.9 } });
    expect(highFocus.components.information).toBeGreaterThan(lowFocus.components.information);

    // integration increases with binding_coherence
    const lowBind = await calc.calculatePhi({ att: { ...base, binding_coherence: 0.2 } });
    const highBind = await calc.calculatePhi({ att: { ...base, binding_coherence: 0.9 } });
    expect(highBind.components.integration).toBeGreaterThan(lowBind.components.integration);

    // exclusion increases as switching cost complement increases (i.e., when attention_switching_cost decreases)
    const highSwitchCost = await calc.calculatePhi({ att: { ...base, attention_switching_cost: 0.9 } }); // complement small
    const lowSwitchCost = await calc.calculatePhi({ att: { ...base, attention_switching_cost: 0.1 } }); // complement large
    expect(lowSwitchCost.components.exclusion).toBeGreaterThan(highSwitchCost.components.exclusion);

    // intrinsic_existence increases with stability
    const lowStab = await calc.calculatePhi({ att: { ...base, stability: 0.1 } });
    const highStab = await calc.calculatePhi({ att: { ...base, stability: 0.9 } });
    expect(highStab.components.intrinsic_existence).toBeGreaterThan(lowStab.components.intrinsic_existence);

    // unification increases with min(focus, bind)
    const uniLow = await calc.calculatePhi({ att: { ...base, attention_strength: 0.2, binding_coherence: 0.8 } }); // min=0.2
    const uniHigh = await calc.calculatePhi({ att: { ...base, attention_strength: 0.7, binding_coherence: 0.8 } }); // min=0.7
    expect(uniHigh.components.unification).toBeGreaterThan(uniLow.components.unification);
  });

  test('PP modulation extremes and clamping', async () => {
    const calc = new WeightedPhiCalculator();
    const att = { focused_content: 'x', attention_strength: 0.5, binding_coherence: 0.5, attention_switching_cost: 0.5, stability: 0.9, flow_level: 0.9 } as any;
    const weights = { gwt: 0.1, causal: 0.1, pp: 0.8 };

    const phi0 = await calc.calculatePhi({ att, weights, predictionError: 0 });
    const phi1 = await calc.calculatePhi({ att, weights, predictionError: 1 });
    expect(phi1.phi_value).toBeLessThan(phi0.phi_value);

    // Clamp below 0 -> behaves like 0
    const phiNeg = await calc.calculatePhi({ att, weights, predictionError: -1 });
    expect(Math.abs(phiNeg.phi_value - phi0.phi_value)).toBeLessThan(1e-9);

    // Clamp above 1 -> behaves like 1
    const phiBig = await calc.calculatePhi({ att, weights, predictionError: 2 });
    expect(Math.abs(phiBig.phi_value - phi1.phi_value)).toBeLessThan(1e-9);
  });

  test('PP modulation monotonicity across errors', async () => {
    const calc = new WeightedPhiCalculator();
    const att = { focused_content: 'x', attention_strength: 0.6, binding_coherence: 0.6, attention_switching_cost: 0.4, stability: 0.8, flow_level: 0.8 } as any;
    const weights = { gwt: 0.2, causal: 0.2, pp: 0.6 };
    const errs = [0, 0.25, 0.5, 0.75, 1];
    const vals: number[] = [];
    for (const e of errs) vals.push((await calc.calculatePhi({ att, weights, predictionError: e })).phi_value);
    for (let i = 0; i < vals.length - 1; i++) {
      expect(vals[i+1]).toBeLessThanOrEqual(vals[i] + 1e-12);
    }
  });

  test('PP modulation sensitivity to pp weight', async () => {
    const calc = new WeightedPhiCalculator();
    const att = { focused_content: 'x', attention_strength: 0.5, binding_coherence: 0.5, attention_switching_cost: 0.5, stability: 0.95, flow_level: 0.95 } as any;

    const wLow = { gwt: 0.6, causal: 0.3, pp: 0.1 };
    const wHigh = { gwt: 0.1, causal: 0.1, pp: 0.8 };

    const low0 = (await calc.calculatePhi({ att, weights: wLow, predictionError: 0 })).phi_value;
    const low1 = (await calc.calculatePhi({ att, weights: wLow, predictionError: 1 })).phi_value;
    const high0 = (await calc.calculatePhi({ att, weights: wHigh, predictionError: 0 })).phi_value;
    const high1 = (await calc.calculatePhi({ att, weights: wHigh, predictionError: 1 })).phi_value;

    const dropLow = low0 - low1;
    const dropHigh = high0 - high1;
    expect(dropHigh).toBeGreaterThan(dropLow);
  });

  test('PP modulation does not alter components and ignores NaN/undefined', async () => {
    const calc = new WeightedPhiCalculator();
    const att = { focused_content: 'x', attention_strength: 0.7, binding_coherence: 0.6, attention_switching_cost: 0.4, stability: 0.9, flow_level: 0.9 } as any;
    const weights = { gwt: 0.3, causal: 0.2, pp: 0.5 };

    const a = await calc.calculatePhi({ att, weights, predictionError: 0.25 });
    const b = await calc.calculatePhi({ att, weights, predictionError: 0.75 });
    expect(a.components).toEqual(b.components);

    const none = await calc.calculatePhi({ att, weights });
    const nan = await calc.calculatePhi({ att, weights, predictionError: NaN as any });
    expect(Math.abs(none.phi_value - nan.phi_value)).toBeLessThan(1e-12);
  });
});

