"use client";

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { Send, TerminalSquare } from 'lucide-react';
import axios from 'axios';
import { useModel } from "../_components/ModelContext";

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

function TelemetryBadge() {
  const [last, setLast] = useState<{ ok: boolean; status: number; clientLatencyMs: number | null; model?: string } | null>(null);
  const [count, setCount] = useState(0);
  React.useEffect(() => {
    const handler = (ev: any) => {
      const d = ev?.detail || {};
      setLast({ ok: !!d.ok, status: Number(d.status||0), clientLatencyMs: Number.isFinite(d.clientLatencyMs) ? d.clientLatencyMs : null, model: d.responseModel || d.requestModel });
      setCount(c => c + 1);
    };
    window.addEventListener('telemetry:request', handler as any);
    return () => window.removeEventListener('telemetry:request', handler as any);
  }, []);
  return (
    <div className="text-[11px] text-gray-500 flex items-center gap-2">
      <span className="hidden md:inline">Requests:</span>
      <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700">{count}</span>
      {last && (
        <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700">
          {last.model || '-'} • {last.clientLatencyMs != null ? `${last.clientLatencyMs.toFixed(0)}ms` : '-'} • {last.ok ? 'ok' : `err ${last.status}`}
        </span>
      )}
    </div>
  );
}

export default function CanvasPage() {
// Use local Next.js API for Phase 1 features
const API_URL = "";
  const { model, setModel, options, rates, expert } = useModel();
  const [useOverride, setUseOverride] = useState(false);
  const [pageModel, setPageModel] = useState(model);
  const effModel = useOverride ? pageModel : model;
  const [code, setCode] = useState('// Start coding with Brahm...');
  const [output, setOutput] = useState('');
  const [goal, setGoal] = useState('Write a Python function that reverses a string.');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [estTokens, setEstTokens] = useState(0);
  const [estCost, setEstCost] = useState(0);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [splitPct, setSplitPct] = useState<number>(50);
  const [preview, setPreview] = useState<{ url: string; type: string; name: string; size: number } | null>(null);
  const MAX_UPLOAD_MB = 15;

  React.useEffect(() => {
    const chars = code.length;
    const tokens = Math.ceil(chars / 4);
    setEstTokens(tokens);
    const rate = rates[effModel] ?? 0.0;
    setEstCost((tokens / 1000) * rate);
  }, [code, effModel, rates]);

  const onMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  React.useEffect(() => {
    if (!isDragging) return;
    const onMove = (ev: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.min(Math.max(ev.clientX - rect.left, 80), rect.width - 80);
      const pct = (x / rect.width) * 100;
      const clamped = Math.min(80, Math.max(20, pct));
      setSplitPct(clamped);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  const runAgent = async () => {
    setBusy(true);
    try {
      const trace = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const start = Date.now();
const res = await axios.post(`/api/agents/run`, { goal, model: effModel }, { headers: { 'X-Model': effModel, 'X-Request-Id': trace, 'X-Client-App': 'canvas' } });
      setOutput(JSON.stringify(res.data, null, 2));
      try {
        const h = (res.headers || {}) as any;
        const serverLatency = Number(h['x-server-latency-ms'] || h['x-latency-ms'] || h['x-elapsed-ms']);
        const costUsd = Number(h['x-llm-cost-usd']);
        const respModel = h['x-llm-model'] || h['x-model'] || '';
        const clientLatency = Date.now() - start;
        const detail = { trace, url: `${API_URL}/agent/execute`, ok: true, status: res.status, clientLatencyMs: clientLatency, serverLatencyMs: Number.isFinite(serverLatency) ? serverLatency : null, costUsd: Number.isFinite(costUsd) ? costUsd : null, requestModel: effModel, responseModel: respModel, app: 'canvas' };
        window.dispatchEvent(new CustomEvent('telemetry:request', { detail }));
      } catch {}
    } catch (e: any) {
      setOutput(e?.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]">
      <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TerminalSquare className="text-purple-400" />
          <h1 className="text-xl font-semibold">Brahm Canvas</h1>
          <span className="text-xs text-purple-300/70">Jnana River</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-purple-300 flex items-center gap-2">
            <span>Model</span>
            <select value={useOverride ? pageModel : model} onChange={(e)=> useOverride ? setPageModel(e.target.value) : setModel(e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100 text-sm">
              {options.map(m => (<option key={m} value={m}>{m}</option>))}
            </select>
            {useOverride && (
              <span
                className={`text-[10px] px-1 rounded border ${pageModel !== model ? 'bg-yellow-100 text-yellow-900 border-yellow-300' : 'bg-gray-200 text-gray-700 border-gray-300'}`}
                title={pageModel !== model ? 'Override active' : 'Override active (same as global)'}
                aria-label={pageModel !== model ? 'override' : 'override (global)'}
              >
                {pageModel !== model ? 'override' : 'override (global)'}
              </span>
            )}
          </label>
          <label className="text-xs text-purple-300 flex items-center gap-1">
            <input type="checkbox" checked={useOverride} onChange={(e)=>{ setUseOverride(e.target.checked); if (!e.target.checked) setPageModel(model); }} /> override
          </label>
          <button
            className="text-[11px] px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700"
            onClick={()=>{ setUseOverride(false); setPageModel(model); }}
            title="Revert to global model"
          >
            Use global
          </button>
          {!useOverride && <span className="hidden md:inline text-xs text-purple-300/80">Using global: <b>{model}</b></span>}
          {useOverride && <span className="hidden md:inline text-xs text-purple-300/80">Model (effective): <b>{effModel}</b></span>}
          <input
            className="bg-gray-800/70 rounded px-3 py-2 w-[380px] text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe your goal..."
          />
          <span className="text-[11px] px-2 py-1 rounded bg-gray-800 border border-gray-700">
            Est. cost: ${estCost.toFixed(5)} ({estTokens} tok)
          </span>
          {expert && (
            <span className="text-[11px] px-2 py-1 rounded bg-gray-800 border border-gray-700" title="Expert controls active">
              Expert
            </span>
          )}
          <button
            onClick={runAgent}
            disabled={busy}
            className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={16} /> Run Plan
          </button>
        </div>
      </div>

      <div className="h-[calc(100vh-64px)]">
        <div ref={containerRef} className="relative select-none h-full">
          {/* Left pane */}
          <div className="absolute top-0 left-0 h-full overflow-hidden border-r border-purple-500/20" style={{ width: `${splitPct}%` }}>
            {/* Drag-and-drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                if (!e.dataTransfer.files?.length) return;
                const f = e.dataTransfer.files[0];

                // Basic guardrails
                const sizeMb = f.size / (1024 * 1024);
                if (sizeMb > MAX_UPLOAD_MB) {
                  setOutput((prev) => prev + `\nRejected: ${f.name} — file too large (${sizeMb.toFixed(2)} MB, limit ${MAX_UPLOAD_MB} MB)`);
                  return;
                }

                // Preview images client-side
                try {
                  if (preview?.url) URL.revokeObjectURL(preview.url);
                } catch {}
                if (f.type.startsWith('image/')) {
                  try { setPreview({ url: URL.createObjectURL(f), type: f.type, name: f.name, size: f.size }); } catch { setPreview(null); }
                } else {
                  setPreview(null);
                }

                const form = new FormData();
                form.append('file', f);
                try { const lang = localStorage.getItem('ocr_lang') || 'eng'; form.append('lang', lang); } catch {}
                setUploading(true);
                try {
                  const trace = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                  const start = Date.now();
const res = await fetch(`/api/files/upload`, {
                    method: 'POST',
                    headers: { 'X-Model': effModel, 'X-Request-Id': trace, 'X-Client-App': 'canvas' },
                    body: form
                  });
                  const data = await res.json().catch(()=>({ detail: 'invalid response' }));
                  if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
                  setOutput((prev) => prev + `\nUploaded: ${f.name} -> ${JSON.stringify(data)}`);
                  try {
                    const h = res.headers;
                    const serverLatency = Number(h.get('x-server-latency-ms') || h.get('x-latency-ms') || h.get('x-elapsed-ms'));
                    const costUsd = Number(h.get('x-llm-cost-usd'));
                    const respModel = h.get('x-llm-model') || h.get('x-model') || '';
                    const clientLatency = Date.now() - start;
                    const detail = { trace, url: `${API_URL}/files/upload`, ok: res.ok, status: res.status, clientLatencyMs: clientLatency, serverLatencyMs: Number.isFinite(serverLatency) ? serverLatency : null, costUsd: Number.isFinite(costUsd) ? costUsd : null, requestModel: effModel, responseModel: respModel, app: 'canvas' };
                    window.dispatchEvent(new CustomEvent('telemetry:request', { detail }));
                  } catch {}
                } catch (err: any) {
                  setOutput((prev) => prev + `\nUpload failed: ${err?.message || err}`);
                } finally {
                  setUploading(false);
                }
              }}
              className={`p-2 text-xs ${uploading ? 'bg-purple-900/30' : 'bg-gray-900/40'} border-b border-purple-500/20`}
            >
              {uploading ? 'Uploading...' : 'Drag & drop files here to OCR (stub)'}
            </div>
            {/* Quick preview (images) */}
            {preview && (
              <div className="p-2 border-b border-purple-500/20 bg-black/20 flex items-center gap-3">
                <div className="text-xs text-gray-400 flex-1 truncate">{preview.name} • {(preview.size/1024).toFixed(1)} KB • {preview.type}</div>
                <button className="text-[11px] px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700" onClick={()=>{ try { if (preview.url) URL.revokeObjectURL(preview.url);} catch {}; setPreview(null); }}>Clear preview</button>
              </div>
            )}
            {preview && preview.type.startsWith('image/') && (
              <div className="p-2 border-b border-purple-500/20 bg-black/10">
                <img src={preview.url} alt="preview" className="max-h-48 rounded" />
              </div>
            )}
            <MonacoEditor
              height="100%"
              defaultLanguage="typescript"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || '')}
              options={{ fontSize: 14, minimap: { enabled: false } }}
            />
          </div>

          {/* Divider */}
          <div onMouseDown={onMouseDown} className={`absolute top-0 h-full cursor-col-resize group ${isDragging ? 'bg-purple-200/20' : 'bg-transparent'}`} style={{ left: `calc(${splitPct}% - 3px)`, width: 6 }}>
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-1 h-24 rounded bg-gray-400 group-hover:bg-purple-500" />
          </div>

          {/* Right pane */}
          <div className="absolute top-0 right-0 h-full overflow-auto" style={{ width: `${100 - splitPct}%` }}>
            <div className="h-full p-3">
              <div className="flex items-center justify-between mb-2 text-[11px] text-gray-400">
                <span>Output</span>
                <TelemetryBadge />
              </div>
              <pre className="h-full overflow-auto bg-gray-900 rounded p-3 text-xs">
{output}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
