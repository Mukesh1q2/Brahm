"use client";

import React from 'react';
import axios from 'axios';
import type { ConsoleEvent } from '@/types/events';

function StateBadge({ state }: { state?: string }) {
  const color = state === 'succeeded' ? 'bg-green-700/50 border-green-600' : state === 'running' ? 'bg-blue-700/50 border-blue-600' : state === 'failed' ? 'bg-red-700/50 border-red-600' : 'bg-gray-700/50 border-gray-600';
  return <span className={`text-[11px] px-2 py-0.5 rounded border ${color}`}>{state || 'planned'}</span>;
}

export default function ConsoleTimelinePage() {
  const [items, setItems] = React.useState<ConsoleEvent[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/console/events');
      setItems(res.data?.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return (
    <div className="p-4 bg-[var(--app-bg)] text-[var(--app-fg)]">
      <h1 className="text-xl font-semibold mb-3">Console Timeline</h1>
      <div className="space-y-3">
        {loading && <div className="text-[12px] opacity-70">Loading…</div>}
        {!loading && items.length === 0 && <div className="text-[12px] opacity-70">No events</div>}
        {!loading && items.map((ev) => (
          <div key={ev.id} className="flex items-start gap-3">
            <div className="mt-1 w-2 h-2 rounded-full bg-[var(--accent)]" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">{ev.title}</div>
                <StateBadge state={ev.state} />
                {typeof ev.costUSD === 'number' && (
                  <span className="text-[11px] opacity-70">${ev.costUSD.toFixed(2)}</span>
                )}
                <span className="text-[11px] opacity-60">{new Date(ev.ts).toLocaleTimeString()}</span>
              </div>
              {ev.summary && (
                <div className="mt-1 text-[13px] rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] p-3">
                  {ev.summary}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

