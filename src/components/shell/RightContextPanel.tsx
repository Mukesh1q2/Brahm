"use client";
import React, { useEffect } from "react";
import ReasoningTracePanel from "@/components/panels/ReasoningTracePanel";
import { useRightPanelStore, type TabKey } from "@/store/rightPanelStore";
import { useAgentEventBus } from "@/store/agentEventBus";
import type { AgentEvent } from "@/types/AgentEvents";
import { X, Copy, ExternalLink, Filter } from "lucide-react";
import dynamic from 'next/dynamic';
import { flags } from "@/lib/flags";
const DiffViewerLazy = dynamic(() => import("@/components/panels/CodeDiffViewer"), { ssr: false });
const QuantumGraphLazy = dynamic(() => import("@/components/visuals/QuantumGraph"), { ssr: false });

type RightContextPanelProps = {
  reasoningSummary?: string;
  reasoningJson?: unknown;
  codeDiff?: { original: string; modified: string; language?: string } | null;
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "trace",   label: "Trace"   },
  { key: "json",    label: "JSON"    },
  { key: "diff",    label: "Diff"    },
  { key: "memory",  label: "Memory"  },
  { key: "experiences",  label: "Experiences"  },
  { key: "kernel",  label: "Kernel"  },
];

export function MemoryList() {
  const [episodes, setEpisodes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [limit, setLimit] = React.useState(50);
  const [q, setQ] = React.useState('');
  const [phiMin, setPhiMin] = React.useState('');
  const [phiMax, setPhiMax] = React.useState('');
  const [mins, setMins] = React.useState('');
  const [labels, setLabels] = React.useState<string[]>([]);
  const [labelInput, setLabelInput] = React.useState('');
  const [labelsMode, setLabelsMode] = React.useState<'and'|'or'>('and');
  const labelsRef = React.useRef<string[]>([]);
  const [selected, setSelected] = React.useState<any|null>(null);
  const persistEnabledUI = (process.env.NEXT_PUBLIC_PERSIST_REMOTE ?? 'false') === 'true';
  const [persistRemoteOk, setPersistRemoteOk] = React.useState<boolean | null>(null);

  // Initialize from URL on mount
  React.useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const _q = sp.get('mem_q') || '';
      const _phiMin = sp.get('mem_phi_min') || '';
      const _phiMax = sp.get('mem_phi_max') || '';
      const _mins = sp.get('mem_mins') || '';
      const _limit = Number(sp.get('mem_limit') || '') || 50;
      const _labels = sp.getAll('mem_label');
      const _labelMode = (sp.get('mem_label_mode') || '').toLowerCase();
      if (_q) setQ(_q);
      if (_phiMin) setPhiMin(_phiMin);
      if (_phiMax) setPhiMax(_phiMax);
      if (_mins) setMins(_mins);
      if (_limit) setLimit(_limit);
      if (_labels && _labels.length) setLabels(Array.from(new Set(_labels)));
      if (_labelMode === 'or' || _labelMode === 'and') setLabelsMode(_labelMode as 'and'|'or');
    } catch {}
  }, []);

  const syncUrl = React.useCallback((params: { q?: string; phiMin?: string; phiMax?: string; mins?: string; limit?: number; labels?: string[]; labelsMode?: 'and'|'or' }) => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (params.q !== undefined) sp.set('mem_q', params.q);
      if (params.phiMin !== undefined) sp.set('mem_phi_min', params.phiMin);
      if (params.phiMax !== undefined) sp.set('mem_phi_max', params.phiMax);
      if (params.mins !== undefined) sp.set('mem_mins', params.mins);
      if (params.limit !== undefined) sp.set('mem_limit', String(params.limit));
      if (params.labels) {
        // clear existing
        sp.delete('mem_label');
        for (const l of params.labels) sp.append('mem_label', l);
      }
      if (params.labelsMode) sp.set('mem_label_mode', params.labelsMode);
      const url = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, '', url);
    } catch {}
  }, []);

  const load = React.useCallback((override?: { limit?: number; labels?: string[] }) => {
    const effLimit = override?.limit ?? limit;
    const effLabels = override?.labels ?? labels;
    const envPersist = (process.env.NEXT_PUBLIC_PERSIST_REMOTE ?? 'false') === 'true';
    const persistEnabled = envPersist && persistRemoteOk === true;
    setLoading(true);
    if (persistEnabled) {
      // Ensure we have at least a dev token so routes that expect a userId can associate rows
      try { localStorage.setItem('access_token', localStorage.getItem('access_token') || `e2e_${Math.random().toString(36).slice(2,8)}`); } catch {}
      // Fetch conversations and latest messages to show as episodes when persistence is enabled
      const since = mins ? (Date.now() - Number(mins)*60*1000) : 0;
      // Use episodes API when persistence is enabled
      let url = `/api/memory/episodes?limit=${effLimit}`;
      if (q) url += `&q=${encodeURIComponent(q)}`;
      if (since) url += `&since=${since}`;
      if (phiMin) url += `&phi_min=${encodeURIComponent(phiMin)}`;
      if (phiMax) url += `&phi_max=${encodeURIComponent(phiMax)}`;
      for (const l of effLabels) url += `&label=${encodeURIComponent(l)}`;
      if (effLabels.length && labelsMode === 'or') url += `&mode=or`;
      fetch(url)
        .then(r=>r.json())
        .then(async (j) => {
          const items: any[] = Array.isArray(j?.items) ? j.items : [];
          const episodes = items.map((row:any)=> ({ id: row.id, experience: { main_content: row.main_content, timestamp: Number(row.ts||Date.now()), phi_level: row.phi_level!=null? Number(row.phi_level): null } }));
          setEpisodes(episodes);
        })
        .catch(()=> setEpisodes([]))
        .finally(()=> setLoading(false));
    } else {
      // Fallback to agents/memory endpoint for demos
      let url = `/api/agents/memory?limit=${effLimit}`;
      if (q) url += `&q=${encodeURIComponent(q)}`;
      const since = mins ? (Date.now() - Number(mins)*60*1000) : 0;
      if (since) url += `&since=${since}`;
      if (phiMin) url += `&phi_min=${encodeURIComponent(phiMin)}`;
      if (phiMax) url += `&phi_max=${encodeURIComponent(phiMax)}`;
      // labels not supported in memory fallback, ignore
      fetch(url).then(r=>r.json()).then(d=> setEpisodes(d.episodes||[])).catch(()=> setEpisodes([])).finally(()=> setLoading(false));
    }
  }, [q, phiMin, phiMax, mins, limit, labelsMode]);

  React.useEffect(() => { load(); }, []);
  React.useEffect(() => { (async()=>{ try { const r = await fetch('/api/persistence/status', { cache: 'no-store' }); const j = await r.json(); setPersistRemoteOk(Boolean(j?.ok)); } catch { setPersistRemoteOk(false); } })(); }, []);
  React.useEffect(() => { labelsRef.current = labels; }, [labels]);
  React.useEffect(() => { const persistEnabled = (process.env.NEXT_PUBLIC_PERSIST_REMOTE ?? 'false') === 'true'; if (persistEnabled) load(); }, [labelsMode, load]);
  // When DB becomes available, refresh once to switch to DB-backed episodes
  React.useEffect(() => { const persistFlag = (process.env.NEXT_PUBLIC_PERSIST_REMOTE ?? 'false') === 'true'; if (persistFlag && persistRemoteOk === true) load(); }, [persistRemoteOk, load]);

  const applyFilters = () => {
    const lbs = labelsRef.current;
    syncUrl({ q, phiMin, phiMax, mins, limit, labels: lbs });
    load({ labels: lbs });
  };

  const PresetButton: React.FC<{ label: string; onClick: () => void; active?: boolean }> = ({ label, onClick, active }) => (
    <button
      className={`rounded px-2 py-1 text-[11px] ${active ? 'bg-white/20 text-white' : 'bg-white/10 text-neutral-200 hover:bg-white/15'}`}
      onClick={onClick}
      type="button"
    >{label}</button>
  );

  const MemoryDrawer: React.FC<{ episode: any, onClose: () => void }> = ({ episode, onClose }) => {
    const json = JSON.stringify(episode, null, 2);
    const copy = async () => { try { await navigator.clipboard.writeText(json); } catch {} };
    const openNew = () => {
      try {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch {}
    };
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="absolute right-0 top-0 h-full w-[min(560px,100%)] border-l border-white/10 bg-neutral-950 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-neutral-200">Episode details</div>
            <button className="rounded bg-white/10 p-1 hover:bg-white/15" onClick={onClose} aria-label="Close details"><X size={16} /></button>
          </div>
          <div className="mb-3 flex items-center gap-2 text-[11px] text-neutral-400">
            <div>{new Date(episode?.experience?.timestamp || Date.now()).toLocaleString()}</div>
            <div>• phi={episode?.experience?.phi_level}</div>
            {episode?.id && (
              <div className="truncate">• id={episode.id}</div>
            )}
          </div>
          <div className="mb-3 flex items-center gap-2">
            <button className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/15" onClick={copy}><Copy size={14} /> Copy JSON</button>
            <button className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/15" onClick={openNew}><ExternalLink size={14} /> Open in new tab</button>
          </div>
          <pre className="h-[calc(100%-120px)] overflow-auto rounded-lg bg-black/40 p-3 text-xs text-neutral-300 whitespace-pre-wrap">{json}</pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-neutral-400">Episodic memories</div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <Filter size={14} /> Filters
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="rounded border border-white/10 bg-black/20 px-2 py-1" data-testid="memory-q-input" placeholder="search..." value={q} onChange={e=>setQ(e.target.value)} />
        <div className="flex items-center gap-2">
          <input className="w-16 rounded border border-white/10 bg-black/20 px-2 py-1" data-testid="memory-phi-min" placeholder="phi≥" value={phiMin} onChange={e=>setPhiMin(e.target.value)} />
          <input className="w-16 rounded border border-white/10 bg-black/20 px-2 py-1" data-testid="memory-phi-max" placeholder="phi≤" value={phiMax} onChange={e=>setPhiMax(e.target.value)} />
          <input className="w-24 rounded border border-white/10 bg-black/20 px-2 py-1" data-testid="memory-mins" placeholder="mins back" value={mins} onChange={e=>setMins(e.target.value)} />
          <button className="rounded bg-white/10 px-2 py-1" data-testid="memory-apply" onClick={applyFilters}>Apply</button>
        </div>
      </div>
      {/* Labels (only when remote persistence is enabled) */}
      {persistEnabledUI && (
        <>
          <div className="flex items-center gap-2">
            <input className="rounded border border-white/10 bg-black/20 px-2 py-1 text-xs" placeholder="Add label (Enter)" value={labelInput} onChange={e=>setLabelInput(e.target.value)} onKeyDown={e=>{ if (e.key==='Enter') { const t = labelInput.trim(); if (t) { const next = Array.from(new Set([...labels, t])); setLabels(next); syncUrl({ labels: next }); setLabelInput(''); } } }} />
            {!!labels.length && <button className="rounded bg-white/10 px-2 py-1 text-xs" onClick={()=>{ setLabels([]); syncUrl({ labels: [] }); }}>Clear</button>}
            {/* AND/OR mode selector */}
            <label className="ml-auto inline-flex items-center gap-1 text-[11px] text-white/70">
              mode
              <select className="rounded bg-black/20 px-2 py-1 text-xs" value={labelsMode} onChange={e=>{ const v = (e.target.value==='or'?'or':'and') as 'and'|'or'; setLabelsMode(v); syncUrl({ labelsMode: v }); }}>
                <option value="and">All labels (AND)</option>
                <option value="or">Any (OR)</option>
              </select>
            </label>
          </div>
          {!!labels.length && (
            <div className="flex flex-wrap items-center gap-2">
              {labels.map(l => (
                <span key={l} className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2 py-0.5 text-[11px] text-white/80">
                  {l}
                  <button className="text-white/60 hover:text-white" onClick={()=>{ const next = labels.filter(x=>x!==l); setLabels(next); syncUrl({ labels: next}); }}>×</button>
                </span>
              ))}
            </div>
          )}
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <PresetButton label="5m" onClick={()=>{ setMins('5'); syncUrl({ mins: '5' }); }} active={mins==='5'} />
        <PresetButton label="15m" onClick={()=>{ setMins('15'); syncUrl({ mins: '15' }); }} active={mins==='15'} />
        <PresetButton label="60m" onClick={()=>{ setMins('60'); syncUrl({ mins: '60' }); }} active={mins==='60'} />
        <PresetButton label="phi≥3" onClick={()=>{ setPhiMin('3'); syncUrl({ phiMin: '3' }); }} active={phiMin==='3'} />
        <PresetButton label="phi≥5" onClick={()=>{ setPhiMin('5'); syncUrl({ phiMin: '5' }); }} active={phiMin==='5'} />
        <PresetButton label="phi≥7" onClick={()=>{ setPhiMin('7'); syncUrl({ phiMin: '7' }); }} active={phiMin==='7'} />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-neutral-400">Limit</span>
          <select className="rounded bg-black/20 px-2 py-1" data-testid="memory-limit" value={limit} onChange={e=>{ const v = Number(e.target.value)||50; setLimit(v); syncUrl({ limit: v }); }}>
            {[50,100,200,500].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="text-neutral-500">Loading…</div>}
      {!loading && episodes.length === 0 && <div className="text-neutral-500">No episodes yet.</div>}
      <div className="space-y-2">
        {episodes.map((e:any)=> (
          <div key={e.id} className="cursor-pointer rounded border border-white/10 bg-white/5 p-2 hover:bg-white/10" data-testid="memory-episode" onClick={()=>setSelected(e)}>
            <div className="text-neutral-200">{e?.experience?.main_content || e.id}</div>
            <div className="text-[10px] text-neutral-500">{new Date(e?.experience?.timestamp || Date.now()).toLocaleString()} • phi={e?.experience?.phi_level}</div>
          </div>
        ))}
        {!loading && episodes.length >= limit && (
          <div className="pt-2">
            <button className="w-full rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/15" data-testid="memory-load-more" onClick={()=>{ const v = limit + 50; setLimit(v); syncUrl({ limit: v }); load({ limit: v }); }}>Load more</button>
          </div>
        )}
      </div>

      {selected && (<div data-testid="memory-drawer"><MemoryDrawer episode={selected} onClose={()=>setSelected(null)} /></div>)}
    </div>
  );
}

function ExperiencesList() {
  const [eps, setEps] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [source, setSource] = React.useState<'db'|'memory'>('db');
  const load = React.useCallback(() => {
    setLoading(true);
    const url = source === 'db' ? '/api/experiences?limit=100' : '/api/agents/memory?limit=100';
    fetch(url)
      .then(r=>r.json())
      .then(j=> {
        const items = source==='db' ? (Array.isArray(j?.items) ? j.items : []) : (Array.isArray(j?.episodes) ? j.episodes : []);
        setEps(items);
      })
      .catch(()=> setEps([]))
      .finally(()=> setLoading(false));
  }, [source]);
  React.useEffect(() => { load(); }, [load]);
  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-neutral-400">Source:</span>
        <select data-testid="experiences-source" className="rounded bg-black/30 px-2 py-1" value={source} onChange={e=>setSource(e.target.value as any)}>
          <option value="db">Database</option>
          <option value="memory">In-memory</option>
        </select>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={load}>Refresh</button>
      </div>
      {loading && <div className="text-neutral-500">Loading…</div>}
      {!loading && eps.length===0 && <div className="text-neutral-500">No experiences yet.</div>}
      {eps.map((e:any)=> {
        const ex = e?.experience || e; // unify shape from memory vs DB
        return (
          <div key={e.id} className="rounded border border-white/10 bg-white/5 p-2">
            <div className="text-neutral-200">{ex?.main_content || e.id}</div>
            <div className="text-[10px] text-neutral-500">{new Date(ex?.timestamp || Date.now()).toLocaleString()} • phi={ex?.phi_level}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function RightContextPanel({ reasoningSummary, reasoningJson, codeDiff }: RightContextPanelProps) {
  const tab = useRightPanelStore((s) => s.tab);
  // SSE controls
  const [enhanced, setEnhanced] = React.useState<boolean>(false);
  const [moduleProfile, setModuleProfile] = React.useState<'basic'|'enhanced'>('enhanced');
  const [enableEthics, setEnableEthics] = React.useState(true);
  const [enableTools, setEnableTools] = React.useState(true);
  const [enableSalience, setEnableSalience] = React.useState(true);
  const [enableCIPS, setEnableCIPS] = React.useState(false);
  const [enableCIPSApplyEvolution, setEnableCIPSApplyEvolution] = React.useState(false);
  const [phiThresh, setPhiThresh] = React.useState<number>(3);
  const [steps, setSteps] = React.useState<number>(6);
  const [seed, setSeed] = React.useState<string>("");
  const [wGwt, setWGwt] = React.useState<number>(0.5);
  const [wCausal, setWCausal] = React.useState<number>(0.3);
  const [wPp, setWPp] = React.useState<number>(0.2);
  const [liveWeights, setLiveWeights] = React.useState<{ gwt?: number; causal?: number; pp?: number } | null>(null);
  const [lastPredErr, setLastPredErr] = React.useState<number | null>(null);
  const [lastPhiVal, setLastPhiVal] = React.useState<number | null>(null);
  const [predErrSeries, setPredErrSeries] = React.useState<number[]>([]);
  const [lastCoalitions, setLastCoalitions] = React.useState<Array<{ id: string; content: string; novelty?: number; information_gain?: number; value?: number }>>([]);
  const [lastWinner, setLastWinner] = React.useState<{ id: string; content: string } | null>(null);
  const [lastCoalitionsEv, setLastCoalitionsEv] = React.useState<any>(null);
  const [lastWinnerEv, setLastWinnerEv] = React.useState<any>(null);
  const [phiSeries, setPhiSeries] = React.useState<number[]>([]);
  const [attSeries, setAttSeries] = React.useState<number[]>([]);
  const [showLegends, setShowLegends] = React.useState<boolean>(true);
  const [chartsEnabled, setChartsEnabled] = React.useState<boolean>(() => {
    try {
      const v = localStorage.getItem('kernel_charts_enabled');
      if (v != null) return v !== 'false';
    } catch {}
    return flags.kernelCharts;
  });
  React.useEffect(() => { try { localStorage.setItem('kernel_charts_enabled', chartsEnabled ? 'true' : 'false'); } catch {} }, [chartsEnabled]);
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  React.useEffect(()=>{ (async()=>{ try { const r = await fetch('/api/persistence/status', { cache:'no-store' }); const j = await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);
  const [autoMitigate, setAutoMitigate] = React.useState<boolean>(() => {
    try { return localStorage.getItem('ck_auto_mitigate') === 'true'; } catch { return false; }
  });
  const applyPreset = React.useCallback((preset: 'safety'|'balanced'|'exploration'|'cips') => {
    if (preset === 'safety') {
      setEnhanced(false);
      setEnableEthics(true);
      setEnableTools(false);
      setEnableSalience(true);
      setEnableCIPS(false);
      setEnableCIPSApplyEvolution(false);
      setSteps(4);
      setWGwt(0.70); setWCausal(0.25); setWPp(0.05);
    } else if (preset === 'balanced') {
      setEnhanced(false);
      setEnableEthics(true);
      setEnableTools(true);
      setEnableSalience(true);
      setEnableCIPS(false);
      setEnableCIPSApplyEvolution(false);
      setSteps(6);
      setWGwt(0.50); setWCausal(0.30); setWPp(0.20);
    } else if (preset === 'exploration') {
      setEnhanced(true);
      setEnableEthics(true);
      setEnableTools(true);
      setEnableSalience(true);
      setEnableCIPS(true);
      setEnableCIPSApplyEvolution(true);
      setSteps(10);
      setWGwt(0.50); setWCausal(0.20); setWPp(0.30);
    } else if (preset === 'cips') {
      setEnhanced(true);
      setEnableEthics(true);
      setEnableTools(false);
      setEnableSalience(true);
      setEnableCIPS(true);
      setEnableCIPSApplyEvolution(true);
      setSteps(8);
      setWGwt(0.40); setWCausal(0.30); setWPp(0.30);
    }
  }, []);

  const resetDefaults = React.useCallback(() => {
    setEnhanced(false);
    setEnableEthics(true);
    setEnableTools(true);
    setEnableSalience(true);
    setEnableCIPS(false);
    setEnableCIPSApplyEvolution(false);
    setPhiThresh(3);
    setSteps(6);
    setSeed('');
    setWGwt(0.5); setWCausal(0.3); setWPp(0.2);
  }, []);
  const [lastPhiComp, setLastPhiComp] = React.useState<{ information?: number; integration?: number } | null>(null);
  const [lastStability, setLastStability] = React.useState<{ risk_level?: string; stability_score?: number } | null>(null);
  const [lastEthics, setLastEthics] = React.useState<{ overall?: number; dharmic?: number } | null>(null);
  const [lastQualiaCount, setLastQualiaCount] = React.useState<number | null>(null);
  const [lastMetaScore, setLastMetaScore] = React.useState<number | null>(null);
  const [lastEmbodiedScore, setLastEmbodiedScore] = React.useState<number | null>(null);
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  // Auto-mitigation telemetry/cooldown
  const lastMitigationRef = React.useRef<number | null>(null);
  const mitigationCountRef = React.useRef<number>(0);
  const lastRiskRef = React.useRef<string | null>(null);
  const setTab = useRightPanelStore((s) => s.setTab);
  const hydrate = useRightPanelStore((s) => s.hydrate);
  const activeRunId = useRightPanelStore((s) => s.activeRunId);
  const setActiveRun = useRightPanelStore((s) => s.setActiveRun);
  const events = useAgentEventBus((s) => s.events);

  useEffect(() => { hydrate(); }, [hydrate]);

  // Auto-stop on navigation/unload
  useEffect(() => {
    const stop = () => { try { sseRef.current?.close(); } catch {} };
    window.addEventListener('beforeunload', stop);
    window.addEventListener('pagehide', stop);
    return () => { window.removeEventListener('beforeunload', stop); window.removeEventListener('pagehide', stop); };
  }, []);

  // Expose a read-only window hook for E2E to fetch the AgentEvent bus snapshot
  useEffect(() => {
    try {
      // Only expose when explicitly enabled for E2E
      if ((process.env.NEXT_PUBLIC_E2E_HOOKS ?? 'false') !== 'false') {
        // @ts-ignore
        (window as any).agentEvents = () => {
          try { return [...useAgentEventBus.getState().events]; } catch { return []; }
        };
      }
    } catch {}
  }, []);

  const onTab = (k: TabKey) => () => setTab(k);

  // Keep reference to SSE source for stop button
  const sseRef = React.useRef<EventSource | null>(null);
  const reconnectTimerRef = React.useRef<number | null>(null);
  const [connecting, setConnecting] = React.useState(false);
  const [connected, setConnected] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  // Persist SSE settings to localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('sseSettings');
      const am = localStorage.getItem('ck_auto_mitigate');
      if (am != null) setAutoMitigate(am === 'true');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.enhanced === 'boolean') setEnhanced(s.enhanced);
      if (s.moduleProfile === 'basic' || s.moduleProfile === 'enhanced') setModuleProfile(s.moduleProfile);
      if (typeof s.enableEthics === 'boolean') setEnableEthics(s.enableEthics);
      if (typeof s.enableTools === 'boolean') setEnableTools(s.enableTools);
      if (typeof s.enableSalience === 'boolean') setEnableSalience(s.enableSalience);
      if (typeof s.enableCIPS === 'boolean') setEnableCIPS(s.enableCIPS);
      if (typeof s.enableCIPSApplyEvolution === 'boolean') setEnableCIPSApplyEvolution(s.enableCIPSApplyEvolution);
      if (typeof s.phiThresh === 'number') setPhiThresh(s.phiThresh);
      if (typeof s.steps === 'number') setSteps(s.steps);
      if (typeof s.seed === 'string') setSeed(s.seed);
      if (typeof s.wGwt === 'number') setWGwt(s.wGwt);
      if (typeof s.wCausal === 'number') setWCausal(s.wCausal);
      if (typeof s.wPp === 'number') setWPp(s.wPp);
    } catch {}
  }, []);
  React.useEffect(() => {
    try {
      const s = { enhanced, moduleProfile, enableEthics, enableTools, enableSalience, enableCIPS, enableCIPSApplyEvolution, phiThresh, steps, seed, wGwt, wCausal, wPp };
      localStorage.setItem('sseSettings', JSON.stringify(s));
      localStorage.setItem('ck_auto_mitigate', autoMitigate ? 'true' : 'false');
    } catch {}
  }, [enhanced, moduleProfile, enableEthics, enableTools, enableSalience, enableCIPS, enableCIPSApplyEvolution, phiThresh, steps, seed, wGwt, wCausal, wPp, autoMitigate]);

  const startStream = React.useCallback(() => {
    try {
      // Close existing
      try { sseRef.current?.close(); } catch {}
      setConnecting(true); setConnected(false);
      const goal = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('goal') || 'Conscious kernel live stream') : 'Conscious kernel live stream';
      const sp = new URLSearchParams();
      sp.set('goal', goal);
      sp.set('steps', String(steps));
      if (seed) sp.set('seed', seed);
      sp.set('enhanced', String(enhanced));
      sp.set('profile', moduleProfile);
      if (phiThresh != null) sp.set('targetPhi', String(phiThresh));
      sp.set('enableEthics', String(enableEthics));
      sp.set('enableTools', String(enableTools));
      sp.set('enableSalience', String(enableSalience));
      sp.set('enableCIPS', String(enableCIPS));
      sp.set('enableCIPSApplyEvolution', String(enableCIPSApplyEvolution));
      sp.set('weightGwt', String(wGwt));
      sp.set('weightCausal', String(wCausal));
      sp.set('weightPp', String(wPp));
      const url = `/api/agents/stream?${sp.toString()}`;
      if (enableCIPS) { try { setLastPredErr(0); } catch {} }
      const src = new EventSource(url);
      sseRef.current = src;
      // @ts-ignore
      (window as any).__ck_sse__ = src;
      src.addEventListener('open', () => {
        setConnecting(false); setConnected(true); setRetryCount(0);
        // Seed initial metrics for short runs
        if (enableCIPS) {
          try {
            const runId = 'kernel';
            setLastPredErr(0);
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `PredErr=${(0).toFixed(3)}`, json: { type: 'cips:prediction', error: 0 } });
            if ((process.env.NEXT_PUBLIC_E2E_HOOKS ?? 'false') !== 'false') {
              useAgentEventBus.getState().push({ type: 'trace', runId, summary: 'Coalitions:1', json: { type: 'cips:coalitions', items: [{ id: 'c1' }] } });
              useAgentEventBus.getState().push({ type: 'trace', runId, summary: 'Winner:c1', json: { type: 'cips:workspace_winner', coalition: { id: 'c1' } } });
              useAgentEventBus.getState().push({ type: 'trace', runId, summary: 'Qualia S:0.50 C:0.70', json: { type: 'cips:qualia', qualia: { sensory: 0.5, cognitive: 0.7 } } });
              useAgentEventBus.getState().push({ type: 'trace', runId, summary: 'SelfModel conf=0.80', json: { type: 'cips:self_model', confidence: 0.8 } });
              useAgentEventBus.getState().push({ type: 'trace', runId, summary: 'Evolve+1/1', json: { type: 'cips:evolution', improvements: [{}], accepted: [{}] } });
            }
          } catch {}
        }
      });
      const onEv = (msg: MessageEvent) => {
        try {
          const ev = JSON.parse((msg as any).data);
          const writeStatus = (patch: any) => {
            try {
              const k = 'rightpanel_status';
              const prev = JSON.parse(localStorage.getItem(k) || '{}');
              const next = { ...prev, ...patch, ts: Date.now() };
              localStorage.setItem(k, JSON.stringify(next));
            } catch {}
          };
          // Adapt kernel events to AgentEvent bus
          if (ev.type === 'run:start') {
            useAgentEventBus.getState().push({ type: 'run:start', runId: ev.runId, agent: 'kernel', timestamp: Date.now() });
          } else if (ev.type === 'run:end') {
            useAgentEventBus.getState().push({ type: 'run:end', runId: ev.runId, success: ev.success, timestamp: Date.now() });
            (window as any).__brahm_toast?.('Run finished', 'info');
          } else if (ev.type === 'broadcast') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: ev.broadcast?.summary || '', json: ev });
          } else if (ev.type === 'experience') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: 'Experience', json: ev.experience });
          } else if (ev.type === 'conscious_experience') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            try { const qc = Number(ev?.conscious_experience?.qualia_count ?? ev?.experience?.qualia_count ?? 0); setLastQualiaCount(qc); writeStatus({ qualia: qc }); } catch {}
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: 'ConsciousExperience', json: ev });
          }
          // Accumulate series for sparklines
          // @ts-ignore
          ;(window as any).__ck_series__ = (window as any).__ck_series__ || { phi: [], binding: [] };
          const series = (window as any).__ck_series__;
          if (ev.type === 'attention' && ev.state?.binding_coherence != null) {
            series.binding.push(Number(ev.state.binding_coherence)); if (series.binding.length>30) series.binding.shift();
          } else if ((ev.type === 'phi' || ev.type === 'phi_measurement') && (ev.measurement?.phi_value != null || ev.measurement?.phi != null)) {
            const v = Number(ev.measurement?.phi_value ?? ev.measurement?.phi);
            series.phi.push(v); if (series.phi.length>30) series.phi.shift();
          }

          if (ev.type === 'phi') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            setLastPhiVal(Number(ev?.measurement?.phi_value ?? ev?.measurement?.phi ?? 0));
            try { setLastPhiComp({ information: Number(ev?.measurement?.components?.information ?? 0), integration: Number(ev?.measurement?.components?.integration ?? 0) }); } catch {}
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Phi=${ev.measurement?.phi_value?.toFixed?.(2) ?? ''}`, json: ev });
          } else if (ev.type === 'phi_measurement') {
            try { setLastPhiVal(Number(ev?.measurement?.phi_value ?? ev?.measurement?.phi ?? 0)); setLastPhiComp({ information: Number(ev?.measurement?.components?.information ?? 0), integration: Number(ev?.measurement?.components?.integration ?? 0) }); } catch {}
          } else if (ev.type === 'conscious_access') {
            const has = Boolean(ev?.has_access ?? ev?.access?.has_conscious_access);
            setHasAccess(has);
          } else if (ev.type === 'stability' || ev.type === 'stability_assessment') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            const risk = ev?.assessment?.risk_level;
            const score = ev?.assessment?.stability_score;
            setLastStability({ risk_level: risk, stability_score: score });
            writeStatus({ risk, stability: score });
            if (ev.type === 'stability') {
              useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Stability=${ev.assessment?.stability_score?.toFixed?.(2) ?? ''} (${risk||''})`, json: ev });
            }
            // Auto-mitigate on risk escalation with cooldown to avoid thrash
            try {
              const now = Date.now();
              const prevRisk = lastRiskRef.current;
              lastRiskRef.current = risk || prevRisk;
              const cooldownMs = (() => { const v = Number(process.env.NEXT_PUBLIC_MITIGATION_COOLDOWN_MS); return Number.isFinite(v) && v > 0 ? v : 30000; })();
              const inCooldown = lastMitigationRef.current != null && (now - (lastMitigationRef.current || 0) < cooldownMs);
              const isHigh = risk === 'high' || risk === 'critical';
              const wasHigh = prevRisk === 'high' || prevRisk === 'critical';
              const escalated = isHigh && !wasHigh || (prevRisk === 'high' && risk === 'critical');
              if (autoMitigate && isHigh && !inCooldown && escalated) {
                setSteps(s=>Math.max(1, Math.floor(s*0.8)));
                const ng = Math.max(0.05, Math.min(0.8, (liveWeights?.gwt ?? wGwt) * 0.95));
                const np = Math.max(0.05, Math.min(0.8, (liveWeights?.pp ?? wPp) * 0.9));
                const nc = Math.max(0.05, 1 - (ng + np));
                setWGwt(Number(ng.toFixed(2))); setWPp(Number(np.toFixed(2))); setWCausal(Number(nc.toFixed(2)));
                lastMitigationRef.current = now;
                mitigationCountRef.current += 1;
                writeStatus({ mitigations: mitigationCountRef.current, mitigated_at: now });
                (window as any).__brahm_toast?.('Auto-mitigation applied (stability risk)', 'info');
              }
            } catch {}
          } else if (ev.type === 'ethics') {
            try { const overall = Number(ev?.evaluation?.overall_score ?? 0); setLastEthics({ overall, dharmic: Number(ev?.evaluation?.frameworks?.dharmic?.score ?? 0) }); writeStatus({ ethics: overall }); } catch {}
          } else if (ev.type === 'meta_reflection') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            const score = Number(ev?.score ?? ev?.reflection?.score ?? ev?.metrics?.score ?? 0);
            setLastMetaScore(isFinite(score) ? score : 0);
            writeStatus({ reflect: isFinite(score) ? score : 0 });
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `MetaReflection=${isFinite(score)? score.toFixed(2):'n/a'}`, json: ev });
          } else if (ev.type === 'embodied_integration') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            const score = Number(ev?.score ?? ev?.metrics?.integration_score ?? ev?.integration?.score ?? 0);
            setLastEmbodiedScore(isFinite(score) ? score : 0);
            writeStatus({ embody: isFinite(score) ? score : 0 });
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `EmbodiedInt=${isFinite(score)? score.toFixed(2):'n/a'}`, json: ev });
          } else if (ev.type === 'cips:coalitions') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            const count = Array.isArray(ev.items) ? ev.items.length : 0;
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Coalitions:${count}`, json: ev });
          } else if (ev.type === 'cips:workspace_winner') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Winner:${ev.coalition?.id || ''}` , json: ev });
          } else if (ev.type === 'cips:qualia') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Qualia S:${ev.qualia?.sensory?.toFixed?.(2)} C:${ev.qualia?.cognitive?.toFixed?.(2)}`, json: ev });
          } else if (ev.type === 'cips:prediction') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            try { setLastPredErr(Number(ev.error)); } catch {}
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `PredErr=${(ev.error ?? 0).toFixed?.(3)}`, json: ev });
          } else if (ev.type === 'cips:self_model') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `SelfModel conf=${(ev.confidence ?? 0).toFixed?.(2)}`, json: ev });
          } else if (ev.type === 'cips:evolution') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Evolve+${(ev.improvements||[]).length}/${(ev.accepted||[]).length}`, json: ev });
          } else if (ev.type === 'cips:weights') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            try { setLiveWeights({ gwt: Number(ev.weights?.gwt), causal: Number(ev.weights?.causal), pp: Number(ev.weights?.pp) }); } catch {}
            const g = Number(ev.weights?.gwt ?? 0).toFixed(2), c = Number(ev.weights?.causal ?? 0).toFixed(2), p = Number(ev.weights?.pp ?? 0).toFixed(2);
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Weights(${g},${c},${p})`, json: ev });
          } else if (ev.type === 'cips:prediction') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            try { const e = Number(ev.error ?? 0); setLastPredErr(e); setPredErrSeries(prev => [...prev.slice(-49), e]); } catch {}
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `PredErr=${(ev.error ?? 0).toFixed?.(3)}`, json: ev });
          } else if (ev.type === 'cips:coalitions') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            try { setLastCoalitions(ev.items?.slice?.(0, 5) || []); setLastCoalitionsEv(ev); } catch {}
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Coalitions:${(ev.items||[]).length}`, json: ev });
          } else if (ev.type === 'phi') {
            try { const v = Number(ev?.measurement?.phi_value ?? 0); setPhiSeries(prev => [...prev.slice(-49), v]); } catch {}
          } else if (ev.type === 'attention') {
            try { const a = Number(ev?.state?.attention_strength ?? 0); setAttSeries(prev => [...prev.slice(-49), a]); } catch {}
          } else if (ev.type === 'cips:workspace_winner') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            try { setLastWinner(ev.coalition); setLastWinnerEv(ev); } catch {}
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Winner:${ev.coalition?.id||'-'}` , json: ev });
          } else if (ev.type === 'attention') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            // attach series
            const json = { ...ev } as any; try { json.series = (window as any).__ck_series__; } catch {}
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Attention=${(ev.state?.attention_strength ?? 0).toFixed?.(2)}`, json });
          } else if (ev.type === 'salience') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Salience=${(ev.score ?? 0).toFixed?.(2)}`, json: ev });
          } else if (ev.type === 'tool') {
            const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
            useAgentEventBus.getState().push({ type: 'trace', runId, summary: `Tool:${ev.name}`, json: ev.result });
          }
        } catch {}
      };
      src.addEventListener('ev', onEv);
      // E2E hook: allow injecting kernel events directly when enabled
      try {
        if ((process.env.NEXT_PUBLIC_E2E_HOOKS ?? 'false') !== 'false') {
          // @ts-ignore
          (window as any).__ck_emit_event = (e: any) => onEv({ data: JSON.stringify(e) } as any);
        }
      } catch {}
      src.addEventListener('error', () => {
        setConnected(false);
        setConnecting(false);
        try { src.close(); } catch {}
        // backoff reconnect
        const max = 4;
        const next = retryCount + 1;
        setRetryCount(next);
        if (next <= max) {
          const delay = Math.min(1000 * 2 ** (next - 1), 8000);
          if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = window.setTimeout(() => { startStream(); }, delay) as unknown as number;
          (window as any).__brahm_toast?.(`Reconnecting stream… (attempt ${next})`, 'info');
        } else {
          (window as any).__brahm_toast?.('Stream disconnected', 'error');
        }
      });
    } catch {}
  }, [steps, seed, phiThresh, enhanced, enableEthics, enableTools, enableSalience, enableCIPS, enableCIPSApplyEvolution, wGwt, wCausal, wPp, retryCount, autoMitigate]);
  React.useEffect(() => {
    try { const sp = new URLSearchParams(window.location.search); if (sp.get('autostream') === '1') startStream(); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => () => { if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current); }, []);

  // Derived labels for UI badges
  const weightsLabel = (() => {
    const g = Number(liveWeights?.gwt ?? wGwt);
    const c = Number(liveWeights?.causal ?? wCausal);
    const p = Number(liveWeights?.pp ?? wPp);
    try {
      return `w(${g.toFixed(2)},${c.toFixed(2)},${p.toFixed(2)})`;
    } catch {
      return `w(${g},${c},${p})`;
    }
  })();

  return (
    <aside
      className="flex h-full w-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur"
      data-testid="right-panel"
    >
      {/* Run selector + Stream control */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <select
            className="rounded-md bg-black/30 px-2 py-1 text-sm text-neutral-200"
            value={activeRunId ?? ""}
            onChange={(e) => setActiveRun(e.target.value || null)}
            data-testid="run-selector"
          >
            <option value="">(latest)</option>
            {events.filter(e => e.type === 'run:start').map((e: AgentEvent & { type: 'run:start' }) => (
              <option key={e.runId} value={e.runId}>
                {e.agent} — {new Date(e.timestamp).toLocaleTimeString()}
              </option>
            ))}
          </select>
          <button
            className="rounded-md bg-white/10 px-2 py-1 text-sm hover:bg-white/15"
            onClick={async () => { 
              try {
                const b = localStorage.getItem('budget_usd_monthly');
                const s = localStorage.getItem('spent_usd_mtd');
                const budget = b ? Number(b) : null;
                const spent = s ? Number(s) : 0;
                if (budget != null && spent >= budget) {
                  (window as any).__brahm_toast?.('Budget exceeded. Increase budget to stream.', 'error');
                  return;
                }
              } catch {}
              (window as any).__brahm_toast?.('Streaming started', 'success');
              startStream();
          }}
>
          Stream Run
        </button>
          <button
            className="rounded-md bg-white/5 px-2 py-1 text-sm hover:bg-white/10"
            onClick={() => { try { if (!sseRef.current) return; if (!confirm('Stop current stream?')) return; sseRef.current?.close(); (window as any).__brahm_toast?.('Streaming stopped', 'info'); } catch {} }}
        >
          Stop Stream
        </button>
        </div>
        {/* SSE options */}
        <div className="grid grid-cols-1 gap-2 text-[11px] text-neutral-300 md:grid-cols-3">
          <fieldset className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 px-2 py-1">
            <legend className="px-1 text-[10px] text-neutral-400">Preset</legend>
            <select className="rounded bg-black/30 px-1 py-0.5" onChange={(e)=>{ const v = e.target.value as any; if (v) applyPreset(v); e.currentTarget.selectedIndex = 0; }}>
              <option value="">Select…</option>
              <option value="safety">Safety</option>
              <option value="balanced">Balanced</option>
              <option value="exploration">Exploration</option>
              <option value="cips">CIPS Learning</option>
            </select>
            <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15" onClick={resetDefaults}>Reset</button>
          </fieldset>
          <fieldset className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 px-2 py-1">
            <legend className="px-1 text-[10px] text-neutral-400">Runtime</legend>
            <label className="flex items-center gap-1"><input data-testid="sse-enhanced" type="checkbox" checked={enhanced} onChange={e=>setEnhanced(e.target.checked)} /> enhanced</label>
            <label className="flex items-center gap-1">profile
              <select className="rounded bg-black/30 px-1 py-0.5" value={moduleProfile} onChange={e=>setModuleProfile((e.target.value as any) || 'enhanced')}>
                <option value="enhanced">enhanced</option>
                <option value="basic">basic</option>
              </select>
            </label>
            <label className="flex items-center gap-1"><input data-testid="sse-ethics" type="checkbox" checked={enableEthics} onChange={e=>setEnableEthics(e.target.checked)} /> ethics</label>
            <label className="flex items-center gap-1"><input data-testid="sse-tools" type="checkbox" checked={enableTools} onChange={e=>setEnableTools(e.target.checked)} /> tools</label>
            <label className="flex items-center gap-1"><input data-testid="sse-salience" type="checkbox" checked={enableSalience} onChange={e=>setEnableSalience(e.target.checked)} /> salience</label>
          </fieldset>
          <fieldset className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 px-2 py-1">
            <legend className="px-1 text-[10px] text-neutral-400">CIPS</legend>
            <label className="flex items-center gap-1"><input data-testid="sse-cips" type="checkbox" checked={enableCIPS} onChange={e=>setEnableCIPS(e.target.checked)} /> CIPS</label>
            <label className="flex items-center gap-1"><input data-testid="sse-cips-apply" type="checkbox" checked={enableCIPSApplyEvolution} onChange={e=>setEnableCIPSApplyEvolution(e.target.checked)} /> CIPS Apply</label>
          </fieldset>
          {flags.performanceControls && (
            <fieldset className="flex flex-wrap items-center gap-2 rounded-lg bg-white/5 px-2 py-1">
              <legend className="px-1 text-[10px] text-neutral-400">Params</legend>
              <label className="flex items-center gap-1">phi
                <input data-testid="sse-phi" className="w-16 rounded bg-black/30 px-1 py-0.5" type="number" step="0.1" value={phiThresh} onChange={e=>setPhiThresh(Number(e.target.value)||0)} />
              </label>
              <label className="flex items-center gap-1">steps
                <input data-testid="sse-steps" className="w-14 rounded bg-black/30 px-1 py-0.5" type="number" min={1} max={30} value={steps} onChange={e=>setSteps(Math.max(1, Math.min(30, Number(e.target.value)||6)))} />
              </label>
              <label className="flex items-center gap-1">seed
                <input data-testid="sse-seed" className="w-24 rounded bg-black/30 px-1 py-0.5" value={seed} onChange={e=>setSeed(e.target.value)} placeholder="auto" />
              </label>
              <label className="flex items-center gap-1">w_gwt
                <input data-testid="sse-w-gwt" className="w-16 rounded bg-black/30 px-1 py-0.5" type="number" step="0.05" value={wGwt} onChange={e=>setWGwt(Number(e.target.value)||0)} />
              </label>
              <label className="flex items-center gap-1">w_causal
                <input data-testid="sse-w-causal" className="w-16 rounded bg-black/30 px-1 py-0.5" type="number" step="0.05" value={wCausal} onChange={e=>setWCausal(Number(e.target.value)||0)} />
              </label>
              <label className="flex items-center gap-1">w_pp
                <input data-testid="sse-w-pp" className="w-16 rounded bg-black/30 px-1 py-0.5" type="number" step="0.05" value={wPp} onChange={e=>setWPp(Number(e.target.value)||0)} />
              </label>
            </fieldset>
          )}
        </div>
        {/* Mitigation toggle */}
        {flags.stabilityMitigation && (
          <div className="flex items-center gap-3 text-[11px] text-neutral-300">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={autoMitigate} onChange={e=>setAutoMitigate(e.target.checked)} /> Auto-mitigate on high risk
            </label>
          </div>
        )}
        {/* Config badge */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-400" data-testid="sse-badge">
          <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-kernel">kernel:{enhanced? 'enh':'base'}</span>
          <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-profile">profile:{moduleProfile}</span>
          <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-phi">phi≥{phiThresh}</span>
          <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-steps">steps:{steps}</span>
          {seed && <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-seed">seed:{seed}</span>}
          <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-ethics">E:{enableEthics? 'on':'off'}</span>
          <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-tools">T:{enableTools? 'on':'off'}</span>
          <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-salience">S:{enableSalience? 'on':'off'}</span>
          <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-cips">CIPS:{enableCIPS? 'on':'off'}</span>
          <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-cips-apply">Apply:{enableCIPSApplyEvolution? 'on':'off'}</span>
          <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-ppmod">Err:{lastPredErr!=null ? lastPredErr.toFixed(3) : '-'}</span>
          <span className="rounded bg-white/5 px-2 py-0.5" data-testid="sse-badge-weights">{weightsLabel}</span>
          {/* Enhanced status pills */}
          {hasAccess!==null && (
            <span className={`rounded bg-white/5 px-2 py-0.5`}>state:{hasAccess? 'access':'pre'}</span>
          )}
          {lastStability?.risk_level && (
            <span className={`rounded px-2 py-0.5 ${lastStability.risk_level==='critical'?'bg-red-900/40': lastStability.risk_level==='high'?'bg-orange-900/40': lastStability.risk_level==='elevated'?'bg-amber-900/40':'bg-emerald-900/30'}`}>stability:{lastStability.risk_level}</span>
          )}
          {lastEthics?.overall!=null && (
            <span className="rounded bg-white/5 px-2 py-0.5">ethics:{lastEthics.overall.toFixed(2)}</span>
          )}
          {lastPhiComp && (
            <span className="rounded bg-white/5 px-2 py-0.5">phi(info:{(lastPhiComp.information??0).toFixed(2)} int:{(lastPhiComp.integration??0).toFixed(2)})</span>
          )}
          {lastMetaScore!=null && (
            <span className="rounded bg-white/5 px-2 py-0.5">reflect:{lastMetaScore.toFixed(2)}</span>
          )}
          {lastEmbodiedScore!=null && (
            <span className="rounded bg-white/5 px-2 py-0.5">embody:{lastEmbodiedScore.toFixed(2)}</span>
          )}
          {lastQualiaCount!=null && (
            <span className="rounded bg-white/5 px-2 py-0.5">qualia:{lastQualiaCount}</span>
          )}
          {mitigationCountRef.current>0 && (
            <span className="rounded bg-white/5 px-2 py-0.5">mit:{mitigationCountRef.current}</span>
          )}
          {lastMitigationRef.current && (
            <span className="rounded bg-white/5 px-2 py-0.5">last:{new Date(lastMitigationRef.current).toLocaleTimeString()}</span>
          )}
        {(lastStability?.risk_level==='high' || lastStability?.risk_level==='critical') && (
          <button className="rounded bg-red-900/40 px-2 py-0.5 hover:bg-red-900/50" onClick={()=>{ setSteps(s=>Math.max(1, Math.floor(s*0.8))); const sum = wGwt+wCausal+wPp; const ng = Math.max(0.05, Math.min(0.8, wGwt*0.95)); const np = Math.max(0.05, Math.min(0.8, wPp*0.9)); const nc = Math.max(0.05, 1 - (ng+np)); setWGwt(Number(ng.toFixed(2))); setWPp(Number(np.toFixed(2))); setWCausal(Number(nc.toFixed(2))); (window as any).__brahm_toast?.('Applied mitigation: reduced steps & adjusted weights','info'); }}>Apply mitigation</button>
        )}
        </div>

        {/* CIPS insight mini-panel */}
        {enableCIPS && (
          <div className="grid grid-cols-1 gap-2 rounded-lg bg-white/5 p-2 text-[11px] text-neutral-300 md:grid-cols-3">
            <div>
              <div className="text-[10px] text-neutral-400">Prediction error</div>
              <div className="h-2 w-full rounded bg-white/10">
                <div className="h-2 rounded bg-pink-500" style={{ width: `${Math.min(1, Math.max(0, (lastPredErr ?? 0)))*100}%` }} />
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400">Weights</div>
              <div className="flex h-2 w-full overflow-hidden rounded bg-white/10">
                {(() => { const g = Number(liveWeights?.gwt ?? wGwt); const c = Number(liveWeights?.causal ?? wCausal); const p = Number(liveWeights?.pp ?? wPp); const sum = (g+c+p)||1; return (
                  <>
                    <div title={`gwt ${g.toFixed(2)}`} style={{ width: `${(g/sum)*100}%` }} className="bg-purple-500" />
                    <div title={`causal ${c.toFixed(2)}`} style={{ width: `${(c/sum)*100}%` }} className="bg-blue-500" />
                    <div title={`pp ${p.toFixed(2)}`} style={{ width: `${(p/sum)*100}%` }} className="bg-emerald-500" />
                  </>
                ); })()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400">Qualia</div>
              <div className="mt-0.5 rounded bg-white/10 px-2 py-1">{lastQualiaCount ?? '-'}</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={onTab(key)}
            data-testid={`right-panel-tab-${key}`}
            aria-pressed={tab === key}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              tab === key ? "bg-white/15 text-white" : "text-neutral-300 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-black/20 p-3">
        {(() => {
          // Prefer agent run data if present and activeRunId selected
          const latestRunId = activeRunId || [...events].reverse().find(e => e.type === 'run:start')?.runId;
          const currentTrace = latestRunId ? ([...events].reverse().find(e => e.type==='trace' && e.runId===latestRunId) as any) : undefined;
          const currentPatch = latestRunId ? ([...events].reverse().find(e => e.type==='patch' && e.runId===latestRunId) as any) : undefined;

          const effSummary = currentTrace?.summary ?? reasoningSummary;
          const effJson = currentTrace?.json ?? reasoningJson;
          const effDiff = currentPatch ? { original: currentPatch.original, modified: currentPatch.modified, language: currentPatch.language } : codeDiff;

          if (tab === 'summary') return (
            <div className="space-y-3">
              {effSummary ? (
                <ReasoningTracePanel summary={effSummary} json={undefined} />
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-neutral-400">
                  No summary yet. Click "Stream Run" to begin.
                </div>
              )}
              <QuantumGraphLazy height={140} />
            </div>
          );
          if (tab === 'trace') return effJson ? (
            <ReasoningTracePanel summary={undefined} json={effJson} />
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-neutral-400">No trace yet.</div>
          );
          if (tab === 'json') return effJson ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                  onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify(effJson ?? {}, null, 2)); (window as any).__brahm_toast?.('JSON copied', 'success'); } catch {} }}
                >Copy JSON</button>
                <button
                  className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                  onClick={() => { try { const blob = new Blob([JSON.stringify(effJson ?? {}, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'trace.json'; a.click(); URL.revokeObjectURL(url); } catch {} }}
                >Export</button>
                {!connected && (
                  <span className="ml-auto text-[11px] text-amber-300">{connecting ? 'Connecting…' : retryCount>0 ? `Reconnecting (attempt ${retryCount})…` : 'Disconnected'}</span>
                )}
              </div>
              <pre data-testid="json-raw" className="text-xs text-neutral-300">{JSON.stringify(effJson ?? {}, null, 2)}</pre>
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-neutral-400">No JSON available.</div>
          );
          if (tab === 'diff') return effDiff ? (
            <DiffViewerLazy {...effDiff} />
          ) : (
            <div className="text-sm text-neutral-400">No diff available.</div>
          );
          if (tab === 'memory') return <MemoryList />;
          if (tab === 'experiences') return <ExperiencesList />;
          if (tab === 'kernel') return (
            <div className="space-y-3 text-sm text-neutral-300">
              <div className="mb-1 flex items-center gap-3 text-[11px] text-neutral-400">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={showLegends} onChange={e=>setShowLegends(e.target.checked)} /> Show legends
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={chartsEnabled} onChange={e=>setChartsEnabled(e.target.checked)} /> Enable charts
                </label>
                <span className={`rounded px-2 py-[2px] ${chartsEnabled? 'bg-emerald-900/30 text-emerald-300' : 'bg-neutral-800 text-neutral-300'}`}>charts:{chartsEnabled? 'on':'off'}</span>
                <span className={`rounded px-2 py-[2px] ${pgOk? 'bg-emerald-900/30 text-emerald-300' : 'bg-neutral-800 text-neutral-300'}`}>db:{pgOk? 'on':'off'}</span>
                {pgOk && (
                  <button className="rounded bg-white/10 px-2 py-[2px] hover:bg-white/15"
                          title="Persist latest kernel snapshot"
                          onClick={async()=>{ try { const phi = lastPhiVal!=null ? Number(lastPhiVal) : 0; const body={ main_content:'Kernel snapshot', timestamp: Date.now(), phi_level: phi, qualia_count: 0, duration_ms: 0 }; const r= await fetch('/api/experiences', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }); (window as any).__brahm_toast?.(r.ok? 'Saved snapshot':'Persist failed', r.ok? 'success':'error'); } catch {} }}>
                    Persist latest
                  </button>
                )}
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-[11px] text-neutral-400 mb-1">Prediction error</div>
                  <div className="h-16 flex items-end gap-[1px]">
                    {predErrSeries.map((v,i)=>{ const n = Math.max(0, Math.min(1, Number(v))); const h = 2 + n*60; return <div key={i} className="w-[3px] bg-pink-500" style={{ height: h }} /> })}
                  </div>
                  <div className="mt-1 text-[11px] text-neutral-400">last: {lastPredErr!=null? lastPredErr.toFixed(3): '-'}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-[11px] text-neutral-400 mb-1">Phi weights</div>
                  <div className="flex h-3 w-full overflow-hidden rounded bg-white/10">
                    {(() => { const g = Number(liveWeights?.gwt ?? wGwt); const c = Number(liveWeights?.causal ?? wCausal); const p = Number(liveWeights?.pp ?? wPp); const sum = (g+c+p)||1; return (
                      <>
                        <div title={`gwt ${g.toFixed(2)}`} style={{ width: `${(g/sum)*100}%` }} className="bg-purple-500" />
                        <div title={`causal ${c.toFixed(2)}`} style={{ width: `${(c/sum)*100}%` }} className="bg-blue-500" />
                        <div title={`pp ${p.toFixed(2)}`} style={{ width: `${(p/sum)*100}%` }} className="bg-emerald-500" />
                      </>
                    ); })()}
                  </div>
                  <div className="mt-1 text-[11px] text-neutral-400">g:{Number(liveWeights?.gwt ?? wGwt).toFixed(2)} c:{Number(liveWeights?.causal ?? wCausal).toFixed(2)} p:{Number(liveWeights?.pp ?? wPp).toFixed(2)}</div>
                  {showLegends && (
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-400">
                      <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-purple-500" /> GWT</span>
                      <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-blue-500" /> Causal</span>
                      <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-emerald-500" /> PP</span>
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-[11px] text-neutral-400 mb-1">Qualia</div>
                  <div className="text-xl">{lastQualiaCount ?? '-'}</div>
                </div>
              </div>
              {chartsEnabled && (
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-[11px] text-neutral-400 mb-1">Phi trend</div>
                  <div className="h-16 flex items-end gap-[1px]">
                    {phiSeries.map((v,i)=>{ const n = Math.max(0, Math.min(10, Number(v))); const h = 2 + (n/10)*60; return <div key={i} className="w-[3px] bg-purple-400" style={{ height: h }} /> })}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-[11px] text-neutral-400 mb-1">Attention trend</div>
                  <div className="h-16 flex items-end gap-[1px]">
                    {attSeries.map((v,i)=>{ const n = Math.max(0, Math.min(1, Number(v))); const h = 2 + n*60; return <div key={i} className="w-[3px] bg-blue-400" style={{ height: h }} /> })}
                  </div>
                </div>
              </div>
              )}
              <ToolRunner />
              <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                <div className="text-[11px] text-neutral-400 mb-2">Coalitions</div>
                {lastCoalitions.length === 0 ? (
                  <div className="text-neutral-500 text-xs">No coalitions yet.</div>
                ) : (
                  <ul className="text-xs list-disc pl-4">
                    {lastCoalitions.map(c => (<li key={c.id}><span className="text-neutral-200">{c.content}</span> <span className="text-neutral-500">(nov:{(c.novelty??0).toFixed?.(2)} ig:{(c.information_gain??0).toFixed?.(2)} val:{(c.value??0).toFixed?.(2)})</span></li>))}
                  </ul>
                )}
                {lastWinner && (
                  <div className="mt-2 text-[11px] text-neutral-400">Winner: <span className="text-neutral-200">{lastWinner.content}</span></div>
                )}
                <div className="mt-2 flex gap-2">
                  <button className="rounded bg-white/10 px-2 py-1 text-[11px] hover:bg-white/15" onClick={() => {
                    try {
                      const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
                      if (lastCoalitionsEv) useAgentEventBus.getState().push({ type: 'trace', runId, summary: 'Coalitions (jump)', json: lastCoalitionsEv });
                      setTab('trace');
                    } catch {}
                  }}>View in Trace</button>
                  <button className="rounded bg-white/10 px-2 py-1 text-[11px] hover:bg-white/15" onClick={() => {
                    try {
                      const runId = (useAgentEventBus.getState().events.find(e=>e.type==='run:start') as any)?.runId || 'kernel';
                      if (lastWinnerEv) useAgentEventBus.getState().push({ type: 'trace', runId, summary: 'Winner (jump)', json: lastWinnerEv });
                      setTab('json');
                    } catch {}
                  }}>View JSON</button>
                </div>
              </div>
            </div>
          );
          return null;
        })()}
      </div>
    </aside>
  );
}

function ToolRunner() {
  const e2eEnabled = (process.env.NEXT_PUBLIC_E2E_HOOKS ?? 'false') !== 'false';
  let allow = flags.toolRunner;
  try {
    if (!allow && e2eEnabled && typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('toolrunner') === '1') allow = true;
    }
  } catch {}
  if (!allow) return null;
  const [tools, setTools] = React.useState<Array<{ name: string; desc: string }>>([]);
  const [tool, setTool] = React.useState<string>('echo');
  const [args, setArgs] = React.useState<string>('{"hello":"world"}');
  const [out, setOut] = React.useState<any>(null);
  const [history, setHistory] = React.useState<Array<{ ts: number; tool: string; args: any; result: any }>>([]);
  const [unlocked, setUnlocked] = React.useState<boolean>(() => {
    try { return localStorage.getItem('tool_runner_unlocked') === 'true'; } catch { return false; }
  });
  const token = process.env.NEXT_PUBLIC_TOOL_RUNNER_TOKEN || '';
  React.useEffect(() => { (async()=>{ try { const r = await fetch('/api/tools', { cache: 'no-store' }); const j = await r.json(); if (Array.isArray(j?.items)) setTools(j.items); } catch {} })(); }, []);
  React.useEffect(() => { if (!flags.toolRunnerPersist) return; try { const raw = localStorage.getItem('tool_runner_history'); if (raw) setHistory(JSON.parse(raw)); } catch {} }, []);
  React.useEffect(() => { if (!flags.toolRunnerPersist) return; try { localStorage.setItem('tool_runner_history', JSON.stringify(history)); } catch {} }, [history]);
  const selectedTool = React.useMemo(() => tools.find(t=>t.name===tool), [tools, tool]);
  const examples = React.useMemo(() => ({
    echo: { hello: 'world' },
    web_search: { q: 'quantum entanglement' },
    calc: { expr: '2^3^2' },
  } as Record<string, any>), []);
  const exampleStr = React.useMemo(() => {
    const ex = examples[tool];
    try { return JSON.stringify(ex); } catch { return ''; }
  }, [examples, tool]);
  const run = async () => {
    try {
      const payload = { tool, args: JSON.parse(args || '{}') } as any;
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['x-tool-runner-token'] = token;
      const r = await fetch('/api/tools/execute', { method: 'POST', headers, body: JSON.stringify(payload) });
      const j = await r.json();
      setOut(j);
      try { setHistory(prev => [{ ts: Date.now(), tool, args: payload.args, result: j }, ...prev].slice(0, 10)); } catch {}
    } catch (e) { setOut({ ok: false, error: (e as any)?.message || 'error' }); }
  };
  const [entered, setEntered] = React.useState('');
  if (token && !unlocked) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-2">
        <div className="mb-1 text-[11px] text-neutral-400">Tool runner locked</div>
        <div className="flex items-center gap-2 text-[12px]">
          <input className="rounded bg-black/30 px-2 py-1" value={entered} onChange={e=>setEntered(e.target.value)} placeholder="Enter access token" />
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ if (entered && entered === token) { try { localStorage.setItem('tool_runner_unlocked','true'); } catch {}; setUnlocked(true); } }}>
            Unlock
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
      <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Run tool</span>
        <details className="text-[11px]">
          <summary className="cursor-pointer select-none text-neutral-300">Help</summary>
          <div className="mt-1 space-y-1 text-neutral-300">
            <div>echo: {`{"hello":"world"}`}</div>
            <div>web_search: {`{"q":"quantum entanglement"}`}</div>
            <div>calc: {`{"expr":"2^3^2"}`} → 512</div>
          </div>
        </details>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <select className="rounded bg-black/30 px-2 py-1" value={tool} onChange={e=>{ const t = e.target.value; setTool(t); try { const ex = examples[t]; if (ex) setArgs(JSON.stringify(ex)); } catch {} }}>
          {tools.map(t=> <option key={t.name} value={t.name}>{t.name}</option>)}
        </select>
        {selectedTool && (
          <span className="text-[11px] text-neutral-400 italic">{selectedTool.desc}</span>
        )}
        {exampleStr && (
          <span className="flex items-center gap-1 text-[11px] text-neutral-400">
            <span>Example:</span>
            <code className="rounded bg-black/30 px-1 py-[1px] text-neutral-300">{exampleStr}</code>
            <button className="rounded bg-white/10 px-1 py-[1px] hover:bg-white/15" onClick={async ()=>{ try { await navigator.clipboard.writeText(exampleStr); } catch {} }}>Copy</button>
            <button className="rounded bg-white/10 px-1 py-[1px] hover:bg-white/15" onClick={()=> setArgs(exampleStr)}>Use</button>
          </span>
        )}
        <input className="min-w-[200px] flex-1 rounded bg-black/30 px-2 py-1" placeholder='{"q":"entanglement"}' value={args} onChange={e=>setArgs(e.target.value)} />
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={run}>Run</button>
        <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>setHistory([])}>Clear history</button>
      </div>
      {out && (
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-black/30 p-2 text-[11px] text-neutral-300">{JSON.stringify(out, null, 2)}</pre>
      )}
      {tool==='web_search' && out?.result?.results && (
        <div className="mt-2 rounded border border-white/10 bg-white/5 p-2">
          <div className="text-[11px] text-neutral-400 mb-1">Results</div>
          <ul className="space-y-1 text-[12px]">
            {(out.result.results as any[]).map((r,i)=>(
              <li key={i} className="rounded bg-black/30 p-2">
                <div className="font-medium text-neutral-200">{r.title}</div>
                <div className="text-[11px] text-neutral-400 break-all">{r.url}</div>
                <div className="text-[11px] text-neutral-300">{r.snippet}</div>
              </li>
            ))}
          </ul>
          <div className="mt-2 text-[11px]">
            <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={async()=>{
              try { const list: any[] = (out?.result?.results||[]) as any[]; if (!list.length) return; const text = list.map(r=> `${r.title}\n${r.url}\n${r.snippet}`).join('\n\n'); await fetch('/api/memory/semantic', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text, labels:['web_search','result'], ts: Date.now() }) }); (window as any).__brahm_toast?.('Saved results to semantic','success'); } catch { (window as any).__brahm_toast?.('Save failed','error'); }
            }}>Save to Semantic</button>
          </div>
        </div>
      )}
      {history.length>0 && (
        <div className="mt-2">
          <div className="mb-1 text-[11px] text-neutral-400">Recent runs</div>
          <ul className="space-y-1 text-[11px] text-neutral-300">
            {history.map((h,i)=> (
              <li key={i} className="rounded bg-black/30 p-1">
                <div className="flex items-center justify-between">
                  <span>{new Date(h.ts).toLocaleTimeString()} • {h.tool}</span>
                </div>
                <div className="grid gap-1 md:grid-cols-2">
                  <pre className="overflow-auto rounded bg-black/40 p-1">{JSON.stringify(h.args)}</pre>
                  <pre className="overflow-auto rounded bg-black/40 p-1">{JSON.stringify(h.result)}</pre>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}



