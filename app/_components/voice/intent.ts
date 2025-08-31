export type VoiceAction =
  | { type: 'navigate'; path: string }
  | { type: 'saveDiary' }
  | { type: 'saveSnapshot' }
  | { type: 'setTone'; tone: 'friendly'|'humorous'|'wise' }
  | { type: 'setScope'; scope: 'global'|'local' }
  | { type: 'setLanguage'; lang: string }
  | { type: 'mic'; state: 'start'|'stop' }
  | { type: 'testVoice' }
  | { type: 'setProfile'; profile: 'soft'|'energetic'|'balanced' }
  | { type: 'greet' };

export function parseVoiceIntents(transcript: string): VoiceAction[] {
  const t = (transcript || '').toLowerCase();
  const actions: VoiceAction[] = [];
  const nav = /\b(open|go to|start) (education|console|chat|quantum|superposition|tunneling|gravity|bloch sphere|bloch|bb84 qkd|bb84|qkd|circuits|circuit demo|qft|fourier|teleportation|superdense coding|superdense|adiabatic|annealing|density matrix|density matrices|repeaters|quantum repeaters|quantum internet)\b/.exec(t);
  if (nav) {
    const k = nav[2];
    if (k.includes('education')) actions.push({ type: 'navigate', path: '/education' });
    else if (k.includes('console')) actions.push({ type: 'navigate', path: '/console' });
    else if (k.includes('chat')) actions.push({ type: 'navigate', path: '/chat' });
    else if (k.includes('quantum')) actions.push({ type: 'navigate', path: '/quantum' });
    else if (k.includes('superposition')) actions.push({ type: 'navigate', path: '/education/superposition' });
    else if (k.includes('tunneling')) actions.push({ type: 'navigate', path: '/education/tunneling' });
    else if (k.includes('gravity')) actions.push({ type: 'navigate', path: '/education/gravity' });
    else if (k.includes('bloch')) actions.push({ type: 'navigate', path: '/education/bloch' });
    else if (k.includes('bb84') || k === 'qkd') actions.push({ type: 'navigate', path: '/education/bb84' });
    else if (k.includes('circuits') || k.includes('circuit demo')) actions.push({ type: 'navigate', path: '/education/circuits' });
    else if (k.includes('qft') || k.includes('fourier')) actions.push({ type: 'navigate', path: '/education/qft' });
    else if (k.includes('teleportation')) actions.push({ type: 'navigate', path: '/education/teleportation' });
    else if (k.includes('superdense')) actions.push({ type: 'navigate', path: '/education/superdense' });
    else if (k.includes('adiabatic')) actions.push({ type: 'navigate', path: '/education/adiabatic' });
    else if (k.includes('annealing')) actions.push({ type: 'navigate', path: '/education/annealing' });
    else if (k.includes('density')) actions.push({ type: 'navigate', path: '/education/density' });
    else if (k.includes('repeater') || k.includes('internet')) actions.push({ type: 'navigate', path: '/education/repeaters' });
  }
  // QFT actions
  if (/(run|start|execute) (the )?(qft|fourier)/.test(t)) {
    actions.push({ type: 'navigate', path: '/education/qft' });
    // A follow-up event lets the page act (e.g., run demo / load preset)
    // VoiceCommandsShim will dispatch a DOM event we can listen to
    // by convention: 'voice:runQFT'
  }
  // Kernel stream
  if (/(open|start).*(kernel stream)/.test(t)) {
    actions.push({ type: 'navigate', path: '/console?autostream=1&e2e_pg=1' });
  }
  if (/(save|persist).*(diary|note)/.test(t)) actions.push({ type: 'saveDiary' });
  if (/(persist|save).*snapshot/.test(t)) actions.push({ type: 'saveSnapshot' });
  if (/greet( me)?/.test(t)) actions.push({ type: 'greet' });
  const tone = /tone (friendly|humorous|wise)/.exec(t);
  if (tone) actions.push({ type: 'setTone', tone: tone[1] as any });
  const scope = /scope (global|local)/.exec(t);
  if (scope) actions.push({ type: 'setScope', scope: scope[1] as any });
  const lang = /language (\w\w)/.exec(t);
  if (lang) actions.push({ type: 'setLanguage', lang: lang[1] });
  if (/stop listening/.test(t)) actions.push({ type: 'mic', state: 'stop' });
  if (/start listening/.test(t)) actions.push({ type: 'mic', state: 'start' });
  if (/test voice/.test(t)) actions.push({ type: 'testVoice' });
  const profile = /profile (soft|energetic|balanced)/.exec(t);
  if (profile) actions.push({ type: 'setProfile', profile: profile[1] as any });
  return actions;
}
