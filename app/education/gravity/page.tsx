"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { flags } from '@/lib/flags';

const GravityScene = dynamic(()=> import('@/app/_components/quantum/GravityCurvatureScene'), { ssr: false });

export default function GravityLesson() {
  const three = flags.three;
  const [mass, setMass] = React.useState(0.03);
  const [cx, setCx] = React.useState(0.0);
  const [cy, setCy] = React.useState(0.0);
  React.useEffect(()=>{
    try { const sp = new URLSearchParams(window.location.search); const m = sp.get('mass'); const x = sp.get('cx'); const y = sp.get('cy'); if (m!=null) setMass(Math.max(0.01, Math.min(0.12, Number(m)))); if (x!=null) setCx(Math.max(-0.4, Math.min(0.4, Number(x)))); if (y!=null) setCy(Math.max(-0.4, Math.min(0.4, Number(y)))); } catch {}
  },[]);
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education • Gravity & Curvature</h1>
      <p className="text-sm text-gray-400">Shader-based spacetime curvature visualization. 2D fallback available.</p>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
          <label className="flex items-center gap-1">mass
            <input type="range" min={0.01} max={0.12} step={0.005} value={mass} onChange={e=>setMass(Number(e.target.value))} />
            <span>{mass.toFixed(3)}</span>
          </label>
          <label className="flex items-center gap-1">center x
            <input type="range" min={-0.4} max={0.4} step={0.01} value={cx} onChange={e=>setCx(Number(e.target.value))} />
            <span>{cx.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-1">center y
            <input type="range" min={-0.4} max={0.4} step={0.01} value={cy} onChange={e=>setCy(Number(e.target.value))} />
            <span>{cy.toFixed(2)}</span>
          </label>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-300">
          <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={()=>{ try { const u=new URL(window.location.href); u.searchParams.set('mass', String(mass)); u.searchParams.set('cx', String(cx)); u.searchParams.set('cy', String(cy)); navigator.clipboard.writeText(u.toString()); } catch {} }}>Copy link</button>
          <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={()=>{ try { const blob = new Blob([JSON.stringify({ mass, cx, cy }, null, 2)], { type:'application/json' }); const url=URL.createObjectURL(blob); const a=document.createElement('a'); const ts=new Date().toISOString().replace(/[:.]/g,'-'); a.href=url; a.download=`gravity-state-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);} catch {} }}>Export state</button>
        </div>
        {three ? (
          <GravityScene mass={mass} center={[cx, cy]} />
        ) : (
          <div className="rounded border border-white/10 bg-white/5 p-6 min-h-[240px] text-sm text-gray-300">
            2D fallback — imagine a grid bending near mass. Enable Three to see curvature animation.
          </div>
        )}
      </div>
    </div>
  );
}
