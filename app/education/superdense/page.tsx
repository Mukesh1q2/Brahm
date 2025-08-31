"use client";
import React from 'react';
import { flags } from '@/lib/flags';

type Bits = '00'|'01'|'10'|'11';

export default function SuperdenseCodingPage() {
  const voiceHint = flags.voiceEnabled || flags.e2eHooks;
  const [msg, setMsg] = React.useState<Bits>('10');
  const [sent, setSent] = React.useState<Bits|null>(null);
  const [hist, setHist] = React.useState<Array<{ ts: number; msg: Bits }>>([]);
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  React.useEffect(()=>{ (async()=>{ try { const r=await fetch('/api/persistence/status',{cache:'no-store'}); const j=await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);
  React.useEffect(()=>{ try { const sp=new URLSearchParams(window.location.search); const m=sp.get('msg'); if (m && ['00','01','10','11'].includes(m)) setMsg(m as Bits); } catch {} },[]);

  const encodeLabel = (m: Bits) => ({ '00':'I', '01':'X', '10':'Z', '11':'XZ' }[m]);
  const decode = (m: Bits) => m; // In ideal protocol, Bob recovers Alice's two bits

  const run = async () => {
    const ts = Date.now();
    const out = decode(msg);
    setSent(out);
    try { const next=[{ ts, msg }, ...hist].slice(0,50); setHist(next); localStorage.setItem('edu_superdense_hist', JSON.stringify(next)); } catch {}
    if (pgOk) { try { await fetch('/api/experiences',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id:`edu_superdense_${ts}`, timestamp: ts, main_content:`Superdense msg=${msg} op=${encodeLabel(msg)}`, phi_level:0, qualia_count:0, duration_ms:0 }) }); } catch {} }
  };

  // Voice Agent: persist snapshot
  React.useEffect(() => {
    const handler = async () => { const ts=Date.now(); try { const next=[{ ts, msg }, ...hist].slice(0,50); setHist(next); localStorage.setItem('edu_superdense_hist', JSON.stringify(next)); } catch {}; if (pgOk) { try { await fetch('/api/experiences',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id:`edu_superdense_${ts}`, timestamp: ts, main_content:`Superdense snapshot msg=${msg}`, phi_level:0, qualia_count:0, duration_ms:0 }) }); } catch {} } };
    try { window.addEventListener('voice:saveSnapshot', handler as any); } catch {}
    return () => { try { window.removeEventListener('voice:saveSnapshot', handler as any); } catch {} };
  }, [msg, hist, pgOk]);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education • Superdense Coding</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="text-sm text-gray-300">Send two classical bits using one qubit, leveraging prior entanglement. Alice applies I/X/Z/XZ based on the two-bit message, sends her qubit to Bob, who decodes with CNOT and H, yielding the original two bits.</div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
          <label className="flex items-center gap-1">message
            <select className="rounded bg-black/30 px-1 py-0.5" value={msg} onChange={e=> setMsg((e.target.value as Bits) || '00')}>
              <option value="00">00</option>
              <option value="01">01</option>
              <option value="10">10</option>
              <option value="11">11</option>
            </select>
          </label>
          <span className="rounded bg-white/10 px-2 py-0.5">Alice encodes: {encodeLabel(msg)}</span>
          <button className="rounded bg-brand-600 px-2 py-1 hover:bg-brand-500" onClick={run}>Send</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const u=new URL(window.location.href); u.searchParams.set('msg', msg); navigator.clipboard.writeText(u.toString()); } catch {} }}>Copy link</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const blob=new Blob([JSON.stringify(hist, null, 2)], { type:'application/json' }); const url=URL.createObjectURL(blob); const a=document.createElement('a'); const ts=new Date().toISOString().replace(/[:.]/g,'-'); a.href=url; a.download=`superdense-history-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);} catch {} }}>Export history</button>
          {pgOk && <span className="rounded bg-emerald-900/30 border border-emerald-700 px-2 py-0.5 text-emerald-300">DB:on</span>}
          {voiceHint && <span className="text-[11px] text-neutral-400 italic">Voice: say "persist snapshot"</span>}
        </div>
        {sent && (
          <div className="rounded border border-white/10 bg-black/30 p-3 text-xs text-neutral-300">
            <div className="text-neutral-400 mb-1">Bob decodes</div>
            <div>Recovered bits: <span className="font-mono">{sent}</span></div>
            <div className="text-neutral-400 mt-1">Ideal channel: recovered equals sent. Noise would induce errors.</div>
          </div>
        )}
      </div>
    </div>
  );
}

