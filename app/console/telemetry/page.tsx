"use client";

import React from 'react';

export default function TelemetryPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [limit, setLimit] = React.useState(100);
  const [auto, setAuto] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/telemetry/replay?limit=${limit}`);
      const j = await res.json();
      setItems(Array.isArray(j?.items) ? j.items.reverse() : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!auto) return;
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [auto, load]);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-3">Replay Telemetry</h1>
      <div className="flex items-center gap-3 mb-3 text-sm">
        <label className="flex items-center gap-2">
          <span>Limit</span>
          <input type="number" value={limit} min={10} max={1000} step={10} onChange={(e)=>setLimit(Number(e.target.value||100))} className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={auto} onChange={(e)=>setAuto(e.target.checked)} />
          <span>Auto refresh</span>
        </label>
        <button className="px-3 py-1 rounded bg-white/10 border border-white/15 hover:bg-white/15" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-3 py-2">Time</th>
              <th className="text-left px-3 py-2">Kind</th>
              <th className="text-left px-3 py-2">Page</th>
              <th className="text-left px-3 py-2">Section</th>
              <th className="text-left px-3 py-2">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">No events yet… visit /quantum and interact.</td>
              </tr>
            )}
            {items.map((it, idx) => (
              <tr key={idx} className="border-t border-white/10">
                <td className="px-3 py-2 text-gray-300">{new Date(it.ts).toLocaleTimeString()}</td>
                <td className="px-3 py-2">{String(it.kind)}</td>
                <td className="px-3 py-2 text-gray-400">{it.page || ''}</td>
                <td className="px-3 py-2 text-gray-400">{it.section || ''}</td>
                <td className="px-3 py-2 text-gray-400">
                  <pre className="whitespace-pre-wrap text-[12px] overflow-auto max-h-24">{JSON.stringify(it.metadata || {}, null, 2)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-gray-400">Tip: Enable the floating Telemetry panel with NEXT_PUBLIC_DEBUG_PANEL=true for in-app request logs.</div>
    </div>
  );
}

