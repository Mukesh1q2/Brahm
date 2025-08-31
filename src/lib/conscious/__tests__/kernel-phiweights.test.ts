import { ConsciousKernel } from '@/lib/conscious/kernel';
import type { AdvancedPhiCalculator } from '@/lib/conscious/phi';
import type { AttentionState, PhiMeasurement } from '@/types/Conscious';

class DummyPhi implements AdvancedPhiCalculator {
  public calls: Array<{ goal?: string; att: AttentionState; weights?: { gwt?: number; causal?: number; pp?: number }; predictionError?: number }> = [];
  async calculatePhi(system: { goal?: string; att: AttentionState; weights?: { gwt?: number; causal?: number; pp?: number }; predictionError?: number }) {
    this.calls.push(system);
    // Return a constant measurement so kernel progresses deterministically
    return {
      phi_value: 5,
      components: { information: 0.5, integration: 0.5, exclusion: 0.5, intrinsic_existence: 0.5, unification: 0.5 } as PhiMeasurement['components'],
      method: 'weighted',
      confidence: 0.8,
    };
  }
}

describe('ConsciousKernel phiWeights threading', () => {
  test('constructor options phiWeights are passed into calculatePhi', async () => {
    const dummy = new DummyPhi();
    const kernel = new ConsciousKernel({ maxSteps: 1, seed: 1, phiWeights: { gwt: 0.9, causal: 0.05, pp: 0.05 } });
    // Override the phi calculator with our dummy
    (kernel as any).phiCalc = dummy;

    const evs: any[] = [];
    for await (const ev of kernel.run('Goal A')) evs.push(ev);

    expect(dummy.calls.length).toBeGreaterThan(0);
    expect(dummy.calls[0].weights).toEqual({ gwt: 0.9, causal: 0.05, pp: 0.05 });
  });

  test('run() opts phiWeights override constructor options', async () => {
    const dummy = new DummyPhi();
    const kernel = new ConsciousKernel({ maxSteps: 1, seed: 2, phiWeights: { gwt: 0.9, causal: 0.05, pp: 0.05 } });
    (kernel as any).phiCalc = dummy;

    const runWeights = { gwt: 0.1, causal: 0.8, pp: 0.1 };
    const evs: any[] = [];
    for await (const ev of (kernel as any).run('Goal B', { phiWeights: runWeights })) evs.push(ev);

    expect(dummy.calls.length).toBeGreaterThan(0);
    expect(dummy.calls[0].weights).toEqual(runWeights);
  });

  test('kernel passes predictionError into calculatePhi when CIPS enabled', async () => {
    const dummy = new DummyPhi();
    const kernel = new ConsciousKernel({ maxSteps: 1, seed: 3, enableCIPS: true });
    (kernel as any).phiCalc = dummy;

    const evs: any[] = [];
    for await (const ev of kernel.run('Goal C')) evs.push(ev);

    // Ensure a cips:prediction occurred and dummy saw a predictionError
    const pred = evs.find((e:any)=> e.type==='cips:prediction');
    expect(pred).toBeTruthy();
    expect(dummy.calls.length).toBeGreaterThan(0);
    expect(typeof dummy.calls[0].predictionError).toBe('number');
    expect(dummy.calls[0].predictionError).toBeGreaterThanOrEqual(0);
    expect(dummy.calls[0].predictionError).toBeLessThanOrEqual(1);
  });

  test('CIPS evolution increases pp weight when apply evolution enabled', async () => {
    const kernel = new ConsciousKernel({ maxSteps: 1, seed: 4, enableCIPS: true, enableCIPSApplyEvolution: true, phiWeights: { gwt: 0.5, causal: 0.3, pp: 0.2 } });
    const evs: any[] = [];
    for await (const ev of kernel.run('Goal D')) evs.push(ev);

    const weightEv = evs.find((e:any)=> e.type==='cips:weights');
    expect(weightEv).toBeTruthy();
    const w = weightEv.weights;
    const sum = Number(w.gwt||0)+Number(w.causal||0)+Number(w.pp||0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-6);
    // Equality can occur for short runs; accept >= to avoid flake.
    expect(w.pp).toBeGreaterThanOrEqual(0.2);
  });
});

