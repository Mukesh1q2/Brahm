"use client";
import React from 'react';

type Gate = { type: 'H'|'X'|'Z'|'CNOT'|'CPHASE'; target: number; control?: number; phi?: number };

function encodeGates(gs: Gate[]): string { try { return btoa(unescape(encodeURIComponent(JSON.stringify(gs)))); } catch { return ''; } }

function qftPreset(n: number, withSwap=false): Gate[] {
  const gs: Gate[] = [];
  for (let k=0;k<n;k++) {
    gs.push({ type:'H', target:k });
    for (let j=k+1;j<n;j++) {
      const phi = Math.PI / Math.pow(2, j-k);
      gs.push({ type:'CPHASE', control:j, target:k, phi });
    }
  }
  if (withSwap && n>=2) {
    for (let i=0;i<Math.floor(n/2);i++) {
      const a=i, b=n-1-i;
      gs.push({ type:'CNOT', control:a, target:b });
      gs.push({ type:'CNOT', control:b, target:a });
      gs.push({ type:'CNOT', control:a, target:b });
    }
  }
  return gs;
}

export default function QFTPage() {
  const [n, setN] = React.useState(3);
  const [x, setX] = React.useState(1);
  const N = 1<<n;
  const amps = React.useMemo(()=>{
    const out = Array.from({length:N}, (_, y) => {
      const ang = 2*Math.PI*x*y/N;
      return { re: Math.cos(ang)/Math.sqrt(N), im: Math.sin(ang)/Math.sqrt(N) };
    });
    return out;
  }, [n, x]);
  const probs = amps.map(a => a.re*a.re + a.im*a.im);
  const loadPlayground = React.useCallback((withSwap=false) => {
    const g = qftPreset(n, withSwap);
    const enc = encodeGates(g);
    try {
      const u = new URL(window.location.origin + '/education/circuits');
      u.searchParams.set('n', String(n));
      u.searchParams.set('g', enc);
      window.location.assign(u.toString());
    } catch {}
  }, [n]);

  React.useEffect(() => {
    const h = () => loadPlayground(false);
    try { window.addEventListener('voice:runQFT', h as any); } catch {}
    return () => { try { window.removeEventListener('voice:runQFT', h as any); } catch {} };
  }, [loadPlayground]);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education  Quantum Fourier Transform</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
          <label className="flex items-center gap-1">qubits
            <select className="rounded bg-black/30 px-1 py-0.5" value={n} onChange={e=>{ const nn=Math.max(1, Math.min(3, Number(e.target.value)||3)); setN(nn); setX(x % (1<<nn)); }}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
          <label className="flex items-center gap-1">input |x?
            <input className="w-20 rounded bg-black/30 px-1 py-0.5" type="number" min={0} max={(1<<n)-1} value={x} onChange={e=>{ const v = Math.max(0, Math.min((1<<n)-1, Number(e.target.value)||0)); setX(v); }} />
          </label>
          <button className="rounded bg-brand-600 px-2 py-1 hover:bg-brand-500" onClick={()=>loadPlayground(false)}>Load in Playground (QFT{n})</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>loadPlayground(true)}>+SWAP</button>
          <span className="text-[11px] text-neutral-400 italic">Voice: say "run qft"</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-xs">
          <div className="rounded border border-white/10 bg-black/30 p-2">
            <div className="text-neutral-400 mb-1">Amplitudes (H|x? mapped by DFT)</div>
            <pre className="max-h-40 overflow-auto">{amps.map((a,i)=> `|${i.toString(2).padStart(n,'0')}?: ${a.re.toFixed(3)} ${a.im>=0?'+':'-'} ${Math.abs(a.im).toFixed(3)}i`).join('\n')}</pre>
          </div>
          <div className="rounded border border-white/10 bg-black/30 p-2">
            <div className="text-neutral-400 mb-1">Probabilities</div>
            <div className="flex items-end gap-2 h-24">
              {probs.map((p,i)=> (
                <div key={i} title={`|${i.toString(2).padStart(n,'0')}? ${(p*100).toFixed(1)}%`} className="w-6 bg-emerald-500/70" style={{ height: `${Math.max(3, p*100)}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

