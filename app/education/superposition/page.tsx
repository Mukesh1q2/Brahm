"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { flags } from '@/lib/flags';

const QuantumVisualizers = dynamic(()=> import('@/app/_components/quantum/QuantumConceptVisualizers'), { ssr: false });

function speak(text: string) {
  try { const u = new SpeechSynthesisUtterance(text); u.rate=1; u.pitch=1; window.speechSynthesis.speak(u); } catch {}
}

export default function SuperpositionLesson() {
  const three = flags.three;
  const [theta, setTheta] = React.useState(Math.PI/4);
  const [measured, setMeasured] = React.useState<number|null>(null);
  const [hist, setHist] = React.useState<Array<{ ts: number; theta: number; outcome: 0|1 }>>([]);
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  const [step, setStep] = React.useState(0);
  React.useEffect(()=>{ speak('Welcome to the Superposition demo. Adjust theta and measure.'); },[]);
  // Read from query (?theta=...)
  React.useEffect(()=>{
    try {
      const sp = new URLSearchParams(window.location.search);
      const th = sp.get('theta');
      if (th != null) {
        const v = Math.max(0, Math.min(Math.PI/2, Number(th)));
        if (Number.isFinite(v)) setTheta(v);
      }
    } catch {}
  },[]);
  React.useEffect(()=>{ try { const raw = localStorage.getItem('edu_superposition_hist'); if (raw) setHist(JSON.parse(raw)); } catch {} },[]);
  React.useEffect(()=>{ (async()=>{ try { const r = await fetch('/api/persistence/status', { cache:'no-store' }); const j = await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);

  const measure = async () => {
    const p0 = Math.cos(theta)**2; const r = Math.random(); const out: 0|1 = (r<p0? 0:1);
    setMeasured(out);
    const row = { theta, out, ts: Date.now() } as const;
    try {
      localStorage.setItem('edu_superposition_last', JSON.stringify(row));
      const next = [{ ts: row.ts, theta: row.theta, outcome: row.out }, ...hist].slice(0,50);
      setHist(next);
      localStorage.setItem('edu_superposition_hist', JSON.stringify(next));
    } catch {}
    // Optional DB persist
    if (pgOk) {
      try {
        await fetch('/api/experiences', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
          id: `edu_superposition_${row.ts}`,
          timestamp: row.ts,
          main_content: `Superposition measured → |${out}⟩ at θ=${theta.toFixed(3)}`,
          phi_level: 0,
          qualia_count: 0,
          duration_ms: 0,
        }) });
      } catch {}
    }
  };

  const steps = [
    {
      title: 'Prepare superposition',
      desc: 'Apply an H-like preparation: set θ ≈ π/4 to balance |0⟩ and |1⟩ amplitudes.',
      apply: () => { setTheta(Math.PI/4); speak('Setting theta to pi over four for balanced superposition.'); },
    },
    {
      title: 'Observe probabilities',
      desc: 'Check the bars for p(|0⟩) and p(|1⟩) before measurement.',
      apply: () => { speak(`Current probabilities: p zero ${ (Math.cos(theta)**2).toFixed(2) }, p one ${ (Math.sin(theta)**2).toFixed(2) }`); },
    },
    {
      title: 'Measure (collapse)',
      desc: 'Perform a projective measurement. The state collapses to |0⟩ or |1⟩ with corresponding probabilities.',
      apply: () => { measure(); },
    },
    {
      title: 'Reset & repeat',
      desc: 'Reset the state and try different θ to see how probabilities change.',
      apply: () => { setMeasured(null); speak('State reset. Adjust theta and try again.'); },
    },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education • Superposition</h1>
      <p className="text-sm text-gray-400">Basic Three.js visualization with measurement slider and narration.</p>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-gray-300">θ</span>
            <input type="range" min={0} max={Math.PI/2} step={0.01} value={theta} onChange={e=>setTheta(Number(e.target.value))} className="w-48" disabled={measured!==null} />
          </label>
          <div className="text-xs text-gray-400">
            <div>a0 = cos(θ) = {Math.cos(theta).toFixed(3)} • p(|0⟩) = {(Math.cos(theta)**2).toFixed(3)}</div>
            <div>a1 = sin(θ) = {Math.sin(theta).toFixed(3)} • p(|1⟩) = {(Math.sin(theta)**2).toFixed(3)}</div>
          </div>
          <button className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500 disabled:opacity-60" onClick={measure} disabled={measured!==null}>Measure</button>
          {measured!==null && <button className="px-3 py-1 rounded border border-white/15 bg-white/5 hover:bg-white/10" onClick={()=>setMeasured(null)}>Reset</button>}
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span>History</span>
          <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={()=>{ try { localStorage.removeItem('edu_superposition_hist'); } catch {}; setHist([]); }}>Clear</button>
          <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={()=>{ try { const blob = new Blob([JSON.stringify(hist, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); const ts = new Date().toISOString().replace(/[:.]/g,'-'); a.href = url; a.download = `superposition-history-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } catch {} }}>Export</button>
          <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={()=>{ try { const u = new URL(window.location.href); u.searchParams.set('theta', String(theta)); navigator.clipboard.writeText(u.toString()); } catch {} }}>Copy link</button>
          {pgOk && <span className="rounded bg-emerald-900/30 border border-emerald-700 px-2 py-0.5 text-emerald-300">DB:on</span>}
        </div>
        {hist.length>0 && (
          <div className="rounded border border-white/10 bg-black/30 p-2 text-xs text-neutral-300 max-h-40 overflow-auto">
            <table className="w-full text-left">
              <thead><tr><th className="pr-2">Time</th><th className="pr-2">θ</th><th>Outcome</th></tr></thead>
              <tbody>
                {hist.map((h,i)=>(<tr key={i}><td className="pr-2">{new Date(h.ts).toLocaleTimeString()}</td><td className="pr-2">{h.theta.toFixed(3)}</td><td>|{h.outcome}⟩</td></tr>))}
              </tbody>
            </table>
          </div>
        )}
        {/* Guided stepper */}
        <div className="rounded border border-white/10 bg-black/30 p-3 text-xs text-neutral-300">
          <div className="flex items-center justify-between">
            <div className="font-medium text-neutral-200">Step {step+1} / {steps.length}: {steps[step].title}</div>
            <div className="flex items-center gap-2">
              <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={()=> steps[step].apply()}>Apply</button>
              <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={()=> speak(steps[step].desc)}>Speak</button>
            </div>
          </div>
          <div className="mt-1 text-neutral-400">{steps[step].desc}</div>
          <div className="mt-2 flex items-center gap-2">
            <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15 disabled:opacity-50" disabled={step<=0} onClick={()=> setStep(s=> Math.max(0, s-1))}>Prev</button>
            <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15 disabled:opacity-50" disabled={step>=steps.length-1} onClick={()=> setStep(s=> Math.min(steps.length-1, s+1))}>Next</button>
          </div>
        </div>

        {three ? (
          <QuantumVisualizers activeDemo='superposition' />
        ) : (
          <div className="rounded border border-white/10 bg-white/5 p-6 min-h-[240px]">
            <div className="text-sm text-gray-300 mb-2">2D fallback</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">|0⟩ probability</div>
                <div className="h-2 rounded bg-white/10 overflow-hidden"><div className="h-2 bg-brand-500" style={{ width: `${(Math.cos(theta)**2)*100}%` }} /></div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">|1⟩ probability</div>
                <div className="h-2 rounded bg-white/10 overflow-hidden"><div className="h-2 bg-purple-500" style={{ width: `${(Math.sin(theta)**2)*100}%` }} /></div>
              </div>
            </div>
            {measured!==null && <div className="mt-3 text-xs text-gray-300">Outcome: |{measured}⟩ (collapsed)</div>}
          </div>
        )}
      </div>
    </div>
  );
}
