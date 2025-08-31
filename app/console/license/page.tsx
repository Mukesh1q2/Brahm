"use client";

import React from 'react';
import axios from 'axios';

export default function LicensePage() {
  const [text, setText] = React.useState('[{"name":"dep-a","license":"MIT"},{"name":"dep-b","license":"GPL-3.0"}]');
  const [rows, setRows] = React.useState<any[]>([]);

  async function check() {
    let deps: any[] = []
    try { deps = JSON.parse(text) } catch {}
    const r = await axios.post('/api/license/check', { deps })
    setRows(r.data?.results||[])
  }

  return (
    <div className="p-4 text-gray-100 space-y-3">
      <h1 className="text-xl font-semibold">License Checker</h1>
      <textarea className="w-full h-32 bg-white/5 rounded p-2" value={text} onChange={e=>setText(e.target.value)} />
      <button className="bg-white/10 px-3 py-1 rounded" onClick={check}>Check</button>
      <div className="text-sm">
        {rows.map((r,i)=> (
          <div key={i} className="flex items-center gap-2">
            <span className="w-40">{r.name}</span>
            <span className="w-40">{r.license}</span>
            <span className={`text-xs ${r.ok?'text-emerald-400':'text-rose-400'}`}>{r.ok?'ok':'flagged'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

