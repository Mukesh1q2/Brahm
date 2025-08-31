"use client";

import React from "react";
import { useRightPanelData } from "@/store/rightPanelData";
import { useRightPanelStore } from "@/store/rightPanelStore";
import CodeDiff from "../CodeDiff";

export default function RightPanel() {
  const { tab, setTab } = useRightPanelStore();
  const data = useRightPanelData();
  const tabs: { key: any; label: string; show: boolean }[] = [
    { key: 'summary', label: 'Summary', show: !!data.summary },
    { key: 'council', label: 'Council', show: !!data.council },
    { key: 'trace', label: 'Trace', show: !!data.json },
    { key: 'diff', label: 'Diff', show: !!data.codeDiff },
    { key: 'json', label: 'JSON', show: !!data.json },
  ];
  const visibleTabs = tabs.filter(t => t.show);
  if (visibleTabs.length === 0) return null;

  return (
    <section className="border-t border-white/5 bg-[#0b0b0b]">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 px-3 pt-2 text-xs">
          {visibleTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-2 py-1 rounded ${tab === t.key ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
            >{t.label}</button>
          ))}
        </div>
        <div className="px-3 py-2">
          {tab === 'summary' && data.summary && (
            <div className="text-sm text-neutral-300 whitespace-pre-wrap">{data.summary}</div>
          )}
          {tab === 'trace' && data.json && (
            <pre className="text-xs text-neutral-300 whitespace-pre-wrap overflow-auto max-h-64">{JSON.stringify(data.json, null, 2)}</pre>
          )}
          {tab === 'json' && data.json && (
            <pre className="text-xs text-neutral-300 whitespace-pre-wrap overflow-auto max-h-64">{JSON.stringify(data.json, null, 2)}</pre>
          )}
          {tab === 'diff' && data.codeDiff && (
            <div className="border border-white/10 rounded overflow-hidden">
              <CodeDiff original={data.codeDiff.original} modified={data.codeDiff.modified} language={data.codeDiff.language || 'plaintext'} />
            </div>
          )}
          {tab === 'council' && data.council && (
            <>
              <CouncilView />
              <WorkspaceTimeline />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function CouncilView() {
  const { council } = useRightPanelData();
  const [compact, setCompact] = React.useState(false);
  if (!council) return null;
  const votes = council.votes || {};
  const spotlight = council.spotlight || '';
  const voteVals = Object.values(votes).map((v:any)=>Number(v)).filter(n=>Number.isFinite(n));
  const avg = voteVals.length ? (voteVals.reduce((a,b)=>a+b,0)/voteVals.length) : 0;
  const maxAbsDelta = voteVals.length ? Math.max(...voteVals.map(v=>Math.abs(v-avg))) : 1;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-400">Spotlight: <span className="text-neutral-200 font-medium">{spotlight || '—'}</span></div>
        <label className="text-xs text-neutral-400 inline-flex items-center gap-1"><input type="checkbox" checked={compact} onChange={e=>setCompact(e.target.checked)} /> Compact</label>
      </div>
      <div className={`grid grid-cols-1 ${compact? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-2`}>
        {council.trace.map((t, i) => {
          const v = Number(votes[t.name] ?? NaN);
          const showV = Number.isFinite(v);
          const delta = showV ? (v - avg) : 0;
          const barPct = Math.min(100, Math.max(0, (Math.abs(delta) / (maxAbsDelta || 1)) * 100));
          const barColor = delta >= 0 ? 'bg-emerald-500' : 'bg-rose-500';
          const short = compact ? (t.output.length > 120 ? t.output.slice(0, 117) + '…' : t.output) : t.output;
          return (
            <div key={`${t.name}:${i}`} className={`rounded border p-2 ${t.name===spotlight ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}>
              <div className="text-xs flex items-center justify-between">
                <span className="font-semibold text-neutral-200 truncate mr-2" title={t.name}>{t.name}</span>
                <span className="text-neutral-400 ml-2 whitespace-nowrap">
                  {showV ? v.toFixed(2) : ''}
                  {showV && (
                    <span className={`ml-1 text-[10px] ${delta>=0 ? 'text-emerald-400' : 'text-rose-400'}`}>{delta>=0? '+':''}{delta.toFixed(2)}</span>
                  )}
                </span>
              </div>
              {showV && (
                <div className="mt-1 h-1.5 w-full rounded bg-white/10" title={`Δ from avg: ${delta.toFixed(3)}`}>
                  <div className={`h-1.5 rounded ${barColor}`} style={{ width: `${barPct}%` }} />
                </div>
              )}
              <div className={`mt-1 text-xs text-neutral-300 ${compact? 'line-clamp-3' : 'whitespace-pre-wrap'}`}>{short}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkspaceTimeline() {
  const [items, setItems] = React.useState<Array<{ ts: number; spotlight: string | null; curiosity: number | null }>>([]);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('workspace_timeline');
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) setItems(arr.slice(-50).reverse());
    } catch {}
  }, []);
  if (!items.length) return null;
  return (
    <div className="mt-3 border-t border-white/10 pt-2">
      <div className="text-xs text-neutral-400 mb-1">Workspace timeline</div>
      <div className="max-h-40 overflow-auto text-xs space-y-1">
        {items.map((it, idx) => (
          <div key={`${it.ts}:${idx}`} className="flex items-center justify-between border-b border-white/5 pb-1">
            <div className="text-neutral-300">spotlight: <span className="font-medium">{it.spotlight || '—'}</span> · curiosity: {(Number(it.curiosity||0)).toFixed(2)}</div>
            <div className="text-[10px] text-neutral-500">{new Date(it.ts).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

