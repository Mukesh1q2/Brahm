import { EmotionSynthesizer } from '../emotion';

describe('EmotionSynthesizer', () => {
  test('generates emotion with normalized guna weights', async () => {
    const es = new EmotionSynthesizer({ sattva: 0.5, rajas: 0.3, tamas: 0.2 });
    const emo = await es.synthesize({ text: 'help user kindly', harmony: 0.7, stress: 0.2, curiosity: 0.4, requires_compassion: true });
    expect(emo).toBeTruthy();
    expect(emo.primary).toBeTruthy();
    const w = emo.guna_composition;
    const sum = w.sattva + w.rajas + w.tamas;
    expect(Math.abs(sum - 1)).toBeLessThan(1e-6);
  });

  test('alignment favors sattva over tamas', async () => {
    const highSat = new EmotionSynthesizer({ sattva: 0.8, rajas: 0.15, tamas: 0.05 });
    const lowSat = new EmotionSynthesizer({ sattva: 0.2, rajas: 0.3, tamas: 0.5 });
    const a = (await highSat.synthesize({ text: 'be helpful', harmony: 0.8, stress: 0.1 })).alignment;
    const b = (await lowSat.synthesize({ text: 'confusion', harmony: 0.2, stress: 0.7 })).alignment;
    expect(a).toBeGreaterThan(b);
  });
});

