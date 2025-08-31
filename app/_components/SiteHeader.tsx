"use client";

import React from 'react';
import { useModel } from "./ModelContext";
import { useEdition } from "@/store/edition";

function HeaderTelemetryStrip() {
  const [last, setLast] = React.useState<{ ok: boolean; status: number; ms: number | null; model?: string } | null>(null);
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const handler = (ev: any) => {
      const d = ev?.detail || {};
      setLast({ ok: !!d.ok, status: Number(d.status||0), ms: Number.isFinite(d.clientLatencyMs) ? d.clientLatencyMs : null, model: d.responseModel || d.requestModel });
      setCount(c => c + 1);
    };
    window.addEventListener('telemetry:request', handler as any);
    return () => window.removeEventListener('telemetry:request', handler as any);
  }, []);
  return (
    <div className="hidden md:flex items-center gap-2 text-[11px] text-gray-400">
      <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700">{count}</span>
      {last && (
        <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700">
          {last.model || '-'} • {last.ms != null ? `${last.ms.toFixed(0)}ms` : '-'} • {last.ok ? 'ok' : `err ${last.status}`}
        </span>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const { model, setModel, options, expert, setExpert, globalModelSelectorEnabled, region, setRegion, budgetUSDMonthly, spentUSDMonthToDate, setBudgetUSDMonthly, resetSpent } = useModel();
  const { edition } = useEdition();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  return (
    <header className="border-b border-gray-800/60 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        {/* Row 1: brand + nav + quick toggles */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-4 min-w-0">
            <a href="/" className="font-semibold text-white hover:text-brand-300 transition-colors whitespace-nowrap">Brahm</a>
            <nav className="hidden md:flex items-center gap-4 text-sm min-w-0">
              <a className="text-gray-300 hover:text-white" href="/console">Console</a>
              <a className="text-gray-300 hover:text-white" href="/console/timeline">Timeline</a>
              <a className="text-gray-300 hover:text-white" href="/console/consciousness">Consciousness</a>
              <a className="text-gray-300 hover:text-white" href="/console/auto-prs">Auto-PRs</a>
              <a className="text-gray-300 hover:text-white" href="/agents/org">Agents</a>
              <a className="text-gray-300 hover:text-white" href="/audit">Audit</a>
              <a className="text-gray-300 hover:text-white" href="/terminal">Terminal</a>
              <a className="text-gray-300 hover:text-white" href="/canvas">Canvas</a>
              <a className="text-gray-300 hover:text-white" href="/quantum">Quantum</a>
              <a className="text-white font-semibold" href="/panini">Panini</a>
              <a className="text-gray-300 hover:text-white" href="/education">Education</a>
              <a className="text-gray-300 hover:text-white" href="/faq">FAQ</a>
              <a className="text-gray-300 hover:text-white" href="/settings/keys">Settings</a>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {React.createElement(require('./ThemeToggle').default)}
            {React.createElement(require('./EditionToggle').default)}
            {mounted && edition === 'advanced' && (
              <a href="/docs/advanced" className="rounded bg-emerald-700/30 px-2 py-1 text-[10px] border border-emerald-500/50">Advanced Docs</a>
            )}
            {((process.env.NEXT_PUBLIC_CANARY ?? 'false') !== 'false') && (
              <span className="rounded bg-amber-600/30 px-2 py-1 text-[10px] border border-amber-500/50">Canary</span>
            )}
          </div>
        </div>

        {/* Row 2: expert toolbar */}
        {globalModelSelectorEnabled && (
          <div className="mt-2">
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={expert} onChange={(e)=>setExpert(e.target.checked)} />
                <span className="text-gray-300">Expert</span>
              </label>
            </div>
            {expert && (
              <div className="mt-2 -mx-4 px-4 py-2 bg-black/30 border-t border-gray-800/60">
                <div className="overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none]">
                  <div className="flex items-center gap-3 text-xs min-w-max">
                    <span className="text-gray-400 hidden md:inline">Default model (router may escalate)</span>
                    <label className="flex items-center gap-2">
                      <span className="text-gray-300">Model</span>
                      <select className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100" value={model} onChange={(e)=>setModel(e.target.value)}>
                        {options.map(m => (<option key={m} value={m}>{m}</option>))}
                      </select>
                    </label>
                    {/* Region selector */}
                    <label className="flex items-center gap-2">
                      <span className="text-gray-300">Region</span>
                      <select className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100" value={region || ''} onChange={(e)=>setRegion(e.target.value || null)}>
                        <option value="">auto</option>
                        <option value="us-east-1">us-east-1</option>
                        <option value="eu-west-1">eu-west-1</option>
                        <option value="ap-south-1">ap-south-1</option>
                      </select>
                    </label>
                    {/* Budget controls */}
                    <label className="flex items-center gap-2">
                      <span className="text-gray-300">Budget</span>
                      <input
                        className="w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100"
                        type="number"
                        step="0.01"
                        placeholder="$ / mo"
                        value={budgetUSDMonthly ?? ''}
                        onChange={(e)=>{
                          const v = e.target.value === '' ? null : Number(e.target.value);
                          setBudgetUSDMonthly(v);
                        }}
                      />
                    </label>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Spent: ${spentUSDMonthToDate.toFixed(4)}</span>
                      <button className="px-2 py-1 rounded bg-gray-900 border border-gray-700 hover:bg-gray-800" onClick={resetSpent} type="button">Reset</button>
                    </div>
                    <HeaderTelemetryStrip />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

