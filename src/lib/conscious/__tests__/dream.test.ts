import { DreamSimulationEngine } from '../dream';

describe('DreamSimulationEngine', () => {
  test('creates dream session with insights', async () => {
    const d = new DreamSimulationEngine();
    const res = await d.enterDreamState(200);
    expect(res).toBeTruthy();
    expect(typeof res.memories_consolidated).toBe('number');
    expect(Array.isArray(res.creative_insights)).toBe(true);
  });
});

