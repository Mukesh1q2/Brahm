import { ConsciousKernel } from '@/lib/conscious/kernel';
import type { KernelEvent } from '@/types/Conscious';

// Ensure summarize() proposalsSample length and types remain stable for larger runs

describe('ConsciousKernel summarize proposalsSample stability', () => {
  test('proposalsSample is an array of strings with a small cap', async () => {
    const kernel = new ConsciousKernel({ maxSteps: 10, seed: 99 });
    const events: KernelEvent[] = [] as any;
    for await (const ev of kernel.run('Proposals sample stability')) events.push(ev);
    const summary = kernel.summarize(events, 'Proposals sample stability');

    expect(Array.isArray(summary.proposalsSample)).toBe(true);
    // The implementation keeps first two proposal summaries
    expect(summary.proposalsSample.length).toBeLessThanOrEqual(2);
    for (const s of summary.proposalsSample) {
      expect(typeof s).toBe('string');
    }
  });
});

