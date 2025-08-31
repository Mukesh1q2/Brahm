"use client";

import React from 'react';
import axios from 'axios';

export default function RAGPage() {
  const [q, setQ] = React.useState('Explain transformers and cite sources');
  const [steps, setSteps] = React.useState<any[]>([]);
  const [answer, setAnswer] = React.useState('');

  async function run() {
    const r = await axios.post('/api/rag/query', { question: q, hops: 3 });
    setSteps(r.data?.steps||[]);
    setAnswer(r.data?.answer||'');
  }

  return (
    <div className="p-4 text-gray-100 space-y-3">
      <h1 className="text-xl font-semibold">Multi-hop RAG</h1>
      <div className="flex gap-2">
        <input className="flex-1 bg-white/5 rounded px-3 py-2" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="bg-white/10 px-3 py-2 rounded" onClick={run}>Run</button>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium">Steps</div>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          {steps.map((s,i)=>(
            <li key={i} className="text-gray-300">
              {s.action} {s.query ? `“${s.query}”` : s.docId}
              {s.citation && <a className="ml-2 text-cyan-300" href={s.citation} target="_blank">cite</a>}
              {s.excerpt && <div className="text-xs text-gray-400">{s.excerpt}</div>}
            </li>
          ))}
        </ol>
      </div>
      {answer && (
        <div className="space-y-1">
          <div className="text-sm font-medium">Answer</div>
          <div className="text-sm text-gray-200 whitespace-pre-wrap">{answer}</div>
        </div>
      )}
    </div>
  );
}

