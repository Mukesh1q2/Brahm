import { SimpleWorkspace } from '@/lib/cips';

describe('SimpleWorkspace', () => {
  test('selectWinner is deterministic for given seed and inputs', async () => {
    const ws = new SimpleWorkspace();
    const inputs = ['goal:alpha', 'snapshot:beta'];
    const coalitions = await ws.formCoalitions(inputs);
    const w1 = await ws.selectWinner(coalitions, 123);
    const w2 = await ws.selectWinner(coalitions, 123);
    expect(w1?.id).toBe(w2?.id);
  });
});

