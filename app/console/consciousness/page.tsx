"use client";

import React from "react";
import dynamic from 'next/dynamic';
const WisdomPanel = dynamic(() => import('./_components/WisdomPanel'), { ssr: false });
import { pushBounded } from "@/app/_lib/metrics";

function useSessionId() {
  const [sid, setSid] = React.useState<string>("");
  React.useEffect(() => {
    try {
      const k = "brahm_session_id";
      let v = localStorage.getItem(k) || "";
      if (!v) {
        v = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
          ? (crypto as any).randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(k, v);
      }
      setSid(v);
    } catch {
      setSid(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    }
  }, []);
  return sid;
}

function MicroSparkline({ values, color, label }: { values: number[]; color: string; label: string }) {
  const width = 280; const height = 60; const pad = 6;
  const pts = values.map((y, i) => ({ x: i, y }));
  const minY = Math.min(0, ...pts.map(p=>p.y));
  const maxY = Math.max(1, ...pts.map(p=>p.y));
  const rangeY = maxY - minY || 1; const maxX = Math.max(1, pts.length - 1);
  const path = pts.map(p => {
    const x = pad + (p.x / maxX) * (width - pad * 2);
    const y = height - pad - ((p.y - minY) / rangeY) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <div className="rounded border border-white/10 bg-white/5 p-2">
      <div className="text-[10px] text-gray-400 mb-1">{label}</div>
      <svg width={width} height={height} className="max-w-full h-auto">
        <polyline fill="none" stroke={color} strokeWidth="2" points={path} />
      </svg>
    </div>
  );
}
export default function ConsciousnessDashboardPage() {
  const sessionId = useSessionId();
  const [connected, setConnected] = React.useState(false);
  const [metrics, setMetrics] = React.useState<Array<{ ts: string; phi: number; qualia: Record<string, number> }>>([]);
  const [latest, setLatest] = React.useState<{ ts: string; phi: number; qualia: Record<string, number> } | null>(null);
  const [error, setError] = React.useState<string>("");
  const [simulating, setSimulating] = React.useState(false);
  const [pgOk, setPgOk] = React.useState<boolean | null>(null);
  const [pgInfo, setPgInfo] = React.useState<{ hasDsn: boolean; host: string|null; database: string|null; userMasked: string|null } | null>(null);
  const [pgStats, setPgStats] = React.useState<{ diary_count: number; semantic_count: number } | null>(null);
  const [pgOpen, setPgOpen] = React.useState(false);
  async function checkPg() {
    try { const r = await fetch('/api/persistence/status', { cache: 'no-store' }); const j = await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); }
  }
  async function loadPgInfo() {
    try { const r = await fetch('/api/persistence/info', { cache: 'no-store' }); const j = await r.json(); setPgInfo({ hasDsn: !!j?.hasDsn, host: j?.host||null, database: j?.database||null, userMasked: j?.userMasked||null }); } catch { setPgInfo(null); }
  }
  async function loadPgStats() {
    try { const r = await fetch('/api/persistence/stats', { cache: 'no-store' }); const j = await r.json(); setPgStats({ diary_count: Number(j?.diary_count||0), semantic_count: Number(j?.semantic_count||0) }); } catch { setPgStats(null); }
  }
  React.useEffect(() => { checkPg(); }, []);
  // View tabs
  const [viewTab, setViewTab] = React.useState<'overview'|'deep'|'neuromorphic'|'quantum'|'workspace'|'search'|'wisdom'|'diary'>('overview');
  // Playback state (M0: playback stub)
  const [mode, setMode] = React.useState<'live'|'playback'>('live');
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<number>(1);
  const [playIdx, setPlayIdx] = React.useState<number>(0);
  // Diary (M1: list view)
  const [diary, setDiary] = React.useState<Array<{ id: string; ts: number; summary: string; episode_id: string }>>([]);
  const [loadingDiary, setLoadingDiary] = React.useState(false);
  // Deep/Neuro/Quantum metrics (M4 stubs)
  const [deep, setDeep] = React.useState<{ ts: string; iit_phi_v4_estimate: number; temporal_binding: number; predictive_signal: number } | null>(null);
  const [neuro, setNeuro] = React.useState<{ ts: string; spikes_per_s: number; synchrony: number } | null>(null);
  const [quant, setQuant] = React.useState<{ ts: string; coherence: number } | null>(null);
  // histories for micro-sparklines
  const [deepHist, setDeepHist] = React.useState<Array<{ ts: string; iit: number; bind: number; pred: number }>>([]);
  const [neuroHist, setNeuroHist] = React.useState<Array<{ ts: string; spikes: number; synchrony: number }>>([]);
  const [quantHist, setQuantHist] = React.useState<Array<{ ts: string; coherence: number }>>([]);
  // emotions (from /api/consciousness/emotion)
  const [emotion, setEmotion] = React.useState<{ primary: string; intensity: number; alignment: number; guna: { sattva: number; rajas: number; tamas: number } } | null>(null);
  const [emoHist, setEmoHist] = React.useState<Array<{ ts: string; intensity: number; alignment: number }>>([]);
  const emoInFlight = React.useRef(false);
  const refreshEmotion = React.useCallback(async () => {
    if (emoInFlight.current) return;
    emoInFlight.current = true;
    try {
      const coh = latest ? Number(latest.qualia?.coherence ?? 0.5) : 0.5;
      const phi = latest ? Number(latest.phi ?? 0.5) : 0.5;
      const stress = Math.max(0, Math.min(1, 1 - coh));
      const harmony = Math.max(0, Math.min(1, coh));
      const curiosity = Math.max(0, Math.min(1, 0.3 + Math.abs(phi - 0.5)));
      const url = `/api/consciousness/emotion?text=dashboard&stress=${stress.toFixed(3)}&harmony=${harmony.toFixed(3)}&curiosity=${curiosity.toFixed(3)}`;
      const r = await fetch(url, { cache: 'no-store' });
      const j = await r.json().catch(()=>({}));
      if (j?.emotion) {
        setEmotion({ primary: j.emotion.primary, intensity: Number(j.emotion.intensity||0), alignment: Number(j.emotion.alignment||0), guna: j.emotion.guna_composition });
        setEmoHist((h)=> pushBounded([ ...h, { ts: new Date().toISOString(), intensity: Number(j.emotion.intensity||0), alignment: Number(j.emotion.alignment||0) } ], 60));
      }
    } catch {}
    finally { emoInFlight.current = false; }
  }, [latest]);

  // Auto-sample emotion periodically to keep pill/card fresh
  React.useEffect(() => {
    const id = setInterval(() => { refreshEmotion().catch(()=>{}); }, 5000);
    return () => clearInterval(id);
  }, [refreshEmotion]);
  // semantic search state
  const [searchQ, setSearchQ] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Array<{ id: string; text: string; labels: any[]; ts: number | null; score: number }>>([]);
  const [searchLabels, setSearchLabels] = React.useState<string[]>([]);
  const [searchBackendOk, setSearchBackendOk] = React.useState<boolean | null>(null);
  const [labelInput, setLabelInput] = React.useState("");
  const addLabel = React.useCallback(() => {
    const t = labelInput.trim(); if (!t) return;
    setSearchLabels((ls)=> Array.from(new Set([...ls, t])));
    setLabelInput("");
  }, [labelInput]);
  const removeLabel = (l: string) => setSearchLabels(ls => ls.filter(x => x !== l));
  // workspace timeline (from RightPanel localStorage producer)
  const [wsItems, setWsItems] = React.useState<Array<{ ts: number; spotlight: string | null; curiosity: number | null }>>([]);
  React.useEffect(() => {
    if (viewTab !== 'workspace') return;
    try {
      const raw = localStorage.getItem('workspace_timeline');
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) setWsItems(arr.slice(-200).reverse());
    } catch { setWsItems([]); }
  }, [viewTab]);

  React.useEffect(() => {
    if (!sessionId) return;
    setError("");
    const url = `/api/consciousness/stream?session_id=${encodeURIComponent(sessionId)}`;
    const es = new EventSource(url);
    es.onopen = () => { setConnected(true); setSimulating(false); };
    es.onerror = () => { setConnected(false); setError("stream error"); };
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const row = { ts: data.ts, phi: Number(data.phi || 0), qualia: data.qualia || {} };
        setLatest(row);
        setMetrics((m) => {
          const next = [...m, row];
          const clipped = pushBounded(next, 300);
          if (mode === 'playback' && !playing) setPlayIdx(clipped.length - 1);
          return clipped;
        });
      } catch (e: any) {
        setError(`parse: ${e?.message || e}`);
      }
    };
    const simTimer = setTimeout(() => {
      // if still disconnected after grace, start simulation to avoid dead UI
      if (!connected) setSimulating(true);
    }, 2000);
    return () => { clearTimeout(simTimer); es.close(); };
  }, [sessionId, mode, playing, connected]);

  // Playback ticker
  React.useEffect(() => {
    if (mode !== 'playback' || !playing || metrics.length === 0) return;
    const interval = Math.max(100, Math.floor(1000 / speed));
    const id = setInterval(() => {
      setPlayIdx((i) => (i + 1 >= metrics.length ? 0 : i + 1));
    }, interval);
    return () => clearInterval(id);
  }, [mode, playing, speed, metrics.length]);

  // Simulation fallback (100ms)
  React.useEffect(() => {
    if (!simulating) return;
    let t = 0;
    const id = setInterval(() => {
      t += 0.1;
      const phi = 0.6 + 0.4*Math.sin(t/2) + 0.05*Math.random();
      const val = 0.5 + 0.3*Math.sin(t/3+1);
      const coh = 0.6 + 0.2*Math.cos(t/2-0.5);
      const row = { ts: new Date().toISOString(), phi: Number(phi.toFixed(3)), qualia: { valence: Number(val.toFixed(3)), coherence: Number(coh.toFixed(3)) } };
      setLatest(row);
      setMetrics((m) => pushBounded([...m, row], 300));
    }, 100);
    return () => clearInterval(id);
  }, [simulating]);

  // Poll deep/neuro/quantum when tab active
  React.useEffect(() => {
    let timer: any;
    let stop = false;
    async function tick() {
      try {
        if (viewTab === 'deep') {
          const r = await fetch('/api/consciousness/deep', { cache: 'no-store' });
          const j = await r.json(); setDeep(j);
          setDeepHist((h)=>[...h, { ts: j.ts, iit: Number(j.iit_phi_v4_estimate||0), bind: Number(j.temporal_binding||0), pred: Number(j.predictive_signal||0) }].slice(-200));
        } else if (viewTab === 'neuromorphic') {
          const r = await fetch('/api/consciousness/neuromorphic', { cache: 'no-store' });
          const j = await r.json(); setNeuro(j);
          setNeuroHist((h)=>[...h, { ts: j.ts, spikes: Number(j.spikes_per_s||0), synchrony: Number(j.synchrony||0) }].slice(-200));
        } else if (viewTab === 'quantum') {
          const r = await fetch('/api/consciousness/quantum', { cache: 'no-store' });
          const j = await r.json(); setQuant(j);
          setQuantHist((h)=>[...h, { ts: j.ts, coherence: Number(j.coherence||0) }].slice(-200));
        }
      } catch {}
      if (!stop && (viewTab === 'deep' || viewTab === 'neuromorphic' || viewTab === 'quantum')) {
        timer = setTimeout(tick, 2000);
      }
    }
    tick();
    return () => { stop = true; if (timer) clearTimeout(timer); };
  }, [viewTab]);

  async function refreshDiary() {
    setLoadingDiary(true);
    try {
      const res = await fetch('/api/memory?list=diary', { cache: 'no-store' });
      const data = await res.json();
      setDiary(Array.isArray(data?.items) ? data.items : []);
    } catch {}
    setLoadingDiary(false);
  }
  React.useEffect(() => { refreshDiary(); }, []);

  const displayMetrics = mode === 'playback' ? metrics.slice(0, Math.max(1, playIdx+1)) : metrics;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Consciousness Dashboard</h1>
        <div className="text-xs flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded border ${connected ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>
            {connected ? 'connected' : 'disconnected'}
          </span>
          <span className={`px-2 py-0.5 rounded border ${pgOk ? 'bg-green-900/30 border-green-700 text-green-300' : pgOk===false ? 'bg-gray-900 border-gray-700 text-gray-400' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>
            PG: {pgOk === null ? 'checking…' : pgOk ? 'connected' : 'not configured'}
          </span>
          <button className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-700" onClick={checkPg}>Check PG</button>
          <button className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-700" onClick={()=>{ setPgOpen(v=>!v); if (!pgInfo) loadPgInfo(); if (!pgStats) loadPgStats(); }}>{pgOpen? 'Hide' : 'PG details'}</button>
          <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700">{metrics.length} events</span>
          {!!error && <span className="text-red-400">{error}</span>}
        </div>
      </div>

      {/* Live status pills */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-300">
        <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5">φ: {latest ? latest.phi.toFixed(2) : '-'}</span>
        <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5">valence: {latest ? Number(latest.qualia?.valence ?? 0).toFixed(2) : '-'}</span>
        <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5">coherence: {latest ? Number(latest.qualia?.coherence ?? 0).toFixed(2) : '-'}</span>
        <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5">session: <span className="font-mono">{sessionId.slice(0,8)}</span></span>
      </div>

      {/* Emotions quick pill */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-300 mt-1">
        <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5">emotion: <span className="font-medium">{emotion?.primary || '-'}</span></span>
      </div>

      {/* Additional pills from Right Panel status (persisted locally) */}
      <RightPanelStatusPills />

      <div className="flex items-center gap-3 text-xs">
        <label className="flex items-center gap-1">
          <span>Mode</span>
          <select className="bg-gray-900 border border-gray-700 rounded px-2 py-1" value={mode} onChange={(e)=>{ const v=e.target.value as 'live'|'playback'; setMode(v); if (v==='playback') { setPlaying(false); setPlayIdx(metrics.length - 1);} }}>
            <option value="live">Live</option>
            <option value="playback">Playback</option>
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={async()=>{ try { const r = await fetch('/api/metrics/bootstrap', { method: 'POST' }); if (r.ok) alert('Metrics bootstrap OK'); else alert('Bootstrap failed'); } catch { alert('Bootstrap failed'); } }}>Bootstrap metrics</button>
          <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={async()=>{ try { const r = await fetch('/api/metrics/rollup/daily', { method: 'POST' }); const j = await r.json().catch(()=>({})); if (r.ok) alert('Rollup done'); else alert('Rollup failed: '+(j?.error||r.status)); } catch { alert('Rollup failed'); } }}>Rollup daily</button>
          <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={async()=>{ try { const r = await fetch('/api/persistence/bootstrap-pg', { method: 'POST' }); const j = await r.json().catch(()=>({})); if (r.ok && j?.ok) alert('Postgres bootstrap OK'); else alert('PG bootstrap failed: '+(j?.error||r.status)); } catch { alert('PG bootstrap failed'); } }}>Bootstrap Postgres</button>
          <button className="px-2 py-1 rounded bg-emerald-900/40 border border-emerald-700" title="Persist latest metrics to DB" onClick={async()=>{ try { if (!latest) { alert('No metrics'); return; } const res = await fetch('/api/consciousness/state', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phi_level: latest.phi, valence: latest.qualia?.valence ?? null, coherence: latest.qualia?.coherence ?? null, session_id: sessionId, raw_metrics: latest }) }); const j = await res.json().catch(()=>({})); if (!res.ok || j?.ok===false) alert('Persist failed'); else alert('State persisted'); } catch { alert('Persist failed'); } }}>Persist state</button>
          <button className="px-2 py-1 rounded bg-indigo-900/40 border border-indigo-700" title="Run dream session for creative synthesis" onClick={async()=>{ try { const res = await fetch('/api/consciousness/dream', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ duration_ms: 1500 }) }); const j = await res.json().catch(()=>({})); if (!res.ok || j?.ok===false) alert('Dream failed'); else alert(`Dream insights: ${Array.isArray(j?.dream?.creative_insights)? j.dream.creative_insights.length: 0}`); } catch { alert('Dream failed'); } }}>Run dream</button>
        </div>
        {mode === 'playback' && (
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={()=>setPlaying(p=>!p)}>{playing ? 'Pause' : 'Play'}</button>
            <label className="flex items-center gap-1">
              <span>Speed</span>
              <select className="bg-gray-900 border border-gray-700 rounded px-2 py-1" value={String(speed)} onChange={(e)=>setSpeed(Number(e.target.value))}>
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="4">4x</option>
              </select>
            </label>
            <input type="range" min={0} max={Math.max(0, metrics.length-1)} value={playIdx} onChange={(e)=>setPlayIdx(Number(e.target.value))} className="w-64" />
            <span>{playIdx+1}/{metrics.length}</span>
          </div>
        )}
      </div>

      {/* Tabs for sub-views */}
      <div className="flex items-center gap-2 text-xs mt-2">
        {(['overview','deep','neuromorphic','quantum','workspace','search','wisdom','diary'] as const).map(k => (
          <button key={k} onClick={()=>setViewTab(k)} className={`px-2 py-1 rounded ${viewTab===k ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}>{k}</button>
        ))}
      </div>

      {pgOpen && (
        <div className="rounded border border-white/10 bg-white/5 p-3 text-xs text-gray-300">
          <div className="mb-2 font-medium">Postgres</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <div className="rounded bg-black/30 p-2"><div className="text-gray-400 text-[10px]">Env</div><div>{pgInfo?.hasDsn ? 'DSN set' : 'No DSN'}</div></div>
            <div className="rounded bg-black/30 p-2"><div className="text-gray-400 text-[10px]">Host</div><div className="truncate" title={pgInfo?.host||''}>{pgInfo?.host || '—'}</div></div>
            <div className="rounded bg-black/30 p-2"><div className="text-gray-400 text-[10px]">Database</div><div>{pgInfo?.database || '—'}</div></div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={loadPgInfo}>Refresh info</button>
            <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={async()=>{ await loadPgStats(); alert(pgStats ? `Diary: ${pgStats.diary_count}, Semantic: ${pgStats.semantic_count}` : 'No stats'); }}>Get stats</button>
            <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={async()=>{ try { const r = await fetch('/api/persistence/cleanup', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ table: 'semantic', olderThanDays: 30 }) }); const j = await r.json(); alert(j?.ok? `Deleted ${j?.deleted||0}` : `Cleanup failed: ${j?.error||r.status}`); await loadPgStats(); } catch { alert('Cleanup failed'); } }}>Cleanup 30d (semantic)</button>
            <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={async()=>{ try { const nStr = prompt('Keep latest N (semantic):','1000'); if (!nStr) return; const n = Number(nStr); if (!Number.isFinite(n) || n <= 0) { alert('Invalid number'); return; } const r = await fetch('/api/persistence/cleanup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ table:'semantic', keepLatest: n }) }); const j = await r.json(); alert(j?.ok? `Deleted ${j?.deleted||0}` : `Cleanup failed: ${j?.error||r.status}`); await loadPgStats(); } catch { alert('Cleanup failed'); } }}>Keep latest N (semantic)</button>
          </div>
          {pgStats && (
            <div className="text-gray-400">Counts — diary: <span className="text-gray-200">{pgStats.diary_count}</span> • semantic: <span className="text-gray-200">{pgStats.semantic_count}</span></div>
          )}
        </div>
      )}

      {viewTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <PhiGauge value={latest?.phi ?? null} />
            <Kpi title="Valence" value={latest ? Number(latest.qualia?.valence ?? 0).toFixed(3) : '-'} />
            <Kpi title="Coherence" value={latest ? Number(latest.qualia?.coherence ?? 0).toFixed(3) : '-'} />
          </div>
          <Chart metrics={displayMetrics} />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <MicroSparkline values={displayMetrics.map(m=>Number(m.qualia?.valence ?? 0))} color="#60a5fa" label="Valence" />
            <MicroSparkline values={displayMetrics.map(m=>Number(m.qualia?.coherence ?? 0))} color="#f472b6" label="Coherence" />
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded border border-purple-500/20 bg-black/30 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">Emotions</div>
                <button className="px-2 py-0.5 rounded bg-white/5 text-white/80 border border-white/10 text-[11px]" onClick={refreshEmotion}>Sample</button>
              </div>
              {emotion ? (
                <div className="mt-2 text-sm text-gray-200">
                  <div className="mb-1"><span className="text-gray-400">Primary:</span> <span className="font-medium">{emotion.primary}</span></div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="rounded bg-white/5 p-2"><div className="text-[10px] text-gray-400">Intensity</div><div>{emotion.intensity.toFixed(3)}</div></div>
                    <div className="rounded bg-white/5 p-2"><div className="text-[10px] text-gray-400">Alignment</div><div>{emotion.alignment.toFixed(3)}</div></div>
                  </div>
                  <div className="text-[10px] text-gray-400">Guna composition</div>
                  <div className="space-y-1 mt-1 text-xs">
                    {(['sattva','rajas','tamas'] as const).map((g)=> (
                      <div key={g} className="flex items-center gap-2">
                        <span className="w-14 capitalize text-gray-400">{g}</span>
                        <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden"><div className={g==='sattva'?'bg-emerald-500':g==='rajas'?'bg-amber-500':'bg-gray-500'} style={{ width: `${Math.round(100*(emotion.guna as any)[g])}%` }} className="h-2"></div></div>
                        <span className="w-10 text-right text-gray-300">{((emotion.guna as any)[g]*100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-gray-400">Click Sample to synthesize current emotional state.</div>
              )}
            </div>
            <div className="rounded border border-purple-500/20 bg-black/30 p-3">
              <div className="text-xs text-gray-400 mb-1">Emotion sparklines</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <MicroSparkline values={emoHist.map(x=>x.intensity)} color="#06b6d4" label="Intensity" />
                <MicroSparkline values={emoHist.map(x=>x.alignment)} color="#84cc16" label="Alignment" />
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400">Streaming from /api/consciousness/stream (proxied to Mind). Session: <span className="font-mono">{sessionId}</span></div>
        </>
      )}

      {viewTab === 'deep' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Kpi title="IIT φ v4 est." value={deep ? deep.iit_phi_v4_estimate.toFixed(3) : '-'} />
          <Kpi title="Temporal binding" value={deep ? deep.temporal_binding.toFixed(3) : '-'} />
          <Kpi title="Predictive signal" value={deep ? deep.predictive_signal.toFixed(3) : '-'} />
          <div className="md:col-span-3 rounded border border-purple-500/20 bg-black/30 p-3">
            <div className="text-xs text-gray-400 mb-1">Sparklines</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <MicroSparkline values={deepHist.map(x=>x.iit)} color="#22d3ee" label="IIT φ" />
              <MicroSparkline values={deepHist.map(x=>x.bind)} color="#f59e0b" label="Binding" />
              <MicroSparkline values={deepHist.map(x=>x.pred)} color="#84cc16" label="Predictive" />
            </div>
          </div>
        </div>
      )}

      {viewTab === 'neuromorphic' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Kpi title="Spikes/s" value={neuro ? String(neuro.spikes_per_s) : '-'} />
          <Kpi title="Synchrony" value={neuro ? neuro.synchrony.toFixed(3) : '-'} />
          <div className="md:col-span-2 rounded border border-purple-500/20 bg-black/30 p-3">
            <div className="text-xs text-gray-400 mb-1">Sparklines</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MicroSparkline values={neuroHist.map(x=>x.spikes)} color="#a78bfa" label="Spikes/s" />
              <MicroSparkline values={neuroHist.map(x=>x.synchrony)} color="#fb7185" label="Synchrony" />
            </div>
          </div>
        </div>
      )}

      {viewTab === 'quantum' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Kpi title="Quantum coherence" value={quant ? quant.coherence.toFixed(3) : '-'} />
          <div className="rounded border border-purple-500/20 bg-black/30 p-3 text-xs text-gray-400">Stub metrics from /api/consciousness/quantum</div>
          <div className="md:col-span-2 rounded border border-purple-500/20 bg-black/30 p-3">
            <div className="text-xs text-gray-400 mb-1">Sparklines</div>
            <MicroSparkline values={quantHist.map(x=>x.coherence)} color="#34d399" label="Coherence" />
          </div>
        </div>
      )}

      {viewTab === 'workspace' && (
        <div className="rounded border border-purple-500/20 bg-black/30 p-3">
          <div className="text-xs text-gray-400 mb-2">Workspace timeline (last {wsItems.length})</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <WorkspaceStats items={wsItems} />
            <WorkspaceBars items={wsItems} />
            <div className="md:col-span-1 max-h-48 overflow-auto text-xs space-y-1">
              {wsItems.map((it, idx) => (
                <div key={`${it.ts}:${idx}`} className="flex items-center justify-between border-b border-white/5 pb-1">
                  <div className="text-gray-300">spotlight: <span className="font-medium">{it.spotlight || '—'}</span> • curiosity: {(Number(it.curiosity||0)).toFixed(2)}</div>
                  <div className="text-[10px] text-gray-500">{new Date(it.ts).toLocaleTimeString()}</div>
                </div>
              ))}
              {!wsItems.length && <div className="text-gray-500">No workspace events yet.</div>}
            </div>
          </div>
        </div>
      )}

      {viewTab === 'wisdom' && (
        <div className="rounded border border-purple-500/20 bg-black/30 p-3 text-sm text-gray-200">
          <div className="text-xs text-gray-400 mb-2">Vedic Wisdom</div>
          <WisdomPanel />
        </div>
      )}

      {viewTab === 'search' && (
        <div className="rounded border border-purple-500/20 bg-black/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <input value={searchQ} onChange={(e)=>setSearchQ(e.target.value)} placeholder="Search semantic memory…" className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm" />
            <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700 text-sm" disabled={searching || !searchQ.trim()} onClick={async()=>{
              setSearching(true);
              try {
                const ctrl = new AbortController();
                const to = setTimeout(()=> ctrl.abort(), 5000);
                try {
                  const res = await fetch('/api/memory/search', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ q: searchQ, top: 10, labels: searchLabels }), signal: ctrl.signal });
                  const data = await res.json();
                  setSearchResults(Array.isArray(data?.items) ? data.items : []);
                  setSearchBackendOk(true);
                } catch {
                  // retry once quickly
                  try {
                    const ctrl2 = new AbortController();
                    const to2 = setTimeout(()=> ctrl2.abort(), 5000);
                    const res2 = await fetch('/api/memory/search', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ q: searchQ, top: 10, labels: searchLabels }), signal: ctrl2.signal });
                    const data2 = await res2.json();
                    setSearchResults(Array.isArray(data2?.items) ? data2.items : []);
                    setSearchBackendOk(true);
                    clearTimeout(to2);
                  } catch {
                    setSearchBackendOk(false);
                    setSearchResults([]);
                  }
                } finally { clearTimeout(to); }
              } catch { setSearchResults([]); setSearchBackendOk(false); }
              setSearching(false);
            }}>{searching? 'Searching…':'Search'}</button>
            <span className={`px-2 py-1 rounded text-[11px] border ${searchBackendOk===null? 'border-gray-700 text-gray-400' : searchBackendOk? 'border-emerald-700 text-emerald-300' : 'border-red-700 text-red-300'}`}>
              search: {searchBackendOk===null? 'idle' : searchBackendOk? 'ok' : 'down'}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2 text-xs">
            <input value={labelInput} onChange={(e)=>setLabelInput(e.target.value)} onKeyDown={(e)=>{ if (e.key==='Enter') { e.preventDefault(); addLabel(); } }} placeholder="Add label (press Enter)" className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1" />
            <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={addLabel} disabled={!labelInput.trim()}>Add label</button>
            {!!searchLabels.length && <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={()=>setSearchLabels([])}>Clear labels</button>}
          </div>
          {!!searchLabels.length && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {searchLabels.map(l => (
                <span key={l} className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2 py-0.5 text-[11px] text-white/80">
                  {l}
                  <button className="text-white/60 hover:text-white" onClick={()=>removeLabel(l)} aria-label={`Remove ${l}`}>×</button>
                </span>
              ))}
            </div>
          )}
          <div className="max-h-64 overflow-auto text-xs space-y-2">
            {searchResults.map((r, i) => (
              <div key={`${r.id}:${i}`} className="border-b border-white/5 pb-1">
                <div className="text-gray-300 whitespace-pre-wrap">{r.text}</div>
                <div className="text-[10px] text-gray-500">score: {(Number(r.score||0)).toFixed(3)}</div>
              </div>
            ))}
            {!searchResults.length && <div className="text-gray-500">No results yet.</div>}
          </div>
        </div>
      )}

      {viewTab === 'diary' && (
        <div className="rounded border border-purple-500/20 bg-black/30 p-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Diary (latest)</span>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={refreshDiary} disabled={loadingDiary}>{loadingDiary ? 'Loading…' : 'Refresh'}</button>
              <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={async()=>{
                try {
                  const last = latest?.phi ?? 0;
                  const res = await fetch('/api/memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: `Snapshot φ=${last.toFixed(3)} @ ${new Date().toLocaleTimeString()}` }) });
                  if (res.ok) refreshDiary();
                } catch {}
              }}>Record snapshot</button>
              <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700" onClick={async()=>{
                try { const r = await fetch('/api/memory/export', { cache: 'no-store' }); const j = await r.json(); const blob = new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `brahm_export_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);} catch { alert('Export failed'); }
              }}>Export JSON</button>
              <label className="px-2 py-1 rounded bg-gray-900 border border-gray-700 cursor-pointer">
                Import JSON<input type="file" accept="application/json" className="hidden" onChange={async (e)=>{
                  try { const f = e.target.files?.[0]; if (!f) return; const text = await f.text(); const data = JSON.parse(text); const r = await fetch('/api/memory/import', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(data) }); const j = await r.json(); if (!r.ok || !j?.ok) alert(`Import failed: ${j?.error||r.status}`); else { alert(`Imported diary=${j?.imported?.diary||0}, semantic=${j?.imported?.semantic||0}`); refreshDiary(); } } catch { alert('Import failed'); }
                }} />
              </label>
            </div>
          </div>
          <div className="max-h-48 overflow-auto text-xs space-y-1">
            {diary.map(d => (
              <div key={d.id} className="flex items-center justify-between border-b border-white/5 pb-1">
                <div className="text-gray-300">{d.summary}</div>
                <div className="text-[10px] text-gray-500">{new Date(d.ts).toLocaleTimeString()}</div>
              </div>
            ))}
            {!diary.length && <div className="text-gray-500">No diary entries yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function RightPanelStatusPills() {
  const [status, setStatus] = React.useState<{ risk?: string; stability?: number; ethics?: number; reflect?: number; embody?: number; qualia?: number; ts?: number } | null>(null);
  React.useEffect(() => {
    let t: any; let stop = false;
    const tick = () => {
      try {
        const raw = localStorage.getItem('rightpanel_status');
        const s = raw ? JSON.parse(raw) : null;
        if (s) setStatus(s);
      } catch {}
      if (!stop) t = setTimeout(tick, 1500);
    };
    tick();
    return () => { stop = true; if (t) clearTimeout(t); };
  }, []);
  if (!status) return null;
  const pill = (label: string, value: string, tone: 'ok'|'warn'|'bad'|'none' = 'none') => (
    <span className={`rounded px-2 py-0.5 text-[11px] border ${tone==='bad'?'bg-red-900/40 border-red-800': tone==='warn'?'bg-amber-900/40 border-amber-800': 'bg-white/5 border-white/10'}`}>{label}: {value}</span>
  );
  const toneForRisk = (r?: string) => r==='critical' ? 'bad' : r==='high' ? 'warn' : 'none';
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-gray-300">
      {pill('risk', status.risk ?? '-', toneForRisk(status.risk))}
      {pill('stability', status.stability!=null ? Number(status.stability).toFixed(2) : '-')}
      {pill('ethics', status.ethics!=null ? Number(status.ethics).toFixed(2) : '-')}
      {pill('reflect', status.reflect!=null ? Number(status.reflect).toFixed(2) : '-')}
      {pill('embody', status.embody!=null ? Number(status.embody).toFixed(2) : '-')}
      {pill('qualia', status.qualia!=null ? String(status.qualia) : '-')}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded border border-purple-500/20 bg-black/30 p-3">
      <div className="text-xs text-gray-400">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function WorkspaceStats({ items }: { items: Array<{ ts: number; spotlight: string | null; curiosity: number | null }> }) {
  const counts = React.useMemo(() => {
    const acc: Record<string, number> = {};
    for (const it of items) {
      const k = it.spotlight || 'none';
      acc[k] = (acc[k] || 0) + 1;
    }
    return acc;
  }, [items]);
  const pairs = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  return (
    <div className="rounded border border-white/10 bg-white/5 p-2">
      <div className="text-[10px] text-gray-400 mb-1">Spotlight frequency</div>
      <div className="text-xs space-y-1">
        {pairs.map(([k,v]) => (
          <div key={k} className="flex items-center justify-between"><span className="text-gray-300">{k}</span><span>{v}</span></div>
        ))}
        {!pairs.length && <div className="text-gray-500">No data</div>}
      </div>
    </div>
  );
}
function WorkspaceBars({ items }: { items: Array<{ ts: number; spotlight: string | null; curiosity: number | null }> }) {
  const vals = items.map(it => Number(it.curiosity ?? 0));
  const bins = React.useMemo(() => {
    const n = 10; const arr = new Array(n).fill(0);
    for (const v of vals) { const idx = Math.min(n-1, Math.max(0, Math.floor(v * n))); arr[idx]++; }
    return arr;
  }, [vals]);
  const max = Math.max(1, ...bins);
  return (
    <div className="rounded border border-white/10 bg-white/5 p-2">
      <div className="text-[10px] text-gray-400 mb-1">Curiosity distribution</div>
      <div className="flex items-end gap-1 h-24">
        {bins.map((b, i) => (
          <div key={i} title={`${(i/10).toFixed(1)}–${((i+1)/10).toFixed(1)}`} style={{ height: `${(b/max)*100}%` }} className="w-4 bg-emerald-500/60" />
        ))}
      </div>
    </div>
  );
}
function Chart({ metrics }: { metrics: Array<{ ts: string; phi: number; qualia: Record<string, number> }> }) {
  // simple SVG sparkline for phi
  const width = 900;
  const height = 200;
  const pad = 20;
  // Bezier smoothing by sampling
  const points = metrics.map((m, i) => ({ x: i, y: m.phi }));
  const minY = Math.min(0, ...points.map(p => p.y));
  const maxY = Math.max(1, ...points.map(p => p.y));
  const rangeY = maxY - minY || 1;
  const maxX = Math.max(1, points.length - 1);
  const toXY = (p: {x:number;y:number}) => {
    const x = pad + (p.x / maxX) * (width - pad * 2);
    const y = height - pad - ((p.y - minY) / rangeY) * (height - pad * 2);
    return { x, y };
  };
  let d = '';
  points.forEach((p, i) => {
    const { x, y } = toXY(p);
    if (i === 0) d += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    else {
      const prev = toXY(points[i-1]);
      const cx = (prev.x + x) / 2;
      d += ` C ${cx.toFixed(2)} ${prev.y.toFixed(2)} ${cx.toFixed(2)} ${y.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
  });
  return (
    <div className="rounded border border-purple-500/20 bg-black/30 p-3">
      <div className="text-xs text-gray-400 mb-2">Φ over time</div>
      <svg width={width} height={height} className="max-w-full h-auto">
        <path d={d} fill="none" stroke="#a855f7" strokeWidth="2" />
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#333" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#333" />
      </svg>
    </div>
  );
}

function PhiGauge({ value }: { value: number | null }) {
  const min = 0; const max = 2.0;
  const v = value==null ? null : Math.max(min, Math.min(max, value));
  const pct = v==null ? 0 : (v - min) / (max - min);
  const size = 140; const stroke = 12; const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const dash = v==null ? 0 : c * pct;
  const color = v==null ? '#555' : `hsl(${200 + 140*pct}, 90%, 60%)`;
  return (
    <div className="rounded border border-white/10 bg-white/5 p-3 flex items-center gap-3">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#222" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke}
                fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c-dash}`}
                transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fill="#ddd">{v==null? '–' : v.toFixed(2)}</text>
      </svg>
      <div>
        <div className="text-xs text-gray-400">Φ (0–2)</div>
        <div className="text-gray-300 text-sm">Real-time consciousness level</div>
      </div>
    </div>
  );
}

