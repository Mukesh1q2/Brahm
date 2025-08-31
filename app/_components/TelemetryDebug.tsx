"use client";

import React from "react";

type TelemetryEvent = {
  ts: number;
  type: "request" | "request-complete";
  detail: any;
};

const FLAG = (process.env.NEXT_PUBLIC_DEBUG_PANEL ?? "false") !== "false";

export default function TelemetryDebug() {
  const [open, setOpen] = React.useState(false);
  const [events, setEvents] = React.useState<TelemetryEvent[]>([]);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (!FLAG) return;
    // Expose global toggles for palette/dev
    (window as any).__toggleDebugPanel = () => setOpen((o: boolean) => !o);
    (window as any).__openDebugPanel = () => setOpen(true);
  }, []);

  React.useEffect(() => {
    if (!FLAG) return;
    function onReq(e: any) {
      if (paused) return;
      const ev: TelemetryEvent = { ts: Date.now(), type: "request", detail: e?.detail || {} };
      setEvents((arr) => [ev, ...arr].slice(0, 200));
    }
    function onDone(e: any) {
      if (paused) return;
      const ev: TelemetryEvent = { ts: Date.now(), type: "request-complete", detail: e?.detail || {} };
      setEvents((arr) => [ev, ...arr].slice(0, 200));
    }
    window.addEventListener("telemetry:request", onReq as any);
    window.addEventListener("telemetry:request-complete", onDone as any);
    return () => {
      window.removeEventListener("telemetry:request", onReq as any);
      window.removeEventListener("telemetry:request-complete", onDone as any);
    };
  }, [paused]);

  if (!FLAG) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-40 px-3 py-2 text-xs rounded-md bg-white/10 border border-white/15 hover:bg-white/20"
      >
        Telemetry
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 h-full w-[380px] bg-[#0b0b0c] border-l border-white/10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <div className="text-sm font-semibold">Telemetry Debug</div>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1 text-white/70">
                  <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} />
                  Pause
                </label>
                <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => setEvents([])}>Clear</button>
                <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => setOpen(false)}>Close</button>
              </div>
            </div>
            <div className="p-2 h-[calc(100%-40px)] overflow-auto text-[12px] text-white/80 space-y-2">
              {events.length === 0 && (
                <div className="text-white/50">No telemetry yet…</div>
              )}
              {events.map((ev, idx) => (
                <div key={idx} className="border border-white/10 rounded p-2">
                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>{new Date(ev.ts).toLocaleTimeString()} • {ev.type}</span>
                    <span>{String(ev.detail?.status ?? '')}</span>
                  </div>
                  <pre className="mt-1 whitespace-pre-wrap text-white/80 overflow-auto selectable">{JSON.stringify(ev.detail, null, 2)}</pre>
                  <div className="mt-1 text-right">
                    <button className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px]" onClick={() => { try { navigator.clipboard.writeText(JSON.stringify(ev.detail, null, 2)); } catch {} }}>Copy detail</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

