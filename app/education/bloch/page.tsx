"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { flags } from '@/lib/flags';

const BlochSphere = dynamic(()=> import('@/app/_components/quantum/BlochSphere'), { ssr: false });

function densityMatrix(theta: number, phi: number, noise: number) {
  const c = Math.cos(theta/2), s = Math.sin(theta/2);
  // ρ = [[c^2, c*s*e^{-iφ}], [c*s*e^{iφ}, s^2]], dephasing reduces off-diagonals
  const re = Math.cos(phi), im = Math.sin(phi);
  const r00 = c*c;
  const r11 = s*s;
  const off = c*s*(1 - Math.max(0, Math.min(1, noise))); // scale by (1-noise)
  return {
    r00: r00,
    r01: { re: off*re, im: -off*im },
    r10: { re: off*re, im: off*im },
    r11: r11,
  };
}

export default function BlochLesson() {
  const three = flags.three;
  const voiceHint = flags.voiceEnabled || flags.e2eHooks;
  const [theta, setTheta] = React.useState(Math.PI/3);
  const [phi, setPhi] = React.useState(Math.PI/5);
  const [omega, setOmega] = React.useState(0.6);
  const [noise, setNoise] = React.useState(0.1);
  const [hist, setHist] = React.useState<Array<{ ts: number; theta: number; phi: number; omega: number; noise: number }>>([]);
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  React.useEffect(()=>{ try { const sp=new URLSearchParams(window.location.search); const th=sp.get('theta'); const ph=sp.get('phi'); const om=sp.get('omega'); const nz=sp.get('noise'); if (th) setTheta(Math.max(0, Math.min(Math.PI, Number(th)))); if (ph) setPhi(Math.max(0, Math.min(2*Math.PI, Number(ph)))); if (om) setOmega(Math.max(0, Math.min(4, Number(om)))); if (nz) setNoise(Math.max(0, Math.min(1, Number(nz)))); } catch {} },[]);
  React.useEffect(()=>{ (async()=>{ try { const r=await fetch('/api/persistence/status', { cache:'no-store' }); const j=await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);
  const snapshot = async () => {
    const row = { ts: Date.now(), theta, phi, omega, noise };
    try { const next=[row, ...hist].slice(0,50); setHist(next); localStorage.setItem('edu_bloch_hist', JSON.stringify(next)); } catch {}
    if (pgOk) {
      try { await fetch('/api/experiences', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id:`edu_bloch_${row.ts}`, timestamp: row.ts, main_content:`Bloch snapshot θ=${theta.toFixed(2)} φ=${phi.toFixed(2)} ω=${omega.toFixed(2)} noise=${noise.toFixed(2)}`, phi_level: 0, qualia_count: 0, duration_ms: 0 }) }); } catch {}
    }
  };

  // Voice Agent: handle "persist snapshot"
  React.useEffect(() => {
    const handler = () => { try { snapshot(); } catch {} };
    try { window.addEventListener('voice:saveSnapshot', handler as any); } catch {}
    return () => { try { window.removeEventListener('voice:saveSnapshot', handler as any); } catch {} };
  }, [snapshot]);

  const rho = densityMatrix(theta, phi, noise);
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education • Bloch Sphere & Spin Precession</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
          <label className="flex items-center gap-1">θ
            <input type="range" min={0} max={Math.PI} step={0.01} value={theta} onChange={e=>setTheta(Number(e.target.value))} />
            <span>{theta.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-1">φ
            <input type="range" min={0} max={Math.PI*2} step={0.01} value={phi} onChange={e=>setPhi(Number(e.target.value))} />
            <span>{phi.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-1">ω
            <input type="range" min={0} max={4} step={0.05} value={omega} onChange={e=>setOmega(Number(e.target.value))} />
            <span>{omega.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-1">noise
            <input type="range" min={0} max={1} step={0.01} value={noise} onChange={e=>setNoise(Number(e.target.value))} />
            <span>{noise.toFixed(2)}</span>
          </label>
          <button className="rounded bg-brand-600 px-2 py-1 hover:bg-brand-500" onClick={snapshot}>Record snapshot</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const u=new URL(window.location.href); u.searchParams.set('theta', String(theta)); u.searchParams.set('phi', String(phi)); u.searchParams.set('omega', String(omega)); u.searchParams.set('noise', String(noise)); navigator.clipboard.writeText(u.toString()); } catch {} }}>Copy link</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const blob=new Blob([JSON.stringify(hist, null, 2)], { type:'application/json' }); const url=URL.createObjectURL(blob); const a=document.createElement('a'); const ts=new Date().toISOString().replace(/[:.]/g,'-'); a.href=url; a.download=`bloch-history-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);} catch {} }}>Export history</button>
          {pgOk && <span className="rounded bg-emerald-900/30 border border-emerald-700 px-2 py-0.5 text-emerald-300">DB:on</span>}
          {voiceHint && (
            <span className="text-[11px] text-neutral-400 italic">Voice: say "persist snapshot"</span>
          )}
        </div>
        {three ? (
          <BlochSphere theta={theta} phi={phi} omega={omega} noise={noise} />
        ) : (
          <div className="rounded border border-white/10 bg-white/5 p-6 min-h-[240px] text-sm text-gray-300">
            2D fallback — θ={theta.toFixed(2)}, φ={phi.toFixed(2)}, ω={omega.toFixed(2)}, noise={noise.toFixed(2)}
          </div>
        )}
        <div className="text-xs text-neutral-300">
          <div className="mb-1 text-neutral-400">Density matrix (with dephasing on off-diagonal)</div>
          <pre className="rounded bg-black/30 p-2">{`[ [ ${rho.r00.toFixed(3)}, ${rho.r01.re.toFixed(3)} ${rho.r01.im>=0?'+':'-'} ${Math.abs(rho.r01.im).toFixed(3)}i ],
[ ${rho.r10.re.toFixed(3)} ${rho.r10.im>=0?'+':'-'} ${Math.abs(rho.r10.im).toFixed(3)}i, ${rho.r11.toFixed(3)} ] ]`}</pre>
        </div>
      </div>
    </div>
  );
}
