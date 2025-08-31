"use client";

import React from 'react';
import axios from 'axios';
import type { AuditLog } from '@/types/audit';

export default function AuditPage() {
  const [items, setItems] = React.useState<AuditLog[]>([]);
  const [q, setQ] = React.useState('');
  const [actor, setActor] = React.useState('');
  const [action, setAction] = React.useState('');
  const [resource, setResource] = React.useState('');
  const [selected, setSelected] = React.useState<AuditLog | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/audit/logs');
      const all: AuditLog[] = res.data?.items || [];
      const norm = (s: any) => String(s ?? '').toLowerCase();
      const filtered = all.filter((x) =>
        (!q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase())) &&
        (!actor || norm(x.actor).includes(actor.toLowerCase())) &&
        (!action || norm(x.action).includes(action.toLowerCase())) &&
        (!resource || norm(x.resourceType).includes(resource.toLowerCase()))
      );
      setItems(filtered);
    } finally {
      setLoading(false);
    }
  }, [q, actor, action, resource]);

  React.useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="p-4 text-gray-100">
      <h1 className="text-xl font-semibold mb-3">Audit Logs</h1>

      <div className="flex flex-wrap gap-2 mb-3 text-sm">
        <input className="bg-gray-900 border border-gray-700 rounded px-2 py-1" placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} />
        <input className="bg-gray-900 border border-gray-700 rounded px-2 py-1" placeholder="Actor" value={actor} onChange={e=>setActor(e.target.value)} />
        <input className="bg-gray-900 border border-gray-700 rounded px-2 py-1" placeholder="Action" value={action} onChange={e=>setAction(e.target.value)} />
        <input className="bg-gray-900 border border-gray-700 rounded px-2 py-1" placeholder="Resource type" value={resource} onChange={e=>setResource(e.target.value)} />
        <button onClick={fetchLogs} className="px-3 py-1 bg-purple-700 rounded">Apply</button>
      </div>

      <div className="overflow-auto rounded border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-2 py-1">Time</th>
              <th className="text-left px-2 py-1">Actor</th>
              <th className="text-left px-2 py-1">Action</th>
              <th className="text-left px-2 py-1">Resource</th>
              <th className="text-left px-2 py-1">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-2 py-3 text-center text-gray-400">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-2 py-3 text-center text-gray-400">No results</td></tr>
            ) : items.map(it => (
              <tr key={it.id} className="hover:bg-white/5 cursor-pointer" onClick={() => setSelected(it)}>
                <td className="px-2 py-1">{new Date(it.ts).toLocaleString()}</td>
                <td className="px-2 py-1">{it.actor}</td>
                <td className="px-2 py-1">{it.action}</td>
                <td className="px-2 py-1">{it.resourceType}{it.resourceId ? `:${it.resourceId}` : ''}</td>
                <td className="px-2 py-1">{it.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded p-4 w-[520px]" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Audit detail</div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">Close</button>
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              <div><span className="text-gray-500">Time:</span> {new Date(selected.ts).toLocaleString()}</div>
              <div><span className="text-gray-500">Actor:</span> {selected.actor}</div>
              <div><span className="text-gray-500">Action:</span> {selected.action}</div>
              <div><span className="text-gray-500">Resource:</span> {selected.resourceType}{selected.resourceId ? `:${selected.resourceId}` : ''}</div>
              <div><span className="text-gray-500">Outcome:</span> {selected.outcome}</div>
              {selected.ip && <div><span className="text-gray-500">IP:</span> {selected.ip}</div>}
              <pre className="mt-2 bg-black/50 p-2 rounded border border-white/10 overflow-auto max-h-48">{JSON.stringify(selected.metadata || {}, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

