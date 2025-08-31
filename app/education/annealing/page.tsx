"use client";
import React from 'react';
import { flags } from '@/lib/flags';

type Spin = -1 | 1;

function neighbors(i: number, j: number, N: number) {
  // 2D grid with wrap-around (torus) to keep it simple
  return [
    [(i+1)%N, j],
    [(i-1+N)%N, j],
    [i, (j+1)%N],
    [i, (j-1+N)%N],
  ];
}

function energy(config: Spin[][], J: number, h: number) {
  const N = config.length; let e = 0;
  for (let i=0;i<N;i++) for (let j=0;j<N;j++) {
    const s = config[i][j];
    // count right and down neighbors to avoid double counting
    const nn = [[(i+1)%N, j], [i, (j+1)%N]];
    for (const [x,y] of nn) e += -J * s * config[x][y];
    e += -h * s;
  }
  return e;
}

function randomConfig(N: number): Spin[][] {
  return Array.from({length:N}, (_,i)=> Array.from({length:N}, ()=> (Math.random()<0.5? -1: 1) as Spin));
}

export default function AnnealingPage() {
  const voiceHint = flags.voiceEnabled || flags.e2eHooks;
  const [N, setN] = React.useState(4);
  const [J, setJ] = React.useState(1.0);
  const [h, setH] = React.useState(0.0);
  const [T, setT] = React.useState(1.5);
  const [cfg, setCfg] = React.useState<Spin[][]>(randomConfig(4));
  const [running, setRunning] = React.useState(false);
  const [bestE, setBestE] = React.useState<number>(()=> energy(randomConfig(4), J, h));
  const [hist, setHist] = React.useState<Array<{ ts:number; N:number; J:number; h:number; T:number; E:number }>>([]);
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  React.useEffect(()=>{ (async()=>{ try { const r=await fetch('/api/persistence/status',{cache:'no-store'}); const j=await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);
  React.useEffect(()=>{ try { const sp=new URLSearchParams(window.location.search); const n=sp.get('n'); const jv=sp.get('J'); const hv=sp.get('h'); const tv=sp.get('T'); if (n) { const nn=Math.max(2,Math.min(8,Number(n)||4)); setN(nn); setCfg(randomConfig(nn)); } if (jv) setJ(Math.max(-2,Math.min(2,Number(jv)||1))); if (hv) setH(Math.max(-1,Math.min(1,Number(hv)||0))); if (tv) setT(Math.max(0,Math.min(3,Number(tv)||1.5))); } catch {} },[]);

  const E = React.useMemo(()=> energy(cfg, J, h), [cfg, J, h]);
  React.useEffect(()=>{ setBestE(prev=> Math.min(prev, E)); }, [E]);

  const step = React.useCallback(()=>{
    const n = cfg.length;
    // pick random site
    const i = Math.floor(Math.random()*n), j = Math.floor(Math.random()*n);
    const s = cfg[i][j];
    // compute ΔE for flipping s -> -s: 
    let dE = 0;
    for (const [x,y] of neighbors(i,j,n)) dE += 2 * J * s * cfg[x][y];
    dE += 2 * h * s;
    if (dE <= 0 || Math.random() < Math.exp(-dE / Math.max(1e-6, T))) {
      const next = cfg.map(row=> row.slice()) as Spin[][];
      next[i][j] = (s===1?-1:1) as Spin;
      setCfg(next);
    }
  }, [cfg, J, h, T]);

  React.useEffect(()=>{
    if (!running) return;
    const id = setInterval(()=> step(), 50);
    return ()=> clearInterval(id);
  }, [running, step]);

  const reset = () => { const r = randomConfig(N); setCfg(r); setBestE(energy(r, J, h)); };
  const share = () => { try { const u=new URL(window.location.href); u.searchParams.set('n', String(N)); u.searchParams.set('J', String(J)); u.searchParams.set('h', String(h)); u.searchParams.set('T', String(T)); navigator.clipboard.writeText(u.toString()); } catch {} };
  const snapshot = async () => {
    const ts = Date.now();
    try { const next=[{ ts, N, J, h, T, E }, ...hist].slice(0,50); setHist(next); localStorage.setItem('edu_annealing_hist', JSON.stringify(next)); } catch {}
    if (pgOk) { try { await fetch('/api/experiences',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id:`edu_annealing_${ts}`, timestamp: ts, main_content:`Annealing N=${N} J=${J.toFixed(2)} h=${h.toFixed(2)} T=${T.toFixed(2)} E=${E.toFixed(2)}`, phi_level:0, qualia_count:0, duration_ms:0 }) }); } catch {} }
  };

  React.useEffect(()=>{
    const handler = () => { snapshot(); };
    try { window.addEventListener('voice:saveSnapshot', handler as any); } catch {}
    return ()=> { try { window.removeEventListener('voice:saveSnapshot', handler as any); } catch {} };
  }, [snapshot]);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education • Annealing Landscape (Ising toy)</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-sm text-gray-300">Simulated annealing on a 2D Ising model with nearest-neighbor coupling J and external field h. Temperature T controls flip acceptance via Metropolis.</div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
          <label className="flex items-center gap-1">N
            <input type="range" min={2} max={8} step={1} value={N} onChange={e=>{ const v=Number(e.target.value); setN(v); const r=randomConfig(v); setCfg(r); setBestE(energy(r, J, h)); }} />
            <span>{N}</span>
          </label>
          <label className="flex items-center gap-1">J
            <input type="range" min={-2} max={2} step={0.05} value={J} onChange={e=> setJ(Number(e.target.value))} />
            <span>{J.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-1">h
            <input type="range" min={-1} max={1} step={0.05} value={h} onChange={e=> setH(Number(e.target.value))} />
            <span>{h.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-1">T
            <input type="range" min={0} max={3} step={0.05} value={T} onChange={e=> setT(Number(e.target.value))} />
            <span>{T.toFixed(2)}</span>
          </label>
          <button className="rounded bg-brand-600 px-2 py-1 hover:bg-brand-500" onClick={()=> setRunning(r=> !r)}>{running? 'Pause':'Run'}</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={step}>Step</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={reset}>Reset</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={share}>Copy link</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const blob=new Blob([JSON.stringify(hist, null, 2)], { type:'application/json' }); const url=URL.createObjectURL(blob); const a=document.createElement('a'); const ts=new Date().toISOString().replace(/[:.]/g,'-'); a.href=url; a.download=`annealing-history-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } catch {} }}>Export history</button>
          {pgOk && <span className="rounded bg-emerald-900/30 border border-emerald-700 px-2 py-0.5 text-emerald-300">DB:on</span>}
          {voiceHint && <span className="text-[11px] text-neutral-400 italic">Voice: say "persist snapshot"</span>}
        </div>

        <div className="grid gap-3 md:grid-cols-2 text-xs">
          <div className="rounded border border-white/10 bg-black/30 p-2">
            <div className="text-neutral-400 mb-1">Spins</div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, gap: '4px' }}>
              {cfg.map((row,i)=> row.map((s,j)=> (
                <button key={i+','+j} className="h-6 rounded border border-white/10"
                        style={{ background: s===1? 'rgba(34,197,94,0.6)':'rgba(244,63,94,0.6)' }}
                        onClick={()=>{
                          const next = cfg.map(r=> r.slice()) as Spin[][];
                          next[i][j] = (next[i][j]===1?-1:1) as Spin;
                          setCfg(next);
                        }}
                />
              )))}
            </div>
          </div>
          <div className="rounded border border-white/10 bg-black/30 p-2 space-y-2">
            <div className="text-neutral-400">Energy</div>
            <div className="flex items-center gap-2">
              <span>E</span>
              <div className="h-3 w-48 bg-white/10 rounded overflow-hidden" aria-label="energy">
                <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, Math.max(0, Math.round((1 - (E / (N*N*2*Math.max(0.001, Math.abs(J))+Math.abs(h)*N*N))) * 100)))}%` }} />
              </div>
              <span>{E.toFixed(2)}</span>
            </div>
            <div className="text-neutral-400">Best energy so far: {bestE.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

