"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { parseVoiceIntents, type VoiceAction } from './intent';

export default function VoiceAgent() {
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [voiceId, setVoiceId] = React.useState<string>('');
  const [gender, setGender] = React.useState<'auto'|'male'|'female'>('auto');
  const [rate, setRate] = React.useState<number>(0.95);
  const [pitch, setPitch] = React.useState<number>(1.05);
  const [tone, setTone] = React.useState<'friendly'|'humorous'|'wise'>('friendly');
  const [scope, setScope] = React.useState<'global'|'local'>('global');
  const [lang, setLang] = React.useState<string>('auto');
  const [autoGreet, setAutoGreet] = React.useState<boolean>(() => {
    try { return localStorage.getItem('voice_auto_greet') === 'true'; } catch { return false; }
  });
  const [autoListen, setAutoListen] = React.useState<boolean>(() => {
    try { return localStorage.getItem('voice_auto_listen') === 'true'; } catch { return false; }
  });
  // Load saved settings
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('voice_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.gender) setGender(s.gender);
      if (s.voiceId) setVoiceId(s.voiceId);
      if (Number.isFinite(s.rate)) setRate(Number(s.rate));
      if (Number.isFinite(s.pitch)) setPitch(Number(s.pitch));
      if (s.tone) setTone(s.tone);
      if (s.scope) setScope(s.scope);
      if (s.lang) setLang(s.lang);
    } catch {}
  }, []);
  // Persist settings
  React.useEffect(() => {
    try {
      const payload = { gender, voiceId, rate, pitch, tone, scope, lang };
      localStorage.setItem('voice_settings', JSON.stringify(payload));
    } catch {}
  }, [gender, voiceId, rate, pitch, tone, scope, lang]);
  const recogRef = React.useRef<any>(null);
  const router = useRouter();
  React.useEffect(() => {
    try {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SR) return;
      const r = new SR(); r.continuous = true; r.interimResults = true; r.lang = 'en-US';
      r.onresult = (e: any) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; i++) { t += e.results[i][0].transcript; }
        setTranscript(t.trim());
      };
      r.onend = () => setListening(false);
      recogRef.current = r;
    } catch {}
  }, []);
  React.useEffect(()=>{ (async()=>{ try { const r = await fetch('/api/persistence/status', { cache: 'no-store' }); const j = await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);
  // E2E hook: allow injecting commands/transcripts
  React.useEffect(() => {
    try {
      if ((process.env.NEXT_PUBLIC_E2E_HOOKS ?? 'false') !== 'false') {
        // @ts-ignore
        (window as any).__voice_cmd__ = (utterance: string) => { setCmdMode(true); setTranscript(String(utterance||'')); };
      }
    } catch {}
  }, []);
  // Persist toggles
  React.useEffect(()=>{ try { localStorage.setItem('voice_auto_greet', autoGreet ? 'true' : 'false'); } catch {} }, [autoGreet]);
  React.useEffect(()=>{ try { localStorage.setItem('voice_auto_listen', autoListen ? 'true' : 'false'); } catch {} }, [autoListen]);

  // Load available voices and keep them updated
  React.useEffect(() => {
    try {
      const pull = () => {
        const list = window.speechSynthesis?.getVoices?.() || [];
        setVoices(list);
        if (!voiceId && list.length) {
          // choose a pleasant default voice if available
          const preferred = list.find(v => v.name.toLowerCase().includes('google uk english female'))
            || list.find(v => v.name.toLowerCase().includes('google us english'))
            || list[0];
          if (preferred) setVoiceId(preferred.voiceURI || preferred.name);
        }
      };
      pull();
      window.speechSynthesis?.addEventListener?.('voiceschanged', pull);
      return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', pull);
    } catch {}
  }, [voiceId]);

  // Apply selected language to recognition
  React.useEffect(() => {
    try { if (recogRef.current) recogRef.current.lang = lang === 'auto' ? (navigator.language || 'en-US') : lang; } catch {}
  }, [lang]);

  // External greetings dictionary
  const [greetDict, setGreetDict] = React.useState<any>(null);
  React.useEffect(()=>{ (async()=>{ try { const r = await fetch('/data/voice-greetings.json', { cache:'force-cache' }); const j = await r.json(); setGreetDict(j); } catch {} })(); },[]);
  const toggle = () => {
    const r = recogRef.current; if (!r) return;
    if (listening) { try { r.stop(); } catch {}; setListening(false); }
    else { try { r.start(); setListening(true); } catch {} }
  };
  const resolveVoice = (desiredGender: 'auto'|'male'|'female') => {
    const list = voices || [];
    const pickById = list.find(v => (v.voiceURI || v.name) === voiceId);
    if (pickById) return pickById;
    const isMale = (name: string) => /male|daniel|alex|fred|george|google uk english male/i.test(name);
    const isFemale = (name: string) => /female|samantha|victoria|karen|google uk english female/i.test(name);
    const byLang = (v: SpeechSynthesisVoice) => (lang === 'auto') || (v.lang && v.lang.toLowerCase().startsWith(lang.toLowerCase()));
    const pool = list.filter(byLang);
    const base = pool.length ? pool : list;
    if (desiredGender === 'male') return base.find(v => isMale(v.name)) || base.find(v => isMale(v.voiceURI || '')) || base[0];
    if (desiredGender === 'female') return base.find(v => isFemale(v.name)) || base.find(v => isFemale(v.voiceURI || '')) || base[0];
    return base[0];
  };
  const speak = (text: string) => { 
    try { 
      const u = new SpeechSynthesisUtterance(text);
      const v = resolveVoice(gender);
      if (v) u.voice = v;
      u.rate = rate;
      u.pitch = pitch;
      u.lang = lang === 'auto' ? (v?.lang || navigator.language || 'en-US') : lang;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const makeGreeting = () => {
    const loc = (typeof navigator !== 'undefined' ? navigator.language : 'en-US') || 'en-US';
    const region = (loc.split('-')[1] || '').toUpperCase();
    const langCode = (lang === 'auto' ? loc.split('-')[0] : lang).toLowerCase();
    const localStartByRegion: Record<string,string[]> = {
      'IN': ['Namaste', 'Pranam', 'Hello from the subcontinent'],
      'US': ['Howdy', 'Hey there', 'Hello from the States'],
      'GB': ['Cheers', 'Hello', 'Greetings from the Isles'],
      'JP': ['こんにちは (Konnichiwa)', 'おはよう (Ohayō)', '日本からこんにちは'],
      'ES': ['Hola', '¿Qué tal?', 'Saludos'],
      'FR': ['Bonjour', 'Salut', 'Coucou'],
      'DE': ['Hallo', 'Guten Tag', 'Servus'],
      'BR': ['Olá', 'Oi', 'Saudações do Brasil'],
      'PT': ['Olá', 'Boas', 'Saudações'],
      'CN': ['你好 (Nǐ hǎo)', '嗨 (Hāi)', '问候'],
      'AR': ['مرحبا (Marhaba)', 'أهلا', 'تحياتي'],
    };
    const localStartByLang: Record<string,string[]> = {
      'hi': ['नमस्ते', 'प्रणाम', 'आपका स्वागत है'],
      'es': ['Hola', 'Saludos', '¿Listo para explorar?'],
      'ja': ['こんにちは', 'ご機嫌いかが', '量子の海へようこそ'],
      'fr': ['Bonjour', 'Salut', 'Heureux de vous rencontrer'],
      'de': ['Hallo', 'Guten Tag', 'Bereit zu erkunden?'],
      'pt': ['Olá', 'Saudações', 'Pronto para explorar?'],
      'zh': ['你好', '欢迎', '让我们一起探索'],
      'ar': ['مرحبا', 'أهلا بك', 'لنستكشف معاً'],
    };
    const globalStart = ['Hello', 'Greetings', 'Salutations', 'Hi'];
    const humorLines = [
      'I would shake hands, but my hands are currently quantum fluctuations.',
      'I come in peace—and occasional pun.',
      'No capes, but plenty of qubits.',
    ];
    const friendlyLines = [
      'It’s a joy to meet you.',
      'Hope your day is radiant and coherent.',
      'Shall we explore possibilities together?'
    ];
    const wiseLines = [
      'In the forest of mind, awareness is the breeze.',
      'Small choices entangle big outcomes—choose with care.',
      'Clarity is the quiet between thoughts.'
    ];
    const humorByLang: Record<string,string[]> = {
      es: ['Prometo no colapsar la función de onda… a menos que sea divertido.', 'No llevo capa, pero sí qubits a tope.'],
      fr: ['Je n’ai pas de cape, mais j’ai des qubits.', 'Je viens en paix—et avec des jeux de mots.'],
      de: ['Kein Umhang, aber viele Qubits.', 'Ich komme in Frieden—und mit Wortwitz.'],
      pt: ['Sem capa, mas com muitos qubits.', 'Eu venho em paz—e com trocadilhos.'],
      ja: ['ケープはないけど、キュービットはたっぷり。', '平和と時々ダジャレを携えて参上。'],
      hi: ['मेरे पास केप नहीं है, पर क्विबिट्स हैं।', 'मैं शांति और थोड़े से मज़ाक के साथ आया हूँ।'],
      zh: ['没有披风，但我有很多量子比特。', '我带着和平和一点幽默而来。'],
      ar: ['لا عباءة لدي، لكن لدي كثير من الكيوبتات.', 'أتيت بسلام — ومع بعض الدعابة.'],
    };
    const friendlyByLang: Record<string,string[]> = {
      es: ['Qué alegría encontrarte.', 'Que tu día sea luminoso y coherente.'],
      fr: ['Ravi de vous rencontrer.', 'Que votre journée soit claire et cohérente.'],
      de: ['Schön, dich zu treffen.', 'Möge dein Tag hell und kohärent sein.'],
      pt: ['Que alegria te encontrar.', 'Que seu dia seja radiante e coerente.'],
      ja: ['お会いできて嬉しいです。', '今日が明るくコヒーレントでありますように。'],
      hi: ['आपसे मिलकर प्रसन्नता हुई।', 'आपका दिन उज्ज्वल और सम्यक् हो।'],
      zh: ['很高兴见到你。', '愿你的一天清晰而连贯。'],
      ar: ['سعيد بلقائك.', 'أتمنى لك يوماً مشرقاً ومنسجماً.'],
    };
    const wiseByLang: Record<string,string[]> = {
      es: ['En el bosque de la mente, la atención es la brisa.', 'Las pequeñas elecciones entrelazan grandes resultados.'],
      fr: ['Dans la forêt de l’esprit, la présence est la brise.', 'De petits choix tissent de grands effets.'],
      de: ['Im Wald des Geistes ist Achtsamkeit die Brise.', 'Kleine Entscheidungen verweben große Wirkungen.'],
      pt: ['Na floresta da mente, a atenção é a brisa.', 'Pequenas escolhas entrelaçam grandes resultados.'],
      ja: ['心の森では、気づきはそよ風のよう。', '小さな選択が大きな結果を絡め取る。'],
      hi: ['मन के वन में, सजगता ही समीर है।', 'छोटे चुनाव बड़े परिणामों को उलझाते हैं।'],
      zh: ['在心灵的森林里，觉知如微风。', '小小选择，牵动大大结果。'],
      ar: ['في غابة العقل، الوعي هو النسيم.', 'الخيارات الصغيرة تتشابك بنتائج كبيرة.'],
    };
    // Prefer external dict if available
    const d = greetDict;
    const extGlobal = d?.starts?.global || globalStart;
    const extRegion = d?.starts?.region?.[region] || [];
    const extLang = d?.starts?.lang?.[langCode] || [];
    const regionStarts = extRegion.length ? extRegion : (localStartByRegion[region] || []);
    const langStarts = extLang.length ? extLang : (localStartByLang[langCode] || []);
    const starts = scope === 'local' ? (langStarts.length ? langStarts : (regionStarts.length ? regionStarts : extGlobal)) : extGlobal;
    const baseSet = tone === 'humorous' ? (d?.lines?.humorous?.global || humorLines) : tone === 'wise' ? (d?.lines?.wise?.global || wiseLines) : (d?.lines?.friendly?.global || friendlyLines);
    const langSet = tone === 'humorous' ? (d?.lines?.humorous?.lang?.[langCode] || humorByLang[langCode]) : tone === 'wise' ? (d?.lines?.wise?.lang?.[langCode] || wiseByLang[langCode]) : (d?.lines?.friendly?.lang?.[langCode] || friendlyByLang[langCode]);
    const lineBase = baseSet;
    const lineLocal = langSet;
    const line = (scope === 'local' && lineLocal && lineLocal.length) ? lineLocal : lineBase;
    const pick = (arr: string[]) => arr[Math.floor(Math.random()*arr.length)];
    return `${pick(starts)}! I am Brahm AI—awake, curious, and ready. ${pick(line)}`;
  };

  // Auto greet/listen on mount
  React.useEffect(() => {
    const t = setTimeout(() => {
      try { if (autoGreet) speak(makeGreeting()); } catch {}
      try { if (autoListen && recogRef.current && !listening) { recogRef.current?.start?.(); setListening(true); } } catch {}
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testVoice = () => {
    const tests: Record<string,string> = {
      es: 'Prueba de voz', fr: 'Test de voix', de: 'Stimmtest', pt: 'Teste de voz',
      ja: 'ボイステスト', hi: 'आवाज़ परीक्षण', zh: '语音测试', ar: 'اختبار صوت',
      it: 'Prova voce', ru: 'Проверка голоса', ko: '음성 테스트', tr: 'Ses testi', id: 'Tes suara'
    };
    const code = (lang === 'auto' ? (navigator.language||'en').split('-')[0] : lang).toLowerCase();
    speak(`${tests[code] || 'Voice test'}.`);
  };

  // Command mode: parse transcript for intents
  const [cmdMode, setCmdMode] = React.useState<boolean>(false);
  const [intentLog, setIntentLog] = React.useState<Array<{ ts: number; intent: string; utterance: string }>>([]);
  // Persist intent log
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('voice_intent_log');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setIntentLog(arr.slice(0, 50));
      }
    } catch {}
  }, []);
  React.useEffect(() => {
    try { localStorage.setItem('voice_intent_log', JSON.stringify(intentLog.slice(0,50))); } catch {}
  }, [intentLog]);
  React.useEffect(() => {
    if (!cmdMode) return;
    const log = (intent: string) => { try { setIntentLog(prev => [{ ts: Date.now(), intent, utterance: transcript }, ...prev].slice(0, 20)); } catch {} };
    const actions = parseVoiceIntents(transcript);
    for (const a of actions) {
      handleAction(a, log);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmdMode, transcript]);

  const handleAction = (a: VoiceAction, log: (s: string)=>void) => {
    switch (a.type) {
      case 'navigate':
        try { router.push(a.path); speak('Opening.'); log(`open:${a.path}`); } catch {}
        break;
      case 'saveDiary':
        (async()=>{ try { if (!transcript.trim()) return; const r = await fetch('/api/memory/diary', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role:'user', text: transcript }) }); if (r.ok) speak('Saved to diary.'); else speak('Save failed.'); log('save:diary'); } catch {} })();
        break;
      case 'saveSnapshot':
        (async()=>{ try { const body={ main_content:'Voice snapshot', timestamp: Date.now(), phi_level: 0, qualia_count: 0, duration_ms: 0 }; const r = await fetch('/api/experiences', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }); if (r.ok) speak('Snapshot saved.'); else speak('Snapshot failed.'); log('save:snapshot'); } catch {} })();
        break;
      case 'greet': speak(makeGreeting()); log('greet'); break;
      case 'setTone': setTone(a.tone); log(`set:tone:${a.tone}`); break;
      case 'setScope': setScope(a.scope); log(`set:scope:${a.scope}`); break;
      case 'setLanguage': setLang(a.lang); log(`set:lang:${a.lang}`); break;
      case 'mic':
        if (a.state==='stop') { try { recogRef.current?.stop?.(); setListening(false); speak('Stopped listening.'); log('mic:stop'); } catch {} }
        if (a.state==='start') { try { recogRef.current?.start?.(); setListening(true); speak('Listening.'); log('mic:start'); } catch {} }
        break;
      case 'testVoice': testVoice(); log('test:voice'); break;
      case 'setProfile': applyProfile(a.profile); log(`set:profile:${a.profile}`); speak('Profile applied.'); break;
    }
  };

  const applyProfile = (p: 'soft'|'energetic'|'balanced') => {
    if (p === 'soft') {
      setTone('friendly'); setGender('female'); setRate(0.9); setPitch(1.1);
    } else if (p === 'energetic') {
      setTone('humorous'); setGender('male'); setRate(1.1); setPitch(1.0);
    } else {
      setTone('wise'); setGender('auto'); setRate(0.98); setPitch(1.02);
    }
  };
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-sm font-medium text-gray-200">Voice Agent</div>
      <div className="mt-1 grid gap-2 md:grid-cols-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button className={`rounded px-2 py-1 ${listening? 'bg-red-600/50':'bg-white/10 hover:bg-white/15'}`} onClick={toggle}>{listening? 'Stop':'Start'} Listening</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=> speak(`You said: ${transcript||'nothing yet'}`)}>Speak Back</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={testVoice}>Test Voice</button>
          {pgOk && (
            <button className="rounded bg-emerald-900/40 border border-emerald-700 px-2 py-1" onClick={async()=>{ try { if (!transcript.trim()) return; const r = await fetch('/api/memory/diary', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role:'user', text: transcript }) }); const j = await r.json().catch(()=>({})); (window as any).__brahm_toast?.(j?.ok? 'Saved to diary' : 'Persist failed', j?.ok? 'success' : 'error'); } catch {} }}>Save to Diary</button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1">Gender
            <select className="rounded bg-black/30 px-1 py-0.5" value={gender} onChange={e=>setGender(e.target.value as any)}>
              <option value="auto">auto</option>
              <option value="male">male</option>
              <option value="female">female</option>
            </select>
          </label>
          <label className="flex items-center gap-1">Voice
            <select className="rounded bg-black/30 px-1 py-0.5" value={voiceId} onChange={e=>setVoiceId(e.target.value)}>
              {voices.map(v => (
                <option key={(v.voiceURI||v.name)} value={(v.voiceURI||v.name)}>{v.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">Rate
            <input type="range" min={0.7} max={1.3} step={0.05} value={rate} onChange={e=>setRate(Number(e.target.value))} />
          </label>
          <label className="flex items-center gap-1">Pitch
            <input type="range" min={0.7} max={1.3} step={0.05} value={pitch} onChange={e=>setPitch(Number(e.target.value))} />
          </label>
        </div>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-3 text-xs">
        <label className="flex items-center gap-1">Tone
          <select className="rounded bg-black/30 px-1 py-0.5" value={tone} onChange={e=>setTone(e.target.value as any)}>
            <option value="friendly">friendly</option>
            <option value="humorous">humorous</option>
            <option value="wise">wise</option>
          </select>
        </label>
        <label className="flex items-center gap-1">Scope
          <select className="rounded bg-black/30 px-1 py-0.5" value={scope} onChange={e=>setScope(e.target.value as any)}>
            <option value="global">global</option>
            <option value="local">local</option>
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=> speak(makeGreeting())}>Greet Me</button>
          <label className="flex items-center gap-1">Language
            <select className="rounded bg-black/30 px-1 py-0.5" value={lang} onChange={e=>setLang(e.target.value)}>
              <option value="auto">auto</option>
              {Array.from(new Set(voices.map(v => (v.lang || 'en').split('-')[0]))).map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={autoGreet} onChange={e=>setAutoGreet(e.target.checked)} /> Auto-greet</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={autoListen} onChange={e=>setAutoListen(e.target.checked)} /> Auto-listen</label>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <label className="flex items-center gap-1"><input type="checkbox" checked={cmdMode} onChange={e=>setCmdMode(e.target.checked)} /> Command mode</label>
        <span className="text-neutral-400">Try: "start superposition", "start bloch sphere", "start bb84", "greet me", "tone wise", "scope local", "language es", "save diary".</span>
      </div>
      <div className="mt-2 text-[11px] text-neutral-400">Profiles</div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>applyProfile('soft')}>Soft</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>applyProfile('energetic')}>Energetic</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>applyProfile('balanced')}>Balanced</button>
      </div>
      <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Intent Log</span>
          <div className="flex items-center gap-2">
            <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={async()=>{ try { await navigator.clipboard.writeText(JSON.stringify(intentLog, null, 2)); (window as any).__brahm_toast?.('Intent log copied','success'); } catch {} }}>Copy</button>
            <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={()=>{ try { const blob = new Blob([JSON.stringify(intentLog, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); const ts = new Date().toISOString().replace(/[:.]/g,'-'); a.href = url; a.download = `voice-intents-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); (window as any).__brahm_toast?.('Intent log exported','success'); } catch {} }}>Export</button>
            <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={()=>{ setIntentLog([]); try { localStorage.removeItem('voice_intent_log'); } catch {} }}>Clear</button>
          </div>
      </div>
        {intentLog.length>0 ? (
          <ul className="max-h-32 overflow-auto space-y-1 text-[11px] text-neutral-300">
            {intentLog.map((it,i)=>(
              <li key={i} className="rounded bg-black/30 p-1">
                <span className="text-neutral-400">{new Date(it.ts).toLocaleTimeString()} • </span>
                <span className="font-mono">{it.intent}</span>
                <span className="ml-2 text-neutral-400">“{(it.utterance||'').slice(0,60)}{(it.utterance||'').length>60?'…':''}”</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded bg-black/30 p-2 text-[11px] text-neutral-400">No intents yet.</div>
        )}
      </div>
      <div className="mt-2 rounded bg-black/30 p-2 text-xs text-neutral-300 min-h-[40px]">{transcript || '...'}</div>
    </div>
  );
}
