import { jest } from '@jest/globals';

// Mock kernels to capture constructor args and avoid heavy generators
jest.mock('@/lib/conscious/kernel', () => {
  let lastArgs: any = null;
  class ConsciousKernel {
    constructor(args: any) { lastArgs = args; }
    async *run(goal: string) { if (goal) { /* no-op */ } return; }
  }
  return { ConsciousKernel, __lastArgs: () => lastArgs };
});

jest.mock('@/lib/conscious/kernel-enhanced', () => {
  let lastArgs: any = null;
  class EnhancedConsciousKernel {
    constructor(args: any) { lastArgs = args; }
    async *runEnhanced(goal: string) { if (goal) { /* no-op */ } return; }
  }
  return { EnhancedConsciousKernel, __lastArgsEnhanced: () => lastArgs };
});

describe('GET /api/agents/stream parses query and picks kernel', () => {
  test('base kernel passes profile=basic', async () => {
    const { GET }: any = await import('../route');
    const req: any = { url: 'http://localhost/api/agents/stream?goal=x&steps=1&profile=basic' };
    const res = await GET(req);
    expect(res).toBeTruthy();
    const { __lastArgs } = await import('@/lib/conscious/kernel');
    const args = (__lastArgs as any)();
    expect(args?.moduleProfile).toBe('basic');
    expect(args?.maxSteps).toBe(1);
  });

  test('enhanced kernel passes profile=enhanced', async () => {
    const { GET }: any = await import('../route');
    const req: any = { url: 'http://localhost/api/agents/stream?goal=y&steps=2&enhanced=true&profile=enhanced' };
    const res = await GET(req);
    expect(res).toBeTruthy();
    const { __lastArgsEnhanced } = await import('@/lib/conscious/kernel-enhanced');
    const args = (__lastArgsEnhanced as any)();
    expect(args?.moduleProfile).toBe('enhanced');
    expect(args?.maxSteps).toBe(2);
  });
});

