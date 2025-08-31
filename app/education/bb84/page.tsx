"use client";
import React from 'react';
import { flags } from '@/lib/flags';

type Bit = 0|1; type Basis = 'Z'|'X';
function randBit(): Bit { return Math.random()<0.5? 0:1; }
function randBasis(): Basis { return Math.random()<0.5? 'Z':'X'; }

function encode(bit: Bit, basis: Basis): string {
  // Return state label for display
  if (basis==='Z') return bit===0? '|0⟩':'|1⟩';
  return bit===0? '|+⟩':'|−⟩';
}

export default function BB84Page() {
  const voiceHint = flags.voiceEnabled || flags.e2eHooks;
  const [n, setN] = React.useState(16);
  const [eve, setEve] = React.useState(false);
  const [run, setRun] = React.useState<{ aliceBits: Bit[]; aliceBases: Basis[]; states: string[]; bobBases: Basis[]; bobResults: Bit[]; siftIdx: number[]; qber: number }|null>(null);
  const [hist, setHist] = React.useState<any[]>([]);
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  // Hydrate from URL params for shareable links
  React.useEffect(()=>{ try { const sp=new URLSearchParams(window.location.search); const nv=sp.get('n'); const ev=sp.get('eve'); if (nv) setN(Math.max(4, Math.min(64, Number(nv)))); if (ev!=null) setEve(ev==='1'||ev==='true'); } catch {} },[]);
  React.useEffect(()=>{ (async()=>{ try { const r=await fetch('/api/persistence/status',{cache:'no-store'}); const j=await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);
  const execute = async () => {
    const aliceBits = Array.from({length:n}, ()=>randBit());
    const aliceBases = Array.from({length:n}, ()=>randBasis());
    const states = aliceBits.map((b,i)=> encode(b, aliceBases[i]));
    const eveBases = eve? aliceBits.map(()=> randBasis()) : null;
    // If Eve intercepts: measure in random basis, collapse state, resend
    const statesAfterEve = eve? states.map((st,i)=>{
      const eb = eveBases![i];
      // Measuring in wrong basis randomizes
      const correct = (eb===aliceBases[i]);
      const bit = correct? aliceBits[i] : randBit();
      return encode(bit, aliceBases[i]);
    }) : states;
    const bobBases = Array.from({length:n}, ()=>randBasis());
    const bobResults: Bit[] = bobBases.map((bb,i)=>{
      const ab = aliceBases[i];
      if (bb===ab) {
        // Measuring in correct basis recovers bit
        return (statesAfterEve[i].includes('1')||statesAfterEve[i].includes('−'))? 1:0 as Bit;
      } else {
        return randBit();
      }
    });
    const siftIdx = bobBases.map((bb,i)=> bb===aliceBases[i]? i:-1).filter(i=>i>=0);
    // QBER = error rate in sifted key
    const errs = siftIdx.filter(i => bobResults[i] !== aliceBits[i]).length;
    const qber = siftIdx.length? (errs/siftIdx.length): 0;
    const runObj = { aliceBits, aliceBases, states: statesAfterEve, bobBases, bobResults, siftIdx, qber };
    setRun(runObj);
    try { const next=[{ ts: Date.now(), n, eve, qber }, ...hist].slice(0,50); setHist(next); localStorage.setItem('edu_bb84_hist', JSON.stringify(next)); } catch {}
    if (pgOk) { try { await fetch('/api/experiences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:`edu_bb84_${Date.now()}`,timestamp:Date.now(),main_content:`BB84 n=${n} eve=${eve} qber=${qber.toFixed(3)}`,phi_level:0,qualia_count:0,duration_ms:0})}); } catch {} }
  };

  // Persist a snapshot (Voice Agent or button hook)
  const persistSnapshot = React.useCallback(async () => {
    const ts = Date.now();
    const qberStr = run ? run.qber.toFixed(3) : 'n/a';
    const msg = `BB84 snapshot n=${n} eve=${eve} qber=${qberStr}`;
    try {
      const next=[{ ts, n, eve, qber: run?.qber ?? null, note: 'voice' }, ...hist].slice(0,50);
      setHist(next);
      localStorage.setItem('edu_bb84_hist', JSON.stringify(next));
    } catch {}
    if (pgOk) {
      try { await fetch('/api/experiences', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id:`edu_bb84_${ts}`, timestamp: ts, main_content: msg, phi_level: 0, qualia_count: 0, duration_ms: 0 }) }); } catch {}
    }
  }, [n, eve, run, hist, pgOk]);

  // Voice Agent: allow "persist snapshot" to trigger persistence
  React.useEffect(() => {
    const handler = () => { persistSnapshot(); };
    try { window.addEventListener('voice:saveSnapshot', handler as any); } catch {}
    return () => { try { window.removeEventListener('voice:saveSnapshot', handler as any); } catch {} };
  }, [persistSnapshot]);
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education • BB84 QKD</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
          <label className="flex items-center gap-1">n
            <input type="number" min={4} max={64} value={n} onChange={e=>setN(Math.max(4, Math.min(64, Number(e.target.value)||16)))} className="w-20 rounded bg-black/30 px-1 py-0.5" />
          </label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={eve} onChange={e=>setEve(e.target.checked)} /> Eavesdropper (Eve)</label>
          <button className="rounded bg-brand-600 px-2 py-1 hover:bg-brand-500" onClick={execute}>Run</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={persistSnapshot}>Record snapshot</button>
          {voiceHint && (
            <span className="text-[11px] text-neutral-400 italic">Voice: say "persist snapshot"</span>
          )}
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const blob=new Blob([JSON.stringify(hist, null, 2)], { type:'application/json' }); const url=URL.createObjectURL(blob); const a=document.createElement('a'); const ts=new Date().toISOString().replace(/[:.]/g,'-'); a.href=url; a.download=`bb84-history-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);} catch {} }}>Export history</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const u=new URL(window.location.href); u.searchParams.set('n', String(n)); u.searchParams.set('eve', eve ? '1' : '0'); navigator.clipboard.writeText(u.toString()); } catch {} }}>Copy link</button>
        </div>
        {run ? (
          <div className="grid gap-3 md:grid-cols-2 text-xs">
            <div className="rounded border border-white/10 bg-black/30 p-2">
              <div className="text-neutral-400 mb-1">Alice</div>
              <table className="w-full"><thead><tr><th>i</th><th>bit</th><th>basis</th><th>state</th></tr></thead>
                <tbody>{run.aliceBits.map((b,i)=>(<tr key={i}><td>{i}</td><td>{b}</td><td>{run.aliceBases[i]}</td><td>{run.states[i]}</td></tr>))}</tbody>
              </table>
            </div>
            <div className="rounded border border-white/10 bg-black/30 p-2">
              <div className="text-neutral-400 mb-1">Bob</div>
              <table className="w-full"><thead><tr><th>i</th><th>basis</th><th>result</th><th>keep?</th></tr></thead>
                <tbody>{run.bobBases.map((b,i)=>(<tr key={i}><td>{i}</td><td>{b}</td><td>{run.bobResults[i]}</td><td>{run.siftIdx.includes(i)? '✓':''}</td></tr>))}</tbody>
              </table>
            </div>
            <div className="rounded border border-white/10 bg-black/30 p-2 space-y-2">
              <div className="text-neutral-400">Sifted key & QBER</div>
              <div className="mt-1">Sifted length: {run.siftIdx.length}</div>
              <div className="flex items-center gap-2">
                <span>QBER</span>
                <div className="h-3 w-48 bg-white/10 rounded overflow-hidden" aria-label="QBER">
                  <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, Math.max(0, Math.round(run.qber*100)))}%` }} />
                </div>
                <span>{(run.qber*100).toFixed(1)}%</span>
              </div>
              {eve && (
                <div className="text-neutral-300">
                  <div className="text-neutral-400 mb-1">Disturbance (Eve enabled)</div>
                  <div className="text-[11px]">When Eve measures in a random basis, she collapses states prepared by Alice. On mismatched bases, Bob’s results become random, increasing QBER.</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-neutral-400 text-sm">Click Run to simulate BB84; enable Eve to see QBER rise.</div>
        )}
      </div>
    </div>
  );
}
