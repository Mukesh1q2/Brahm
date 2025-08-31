"use client";
import React from 'react';

export default function WisdomPanel() {
  const [q, setQ] = React.useState('duty and detachment');
  const [svabhava, setSvabhava] = React.useState('engineer');
  const [ashrama, setAshrama] = React.useState('grihastha');
  const [loading, setLoading] = React.useState(false);
  const [teach, setTeach] = React.useState<any|null>(null);
  const [sim, setSim] = React.useState<Array<any>>([]);

  const doTeach = async () => {
    setLoading(true);
    try {
      const url = `/api/wisdom/teach?q=${encodeURIComponent(q)}&svabhava=${encodeURIComponent(svabhava)}&ashrama=${encodeURIComponent(ashrama)}`;
      const r = await fetch(url, { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setTeach(j.result); else setTeach({ error: j?.error || 'failed' });
    } catch { setTeach({ error: 'failed' }); }
    setLoading(false);
  };
  const doSearch = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/wisdom/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setSim(j.items||[]); else setSim([]);
    } catch { setSim([]); }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Query" className="px-2 py-1 rounded bg-black/40 border border-white/10" />
        <input value={svabhava} onChange={(e)=>setSvabhava(e.target.value)} placeholder="svabhava" className="px-2 py-1 rounded bg-black/40 border border-white/10" />
        <select value={ashrama} onChange={(e)=>setAshrama(e.target.value)} className="px-2 py-1 rounded bg-black/40 border border-white/10">
          {['brahmacharya','grihastha','vanaprastha','sannyasa'].map(x=> <option key={x} value={x}>{x}</option>)}
        </select>
        <button className="px-2 py-1 rounded bg-white/5 border border-white/10" disabled={loading} onClick={doTeach}>Teach</button>
        <button className="px-2 py-1 rounded bg-white/5 border border-white/10" disabled={loading} onClick={doSearch}>Search</button>
      </div>
      {teach && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <div className="rounded bg-white/5 p-2">
            <div className="text-xs text-gray-400 mb-1">Synthesis</div>
            <div className="text-sm">{teach.synthesis || teach.error}</div>
          </div>
          <div className="rounded bg-white/5 p-2">
            <div className="text-xs text-gray-400 mb-1">Daily Guidance</div>
            {teach.daily_guidance && (
              <ul className="list-disc ml-4 text-sm">
                {teach.daily_guidance.optimal_actions?.map((x:string,i:number)=>(<li key={i}>{x}</li>))}
              </ul>
            )}
          </div>
          <div className="rounded bg-white/5 p-2 md:col-span-2">
            <div className="text-xs text-gray-400 mb-1">Passages</div>
            <ul className="list-disc ml-4 text-sm">
              {(teach.vedic_passages||[]).map((p:any)=>(<li key={p.ref}><span className="text-gray-400">{p.ref}:</span> {p.text}</li>))}
            </ul>
          </div>
        </div>
      )}
      {sim.length>0 && (
        <div className="rounded bg-white/5 p-2">
          <div className="text-xs text-gray-400 mb-1">Semantic matches</div>
          <ul className="list-disc ml-4 text-sm">
            {sim.map((r:any,i:number)=>(<li key={i}><span className="text-gray-400">{r.ref} ({r.score.toFixed(2)}):</span> {r.text}</li>))}
          </ul>
        </div>
      )}
    </div>
  );
}

