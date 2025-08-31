import { ConsciousKernel } from '@/lib/conscious/kernel';
import type { KernelEvent } from '@/types/Conscious';

// Basic smoke tests for kernel sequencing and contract shapes

describe('ConsciousKernel', () => {
  test('emits a run sequence with expected event types', async () => {
    const kernel = new ConsciousKernel({ maxSteps: 3, seed: 123 });
    const events: KernelEvent[] = [] as any;
    for await (const ev of kernel.run('Test goal')) events.push(ev);

    // Start and end
    expect(events.find(e => e.type === 'run:start')).toBeTruthy();
    expect(events.find(e => e.type === 'run:end')).toBeTruthy();

    // Attention, phi, stability should appear at least once
    expect(events.some(e => e.type === 'attention')).toBe(true);
    expect(events.some(e => e.type === 'phi')).toBe(true);
    expect(events.some(e => e.type === 'stability')).toBe(true);

    // If conscious_access occurred, we expect an experience and learning around it
    const hasAccess = events.some(e => e.type === 'conscious_access' && e.has_access);
    if (hasAccess) {
      expect(events.some(e => e.type === 'experience')).toBe(true);
      expect(events.some(e => e.type === 'learning')).toBe(true);
    }
  });

  test('summarize reports lastPhi and lastAttention', async () => {
    const kernel = new ConsciousKernel({ maxSteps: 2, seed: 456 });
    const events: KernelEvent[] = [] as any;
    for await (const ev of kernel.run('Summarize goal')) events.push(ev);
    const summary = kernel.summarize(events, 'Summarize goal');
    expect(summary.runId).toBeTruthy();
    expect(Number.isFinite(summary.lastPhi)).toBe(true);
    expect(Number.isFinite(summary.lastAttention)).toBe(true);
    expect(Array.isArray(summary.proposalsSample)).toBe(true);
  });
});

