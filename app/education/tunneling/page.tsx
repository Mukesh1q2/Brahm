"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { flags } from '@/lib/flags';

const QuantumVisualizers = dynamic(()=> import('@/app/_components/quantum/QuantumConceptVisualizers'), { ssr: false });

function speak(text: string) { try { const u = new SpeechSynthesisUtterance(text); window.speechSynthesis.speak(u); } catch {} }

export default function TunnelingLesson() {
  const three = flags.three;
  const [barrier, setBarrier] = React.useState(5);
  const [energy, setEnergy] = React.useState(3);
  const [prob, setProb] = React.useState(0);
  const [hist, setHist] = React.useState<Array<{ ts: number; barrier: number; energy: number; p: number }>>([]);
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  React.useEffect(()=>{ speak('Tunneling demo. Adjust barrier and energy to see probability.'); },[]);
  React.useEffect(()=>{ try { const raw = localStorage.getItem('edu_tunneling_hist'); if (raw) setHist(JSON.parse(raw)); } catch {} },[]);
  React.useEffect(()=>{ const p = Math.max(0, Math.min(1, Math.exp(-(barrier - energy) * 0.5))); setProb(p); }, [barrier, energy]);
  React.useEffect(()=>{ (async()=>{ try { const r = await fetch('/api/persistence/status', { cache:'no-store' }); const j = await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);
  // Read from query (?barrier=...&energy=...)
  React.useEffect(()=>{
    try {
      const sp = new URLSearchParams(window.location.search);
      const b = sp.get('barrier'); const e = sp.get('energy');
      if (b!=null) { const v = Math.max(0, Math.min(10, Number(b))); if (Number.isFinite(v)) setBarrier(v); }
      if (e!=null) { const v = Math.max(0, Math.min(10, Number(e))); if (Number.isFinite(v)) setEnergy(v); }
    } catch {}
  },[]);
  const snapshot = async () => {
    const row = { ts: Date.now(), barrier, energy, p: prob };
    try { const next = [row, ...hist].slice(0, 50); setHist(next); localStorage.setItem('edu_tunneling_hist', JSON.stringify(next)); } catch {}
    if (pgOk) {
      try {
        await fetch('/api/experiences', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id:`edu_tunneling_${row.ts}`, timestamp: row.ts, main_content: `Tunneling p=${prob.toFixed(3)} (barrier=${barrier}, energy=${energy})`, phi_level: 0, qualia_count: 0, duration_ms: 0 }) });
      } catch {}
    }
  };
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education • Tunneling</h1>
      <p className="text-sm text-gray-400">Barrier + wavefunction visualization with narration. 2D fallback available.</p>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
          <label className="flex items-center gap-1">barrier
            <input type="range" min={0} max={10} step={0.1} value={barrier} onChange={e=>setBarrier(Number(e.target.value))} />
            <span>{barrier.toFixed(1)}</span>
          </label>
          <label className="flex items-center gap-1">energy
            <input type="range" min={0} max={10} step={0.1} value={energy} onChange={e=>setEnergy(Number(e.target.value))} />
            <span>{energy.toFixed(1)}</span>
          </label>
          <span className="rounded bg-white/10 px-2 py-0.5">p≈{prob.toFixed(3)}</span>
          <button className="rounded bg-brand-600 px-2 py-1 hover:bg-brand-500" onClick={snapshot}>Record snapshot</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { localStorage.removeItem('edu_tunneling_hist'); } catch {}; setHist([]); }}>Clear</button>
          <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={()=>{ try { const u = new URL(window.location.href); u.searchParams.set('barrier', String(barrier)); u.searchParams.set('energy', String(energy)); navigator.clipboard.writeText(u.toString()); } catch {} }}>Copy link</button>
          {pgOk && <span className="rounded bg-emerald-900/30 border border-emerald-700 px-2 py-0.5 text-emerald-300">DB:on</span>}
        </div>
        {hist.length>0 && (
          <div className="rounded border border-white/10 bg-black/30 p-2 text-xs text-neutral-300 max-h-40 overflow-auto">
            <table className="w-full text-left">
              <thead><tr><th className="pr-2">Time</th><th className="pr-2">barrier</th><th className="pr-2">energy</th><th>p</th></tr></thead>
              <tbody>
                {hist.map((h,i)=>(<tr key={i}><td className="pr-2">{new Date(h.ts).toLocaleTimeString()}</td><td className="pr-2">{h.barrier.toFixed(1)}</td><td className="pr-2">{h.energy.toFixed(1)}</td><td>{h.p.toFixed(3)}</td></tr>))}
              </tbody>
            </table>
          </div>
        )}
        {hist.length>0 && (
          <div className="text-xs text-gray-400">
            <button className="mt-2 rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={()=>{ try { const blob = new Blob([JSON.stringify(hist, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); const ts = new Date().toISOString().replace(/[:.]/g,'-'); a.href = url; a.download = `tunneling-history-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } catch {} }}>Export history</button>
          </div>
        )}
        {three ? (
          <QuantumVisualizers activeDemo='tunneling' />
        ) : (
          <div className="rounded border border-white/10 bg-white/5 p-6 min-h-[240px]">
            <div className="text-sm text-gray-300 mb-2">2D fallback</div>
            <div className="text-xs text-gray-400">Increase particle energy to raise tunneling probability through the barrier.</div>
            <div className="mt-2 h-2 rounded bg-white/10 overflow-hidden"><div className="h-2 bg-emerald-500" style={{ width: '35%' }} /></div>
          </div>
        )}
      </div>
    </div>
  );
}
