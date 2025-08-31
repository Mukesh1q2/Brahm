"use client";

import React from 'react';
import axios from 'axios';
import type { ReplayItem } from '@/types/learning';

export default function LearningConsolePage() {
  const [replays, setReplays] = React.useState<ReplayItem[]>([]);
  const [input, setInput] = React.useState('');
  const [target, setTarget] = React.useState('');
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [job, setJob] = React.useState<any>(null);
  const [model, setModel] = React.useState('local-llama');

  const load = React.useCallback(async ()=>{
    const r = await axios.get('/api/learning/replay');
    setReplays(r.data?.items||[]);
  },[]);
  React.useEffect(()=>{ load(); },[load]);

  async function addReplay() {
    if (!input.trim()) return;
    await axios.post('/api/learning/replay', { input, target: target || undefined });
    setInput(''); setTarget('');
    load();
  }
  async function startLoRA() {
    const r = await axios.post('/api/learning/lora/start', { model, datasetSize: replays.length, epochs: 3, learningRate: 1e-4 });
    setJobId(r.data?.job?.id || null);
  }
  React.useEffect(()=>{
    if (!jobId) return;
    const t = setInterval(async ()=>{
      const s = await axios.get('/api/learning/lora/status', { params: { id: jobId } });
      setJob(s.data?.job||null);
      if (s.data?.job?.status==='succeeded' || s.data?.job?.status==='failed') clearInterval(t);
    }, 400);
    return () => clearInterval(t);
  }, [jobId]);

  return (
    <div className="p-4 text-gray-100 space-y-6">
      <h1 className="text-xl font-semibold">Learning</h1>
      <section className="space-y-2">
        <h2 className="text-lg">Replay Buffer</h2>
        <div className="flex gap-2">
          <input className="flex-1 bg-white/5 rounded px-2 py-1" placeholder="input" value={input} onChange={e=>setInput(e.target.value)} />
          <input className="flex-1 bg-white/5 rounded px-2 py-1" placeholder="target (optional)" value={target} onChange={e=>setTarget(e.target.value)} />
          <button className="bg-white/10 px-3 py-1 rounded" onClick={addReplay}>Add</button>
        </div>
        <div className="text-xs text-gray-400">{replays.length} items</div>
        <div className="max-h-64 overflow-auto divide-y divide-white/10 rounded border border-white/10">
          {replays.map(r=> (
            <div key={r.id} className="p-2">
              <div className="text-sm">{r.input}</div>
              {r.target && <div className="text-xs text-gray-400">→ {r.target}</div>}
              <div className="text-[10px] text-gray-500">{new Date(r.ts).toLocaleString()}</div>
            </div>
          ))}
          {replays.length===0 && <div className="p-2 text-sm text-gray-400">No items</div>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg">LoRA Fine-tune</h2>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-300">Model</label>
          <select className="bg-white/5 rounded px-2 py-1" value={model} onChange={e=>setModel(e.target.value)}>
            {['local-llama','gpt-4o-mini','claude-3-5-sonnet'].map(m=> <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="bg-purple-600/80 px-3 py-1 rounded" onClick={startLoRA}>Start</button>
          {jobId && <div className="text-xs text-gray-400">Job: {jobId}</div>}
        </div>
        {job && (
          <div className="text-sm">
            <div>Status: {job.status}</div>
            <div>Loss: {job.loss ?? '-'} / Val: {job.valLoss ?? '-'}</div>
            {job.artifacts?.checkpointUrl && (
              <div className="text-xs text-cyan-300">Artifact: {job.artifacts.checkpointUrl}</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

