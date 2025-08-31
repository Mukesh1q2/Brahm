"use client";

import React from "react";

export default function AgentsDevPage() {
  const [goal, setGoal] = React.useState("Explore consciousness");
  const [steps, setSteps] = React.useState(6);
  const [events, setEvents] = React.useState<any[]>([]);
  const [connected, setConnected] = React.useState(false);

  const start = React.useCallback(() => {
    const src = new EventSource(`/api/agents/stream?goal=${encodeURIComponent(goal)}&steps=${steps}`);
    // @ts-ignore
    window.__agents_dev_stream__ = src;
    setConnected(true);
    setEvents([]);
    src.addEventListener("ev", (msg: MessageEvent) => {
      try { setEvents((prev) => [...prev, JSON.parse(msg.data)]); } catch {}
    });
    src.addEventListener("error", () => { try { src.close(); } catch {}; setConnected(false); });
  }, [goal, steps]);

  const stop = React.useCallback(() => {
    // @ts-ignore
    const src: EventSource | undefined = window.__agents_dev_stream__;
    if (src) { try { src.close(); } catch {}; }
    setConnected(false);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Agents Dev (SSE)</h1>
      <div className="flex items-center gap-2">
        <input className="border rounded px-2 py-1 w-[340px]" value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Goal" />
        <input className="border rounded px-2 py-1 w-[80px]" type="number" value={steps} min={1} max={20} onChange={e=>setSteps(Number(e.target.value))} />
        {!connected ? (
          <button className="px-3 py-1 rounded bg-purple-600 text-white" onClick={start}>Start</button>
        ) : (
          <button className="px-3 py-1 rounded bg-gray-300" onClick={stop}>Stop</button>
        )}
      </div>
      <div className="border rounded bg-white p-3">
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(events, null, 2)}</pre>
      </div>
    </div>
  );
}

