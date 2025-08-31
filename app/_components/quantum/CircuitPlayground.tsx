"use client";
import React from 'react';
import { C, initState, applySingle, H, X, Z, applyCNOT, applyCPHASE, probabilities } from '@/lib/quantum/linalg';

type Gate = { type: 'H'|'X'|'Z'|'CNOT'|'CPHASE'; target: number; control?: number; phi?: number };

function encodeGates(gs: Gate[]): string { try { return btoa(unescape(encodeURIComponent(JSON.stringify(gs)))); } catch { return ''; } }
function decodeGates(s: string|null): Gate[] { try { return s? JSON.parse(decodeURIComponent(escape(atob(s)))): []; } catch { return []; } }

export default function CircuitPlayground() {
  const [n, setN] = React.useState(2);
  const [gates, setGates] = React.useState<Gate[]>([]);
  const [state, setState] = React.useState(initState(2));
  const [phi, setPhi] = React.useState(Math.PI/2);
  const [basisX, setBasisX] = React.useState(0);
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  React.useEffect(()=>{ try { const sp = new URLSearchParams(window.location.search); const enc = sp.get('g'); const nn = sp.get('n'); if (nn) setN(Math.max(1, Math.min(3, Number(nn)))); if (enc) setGates(decodeGates(enc)); } catch {} },[]);
  React.useEffect(()=>{ (async()=>{ try { const r=await fetch('/api/persistence/status',{cache:'no-store'}); const j=await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);
  const reset = () => { setState(initState(n)); };
  const run = () => { let s = initState(n); for (const g of gates) s = applyGate(n, g, s); setState(s); };
  const step = () => { let s = state; const g = gates[0]; if (!g) return; s = applyGate(n, g, s); setState(s); setGates(gates.slice(1)); };
  const add = (g: Gate) => setGates(prev => [...prev, g]);
  const share = () => { try { const u=new URL(window.location.href); u.searchParams.set('n', String(n)); u.searchParams.set('g', encodeGates(gates)); navigator.clipboard.writeText(u.toString()); } catch {} };
  const save = async () => { if (!pgOk) return; try { await fetch('/api/experiences',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id:`edu_circuit_${Date.now()}`, timestamp: Date.now(), main_content:`Circuit n=${n} g=${gates.length}`, phi_level:0, qualia_count:0, duration_ms:0 }) }); } catch {} };

  const probs = probabilities(state);
  const phases = state.map(c => Math.atan2(c.im, c.re));

  // QFT preset generator (n<=3)
  function qftPreset(nq: number, withSwap=false): Gate[] {
    const gs: Gate[] = [];
    for (let k=0;k<nq;k++) {
      gs.push({ type:'H', target:k });
      for (let j=k+1;j<nq;j++) {
        const phi = Math.PI / Math.pow(2, j-k);
        gs.push({ type:'CPHASE', control:j, target:k, phi });
      }
    }
    if (withSwap && nq>=2) {
      for (let i=0;i<Math.floor(nq/2);i++) {
        const a=i, b=nq-1-i;
        gs.push({ type:'CNOT', control:a, target:b });
        gs.push({ type:'CNOT', control:b, target:a });
        gs.push({ type:'CNOT', control:a, target:b });
      }
    }
    return gs;
  }

  function prepareBasis(idx: number) {
    const dim = 1<<n; const clamped = Math.max(0, Math.min(dim-1, Math.floor(idx)));
    const s = Array.from({length: dim}, (_,i) => i===clamped ? C(1,0) : C(0,0));
    setState(s);
  }

  function applyQFT(withSwap=false) {
    const gs = qftPreset(n, withSwap);
    let s = state;
    for (const g of gs) s = applyGate(n, g, s);
    setState(s);
  }
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
        <label className="flex items-center gap-1">qubits
          <select className="rounded bg-black/30 px-1 py-0.5" value={n} onChange={e=>{ const nn = Math.max(1, Math.min(3, Number(e.target.value)||2)); setN(nn); setState(initState(nn)); setGates([]); }}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'H', target:0 })}>H q0</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'X', target:0 })}>X q0</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'Z', target:0 })}>Z q0</button>
        {n===2 && (
          <>
            <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'H', target:1 })}>H q1</button>
            <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'X', target:1 })}>X q1</button>
            <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'Z', target:1 })}>Z q1</button>
            <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'CNOT', control:1, target:0 })}>CNOT q1→q0</button>
            <label className="flex items-center gap-1">CPHASE φ
              <input type="range" min={0} max={Math.PI} step={0.05} value={phi} onChange={e=>setPhi(Number(e.target.value))} />
              <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'CPHASE', control:1, target:0, phi })}>add</button>
            </label>
          </>
        )}
        {n>=3 && (
          <>
            <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'H', target:2 })}>H q2</button>
            <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'X', target:2 })}>X q2</button>
            <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'Z', target:2 })}>Z q2</button>
            <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'CNOT', control:2, target:1 })}>CNOT q2q1</button>
            <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'CNOT', control:2, target:0 })}>CNOT q2q0</button>
            <label className="flex items-center gap-1">CPHASE q2q1 �
              <input type="range" min={0} max={Math.PI} step={0.05} value={phi} onChange={e=>setPhi(Number(e.target.value))} />
              <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'CPHASE', control:2, target:1, phi })}>add</button>
            </label>
            <label className="flex items-center gap-1">CPHASE q2q0 �
              <input type="range" min={0} max={Math.PI} step={0.05} value={phi} onChange={e=>setPhi(Number(e.target.value))} />
              <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>add({ type:'CPHASE', control:2, target:0, phi })}>add</button>
            </label>
          </>
        )}
        <button className="rounded bg-brand-600 px-2 py-1 hover:bg-brand-500" onClick={run}>Run</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={step}>Step</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={reset}>Reset</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={share}>Copy link</button>
        {pgOk && <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={save}>Persist</button>}
        {/* Direct prep/run controls */}
        <label className="flex items-center gap-1">basis |x⟩
          <input type="number" className="w-20 rounded bg-black/30 px-1 py-0.5" min={0} max={(1<<n)-1} value={basisX}
                 onChange={e=> setBasisX(Math.max(0, Math.min((1<<n)-1, Number(e.target.value)||0)))} />
        </label>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>prepareBasis(basisX)}>Prepare |x⟩</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>applyQFT(false)}>Apply QFT</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>applyQFT(true)}>Apply QFT+SWAP</button>
        {/* Presets */}
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ setN(2); setState(initState(2)); setGates([{ type:'H', target:1 }, { type:'CPHASE', control:1, target:0, phi: Math.PI/2 }, { type:'H', target:0 }]); }}>Load QFT2</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ setN(2); setState(initState(2)); setGates([{ type:'H', target:1 }, { type:'CPHASE', control:1, target:0, phi: Math.PI/2 }, { type:'H', target:0 }, { type:'CNOT', control:0, target:1 }, { type:'CNOT', control:1, target:0 }, { type:'CNOT', control:0, target:1 }]); }}>Load QFT2+SWAP</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ setN(2); setState(initState(2)); setGates([{ type:'H', target:0 }, { type:'CPHASE', control:1, target:0, phi: -Math.PI/2 }, { type:'H', target:1 }]); }}>Load QFT2⁻¹</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ setN(2); setState(initState(2)); setGates([{ type:'CNOT', control:0, target:1 }, { type:'CNOT', control:1, target:0 }, { type:'CNOT', control:0, target:1 }, { type:'H', target:0 }, { type:'CPHASE', control:1, target:0, phi: -Math.PI/2 }, { type:'H', target:1 }]); }}>Load QFT2⁻¹+SWAP</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ const gs = qftPreset(3,false); setN(3); setState(initState(3)); setGates(gs); }}>Load QFT3</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ const gs = qftPreset(3,true); setN(3); setState(initState(3)); setGates(gs); }}>Load QFT3+SWAP</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ setN(2); setState(initState(2)); setGates([{ type:'H', target:0 }, { type:'CNOT', control:0, target:1 }]); }}>Load Bell</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ if (n===2) setGates(prev => [...prev, { type:'CNOT', control:0, target:1 }, { type:'CNOT', control:1, target:0 }, { type:'CNOT', control:0, target:1 }]); else if (n===3) setGates(prev => [...prev, { type:'CNOT', control:0, target:2 }, { type:'CNOT', control:2, target:0 }, { type:'CNOT', control:0, target:2 }]); }}>Add SWAP</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const blob = new Blob([JSON.stringify({ n, gates }, null, 2)], { type:'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); const ts = new Date().toISOString().replace(/[:.]/g,'-'); a.href = url; a.download = `circuit-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } catch {} }}>Export circuit</button>
      </div>
      <div className="text-xs text-neutral-400">Gates: {gates.map((g,i)=> `${g.type}${g.control!=null?`(${g.control}→${g.target})`:`(${g.target})`}`).join(', ') || '(none)'}</div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded border border-white/10 bg-black/30 p-2 text-xs text-neutral-300">
          <div className="text-neutral-400 mb-1">State vector</div>
          <pre className="max-h-40 overflow-auto">{state.map((c,i)=>`|${i.toString(2).padStart(n, '0')}⟩: ${c.re.toFixed(3)} ${c.im>=0?'+':'-'} ${Math.abs(c.im).toFixed(3)}i`).join('\n')}</pre>
        </div>
        <div className="rounded border border-white/10 bg-black/30 p-2 text-xs text-neutral-300">
          <div className="text-neutral-400 mb-1">Probabilities</div>
          <div className="flex items-end gap-2 h-24">
            {probs.map((p,i)=> (
              <div key={i} title={`|${i.toString(2).padStart(n,'0')}⟩ ${(p*100).toFixed(1)}%`} className="w-6 bg-emerald-500/70" style={{ height: `${Math.max(3, p*100)}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded border border-white/10 bg-black/30 p-2 text-xs text-neutral-300">
          <div className="text-neutral-400 mb-1">Phases</div>
          <div className="flex items-center gap-3">
            {phases.map((ph,i)=> {
              const hue = (ph+Math.PI)/(2*Math.PI)*360; // map [-pi,pi] -> [0,360]
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="h-5 w-5 rounded-full border border-white/20" style={{ background: `hsl(${hue}, 80%, 60%)` }} />
                  <div className="mt-1 font-mono">{ph.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">Legend: hue encodes phase φ ∈ [-π, π] mapped to 0–360°. Equal colors across basis states indicate equal relative phases.</div>
        </div>
      </div>
    </div>
  );
}

function applyGate(n: number, g: Gate, s: ReturnType<typeof initState>): ReturnType<typeof initState> {
  switch (g.type) {
    case 'H': return applySingle(n, g.target, H, s);
    case 'X': return applySingle(n, g.target, X, s);
    case 'Z': return applySingle(n, g.target, Z, s);
    case 'CNOT': return applyCNOT(n, g.control!, g.target, s);
    case 'CPHASE': return applyCPHASE(n, g.control!, g.target, g.phi ?? Math.PI/2, s);
  }
}
