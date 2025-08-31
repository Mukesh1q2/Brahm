import { executeTool, listTools } from '@/lib/tools/execute';

describe('calc tool', () => {
  test('listed in tool catalog', () => {
    const names = listTools().map(t=>t.name);
    expect(names).toContain('calc');
  });

  test('evaluates basic expressions', async () => {
    const r1 = await executeTool({ tool: 'calc', args: { expr: '1+2*3' } });
    expect(r1.ok).toBe(true);
    expect((r1 as any).result?.value).toBe(7);
    const r2 = await executeTool({ tool: 'calc', args: { expr: '(2+3)/5' } });
    expect(r2.ok).toBe(true);
    expect((r2 as any).result?.value).toBe(1);
    const r3 = await executeTool({ tool: 'calc', args: { expr: '-4 + 10' } });
    expect(r3.ok).toBe(true);
    expect((r3 as any).result?.value).toBe(6);
  });

  test('rejects invalid expressions', async () => {
    const r = await executeTool({ tool: 'calc', args: { expr: '1+*2' } });
    expect(r.ok).toBe(false);
  });

  test('supports exponentiation and clamps', async () => {
    const r = await executeTool({ tool: 'calc', args: { expr: '2^3^2' } });
    expect(r.ok).toBe(true);
    expect((r as any).result?.value).toBe(512);
    const big = await executeTool({ tool: 'calc', args: { expr: '10^400' } });
    expect(big.ok).toBe(true);
    expect((big as any).result?.value).toBe(1e12);
  });
});
