"use client";

import React from 'react';
import axios from 'axios';
import CodeDiff from '@/app/_components/CodeDiff';
import type { PullRequestMeta } from '@/types/prs';

export default function AutoPRsPage() {
  const [items, setItems] = React.useState<PullRequestMeta[]>([]);
  const [selected, setSelected] = React.useState<PullRequestMeta | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [msg, setMsg] = React.useState<string>("");

  const fetchPRs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/prs');
      setItems(res.data?.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchPRs(); }, [fetchPRs]);

  async function createDemoPR() {
    setCreating(true);
    setMsg("");
    try {
      const res = await axios.post('/api/prs', {
        title: 'demo: wire Auto-PRs workspace',
        summary: 'Demonstration PR generated locally. Replace with provider integration to GitHub/GitLab.',
        diffs: [
          { filePath: 'docs/auto-prs.md', original: '# Auto PRs\n', modified: '# Auto PRs\n\nThis is a demo PR.\n', language: 'markdown' }
        ]
      });
      const list = res.data?.items || [];
      setItems(list);
      setSelected(list[0] || null);
      setMsg('Created demo PR');
      setTimeout(()=>setMsg(''), 1500);
    } catch (e: any) {
      setMsg(e?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-4 text-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Auto-PRs</h1>
        <div className="flex items-center gap-2 text-xs">
          {msg && <span className="text-gray-400">{msg}</span>}
          <button onClick={fetchPRs} className="px-2 py-1 bg-white/10 border border-white/10 rounded hover:bg-white/15">Refresh</button>
          <button onClick={createDemoPR} disabled={creating} className="px-2 py-1 bg-purple-700 rounded disabled:opacity-50">Create demo PR</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1 border border-white/10 rounded">
          <div className="p-2 bg-white/5 text-xs text-gray-300">Pull Requests</div>
          <div className="max-h-[60vh] overflow-auto">
            {loading && <div className="p-2 text-xs text-gray-400">Loading…</div>}
            {!loading && items.map(pr => (
              <div key={pr.id} className={`p-2 cursor-pointer hover:bg-white/5 ${selected?.id === pr.id ? 'bg-white/10' : ''}`} onClick={() => setSelected(pr)}>
                <div className="text-sm font-semibold">{pr.id} — {pr.title}</div>
                <div className="text-[11px] text-gray-400">{pr.author} • {pr.status} • {new Date(pr.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="p-2 text-xs text-gray-400">No PRs yet. Create a demo PR or connect a provider.</div>
            )}
          </div>
        </div>
        <div className="md:col-span-2 border border-white/10 rounded p-3">
          {!selected && <div className="text-sm text-gray-400">Select a PR to view details</div>}
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{selected.title}</div>
                  <div className="text-[12px] text-gray-400">{selected.id} • {selected.author} • {selected.status}</div>
                </div>
                {selected.url && <a className="text-xs text-cyan-300 hover:underline" href={selected.url} target="_blank">Open</a>}
              </div>
              {selected.summary && <div className="text-sm text-gray-200">{selected.summary}</div>}
              <div className="space-y-4">
                {(selected.diffs || []).map((d, idx) => (
                  <div key={idx}>
                    <div className="text-xs text-gray-400 mb-1">{d.filePath}</div>
                    <CodeDiff original={d.original} modified={d.modified} language={d.language} height="260px" />
                  </div>
                ))}
                {(!selected.diffs || selected.diffs.length === 0) && (
                  <div className="text-xs text-gray-400">No diffs provided</div>
                )}
              </div>
              <div className="mt-4 rounded bg-white/5 border border-white/10 p-3 text-xs text-gray-300">
                <div className="font-semibold mb-1">How to wire real Auto-PRs</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide a provider integration (e.g., GitHub) on the server. Keep tokens server-only.</li>
                  <li>Store API keys using the Settings page (/settings/keys) in development.</li>
                  <li>Replace /api/prs GET/POST to proxy to your provider and map to PullRequestMeta.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

