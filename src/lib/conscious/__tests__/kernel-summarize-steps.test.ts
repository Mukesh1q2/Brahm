import { ConsciousKernel } from '@/lib/conscious/kernel';
import type { KernelEvent } from '@/types/Conscious';

// Verify summarize().steps is consistent with the number of emitted events.
// We expect summarize().steps to equal events.length per current implementation.

describe('ConsciousKernel summarize steps consistency', () => {
  test('steps equals number of emitted events', async () => {
    const kernel = new ConsciousKernel({ maxSteps: 3, seed: 777 });
    const events: KernelEvent[] = [] as any;
    for await (const ev of kernel.run('Steps consistency test')) events.push(ev);
    const summary = kernel.summarize(events, 'Steps consistency test');

    expect(typeof summary.steps).toBe('number');
    expect(summary.steps).toBe(events.length);
  });
});

