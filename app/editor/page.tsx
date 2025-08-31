"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { useModel } from "../_components/ModelContext";

// Use local Next.js API for Phase 1 features
const API_BASE = "";

export default function EditorPage() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [splitPct, setSplitPct] = React.useState<number>(50); // left pane width in %
  const [code, setCode] = React.useState<string>(`// Welcome to the Agentic Editor\n// Left pane: Monaco code editor\n// Right pane: output/preview\n\nfunction hello(name) {\n  return ` + "`Hello, ${name}!`" + `;\n}\n\nconsole.log(hello('Brahm-ai'));\n`);
  const [output, setOutput] = React.useState<string>("Ready.");
  const [token, setToken] = React.useState<string | null>(null);
  const [sessionId, setSessionId] = React.useState<string>("");
  const [uploads, setUploads] = React.useState<Array<{ name: string; size: number; status: 'uploading'|'queued'|'error'; response?: any; error?: string }>>([]);
  const { model, setModel, options, rates, expert, setExpert } = useModel();
  const [useOverride, setUseOverride] = React.useState(false);
  const [pageModel, setPageModel] = React.useState(model);
  const effectiveModel = React.useMemo(()=> useOverride ? pageModel : model, [useOverride, pageModel, model]);
  const [estTokens, setEstTokens] = React.useState<number>(0);
  const [estCost, setEstCost] = React.useState<number>(0);

  const onMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  React.useEffect(() => {
    // pick up token if present
    try {
      const t = window.localStorage.getItem('access_token');
      if (t) setToken(t);
    } catch {}
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
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

const runPreview = React.useCallback(() => {
    try {
      const lines = code.split("\n").length;
      const chars = code.length;
      setOutput(`Preview: ${lines} lines, ${chars} chars`);
    } catch (e: any) {
      setOutput(`Error: ${e?.message || e}`);
    }
  }, [code]);

  // update estimated tokens and cost
  React.useEffect(() => {
    const chars = code.length;
    const tokens = Math.ceil(chars / 4); // rough heuristic
    setEstTokens(tokens);
    const rate = rates[effectiveModel] ?? 0.0;
    setEstCost((tokens / 1000) * rate);
  }, [code, effectiveModel, rates]);


const uploadFile = React.useCallback(async (file: File) => {
    setUploads(prev => [{ name: file.name, size: file.size, status: 'uploading' }, ...prev]);
    const fd = new FormData();
    fd.append('file', file);
    try { const lang = localStorage.getItem('ocr_lang') || 'eng'; fd.append('lang', lang); } catch {}
    if (sessionId.trim()) fd.append('session_id', sessionId.trim());
    try {
      const trace = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const start = Date.now();
      const headers: Record<string, string> = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}), 'X-Model': effectiveModel, 'X-Request-Id': trace, 'X-Client-App': 'editor' };
      if (expert && sessionId.trim()) headers['X-Session-Id'] = sessionId.trim();
const res = await fetch(`/api/files/upload`, {
        method: 'POST',
        headers,
        body: fd,
      });
      try {
        const h = res.headers;
        const serverLatency = Number(h.get('x-server-latency-ms') || h.get('x-latency-ms') || h.get('x-elapsed-ms'));
        const costUsd = Number(h.get('x-llm-cost-usd'));
        const respModel = h.get('x-llm-model') || h.get('x-model') || '';
        const clientLatency = Date.now() - start;
        const detail = { trace, url: `${API_BASE}/files/upload`, ok: res.ok, status: res.status, clientLatencyMs: clientLatency, serverLatencyMs: Number.isFinite(serverLatency) ? serverLatency : null, costUsd: Number.isFinite(costUsd) ? costUsd : null, requestModel: effectiveModel, responseModel: respModel, app: 'editor' };
        window.dispatchEvent(new CustomEvent('telemetry:request', { detail }));
      } catch {}
      const data = await res.json().catch(() => ({}));
      const ok = res.ok;
      setUploads(prev => {
        const idx = prev.findIndex(u => u.name === file.name && u.size === file.size && u.status === 'uploading');
        if (idx === -1) return prev;
        const copy = [...prev];
        copy[idx] = ok ? { ...copy[idx], status: 'queued', response: data } : { ...copy[idx], status: 'error', error: String(data?.detail || `HTTP ${res.status}`) };
        return copy;
      });
    } catch (e: any) {
      setUploads(prev => {
        const idx = prev.findIndex(u => u.name === file.name && u.size === file.size && u.status === 'uploading');
        if (idx === -1) return prev;
        const copy = [...prev];
        copy[idx] = { ...copy[idx], status: 'error', error: String(e?.message || e) };
        return copy;
      });
    }
  }, [token, sessionId, effectiveModel, expert]);

  const handleFiles = React.useCallback((files: FileList | File[]) => {
    const arr = Array.from(files as unknown as File[]);
    for (const f of arr) {
      if (f && f.size > 0) uploadFile(f);
    }
  }, [uploadFile]);

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agentic Editor (Split Pane)</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-sm">
            <span>Model</span>
            <select className="border rounded px-2 py-1"
              value={useOverride ? pageModel : model}
              onChange={(e)=> useOverride ? setPageModel(e.target.value) : setModel(e.target.value)}
            >
              {options.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {expert && useOverride && (
              <span
                className={`ml-2 text-[10px] px-1 rounded border ${pageModel !== model ? 'bg-yellow-100 text-yellow-900 border-yellow-300' : 'bg-gray-200 text-gray-700 border-gray-300'}`}
                title={pageModel !== model ? 'Override active' : 'Override active (same as global)'}
                aria-label={pageModel !== model ? 'override' : 'override (global)'}
              >
                {pageModel !== model ? 'override' : 'override (global)'}
              </span>
            )}
          </label>
          {expert && (
            <>
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={useOverride} onChange={(e)=>{ setUseOverride(e.target.checked); if (!e.target.checked) setPageModel(model); }} /> Page override
              </label>
              <button
                className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                onClick={()=>{ setUseOverride(false); setPageModel(model); }}
                title="Revert to global model"
              >
                Use global
              </button>
            </>
          )}
          {!useOverride && <span className="hidden md:inline text-xs text-gray-600">Using global: <b>{model}</b></span>}
          {useOverride && <span className="hidden md:inline text-xs text-gray-600">Model (effective): <b>{effectiveModel}</b></span>}
          <span className="text-xs px-2 py-1 rounded bg-gray-100 border">
            Est. cost: ${estCost.toFixed(5)} ({estTokens} tok)
          </span>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={expert} onChange={(e)=>setExpert(e.target.checked)} /> Expert mode
          </label>
          {expert && (
            <input
              className="border rounded px-2 py-1 w-48"
              placeholder="Session ID (optional)"
              value={sessionId}
              onChange={(e)=>setSessionId(e.target.value)}
              title="Attach a session ID to uploads"
            />
          )}
          <button
            className="px-3 py-1 rounded bg-purple-600 text-white"
            onClick={runPreview}
            title="Run preview"
          >
            Run
          </button>
          <button
            className="px-3 py-1 rounded bg-gray-200"
            onClick={() => navigator.clipboard.writeText(code).catch(() => {})}
            title="Copy code"
          >
            Copy
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="border rounded relative select-none"
        style={{ height: "calc(100vh - 180px)" }}
      >
        {/* Left pane */}
        <div
          className="absolute top-0 left-0 h-full overflow-hidden"
          style={{ width: `${splitPct}%` }}
        >
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={{ minimap: { enabled: false }, wordWrap: "on", fontSize: 13 }}
          />
        </div>

        {/* Divider */}
        <div
          onMouseDown={onMouseDown}
          className={`absolute top-0 h-full cursor-col-resize group ${isDragging ? "bg-purple-200/50" : "bg-transparent"}`}
          style={{ left: `calc(${splitPct}% - 3px)`, width: 6 }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-1 h-24 rounded bg-gray-400 group-hover:bg-purple-500" />
        </div>

        {/* Right pane */}
        <div
          className="absolute top-0 right-0 h-full overflow-auto"
          style={{ width: `${100 - splitPct}%` }}
        >
          <div className="h-full p-3 space-y-3">
            <div>
              <div className="text-sm text-gray-600 mb-2">Output / Preview</div>
              <div className="border rounded p-3 bg-white overflow-auto" style={{ height: 220 }}>
                <pre className="text-xs whitespace-pre-wrap">{output}</pre>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">File Upload (OCR)</div>
              <DropZone onFiles={handleFiles} />
              {!!uploads.length && (
                <div className="mt-3 border rounded bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Size</th>
                        <th className="text-left p-2">Status</th>
                        {expert && <th className="text-left p-2">Response/Error</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {uploads.map((u, i) => (
                        <tr key={`${u.name}:${u.size}:${i}`} className="border-t">
                          <td className="p-2 align-top">{u.name}</td>
                          <td className="p-2 align-top">{(u.size/1024).toFixed(1)} KB</td>
                          <td className="p-2 align-top">
                            {u.status === 'uploading' && <span className="text-blue-600">uploading</span>}
                            {u.status === 'queued' && <span className="text-green-700">queued</span>}
                            {u.status === 'error' && <span className="text-red-600">error</span>}
                          </td>
                          {expert && (
                            <td className="p-2 align-top">
                              <pre className="whitespace-pre-wrap">{u.error ? u.error : JSON.stringify(u.response || {}, null, 2)}</pre>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-600 flex items-center justify-between">
        <span>Tip: Drag the vertical divider to resize panes. This split-pane lays the foundation for code editing workflows.</span>
        <TelemetryBadge />
      </div>
    </div>
  );
}

function TelemetryBadge() {
  const [last, setLast] = React.useState<{ ok: boolean; status: number; clientLatencyMs: number | null; model?: string } | null>(null);
  const [count, setCount] = React.useState(0);
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

function DropZone({ onFiles }: { onFiles: (files: FileList | File[]) => void }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [hover, setHover] = React.useState(false);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHover(false);
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length) {
      onFiles(dt.files);
    }
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHover(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHover(false);
  };

  return (
    <div className={`border-2 border-dashed rounded p-4 ${hover ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <div className="text-xs text-gray-600">Drop files here, or click to browse</div>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e)=>{ if (e.target.files) onFiles(e.target.files); e.currentTarget.value=''; }} />
    </div>
  );
}
