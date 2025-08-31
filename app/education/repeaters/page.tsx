"use client";
import React from 'react';
import { flags } from '@/lib/flags';

function endToEndFidelity({ hops, linkF, swapEff, memDeco }: { hops: number; linkF: number; swapEff: number; memDeco: number }) {
  // Simple model: per-hop link fidelity F_link, swapping reduces by swapEff, memory cuts by memDeco
  // End-to-end fidelity ≈ (F_link * swapEff * memDeco)^(hops)
  const base = Math.max(0, Math.min(1, linkF)) * Math.max(0, Math.min(1, swapEff)) * Math.max(0, Math.min(1, memDeco));
  return Math.pow(base, Math.max(1, hops));
}

function endToEndLatency({ hops, linkLatencyMs, classicalMs }: { hops: number; linkLatencyMs: number; classicalMs: number }) {
  // Round-trip classical signaling per swap stage + per-link latency; concept only
  return hops * linkLatencyMs + (hops - 1) * classicalMs;
}

export default function RepeatersPage() {
  const voiceHint = flags.voiceEnabled || flags.e2eHooks;
  const [hops, setHops] = React.useState(4);
  const [linkF, setLinkF] = React.useState(0.9);
  const [swapEff, setSwapEff] = React.useState(0.95);
  const [memDeco, setMemDeco] = React.useState(0.98); // per stage memory survival
  const [linkLatencyMs, setLinkLatencyMs] = React.useState(5);
  const [classicalMs, setClassicalMs] = React.useState(2);
  const [hist, setHist] = React.useState<Array<{ ts: number; hops: number; F: number; L: number }>>([]);
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  React.useEffect(()=>{ (async()=>{ try { const r=await fetch('/api/persistence/status',{cache:'no-store'}); const j=await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);
  React.useEffect(()=>{ try { const sp=new URLSearchParams(window.location.search); const hp=sp.get('hops'); if (hp) setHops(Math.max(2, Math.min(12, Number(hp)))); } catch {} },[]);

  const F = endToEndFidelity({ hops, linkF, swapEff, memDeco });
  const L = endToEndLatency({ hops, linkLatencyMs, classicalMs });

  const snapshot = async () => {
    const ts = Date.now();
    try { const next=[{ ts, hops, F, L }, ...hist].slice(0,50); setHist(next); localStorage.setItem('edu_repeaters_hist', JSON.stringify(next)); } catch {}
    if (pgOk) { try { await fetch('/api/experiences',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id:`edu_repeaters_${ts}`, timestamp: ts, main_content:`Repeaters hops=${hops} F=${F.toFixed(3)} L=${L.toFixed(0)}ms`, phi_level:0, qualia_count:0, duration_ms:0 }) }); } catch {} }
  };

  React.useEffect(() => {
    const handler = () => { snapshot(); };
    try { window.addEventListener('voice:saveSnapshot', handler as any); } catch {}
    return () => { try { window.removeEventListener('voice:saveSnapshot', handler as any); } catch {} };
  }, [snapshot]);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education • Quantum Repeaters (Concept)</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-sm text-gray-300">Toy model: N hops with per-link fidelity and entanglement swapping efficiency. Memory decoherence penalizes fidelity per stage. Latency sums per-link and classical coordination costs.</div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
          <label className="flex items-center gap-1">hops
            <input type="range" min={2} max={12} step={1} value={hops} onChange={e=> setHops(Number(e.target.value))} />
            <span>{hops}</span>
          </label>
          <label className="flex items-center gap-1">link F
            <input type="range" min={0.5} max={0.99} step={0.01} value={linkF} onChange={e=> setLinkF(Number(e.target.value))} />
            <span>{linkF.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-1">swap eff
            <input type="range" min={0.6} max={1} step={0.01} value={swapEff} onChange={e=> setSwapEff(Number(e.target.value))} />
            <span>{swapEff.toFixed(2)}</span>
          </label>
          <label className="flex items-center gap-1">mem deco
            <input type="range" min={0.8} max={1} step={0.005} value={memDeco} onChange={e=> setMemDeco(Number(e.target.value))} />
            <span>{memDeco.toFixed(3)}</span>
          </label>
          <label className="flex items-center gap-1">link ms
            <input type="range" min={1} max={20} step={1} value={linkLatencyMs} onChange={e=> setLinkLatencyMs(Number(e.target.value))} />
            <span>{linkLatencyMs}ms</span>
          </label>
          <label className="flex items-center gap-1">classical ms
            <input type="range" min={0} max={20} step={1} value={classicalMs} onChange={e=> setClassicalMs(Number(e.target.value))} />
            <span>{classicalMs}ms</span>
          </label>
          <button className="rounded bg-brand-600 px-2 py-1 hover:bg-brand-500" onClick={snapshot}>Record snapshot</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const u=new URL(window.location.href); u.searchParams.set('hops', String(hops)); navigator.clipboard.writeText(u.toString()); } catch {} }}>Copy link</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const blob=new Blob([JSON.stringify(hist, null, 2)], { type:'application/json' }); const url=URL.createObjectURL(blob); const a=document.createElement('a'); const ts=new Date().toISOString().replace(/[:.]/g,'-'); a.href=url; a.download=`repeaters-history-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);} catch {} }}>Export history</button>
          {pgOk && <span className="rounded bg-emerald-900/30 border border-emerald-700 px-2 py-0.5 text-emerald-300">DB:on</span>}
          {voiceHint && <span className="text-[11px] text-neutral-400 italic">Voice: say "persist snapshot"</span>}
        </div>

        {/* Visualization: hops shown as nodes; bar meters for F and L */}
        <div className="grid gap-3 md:grid-cols-2 text-xs">
          <div className="rounded border border-white/10 bg-black/30 p-2">
            <div className="text-neutral-400 mb-2">Topology</div>
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from({length: hops}).map((_,i)=> (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-700/60 border border-emerald-400/40 text-center leading-6">{i+1}</div>
                  {i<hops-1 && <div className="w-10 h-1 bg-emerald-500/50" />}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded border border-white/10 bg-black/30 p-2 space-y-2">
            <div className="text-neutral-400">End-to-end metrics</div>
            <div className="flex items-center gap-2">
              <span>Fidelity</span>
              <div className="h-3 w-48 bg-white/10 rounded overflow-hidden" aria-label="fidelity">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, Math.round(F*100)))}%` }} />
              </div>
              <span>{(F*100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Latency</span>
              <div className="h-3 w-48 bg-white/10 rounded overflow-hidden" aria-label="latency">
                <div className="h-full bg-sky-500" style={{ width: `${Math.max(5, Math.min(100, Math.round(L/ (hops*linkLatencyMs + (hops-1)*classicalMs) * 100)))}%` }} />
              </div>
              <span>{L.toFixed(0)} ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

