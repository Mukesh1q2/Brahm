"use client";

import React from "react";

export const modelOptions = [
  "auto",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-3.5-turbo",
  "claude-3-5-sonnet",
  "gemini-2.5-pro",
  "local-llama",
] as const;

export const ratePer1k: Record<string, number> = {
  "auto": 0.0, // router decides; cost computed server-side
  "gpt-4o": 0.005,
  "gpt-4o-mini": 0.0006,
  "gpt-3.5-turbo": 0.0015,
  "claude-3-5-sonnet": 0.005, // placeholder
  "gemini-2.5-pro": 0.004, // placeholder estimate
  "local-llama": 0.0,
};

// API base for fetch interception (Panini endpoints)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type ModelContextValue = {
  model: string;
  setModel: (m: string) => void;
  options: readonly string[];
  rates: Record<string, number>;
  expert: boolean;
  setExpert: (b: boolean) => void;
  globalModelSelectorEnabled: boolean;
  // budgets & region
  region: string | null;
  setRegion: (r: string | null) => void;
  budgetUSDMonthly: number | null;
  spentUSDMonthToDate: number;
  setBudgetUSDMonthly: (v: number | null) => void;
  resetSpent: () => void;
};

const Ctx = React.createContext<ModelContextValue | null>(null);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [model, setModelState] = React.useState<string>('auto');
  const [expert, setExpertState] = React.useState<boolean>(false);
  const [region, setRegionState] = React.useState<string | null>(null);
  const [budgetUSDMonthly, setBudgetUSDMonthlyState] = React.useState<number | null>(null);
  const [spentUSDMonthToDate, setSpent] = React.useState<number>(0);
  // Hydrate from localStorage after mount to avoid SSR/client mismatch
  React.useEffect(() => {
    try {
      const m = window.localStorage.getItem('model_selected');
      if (m) setModelState(m);
    } catch {}
    try {
      const ex = window.localStorage.getItem('expert_mode') === 'true';
      if (ex) setExpertState(true);
    } catch {}
    try {
      const r = window.localStorage.getItem('region_selected');
      setRegionState(r || null);
    } catch {}
    try {
      const b = window.localStorage.getItem('budget_usd_monthly');
      setBudgetUSDMonthlyState(b ? Number(b) : null);
    } catch {}
    try {
      const s = window.localStorage.getItem('spent_usd_mtd');
      setSpent(s ? Number(s) : 0);
    } catch {}
  }, []);
  const setExpert = React.useCallback((b: boolean) => {
    setExpertState(b);
    try { window.localStorage.setItem('expert_mode', String(b)); } catch {}
  }, []);
  const setModel = React.useCallback((m: string) => {
    setModelState(m);
    try { window.localStorage.setItem("model_selected", m); } catch {}
  }, []);
  const setRegion = React.useCallback((r: string | null) => {
    setRegionState(r);
    try { if (r) window.localStorage.setItem('region_selected', r); else window.localStorage.removeItem('region_selected'); } catch {}
  }, []);
  const setBudgetUSDMonthly = React.useCallback((v: number | null) => {
    setBudgetUSDMonthlyState(v);
    try { if (v != null) window.localStorage.setItem('budget_usd_monthly', String(v)); else window.localStorage.removeItem('budget_usd_monthly'); } catch {}
  }, []);
  const resetSpent = React.useCallback(() => {
    setSpent(0);
    try { window.localStorage.setItem('spent_usd_mtd', '0'); } catch {}
  }, []);
  const globalModelSelectorEnabled = (process.env.NEXT_PUBLIC_GLOBAL_MODEL_SELECTOR ?? 'true') !== 'false';
  const val = React.useMemo<ModelContextValue>(() => ({
    model,
    setModel,
    options: modelOptions as unknown as string[],
    rates: ratePer1k,
    expert,
    setExpert,
    globalModelSelectorEnabled,
    region,
    setRegion,
    budgetUSDMonthly,
    spentUSDMonthToDate: spentUSDMonthToDate,
    setBudgetUSDMonthly,
    resetSpent,
  }), [model, setModel, expert, setExpert, globalModelSelectorEnabled, region, setRegion, budgetUSDMonthly, spentUSDMonthToDate, setBudgetUSDMonthly, resetSpent]);

  // Global fetch interceptor for Panini endpoints to inject X-Model and basic client metadata
  const modelRef = React.useRef(model);
  React.useEffect(() => { modelRef.current = model; }, [model]);
  const origFetchRef = React.useRef<typeof fetch | null>(null);
  const patchedRef = React.useRef(false);

  // Attach fetch interceptor for Panini endpoints
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (patchedRef.current) return;
    const orig = window.fetch.bind(window);
    origFetchRef.current = orig;
    const base = (() => { try { return new URL(API_BASE, window.location.origin); } catch { return null; } })();
    const shouldPatch = (u: URL) => {
      const path = u.pathname || '';
      const isPaniniPath = path.startsWith('/panini') || path.startsWith('/optimize/panini');
      if (!isPaniniPath) return false;
      if (!base) return true;
      return (u.host === base.host && u.protocol === base.protocol);
    };
    window.fetch = async (input: any, init?: RequestInit) => {
      try {
        const urlStr = typeof input === 'string' || input instanceof URL ? String(input) : (input && input.url ? String(input.url) : '');
        const u = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        const start = Date.now();
        const trace = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${start}-${Math.random().toString(36).slice(2)}`;
        const isPanini = shouldPatch(u);
        let headersObj: Record<string, string> = {};
        let hasXModel = false;
        if (init && init.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((v,k)=>{ headersObj[k] = v; if (k.toLowerCase() === 'x-model') hasXModel = true; });
          } else if (Array.isArray(init.headers)) {
            for (const [k,v] of init.headers) { headersObj[k] = String(v); if (k.toLowerCase() === 'x-model') hasXModel = true; }
          } else {
            const h = init.headers as any;
            for (const k in h) { if (Object.prototype.hasOwnProperty.call(h,k)) { headersObj[k] = String(h[k]); if (k.toLowerCase() === 'x-model') hasXModel = true; } }
          }
        } else if (input && input.headers) {
          try { (input.headers as Headers).forEach((v:string,k:string)=>{ headersObj[k] = v; if (k.toLowerCase() === 'x-model') hasXModel = true; }); } catch {}
        }
        if (isPanini) {
          if (!hasXModel) headersObj['X-Model'] = modelRef.current;
          headersObj['X-Client-App'] = 'panini';
          headersObj['X-Trace-Id'] = trace;
          headersObj['X-Request-Id'] = trace;
          headersObj['X-Client-Start'] = String(start);
          try { const r = window.localStorage.getItem('region_selected'); if (r) headersObj['X-Region'] = r; } catch {}
        }
        const newInit: RequestInit = { ...(init || {}), headers: headersObj };
        let res: Response;
        if (input instanceof Request) {
          const req = new Request(input, newInit);
          res = await orig(req as any);
        } else {
          res = await orig(String(u), newInit);
        }
        if (isPanini) {
          const end = Date.now();
          const clientLatency = end - start;
          try {
            const r = res.clone();
            const h = r.headers;
            const serverLatency = Number(h.get('x-server-latency-ms') || h.get('x-latency-ms') || h.get('x-elapsed-ms'));
            const costUsd = Number(h.get('x-llm-cost-usd'));
            const respModel = h.get('x-llm-model') || h.get('x-model') || '';
          const detail = { trace, url: u.toString(), ok: res.ok, status: res.status, clientLatencyMs: clientLatency, serverLatencyMs: Number.isFinite(serverLatency) ? serverLatency : null, costUsd: Number.isFinite(costUsd) ? costUsd : null, requestModel: modelRef.current, responseModel: respModel, app: 'panini' };
          window.dispatchEvent(new CustomEvent('telemetry:request', { detail }));
          } catch {}
        }
        return res;
      } catch (e) {
        return orig(input, init as any);
      }
    };
    patchedRef.current = true;
    return () => {
      if (origFetchRef.current) window.fetch = origFetchRef.current as any;
      patchedRef.current = false;
    };
  }, []);

  // Optional telemetry sink: POST live telemetry to an ingest endpoint if configured
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const ingest = (process.env.NEXT_PUBLIC_TELEMETRY_INGEST || '').trim() || `${API_BASE}/telemetry/ingest`;
    if (!ingest) return;
    const handler = async (ev: any) => {
      try {
        const detail = ev?.detail || {};
        // Update local spend meter if provided
        const costUsd = Number(detail.costUsd ?? NaN);
        if (Number.isFinite(costUsd) && costUsd > 0) {
          setSpent(prev => {
            const next = prev + costUsd;
            try { window.localStorage.setItem('spent_usd_mtd', String(next)); } catch {}
            return next;
          });
        }
        const body = {
          ts: new Date().toISOString(),
          trace: detail.trace || '',
          url: detail.url || '',
          ok: !!detail.ok,
          status: Number(detail.status || 0),
          clientLatencyMs: detail.clientLatencyMs ?? null,
          serverLatencyMs: detail.serverLatencyMs ?? null,
          costUsd: detail.costUsd ?? null,
          requestModel: detail.requestModel || null,
          responseModel: detail.responseModel || null,
          client: 'frontend',
          app: detail.app || 'panini',
        };
        // include auth token if present (best effort)
        let headers: Record<string, string> = { 'Content-Type': 'application/json' };
        try { const t = window.localStorage.getItem('access_token'); if (t) headers['Authorization'] = `Bearer ${t}`; } catch {}
        await fetch(ingest, { method: 'POST', headers, body: JSON.stringify(body), keepalive: true });
      } catch {}
    };
    window.addEventListener('telemetry:request', handler as any);
    return () => window.removeEventListener('telemetry:request', handler as any);
  }, []);

  return <Ctx.Provider value={val}>{children}</Ctx.Provider>;
}

export function useModel(): ModelContextValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}

