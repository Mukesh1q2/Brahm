"use client";

import React from 'react';
import { useGlobalWorkspace } from '@/store/globalWorkspace';

export default function QuantumMetricsDashboard() {
  const { metrics, phiEstimate, attention, resetMetrics } = useGlobalWorkspace();
  const avgCorrelation = metrics.entUpdates > 0 ? metrics.correlationSum / metrics.entUpdates : 0;
  const total = Math.max(0, metrics.measurements);
  const p0 = total > 0 ? metrics.outcomes.zero / total : 0;
  const p1 = total > 0 ? metrics.outcomes.one / total : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button className="px-3 py-1 rounded border border-white/15 bg-white/5 hover:bg-white/10 text-xs" onClick={resetMetrics}>Clear metrics</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Measurements */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-gray-400">Measurements</div>
          <div className="mt-1 text-lg font-semibold">{metrics.measurements}</div>
          <div className="mt-3 text-xs text-gray-400">Outcomes</div>
          <div className="mt-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-300"><span>|0⟩</span><span>{metrics.outcomes.zero} ({(p0*100).toFixed(0)}%)</span></div>
            <div className="h-2 rounded bg-white/10 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${p0*100}%` }} /></div>
            <div className="flex items-center justify-between text-xs text-gray-300 mt-2"><span>|1⟩</span><span>{metrics.outcomes.one} ({(p1*100).toFixed(0)}%)</span></div>
            <div className="h-2 rounded bg-white/10 overflow-hidden"><div className="h-full bg-sky-400" style={{ width: `${p1*100}%` }} /></div>
          </div>
        </div>
        {/* Entanglement */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-gray-400">Entanglement</div>
          <div className="mt-1 text-lg font-semibold">Updates: {metrics.entUpdates}</div>
          <div className="text-xs text-gray-400 mt-2">Avg E(φ)</div>
          <div className="text-sm text-gray-300">{avgCorrelation.toFixed(3)}</div>
          <div className="mt-3 h-2 rounded bg-white/10 overflow-hidden" title={`Average correlation ${avgCorrelation.toFixed(3)}`}>
            <div className="h-full bg-purple-400" style={{ width: `${Math.max(0, Math.min(1, (avgCorrelation + 1) / 2)) * 100}%` }} />
          </div>
        </div>
        {/* Current state */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-gray-400">Current state</div>
          <div className="mt-1 text-lg font-semibold">Φ: {phiEstimate.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-2">Attention</div>
          <div className="mt-1 h-2 rounded bg-white/10 overflow-hidden" title={`Attention ${(attention*100).toFixed(0)}%`}>
            <div className="h-full bg-amber-400" style={{ width: `${Math.max(0, Math.min(1, attention)) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

