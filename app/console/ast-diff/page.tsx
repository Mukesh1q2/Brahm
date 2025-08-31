"use client";

import React from 'react';
import axios from 'axios';

export default function ASTDiffPage() {
  const [before, setBefore] = React.useState("export function foo(){return 1}\n");
  const [after, setAfter] = React.useState("export function foo(){return 2}\nexport const bar=1\n");
  const [result, setResult] = React.useState<any>(null);

  async function run() {
    const r = await axios.post('/api/diff/ast', { before, after });
    setResult(r.data);
  }

  return (
    <div className="p-4 text-gray-100 space-y-3">
      <h1 className="text-xl font-semibold">AST Diff</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <textarea className="h-48 bg-white/5 rounded p-2" value={before} onChange={e=>setBefore(e.target.value)} />
        <textarea className="h-48 bg-white/5 rounded p-2" value={after} onChange={e=>setAfter(e.target.value)} />
      </div>
      <button className="bg-white/10 px-3 py-2 rounded" onClick={run}>Compute AST diff</button>
      {result && (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-400">Added</div>
            <ul className="list-disc pl-4">{(result.added||[]).map((s:string,i:number)=>(<li key={i}>{s}</li>))}</ul>
          </div>
          <div>
            <div className="text-xs text-gray-400">Removed</div>
            <ul className="list-disc pl-4">{(result.removed||[]).map((s:string,i:number)=>(<li key={i}>{s}</li>))}</ul>
          </div>
          <div>
            <div className="text-xs text-gray-400">Unchanged</div>
            <ul className="list-disc pl-4">{(result.unchanged||[]).map((s:string,i:number)=>(<li key={i}>{s}</li>))}</ul>
          </div>
        </div>
      )}
    </div>
  );
}

