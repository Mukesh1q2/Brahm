"use client";
import React from 'react';
import { flags } from '@/lib/flags';

function eigen2x2(a: number, b: number, d: number) {
  const tr = a + d;
  const det = a*d - b*b;
  const disc = Math.max(0, tr*tr - 4*det);
  const s = Math.sqrt(disc);
  const l1 = 0.5*(tr - s), l2 = 0.5*(tr + s);
  // Ground eigenvector (for l1): solve (H - l1 I)v = 0 -> (a-l1)x + b y = 0 => choose x=b, y=-(a-l1)
  const x = b, y = -(a - l1);
  const norm = Math.hypot(x, y) || 1;
  const v = { x: x/norm, y: y/norm };
  return { l1, l2, v };
}

export default function AdiabaticToyPage() {
  const voiceHint = flags.voiceEnabled || flags.e2eHooks;
  const [s, setS] = React.useState(0.35); // interpolation parameter in [0,1]
  const [hist, setHist] = React.useState<Array<{ ts: number; s: number }>>([]);
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  React.useEffect(()=>{ (async()=>{ try { const r=await fetch('/api/persistence/status',{cache:'no-store'}); const j=await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);
  React.useEffect(()=>{ try { const sp=new URLSearchParams(window.location.search); const sv=sp.get('s'); if (sv!=null) setS(Math.max(0, Math.min(1, Number(sv)))); } catch {} },[]);

  // H(s) = -(1-s) Z - s X, with Z=diag(1,-1), X=[[0,1],[1,0]] => H = [[-(1-s), -s], [-s, (1-s)]]
  const a = -(1-s), b = -s, d = (1-s);
  const { l1, l2, v } = eigen2x2(a, b, d);
  const gap = l2 - l1;
  const p0 = v.x*v.x; const p1 = v.y*v.y; // ground state's |0>,|1> populations

  const snapshot = async () => {
    const ts = Date.now();
    try { const next=[{ ts, s }, ...hist].slice(0,50); setHist(next); localStorage.setItem('edu_adiabatic_hist', JSON.stringify(next)); } catch {}
    if (pgOk) { try { await fetch('/api/experiences',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id:`edu_adiabatic_${ts}`, timestamp: ts, main_content:`Adiabatic s=${s.toFixed(2)} gap=${gap.toFixed(3)}`, phi_level:0, qualia_count:0, duration_ms:0 }) }); } catch {} }
  };

  React.useEffect(() => {
    const handler = () => { snapshot(); };
    try { window.addEventListener('voice:saveSnapshot', handler as any); } catch {}
    return () => { try { window.removeEventListener('voice:saveSnapshot', handler as any); } catch {} };
  }, [snapshot]);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education • Adiabatic QC (2‑level)</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-sm text-gray-300">Interpolate H(s) = (1−s)H₀ + sH₁ between Z and X Hamiltonians. Track instantaneous eigenvalues and ground state populations. The gap Δ governs adiabatic runtime.</div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
          <label className="flex items-center gap-1">s
            <input type="range" min={0} max={1} step={0.01} value={s} onChange={e=> setS(Number(e.target.value))} />
            <span>{s.toFixed(2)}</span>
          </label>
          <span className="rounded bg-white/10 px-2 py-0.5">λ₁={l1.toFixed(3)}</span>
          <span className="rounded bg-white/10 px-2 py-0.5">λ₂={l2.toFixed(3)}</span>
          <span className="rounded bg-white/10 px-2 py-0.5">Δ={gap.toFixed(3)}</span>
          <button className="rounded bg-brand-600 px-2 py-1 hover:bg-brand-500" onClick={snapshot}>Record snapshot</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const u=new URL(window.location.href); u.searchParams.set('s', String(s)); navigator.clipboard.writeText(u.toString()); } catch {} }}>Copy link</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const blob=new Blob([JSON.stringify(hist, null, 2)], { type:'application/json' }); const url=URL.createObjectURL(blob); const a=document.createElement('a'); const ts=new Date().toISOString().replace(/[:.]/g,'-'); a.href=url; a.download=`adiabatic-history-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);} catch {} }}>Export history</button>
          {pgOk && <span className="rounded bg-emerald-900/30 border border-emerald-700 px-2 py-0.5 text-emerald-300">DB:on</span>}
          {voiceHint && <span className="text-[11px] text-neutral-400 italic">Voice: say "persist snapshot"</span>}
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-xs">
          <div className="rounded border border-white/10 bg-black/30 p-2">
            <div className="text-neutral-400 mb-1">Instantaneous Hamiltonian H(s)</div>
            <pre>{`[ [ ${a.toFixed(3)}, ${b.toFixed(3)} ],\n  [ ${b.toFixed(3)}, ${d.toFixed(3)} ] ]`}</pre>
          </div>
          <div className="rounded border border-white/10 bg-black/30 p-2">
            <div className="text-neutral-400 mb-1">Ground state populations</div>
            <div className="flex items-end gap-2 h-24">
              <div title={`|0⟩ ${(p0*100).toFixed(1)}%`} className="w-6 bg-emerald-500/70" style={{ height: `${Math.max(3, p0*100)}%` }} />
              <div title={`|1⟩ ${(p1*100).toFixed(1)}%`} className="w-6 bg-purple-500/70" style={{ height: `${Math.max(3, p1*100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

