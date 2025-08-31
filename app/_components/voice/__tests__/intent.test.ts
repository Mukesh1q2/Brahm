import { parseVoiceIntents } from '../intent';

describe('parseVoiceIntents', () => {
  test('navigations', () => {
    expect(parseVoiceIntents('open education')[0]).toEqual({ type: 'navigate', path: '/education' });
    expect(parseVoiceIntents('start superposition').some(a=> a.type==='navigate' && (a as any).path==='/education/superposition')).toBe(true);
    expect(parseVoiceIntents('open qft').some(a=> a.type==='navigate' && (a as any).path==='/education/qft')).toBe(true);
    expect(parseVoiceIntents('open fourier').some(a=> a.type==='navigate' && (a as any).path==='/education/qft')).toBe(true);
  });
  test('save diary/snapshot', () => {
    const a1 = parseVoiceIntents('please save a diary note');
    expect(a1.some(a=>a.type==='saveDiary')).toBe(true);
    const a2 = parseVoiceIntents('persist snapshot now');
    expect(a2.some(a=>a.type==='saveSnapshot')).toBe(true);
  });
  test('settings', () => {
    const a = parseVoiceIntents('tone wise scope local language es profile energetic');
    expect(a.find(x=>x.type==='setTone')).toEqual({ type: 'setTone', tone: 'wise' });
    expect(a.find(x=>x.type==='setScope')).toEqual({ type: 'setScope', scope: 'local' });
    expect(a.find(x=>x.type==='setLanguage')).toEqual({ type: 'setLanguage', lang: 'es' });
    expect(a.find(x=>x.type==='setProfile')).toEqual({ type: 'setProfile', profile: 'energetic' });
  });
  test('mic and test voice', () => {
    const a = parseVoiceIntents('stop listening then test voice and start listening');
    expect(a.some(x=>x.type==='mic' && (x as any).state==='stop')).toBe(true);
    expect(a.some(x=>x.type==='testVoice')).toBe(true);
    expect(a.some(x=>x.type==='mic' && (x as any).state==='start')).toBe(true);
  });
});
