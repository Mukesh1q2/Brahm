import { ConsciousKernel } from '@/lib/conscious/kernel';
import type { KernelEvent } from '@/types/Conscious';

// Verify kernel emits CIPS events when enabled

describe('ConsciousKernel with CIPS enabled', () => {
  test('emits coalitions, winner, qualia, prediction, self_model, evolution', async () => {
    const kernel = new ConsciousKernel({ maxSteps: 1, seed: 123, enableCIPS: true });
    const events: KernelEvent[] = [] as any;
    for await (const ev of kernel.run('CIPS goal')) events.push(ev);
    const types = events.map(e => e.type);
    expect(types).toContain('cips:coalitions');
    expect(types).toContain('cips:workspace_winner');
    expect(types).toContain('cips:qualia');
    expect(types).toContain('cips:prediction');
    expect(types).toContain('cips:self_model');
    expect(types).toContain('cips:evolution');
  });
});

