"use client";

import React from 'react';

export default function PrivacyPage() {
  const [on, setOn] = React.useState(false);
  const [log, setLog] = React.useState<any[]>([]);
  React.useEffect(()=>{
    try { setOn(localStorage.getItem('ambient_on')==='true'); } catch {}
    try { const raw = localStorage.getItem('ambient_log'); setLog(raw? JSON.parse(raw): []); } catch {}
  },[]);
  function toggle() {
    const v = !on; setOn(v);
    try { localStorage.setItem('ambient_on', v?'true':'false'); } catch {}
  }
  function clearLog() {
    try { localStorage.removeItem('ambient_log'); setLog([]); } catch {}
  }
  return (
    <div className="p-4 text-gray-100 space-y-3">
      <h1 className="text-xl font-semibold">Privacy</h1>
      <div className="flex items-center gap-2">
        <label className="text-sm">Local-only ambient buffer</label>
        <button className={`px-2 py-1 rounded ${on?'bg-emerald-600/40':'bg-white/10'}`} onClick={toggle}>{on?'On':'Off'}</button>
      </div>
      <div className="text-xs text-gray-400">When enabled, sent prompts are stored locally in ambient_log and never uploaded.</div>
      <div className="flex items-center gap-2">
        <button className="bg-white/10 px-2 py-1 rounded" onClick={clearLog}>Clear log</button>
        <div className="text-xs text-gray-400">{log.length} entries</div>
      </div>
      <div className="space-y-1 text-sm">
        {log.slice().reverse().map((r:any,i:number)=>(
          <div key={i} className="bg-white/5 rounded p-2">
            <div className="text-xs text-gray-500">{new Date(r.ts).toLocaleString()}</div>
            <div>{r.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

