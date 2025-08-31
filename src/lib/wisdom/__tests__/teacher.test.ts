import { UniversalVedicTeacher } from '../../wisdom/teacher';

describe('UniversalVedicTeacher', () => {
  test('returns passages, bridges and guidance', async () => {
    const t = new UniversalVedicTeacher();
    const out = await t.teach('duty and detachment', { svabhava: 'engineer' });
    expect(Array.isArray(out.vedic_passages)).toBe(true);
    expect(out.daily_guidance).toBeTruthy();
    expect(typeof out.synthesis).toBe('string');
  });
});

