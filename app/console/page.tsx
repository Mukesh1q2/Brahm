"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Filter, RefreshCw, Search, Calendar, ListFilter } from "lucide-react";
import { useModel } from "../_components/ModelContext";
import { useRightPanelData } from "@/store/rightPanelData";
import { useRightPanelStore } from "@/store/rightPanelStore";

interface AuditEntry {
  id: number;
  timestamp: string;
  user?: string;
  tool?: string;
  command?: string;
  stage?: string;
  allowed?: boolean;
  reason?: string;
  analysis?: any;
  sandbox?: any;
}

export default function ConsolePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { model, setModel, options } = useModel();

  const [filters, setFilters] = useState({
    page: 1,
    page_size: 20,
    allowed: "",
    stage: "",
    user: "",
    tool: "",
    model: "",
    q: "",
    start: "",
    end: "",
    order: "desc",
  });
  const [data, setData] = useState<{ total: number; entries: AuditEntry[] }>({ total: 0, entries: [] });
  const [loading, setLoading] = useState(false);
  // Right panel global
  const setPanelAll = useRightPanelData(s=>s.setAll);
  const setTab = useRightPanelStore(s=>s.setTab);

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Live telemetry from ModelProvider fetch interceptor
  type TelemetryRow = {
    trace: string;
    url: string;
    ok: boolean;
    status: number;
    clientLatencyMs: number | null;
    serverLatencyMs: number | null;
    costUsd: number | null;
    requestModel?: string;
    responseModel?: string;
    ts: string; // client timestamp when received
  };
  const [telemetry, setTelemetry] = useState<TelemetryRow[]>([]);
  const [telemetryOpen, setTelemetryOpen] = useState<boolean>(false);
  useEffect(() => {
    const handler = (ev: any) => {
      const d = ev?.detail || {};
      const row: TelemetryRow = {
        trace: String(d.trace || ''),
        url: String(d.url || ''),
        ok: !!d.ok,
        status: Number(d.status || 0),
        clientLatencyMs: Number.isFinite(d.clientLatencyMs) ? d.clientLatencyMs : null,
        serverLatencyMs: Number.isFinite(d.serverLatencyMs) ? d.serverLatencyMs : null,
        costUsd: Number.isFinite(d.costUsd) ? d.costUsd : null,
        requestModel: d.requestModel ? String(d.requestModel) : undefined,
        responseModel: d.responseModel ? String(d.responseModel) : undefined,
        ts: new Date().toISOString(),
      };
      setTelemetry(prev => [row, ...prev].slice(0, 200));
    };
    window.addEventListener('telemetry:request', handler as any);
    return () => window.removeEventListener('telemetry:request', handler as any);
  }, []);

  // Seed one mock telemetry row for E2E if hooks are enabled
  useEffect(() => {
    try {
      if ((process.env.NEXT_PUBLIC_E2E_HOOKS ?? 'false') !== 'false') {
        const detail = {
          trace: 'e2e-seed',
          url: '/api/mock',
          ok: true,
          status: 200,
          clientLatencyMs: 5,
          serverLatencyMs: 3,
          costUsd: 0,
          requestModel: 'mock',
          responseModel: 'mock',
        };
        window.dispatchEvent(new CustomEvent('telemetry:request', { detail }));
      }
    } catch {}
  }, []);

  function modelFromTelemetry(t: TelemetryRow): string {
    return t.responseModel || t.requestModel || '-';
  }
  const telemetryMetrics = useMemo(() => {
    const by: Record<string, { count: number; ok: number; cSum: number; cN: number; sSum: number; sN: number; costSum: number; }>
      = {} as any;
    for (const t of telemetry) {
      const m = modelFromTelemetry(t);
      if (!by[m]) by[m] = { count: 0, ok: 0, cSum: 0, cN: 0, sSum: 0, sN: 0, costSum: 0 };
      const b = by[m];
      b.count += 1;
      if (t.ok) b.ok += 1;
      if (t.clientLatencyMs != null) { b.cSum += t.clientLatencyMs; b.cN += 1; }
      if (t.serverLatencyMs != null) { b.sSum += t.serverLatencyMs; b.sN += 1; }
      if (t.costUsd != null) { b.costSum += t.costUsd; }
    }
    const rows = Object.entries(by).map(([model, v]) => ({
      model,
      count: v.count,
      ok: v.ok,
      avgClientMs: v.cN ? (v.cSum / v.cN) : null,
      avgServerMs: v.sN ? (v.sSum / v.sN) : null,
      totalCostUsd: v.costSum || 0,
    })).sort((a,b)=> b.count - a.count);
    return rows;
  }, [telemetry]);

  function inferModel(e: AuditEntry): string {
    const anyE: any = e;
    return (
      anyE?.model ||
      anyE?.analysis?.model ||
      anyE?.analysis?.llm_model ||
      anyE?.analysis?.llm?.model ||
      anyE?.sandbox?.model ||
      (anyE?.headers && (anyE.headers['x-model'] || anyE.headers['X-Model'])) ||
      anyE?.tool_model ||
      anyE?.tool?.model ||
      '-'
    );
  }

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(filters.page));
    params.set("page_size", String(filters.page_size));
    if (filters.allowed !== "") params.set("allowed", String(filters.allowed));
    if (filters.stage) params.set("stage", filters.stage);
    if (filters.user) params.set("user", filters.user);
    if (filters.tool) params.set("tool", filters.tool);
    if (filters.model) params.set("model", filters.model);
    if (filters.q) params.set("q", filters.q);
    if (filters.start) params.set("start", filters.start);
    if (filters.end) params.set("end", filters.end);
    params.set("order", filters.order);

    try {
      const trace = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const start = Date.now();
      const res = await fetch(`${API_URL}/audit/query?${params.toString()}` , { headers: { 'X-Model': model, 'X-Request-Id': trace, 'X-Client-App': 'console' } });
      const json = await res.json();
      setData({ total: json.total || 0, entries: json.entries || [] });
      // Update right panel summary/json
      setPanelAll({
        summary: `Console: ${json.entries?.length || 0} results • page ${filters.page}`,
        json: { filters, total: json.total || 0 },
        codeDiff: null,
      });
      try {
        const h = res.headers;
        const serverLatency = Number(h.get('x-server-latency-ms') || h.get('x-latency-ms') || h.get('x-elapsed-ms'));
        const costUsd = Number(h.get('x-llm-cost-usd'));
        const respModel = h.get('x-llm-model') || h.get('x-model') || '';
        const clientLatency = Date.now() - start;
        const detail = { trace, url: `${API_URL}/audit/query`, ok: res.ok, status: res.status, clientLatencyMs: clientLatency, serverLatencyMs: Number.isFinite(serverLatency) ? serverLatency : null, costUsd: Number.isFinite(costUsd) ? costUsd : null, requestModel: model, responseModel: respModel, app: 'console' };
        window.dispatchEvent(new CustomEvent('telemetry:request', { detail }));
      } catch {}
    } catch (e) {
      setData({ total: 0, entries: [] });
    } finally {
      setLoading(false);
    }
  }

  // Initialize filters from URL params on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    setFilters((f) => ({
      ...f,
      q: sp.get('q') ?? f.q,
      stage: sp.get('stage') ?? f.stage,
      allowed: sp.get('allowed') ?? f.allowed,
      user: sp.get('user') ?? f.user,
      tool: sp.get('tool') ?? f.tool,
      start: sp.get('start') ?? f.start,
      end: sp.get('end') ?? f.end,
      order: sp.get('order') ?? f.order,
      page: sp.get('page') ? Number(sp.get('page')) || f.page : f.page,
      page_size: sp.get('page_size') ? Number(sp.get('page_size')) || f.page_size : f.page_size,
      model: sp.get('model') ?? f.model,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load whenever filters change
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [filters]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(data.total / filters.page_size)), [data.total, filters.page_size]);

  function getLatencyMs(e: any): number | null {
    const cand = e?.latency_ms ?? e?.duration_ms ?? e?.elapsed_ms ?? e?.timing_ms ??
                 e?.analysis?.latency_ms ?? e?.analysis?.duration_ms ?? e?.analysis?.elapsed_ms ??
                 e?.sandbox?.latency_ms ?? e?.sandbox?.duration_ms ?? e?.sandbox?.elapsed_ms;
    const n = Number(cand);
    return Number.isFinite(n) ? n : null;
  }
  function getCostUsd(e: any): number | null {
    const cand = e?.cost_usd ?? e?.analysis?.cost_usd ?? e?.sandbox?.cost_usd ?? e?.metrics?.cost_usd;
    const n = Number(cand);
    return Number.isFinite(n) ? n : null;
  }
  const metricsByModel = useMemo(() => {
    const by: Record<string, { count: number; allowed: number; latencySum: number; latencyN: number; costSum: number; costN: number; }>
      = {} as any;
    for (const e of data.entries) {
      const m = inferModel(e) || '-';
      const key = String(m);
      if (!by[key]) by[key] = { count: 0, allowed: 0, latencySum: 0, latencyN: 0, costSum: 0, costN: 0 };
      const b = by[key];
      b.count += 1;
      if ((e as any).allowed === true) b.allowed += 1;
      const lat = getLatencyMs(e as any);
      if (lat != null) { b.latencySum += lat; b.latencyN += 1; }
      const cost = getCostUsd(e as any);
      if (cost != null) { b.costSum += cost; b.costN += 1; }
    }
    const rows = Object.entries(by).map(([model, v]) => ({
      model,
      count: v.count,
      allowed: v.allowed,
      avgLatencyMs: v.latencyN ? (v.latencySum / v.latencyN) : null,
      totalCostUsd: v.costSum || 0,
    })).sort((a,b)=> b.count - a.count);
    return rows;
  }, [data.entries]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="p-4 border-b border-purple-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListFilter className="text-purple-400" />
          <h1 className="text-xl font-semibold">Self-Evolving Console</h1>
          <span className="text-xs text-purple-300/70">Audit Filters</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-purple-300 flex items-center gap-2">
            <span>Model</span>
            <select value={model} onChange={e=>setModel(e.target.value)} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100 text-sm">
              {options.map(m => (<option key={m} value={m}>{m}</option>))}
            </select>
          </label>
          <button onClick={load} className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 flex items-center gap-2 text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Live Telemetry panel */}
        <div className="bg-black/30 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-purple-300">Live Telemetry</div>
              <div className="text-xs text-gray-400">session-only, from client-side fetch</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs" onClick={()=>setTelemetryOpen(o=>!o)}>
                {telemetryOpen ? 'Hide' : 'Show'} ({telemetry.length})
              </button>
              <button className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs" onClick={()=>setTelemetry([])}>Clear</button>
            </div>
          </div>
          {telemetryMetrics.length > 0 && (
            <div className="mb-3 text-xs text-gray-200">
              <div className="font-medium text-purple-300 mb-1">Per-model (live)</div>
              <div className="flex flex-wrap gap-2">
                {telemetryMetrics.map(r => (
                  <div key={r.model} className="px-2 py-1 rounded border border-gray-700 bg-gray-900/60">
                    <span className="font-mono">{r.model}</span>
                    <span className="mx-2">•</span>
                    <span>{r.ok}/{r.count} ok</span>
                    <span className="mx-2">•</span>
                    <span>client: {r.avgClientMs != null ? `${r.avgClientMs.toFixed(0)} ms` : 'n/a'}</span>
                    <span className="mx-2">•</span>
                    <span>server: {r.avgServerMs != null ? `${r.avgServerMs.toFixed(0)} ms` : 'n/a'}</span>
                    <span className="mx-2">•</span>
                    <span>cost: ${r.totalCostUsd.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {telemetryOpen && (
            <div className="overflow-auto border border-gray-800 rounded">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-900"><tr>
                  <th className="px-2 py-1 text-left">Time</th>
                  <th className="px-2 py-1 text-left">Model</th>
                  <th className="px-2 py-1 text-left">Status</th>
                  <th className="px-2 py-1 text-left">Client ms</th>
                  <th className="px-2 py-1 text-left">Server ms</th>
                  <th className="px-2 py-1 text-left">Cost</th>
                  <th className="px-2 py-1 text-left">URL</th>
                </tr></thead>
                <tbody>
                  {telemetry.slice(0, 50).map((t, i) => (
                    <tr key={`${t.trace}:${i}`} className="border-t border-gray-800">
                      <td className="px-2 py-1 whitespace-nowrap">{new Date(t.ts).toLocaleTimeString()}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{modelFromTelemetry(t)}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{t.ok ? 'ok' : `err ${t.status}`}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{t.clientLatencyMs != null ? t.clientLatencyMs.toFixed(0) : '-'}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{t.serverLatencyMs != null ? t.serverLatencyMs.toFixed(0) : '-'}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{t.costUsd != null ? `$${t.costUsd.toFixed(4)}` : '-'}</td>
                      <td className="px-2 py-1 truncate max-w-[420px]" title={t.url}>{t.url}</td>
                    </tr>
                  ))}
                  {telemetry.length === 0 && (
                    <tr><td colSpan={7} className="px-2 py-3 text-center text-gray-400">No telemetry yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-black/30 border border-purple-500/20 rounded-lg p-4">
          {/* Metrics summary */}
          {metricsByModel.length > 0 && (
            <div className="mb-4 text-xs text-gray-200">
              <div className="font-semibold text-purple-300 mb-1">Model metrics (from current results)</div>
              <div className="flex flex-wrap gap-2">
                {metricsByModel.map(r => (
                  <div key={r.model} className="px-2 py-1 rounded border border-gray-700 bg-gray-900/60">
                    <span className="font-mono">{r.model}</span>
                    <span className="mx-2">•</span>
                    <span>{r.allowed}/{r.count} allowed</span>
                    <span className="mx-2">•</span>
                    <span>avg latency: {r.avgLatencyMs != null ? `${r.avgLatencyMs.toFixed(0)} ms` : 'n/a'}</span>
                    <span className="mx-2">•</span>
                    <span>cost: ${r.totalCostUsd.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-6 gap-3">
            <div>
              <label className="text-xs text-purple-300">Stage</label>
              <select value={filters.stage} onChange={e=>setFilters(f=>({...f, stage:e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1">
                <option value="">Any</option>
                {['plan','dry-run','shadow-run','approve','execute'].map(s=>(<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs text-purple-300">Allowed</label>
              <select value={filters.allowed} onChange={e=>setFilters(f=>({...f, allowed:e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1">
                <option value="">Any</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-purple-300">User</label>
              <input value={filters.user} onChange={e=>setFilters(f=>({...f, user:e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-xs text-purple-300">Tool</label>
              <input value={filters.tool} onChange={e=>setFilters(f=>({...f, tool:e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-xs text-purple-300">Model</label>
              <select value={filters.model} onChange={e=>setFilters(f=>({...f, model:e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1">
                <option value="">Any</option>
                {options.map(m => (<option key={m} value={m}>{m}</option>))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-purple-300">Search</label>
              <div className="flex items-center gap-2">
                <Search size={16} className="text-gray-400" />
                <input value={filters.q} onChange={e=>setFilters(f=>({...f, q:e.target.value}))} className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1" placeholder="command contains..." />
              </div>
            </div>
            <div>
              <label className="text-xs text-purple-300">Start (ISO)</label>
              <input value={filters.start} onChange={e=>setFilters(f=>({...f, start:e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1" placeholder="2025-08-21T00:00:00Z" />
            </div>
            <div>
              <label className="text-xs text-purple-300">End (ISO)</label>
              <input value={filters.end} onChange={e=>setFilters(f=>({...f, end:e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1" placeholder="2025-08-22T00:00:00Z" />
            </div>
            <div>
              <label className="text-xs text-purple-300">Order</label>
              <select value={filters.order} onChange={e=>setFilters(f=>({...f, order:e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1">
                <option value="desc">Newest</option>
                <option value="asc">Oldest</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-purple-300">Page size</label>
              <input type="number" min={1} max={100} value={filters.page_size} onChange={e=>setFilters(f=>({...f, page_size:Number(e.target.value)}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1" />
            </div>
            <div className="flex items-end">
              <button onClick={()=>{setFilters(f=>({...f, page:1})); load();}} className="px-3 py-2 rounded bg-purple-700 hover:bg-purple-800 text-sm">Apply</button>
            </div>
          </div>
        </div>

        <div className="bg-black/30 border border-purple-500/20 rounded-lg p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Stage</th>
                  <th className="px-3 py-2 text-left">Allowed</th>
                  <th className="px-3 py-2 text-left">Model</th>
                  <th className="px-3 py-2 text-left">Command</th>
                  <th className="px-3 py-2 text-left">Reason</th>
                  <th className="px-3 py-2 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e)=> (
                  <React.Fragment key={e.id}>
                    <tr className="border-t border-gray-800 hover:bg-gray-900/50">
                      <td className="px-3 py-2 whitespace-nowrap">{e.timestamp}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{e.user || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{e.stage || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{String(e.allowed)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{inferModel(e)}{inferModel(e) && inferModel(e) !== model ? (<span className="ml-2 text-[10px] px-1 rounded bg-yellow-800/40 border border-yellow-600/30">override</span>) : null}</td>
                      <td className="px-3 py-2 truncate max-w-xs" title={e.command}>{e.command}</td>
                      <td className="px-3 py-2 truncate max-w-xs" title={e.reason}>{e.reason || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs" onClick={()=>setExpanded(prev=> ({...prev, [e.id]: !prev[e.id]}))}>
                          {expanded[e.id] ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                    {expanded[e.id] && (
                      <tr className="border-t border-gray-800 bg-black/30">
                        <td colSpan={8} className="px-3 py-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-purple-300 mb-1">Analysis</div>
                              <pre className="text-xs whitespace-pre-wrap bg-gray-900 rounded p-2 border border-gray-800">{JSON.stringify((e as any).analysis || {}, null, 2)}</pre>
                            </div>
                            <div>
                              <div className="text-xs text-purple-300 mb-1">Sandbox</div>
                              <pre className="text-xs whitespace-pre-wrap bg-gray-900 rounded p-2 border border-gray-800">{JSON.stringify((e as any).sandbox || {}, null, 2)}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {data.entries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-gray-400">No results</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900 border-t border-gray-800 text-xs">
            <div>Total: {data.total}</div>
            <div className="flex items-center gap-2">
              <button disabled={filters.page<=1} onClick={()=>{setFilters(f=>({...f, page: f.page-1})); load();}} className="px-2 py-1 rounded bg-gray-800 disabled:opacity-50">Prev</button>
              <div>Page {filters.page} / {totalPages}</div>
              <button disabled={filters.page>=totalPages} onClick={()=>{setFilters(f=>({...f, page: f.page+1})); load();}} className="px-2 py-1 rounded bg-gray-800 disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
