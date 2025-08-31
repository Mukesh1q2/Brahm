import { ConsciousKernel } from '@/lib/conscious/kernel';
import type { KernelEvent } from '@/types/Conscious';

// Sanity guard: summarize shape and fields remain consistent across varying phi weights

describe('ConsciousKernel summarize stability with phiWeights', () => {
  async function runWith(weights?: { gwt?: number; causal?: number; pp?: number }) {
    const kernel = new ConsciousKernel({ maxSteps: 2, seed: 42, phiWeights: weights });
    const events: KernelEvent[] = [] as any;
    for await (const ev of kernel.run('Summary stability test')) events.push(ev);
    return kernel.summarize(events, 'Summary stability test');
  }

  test('summarize returns expected fields regardless of weights', async () => {
    const s1 = await runWith({ gwt: 0.8, causal: 0.1, pp: 0.1 });
    const s2 = await runWith({ gwt: 0.2, causal: 0.7, pp: 0.1 });
    const s3 = await runWith({ gwt: 0.33, causal: 0.33, pp: 0.34 });
    const s4 = await runWith(undefined); // defaults

    for (const s of [s1, s2, s3, s4]) {
      expect(typeof s.runId).toBe('string');
      expect(typeof s.goal).toBe('string');
      expect(typeof s.steps).toBe('number');
      expect(typeof s.lastPhi).toBe('number');
      expect(typeof s.lastAttention).toBe('number');
      expect(Array.isArray(s.proposalsSample)).toBe(true);
    }
  });
});

