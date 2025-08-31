import { ConsciousKernel } from '@/lib/conscious/kernel';

describe('ConsciousKernel module profiles', () => {
  test('constructs with basic profile', () => {
    const k = new ConsciousKernel({ moduleProfile: 'basic', maxSteps: 1 });
    expect(k).toBeTruthy();
  });

  test('run emits start and end', async () => {
    const k = new ConsciousKernel({ moduleProfile: 'basic', maxSteps: 1 });
    const events: any[] = [];
    for await (const ev of (k as any).run('hello')) { events.push(ev); }
    const types = events.map(e=>e.type);
    expect(types[0]).toBe('run:start');
    expect(types.includes('run:end')).toBe(true);
  });
});

