"use client";
import { useState } from "react";

type ReasoningTracePanelProps = {
  summary?: string;
  json?: unknown;
};

export default function ReasoningTracePanel({ summary, json }: ReasoningTracePanelProps) {
  const [view, setView] = useState<"summary" | "json">("summary");

  return (
    <div className="h-full w-full space-y-3" data-testid="reasoning-panel">
      <div className="inline-flex gap-2 rounded-lg bg-white/5 p-1 backdrop-blur">
        <button
          onClick={() => setView("summary")}
          data-testid="reasoning-tab-summary"
          aria-pressed={view === "summary"}
          className={`px-3 py-1 rounded-md ${view === "summary" ? "bg-white/10" : "hover:bg-white/5"}`}
        >
          Summary
        </button>
        <button
          onClick={() => setView("json")}
          data-testid="reasoning-tab-json"
          aria-pressed={view === "json"}
          className={`px-3 py-1 rounded-md ${view === "json" ? "bg-white/10" : "hover:bg-white/5"}`}
        >
          JSON
        </button>
      </div>

      {view === "summary" ? (
        <div data-testid="reasoning-summary" className="text-sm leading-relaxed text-neutral-200/90 selectable">
          <div data-testid="trace-item">
            <span data-testid="trace-summary">{summary ?? "No summary available."}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-400">Trace JSON</div>
            <button
              type="button"
              className="copy-button"
              onClick={() => { try { navigator.clipboard.writeText(JSON.stringify(json ?? { message: "No trace" }, null, 2)); } catch {} }}
            >Copy</button>
          </div>
          {/* Lightweight visualization if kernel events present */}
          {(() => {
            try {
              const obj: any = json || {};
              if (obj?.measurement?.phi_value != null) {
                const v = Math.max(0, Math.min(10, Number(obj.measurement.phi_value)));
                return (
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-400">Phi</div>
                    <div className="h-2 w-full rounded bg-white/10">
                      <div className="h-2 rounded bg-purple-500" style={{ width: `${(v/10)*100}%` }} />
                    </div>
                  </div>
                );
              }
              if (obj?.state?.attention_strength != null) {
                const a = Math.max(0, Math.min(1, Number(obj.state.attention_strength)));
                return (
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-400">Attention</div>
                    <div className="h-2 w-full rounded bg-white/10">
                      <div className="h-2 rounded bg-blue-500" style={{ width: `${a*100}%` }} />
                    </div>
                  </div>
                );
              }
              if (obj?.assessment?.stability_score != null) {
                const s = Math.max(0, Math.min(1, Number(obj.assessment.stability_score)));
                const risk = String(obj.assessment.risk_level || 'low');
                const color = risk==='critical' ? 'bg-red-600' : risk==='high' ? 'bg-orange-500' : risk==='elevated' ? 'bg-yellow-500' : 'bg-emerald-500';
                return (
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-400">Stability <span className={`ml-2 rounded px-1 text-[10px] ${color} text-white`}>{risk}</span></div>
                    <div className="h-2 w-full rounded bg-white/10">
                      <div className={`h-2 rounded ${color}`} style={{ width: `${s*100}%` }} />
                    </div>
                  </div>
                );
              }
              if (obj?.evaluation?.frameworks?.dharmic?.principles) {
                const p = obj.evaluation.frameworks.dharmic.principles as Record<string, number>;
                const recs = obj.evaluation.recommendations as string[] | undefined;
                return (
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-400">Ethics (Dharmic)</div>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(p).map(([k,v])=> (
                        <div key={k} className="space-y-1">
                          <div className="text-[10px] text-neutral-500">{k}</div>
                          <div className="h-1.5 w-full rounded bg-white/10">
                            <div className="h-1.5 rounded bg-rose-400" style={{ width: `${Math.max(0, Math.min(1, Number(v)))*100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {recs && recs.length>0 && (
                      <ul className="list-disc pl-5 text-[10px] text-neutral-400">
                        {recs.map((r,i)=>(<li key={i}>{r}</li>))}
                      </ul>
                    )}
                  </div>
                );
              }
              if (obj?.components && typeof obj?.score === 'number') {
                const total = Math.max(0, Math.min(1, Number(obj.score)));
                const comps = obj.components as Record<string, number>;
                return (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="text-xs text-neutral-400">Salience</div>
                      <div className="h-2 w-full rounded bg-white/10">
                        <div className="h-2 rounded bg-emerald-500" style={{ width: `${total*100}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(comps).map(([k,v])=> (
                        <div key={k} className="space-y-1">
                          <div className="text-[10px] text-neutral-500">{k}</div>
                          <div className="h-1.5 w-full rounded bg-white/10">
                            <div className="h-1.5 rounded bg-emerald-400" style={{ width: `${Math.max(0, Math.min(1, Number(v)))*100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch {}
            return null;
          })()}
          {/* Sparklines for series (phi/binding) */}
          {(() => {
            try {
              const obj: any = json || {};
              const series = obj.series as { phi?: number[], binding?: number[] } | undefined;
              if (!series) return null;
              const makeSpark = (arr?: number[], max=10, color='bg-neutral-400') => (
                <div className="flex items-end gap-[1px] h-6">{(arr||[]).map((v,i)=>{
                  const n = Math.max(0, Math.min(max, v)); const h = 2 + (n/max)*22;
                  return <div key={i} className={`${color}`} style={{ width: 3, height: h }} />
                })}</div>
              );
              return (
                <div className="space-y-2">
                  {series.phi && series.phi.length>1 && (
                    <div>
                      <div className="text-[10px] text-neutral-500">Phi trend</div>
                      {makeSpark(series.phi, 10, 'bg-purple-400')}
                    </div>
                  )}
                  {series.binding && series.binding.length>1 && (
                    <div>
                      <div className="text-[10px] text-neutral-500">Binding coherence</div>
                      {makeSpark(series.binding, 1, 'bg-blue-400')}
                    </div>
                  )}
                </div>
              );
            } catch {}
            return null;
          })()}
          {/* Tool impact visualization */}
          {(() => {
            try {
              const obj: any = json || {};
              const imp = obj?.consciousness_impact;
              if (imp && typeof imp.phi_change === 'number') {
                const pc = Math.max(0, Math.min(1, (imp.phi_change + 1) / 2));
                return (
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-400">Tool impact (Δphi)</div>
                    <div className="h-2 w-full rounded bg-white/10">
                      <div className="h-2 rounded bg-pink-500" style={{ width: `${pc*100}%` }} />
                    </div>
                  </div>
                );
              }
            } catch {}
            return null;
          })()}
          <pre
            data-testid="reasoning-json"
            className="max-h-[50vh] overflow-auto rounded-lg bg-black/40 p-3 text-xs text-neutral-300 selectable"
          >
            {JSON.stringify(json ?? { message: "No trace" }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

