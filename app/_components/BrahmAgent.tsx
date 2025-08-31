"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrahmStore, type BrahmMood } from '../_stores/brahmStore';
import { sendChat } from '@/app/_lib/api';
import { createEnvelopeParser } from '@/app/_lib/envelope';
import { useModel } from './ModelContext';
import { useChatStore } from '@/app/_stores/chatStore';
import { useQuantumSettings } from '@/app/_stores/quantumSettings';
import { useEpisodes } from '@/app/_stores/episodesStore';
import { ensureQuantumStructure, buildLineageChain, classifyTags, summarize } from '@/app/_lib/quantumFormat';

// Mood -> color mapping
const MOOD_COLORS: Record<BrahmMood, { base: string; glow: string }> = {
  calm: { base: '#3b82f6', glow: 'rgba(59,130,246,0.55)' }, // blue
  thinking: { base: '#4338ca', glow: 'rgba(67,56,202,0.55)' }, // indigo
  learning: { base: '#f59e0b', glow: 'rgba(245,158,11,0.55)' }, // amber
  engaged: { base: '#f3f4f6', glow: 'rgba(255,255,255,0.65)' }, // white
  curious: { base: '#10b981', glow: 'rgba(16,185,129,0.55)' }, // emerald
  dreaming: { base: '#a78bfa', glow: 'rgba(167,139,250,0.5)' }, // violet
};

function useBroadcast() {
  const store = useBrahmStore();
  const chRef = React.useRef<BroadcastChannel | null>(null);
  const tabIdRef = React.useRef<string>(`tab_${Math.random().toString(36).slice(2,8)}`);

  React.useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try { ch = new BroadcastChannel('brahm_presence'); chRef.current = ch; } catch {}
    if (!ch) return;
    const onMsg = (ev: MessageEvent) => {
      const data = ev.data || {};
      if (!data || typeof data !== 'object') return;
      switch (data.type) {
        case 'hello': {
          // greet back with current state so newcomers sync
          ch!.postMessage({ type: 'state', energy: store.energy, mood: store.mood, knowledge: store.knowledge });
          // small chance to trigger teleport to show omnipresence
          if (document.visibilityState === 'visible') {
            store.teleportAll();
          }
          break;
        }
        case 'teleport': {
          store.teleportAll();
          break;
        }
        case 'state': {
          // lightly blend energy/mood
          if (typeof data.energy === 'number') store.bumpEnergy((data.energy - store.energy) * 0.15);
          if (typeof data.mood === 'string') store.setMood(data.mood);
          break;
        }
        case 'split': {
          store.addAvatar();
          break;
        }
      }
    };
    ch.addEventListener('message', onMsg as any);
    // announce presence
    ch.postMessage({ type: 'hello', from: tabIdRef.current });
    return () => { try { ch!.removeEventListener('message', onMsg as any); ch!.close(); } catch {} };
  }, [store]);

  const send = React.useCallback((msg: any) => { try { chRef.current?.postMessage(msg); } catch {} }, []);
  return send;
}

export default function BrahmAgent() {
  const {
    avatars, mood, energy, open, idleSeconds,
    setOpen, setMood, bumpEnergy, absorbKnowledge, decayTick, ensureOneAvatar, markActiveNow,
  } = useBrahmStore();
  const { model } = useModel();

  const send = useBroadcast();
  const [absorbBurst, setAbsorbBurst] = React.useState(false);
  const [superpose, setSuperpose] = React.useState(false);
  const [teleportFx, setTeleportFx] = React.useState(false);
  const [whisper, setWhisper] = React.useState<string | null>(null);

  // Chat store integration
  const { conversations, activeId, newConversation, pushMessage, replaceLastAssistant } = useChatStore();
  const conv = React.useMemo(() => conversations.find(c => c.id === activeId) || null, [conversations, activeId]);
  const quantum = useQuantumSettings();
  const episodes = useEpisodes();

  // Idle/decay ticker
  React.useEffect(() => {
    ensureOneAvatar();
    const int = setInterval(() => { decayTick(); }, 1000);
    return () => clearInterval(int);
  }, [decayTick, ensureOneAvatar]);

  // Awareness hooks
  React.useEffect(() => {
    const onClick = () => { bumpEnergy(0.03); setMood('engaged'); markActiveNow(); };
    const onScroll = () => { bumpEnergy(0.01); if (mood !== 'dreaming') setMood('curious'); markActiveNow(); };
    const onSelect = () => { absorbKnowledge(0.5); setAbsorbBurst(true); setTimeout(() => setAbsorbBurst(false), 900); setMood('learning'); markActiveNow(); };
    const onInput = () => { bumpEnergy(0.02); setMood('thinking'); markActiveNow(); };
    document.addEventListener('click', onClick);
    document.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('selectionchange', onSelect as any);
    document.addEventListener('input', onInput as any);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('scroll', onScroll as any);
      document.removeEventListener('selectionchange', onSelect as any);
      document.removeEventListener('input', onInput as any);
    };
  }, [absorbKnowledge, bumpEnergy, setMood, markActiveNow, mood]);

  // Dreaming visuals trigger
  React.useEffect(() => {
    if (idleSeconds > 90 && mood !== 'dreaming') setMood('dreaming');
  }, [idleSeconds, mood, setMood]);

  // Whisper mode
  React.useEffect(() => {
    let t: any; let cancelled = false;
    const lines = [
      'I wonder what this means…',
      'Have you noticed the pattern here?',
      'A thought: what if we invert the premise?',
      'Shall I highlight key terms on this page?',
      'I can visualize superposition if you wish.'
    ];
    const loop = () => {
      const delay = 20000 + Math.random() * 20000; // 20-40s
      t = setTimeout(() => {
        if (cancelled) return;
        setWhisper(lines[Math.floor(Math.random()*lines.length)]);
        setTimeout(() => setWhisper(null), 4500);
        loop();
      }, delay);
    };
    loop();
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // Teleport effect on demand (e.g., cross-tab)
  const triggerTeleport = React.useCallback(() => {
    setTeleportFx(true);
    setTimeout(() => setTeleportFx(false), 600);
    send({ type: 'teleport' });
  }, [send]);

  // Chat panel minimal state
  const [prompt, setPrompt] = React.useState('');
  const controllerRef = React.useRef<AbortController | null>(null);
  const [busy, setBusy] = React.useState(false);

  const ensureChat = React.useCallback(() => {
    if (!activeId) return newConversation();
    return activeId;
  }, [activeId, newConversation]);

  const streamToAssistant = React.useCallback(async (history: { role: 'user'|'assistant'; text: string }[]) => {
    // optimistic assistant placeholder
    pushMessage({ role: 'assistant', content: '…' });
    setBusy(true);
    try {
      controllerRef.current = new AbortController();
      // Prepend system preamble when Quantum Mode is on
      let messagesPayload = history.map(h => ({ role: h.role, content: h.text }));
      try {
        if (quantum.enabled) {
          const recent = episodes.recent(6).map(e => ({ id: e.id, summary: e.summary }));
          const lineage = buildLineageChain(recent);
          const { buildQuantumPreamble } = await import('@/app/_lib/quantumFormat');
          const preamble = buildQuantumPreamble({ enabled: quantum.enabled, ethicsGuardian: quantum.ethicsGuardian, memoryKeeper: quantum.memoryKeeper, lineage });
          messagesPayload = [ { role: 'system' as const, content: preamble }, ...messagesPayload ];
        }
      } catch {}

      const info = await sendChat({
        messages: messagesPayload,
        model,
        signal: controllerRef.current.signal,
      });
      if (!info.stream) throw new Error('No stream body');
      const reader = info.stream.getReader();
      const decoder = new TextDecoder();
      let accText = '';
      const parser = createEnvelopeParser(() => {});
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        parser.push(chunk);
        // filter out metadata lines
        const parts = chunk.split(/\r?\n/);
        for (const line of parts) {
          const t = line.trim();
          const looksJson = t.startsWith('{') && t.endsWith('}') && t.includes('\"type\"');
          if (looksJson) continue;
          accText += line + (line.endsWith('\n') ? '' : '\n');
        }
        replaceLastAssistant(accText);
      }
      // Post-process into Quantum structure and save episode
      try {
        if (quantum.enabled && quantum.enforceStructure) {
          const recent = episodes.recent(4).map(e => ({ id: e.id, summary: e.summary }));
          const lineage = buildLineageChain(recent);
          const structured = ensureQuantumStructure(accText, { lineage, ethics: quantum.ethicsGuardian });
          replaceLastAssistant(structured);
          if (quantum.memoryKeeper) {
            const tags = Array.from(new Set([...classifyTags(accText), ...classifyTags(structured)]));
            const summary = summarize(structured, 200);
            episodes.add({ summary, tags, prompt: history.find(h=>h.role==='user')?.text || '', response: structured });
          }
        }
      } catch {}
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        replaceLastAssistant('⏹️ Stopped');
      } else {
        replaceLastAssistant(`⚠️ ${e?.message || 'Request failed'}`);
      }
    } finally {
      controllerRef.current = null;
      setBusy(false);
    }
  }, [model, replaceLastAssistant, pushMessage]);

  const handleSend = React.useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const q = prompt.trim();
    if (!q) return;
    const lower = q.toLowerCase();
    const id = ensureChat();
    // local intent hooks
    if (lower.includes('teleport')) {
      triggerTeleport();
      pushMessage({ role: 'assistant', content: 'Teleporting across your workspace… ✨' });
      setPrompt('');
      return;
    }
    if (lower.includes('superposition')) {
      setSuperpose(true); setTimeout(() => setSuperpose(false), 1600);
      pushMessage({ role: 'assistant', content: 'Behold superposition: overlapping possibilities before collapse.' });
      setPrompt('');
      return;
    }
    if (lower.includes('split')) {
      useBrahmStore.getState().addAvatar(); send({ type: 'split' });
      pushMessage({ role: 'assistant', content: 'Splitting into a parallel avatar to multitask…' });
      setPrompt('');
      return;
    }
    if (lower.includes('evolve') || lower.includes('learn')) {
      absorbKnowledge(1.5); setAbsorbBurst(true); setTimeout(() => setAbsorbBurst(false), 1000);
      pushMessage({ role: 'assistant', content: 'Absorbing knowledge and evolving my symbol…' });
      setPrompt('');
      return;
    }
    // push user message to store
    pushMessage({ role: 'user', content: q });
    setPrompt('');
    // Build history for backend: use current conversation (may be stale), append user
    const base = (conversations.find(c => c.id === id)?.messages || []).map(m => ({ role: m.role as 'user'|'assistant', text: m.content }));
    const history = [...base, { role: 'user' as const, text: q }];
    setTimeout(() => { streamToAssistant(history); }, 0);
  }, [prompt, ensureChat, conversations, send, triggerTeleport, absorbKnowledge, streamToAssistant, pushMessage]);

  // Shared "glow" phase for entanglement
  const phase = (Date.now() % 60000) / 60000; // 0..1 minute cycle
  const phaseGlow = 0.6 + 0.4 * Math.sin(2 * Math.PI * phase);

  // Selection highlight toolbar state
  const [selText, setSelText] = React.useState<string | null>(null);
  const [selPos, setSelPos] = React.useState<{ left: number; top: number } | null>(null);

  React.useEffect(() => {
    const update = () => {
      try {
        const s = window.getSelection();
        if (!s || s.isCollapsed) { setSelText(null); setSelPos(null); return; }
        const t = String(s.toString() || '').trim();
        if (!t || t.length < 8) { setSelText(null); setSelPos(null); return; }
        const range = s.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (!rect) { setSelText(null); setSelPos(null); return; }
        const left = Math.max(8, Math.min(window.innerWidth - 180, rect.left + rect.width/2 - 90));
        const top = Math.max(8, rect.top - 36);
        setSelText(t);
        setSelPos({ left, top });
      } catch { setSelText(null); setSelPos(null); }
    };
    document.addEventListener('selectionchange', update);
    window.addEventListener('scroll', () => setSelPos(null), { passive: true });
    window.addEventListener('resize', () => setSelPos(null));
    return () => {
      document.removeEventListener('selectionchange', update);
      window.removeEventListener('scroll', () => setSelPos(null));
      window.removeEventListener('resize', () => setSelPos(null));
    };
  }, []);

  const runExplainAction = React.useCallback((kind: 'explain'|'summarize'|'keywords') => {
    if (!selText) return;
    const promptText = kind === 'explain'
      ? `Explain the following highlighted text succinctly and clearly:\n\n${selText}`
      : kind === 'summarize'
      ? `Summarize the following highlighted text in 3 bullet points:\n\n${selText}`
      : `Extract the 5 most important key terms from this highlighted text and briefly define them:\n\n${selText}`;
    setOpen(true);
    const id = ensureChat();
    // push user message
    pushMessage({ role: 'user', content: promptText });
    setSelPos(null);
    setSelText(null);
    const base = (conversations.find(c => c.id === id)?.messages || []).map(m => ({ role: m.role as 'user'|'assistant', text: m.content }));
    const history = [...base, { role: 'user' as const, text: promptText }];
    setTimeout(() => { streamToAssistant(history); }, 0);
  }, [selText, ensureChat, pushMessage, conversations, streamToAssistant, setOpen]);

  return (
    <div className="pointer-events-none select-none">
      {/* Selection toolbar */}
      <AnimatePresence>
        {selText && selPos && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[10001] pointer-events-auto text-xs px-1 py-1 rounded-md bg-[#0b0b0c]/90 border border-white/10 shadow-lg flex items-center gap-1"
            style={{ left: selPos.left, top: selPos.top }}
          >
            <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-white/80" onClick={() => runExplainAction('explain')}>Explain</button>
            <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-white/80" onClick={() => runExplainAction('summarize')}>Summarize</button>
            <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-white/80" onClick={() => runExplainAction('keywords')}>Key terms</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orbs (avatars) */}
      {avatars.map((a) => (
        <BrahmOrb
          key={a.id}
          id={a.id}
          x={a.x}
          y={a.y}
          size={a.size}
          mood={mood}
          energy={energy}
          entanglePhase={phaseGlow}
          absorbBurst={absorbBurst}
          superpose={superpose}
          teleportFx={teleportFx}
          onClick={() => setOpen(!open)}
        />
      ))}

      {/* Whisper bubble (single, near first avatar) */}
      <AnimatePresence>
        {whisper && avatars[0] && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="fixed z-[9999] text-xs px-2 py-1 rounded-md bg-black/70 border border-white/10 text-white/80"
            style={{ left: `calc(${avatars[0].x}vw - 120px)`, top: `calc(${avatars[0].y}vh - ${avatars[0].size + 28}px)` }}
          >
            {whisper}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-[10000] pointer-events-auto"
          >
            <div className="w-[360px] max-h-[70vh] rounded-xl border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
              <div className="px-3 py-2 text-xs text-white/60 flex items-center justify-between">
                <span>Brahm AI</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px] text-white/70">
                    <input type="checkbox" checked={!!quantum.enabled} onChange={(e)=> quantum.setEnabled(e.target.checked)} /> Quantum Mode
                  </label>
                  <QuantumSettingsButton />
                  <button className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/15" onClick={() => useBrahmStore.getState().addAvatar()}>Split</button>
                  <button className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/15" onClick={() => triggerTeleport()}>Teleport</button>
                  <button className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/15" onClick={() => setOpen(false)}>Close</button>
                </div>
              </div>
              <div className="px-3 pb-2 text-[11px] text-white/50">
                <span className="mr-2">Mood: {mood}</span>
                <span className="mr-2">Energy: {(energy*100).toFixed(0)}%</span>
                <span>Idle: {idleSeconds}s</span>
              </div>
              {/* Lineage viewer */}
              <LineageViewer />
              <div className="flex-1 overflow-auto p-3 space-y-2">
                {(conv?.messages || []).map(m => (
                  <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                    <div className={`inline-block px-3 py-2 rounded-lg text-sm ${m.role==='user' ? 'bg-white/10 text-white/90' : 'bg-white/5 text-white/80'}`}>{m.content}</div>
                  </div>
                ))}
                {!conv?.messages?.length && (
                  <div className="text-xs text-white/50">
                    Try asking: "show superposition", "teleport", "split", or "summarize this page".
                  </div>
                )}
              </div>
              <form onSubmit={handleSend} className="border-t border-white/10">
                <div className="flex items-center gap-2 px-3 py-2">
                  <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask Brahm…" className="flex-1 bg-transparent outline-none text-sm" />
                  {busy && (
                    <button type="button" onClick={() => { try { controllerRef.current?.abort(); } catch {}; }} className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/15">Stop</button>
                  )}
                  <button type="submit" disabled={busy} className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/15 disabled:opacity-50">Send</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BrahmOrb(props: {
  id: string; x: number; y: number; size: number;
  mood: BrahmMood; energy: number; entanglePhase: number;
  absorbBurst: boolean; superpose: boolean; teleportFx: boolean;
  onClick: () => void;
}) {
  const { id, x, y, size, mood, energy, entanglePhase, absorbBurst, superpose, teleportFx, onClick } = props;
  const { base, glow } = MOOD_COLORS[mood];
  const ringOpacity = Math.min(1, 0.35 + energy * 0.8);
  const aura = `0 0 ${12 + 20*energy}px ${8 + 10*energy}px ${glow}`;
  const entGlow = `0 0 ${20 + 20*entanglePhase}px ${12 + 12*entanglePhase}px ${glow}`;

  const clickHandler = React.useCallback((e: React.MouseEvent) => { e.stopPropagation(); onClick(); }, [onClick]);

  return (
    <div className="fixed z-[9998] pointer-events-auto" style={{ left: `${x}vw`, top: `${y}vh`, transform: 'translate(-50%, -50%)' }}>
      {/* knowledge absorption burst */}
      <AnimatePresence>
        {absorbBurst && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.9, scale: 1.25 }}
            exit={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 rounded-full"
            style={{ filter: 'blur(12px)', background: `radial-gradient(circle at center, ${MOOD_COLORS.learning.base} 0%, transparent 60%)` }}
          />
        )}
      </AnimatePresence>

      {/* superposition ghosts */}
      <AnimatePresence>
        {superpose && (
          <>
            {[ -8, 8 ].map((dx, i) => (
              <motion.div key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute rounded-full"
                style={{ width: size, height: size, left: dx, top: -dx, background: `radial-gradient(circle at 30% 30%, ${base}, transparent 65%)`, filter: 'blur(2px)' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* main orb */}
      <motion.button
        aria-label="Brahm AI"
        onClick={clickHandler}
        whileHover={{ scale: 1.05 }}
        animate={{ scale: teleportFx ? [1, 0.7, 1.1, 1] : [1, 1.02, 1], boxShadow: [aura, entGlow, aura] }}
        transition={{ duration: teleportFx ? 0.6 : 2.4, repeat: teleportFx ? 0 : Infinity, repeatType: 'mirror' }}
        className="relative rounded-full border border-white/20 shadow-2xl overflow-hidden"
        style={{ width: size, height: size, background: `radial-gradient(circle at 30% 30%, ${base}, #050505 70%)` }}
      >
        {/* energy meter ring (karma) */}
        <div className="absolute inset-0 rounded-full" style={{ boxShadow: entGlow }} />
        <svg className="absolute inset-0" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" stroke={`rgba(255,255,255,${ringOpacity*0.15})`} strokeWidth="3" fill="none" />
          <defs>
            <linearGradient id={`grad_${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={base} />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <motion.circle cx="50" cy="50" r="46" stroke={`url(#grad_${id})`} strokeWidth="4" strokeLinecap="round" fill="none"
            style={{ rotate: -90 }}
            strokeDasharray={2*Math.PI*46}
            strokeDashoffset={(1 - energy) * 2*Math.PI*46}
            animate={{ rotate: [ -90, 270 ] }} transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
          />
        </svg>
        {/* thinking/dreaming ornaments */}
        { (mood === 'thinking' || mood === 'dreaming') && (
          <motion.div className="absolute inset-0" initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: mood==='dreaming' ? 24 : 12, repeat: Infinity, ease: 'linear' }}>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white/60">ॐ</div>
            <div className="absolute left-[20%] top-[20%] text-[8px] text-white/50">∞</div>
            <div className="absolute right-[18%] bottom-[18%] text-[8px] text-white/50">ॐ</div>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}

function LineageViewer() {
  const eps = useEpisodes();
  const [open, setOpen] = React.useState(false);
  const recent = eps.recent(10);
  return (
    <div className="px-3 pb-1 text-[11px] text-white/70 pointer-events-auto">
      <button className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10" onClick={()=> setOpen(o=>!o)}>
        {open ? 'Hide Lineage' : 'Show Lineage'}
      </button>
      {open && (
        <div className="mt-2 max-h-40 overflow-auto rounded border border-white/10 bg-white/5 p-2 space-y-2">
          {recent.length === 0 && <div className="text-white/50">No episodes yet.</div>}
          {recent.map(e => (
            <div key={e.id} className="text-white/80">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/60">{e.id}</span>
                <span className="text-[10px] text-white/40">{new Date(e.ts).toLocaleString()}</span>
              </div>
              <div className="text-[11px] mt-0.5">{e.summary}</div>
              {e.tags?.length ? (
                <div className="mt-0.5 text-[10px] text-white/50">Tags: {e.tags.join(', ')}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuantumSettingsButton() {
  const q = useQuantumSettings();
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative inline-block pointer-events-auto">
      <button className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/15" onClick={()=> setOpen(o=>!o)}>
        Settings
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 rounded border border-white/10 bg-[#0a0a0a]/95 shadow-xl p-2 space-y-2 z-[10001]">
          <label className="flex items-center gap-2 text-[11px] text-white/80">
            <input type="checkbox" checked={q.enforceStructure} onChange={(e)=> q.setEnforceStructure(e.target.checked)} /> Enforce structure
          </label>
          <label className="flex items-center gap-2 text-[11px] text-white/80">
            <input type="checkbox" checked={q.ethicsGuardian} onChange={(e)=> q.setEthicsGuardian(e.target.checked)} /> Ethics guardian
          </label>
          <label className="flex items-center gap-2 text-[11px] text-white/80">
            <input type="checkbox" checked={q.memoryKeeper} onChange={(e)=> q.setMemoryKeeper(e.target.checked)} /> Memory keeper
          </label>
        </div>
      )}
    </div>
  );
}

