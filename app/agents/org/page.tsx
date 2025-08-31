"use client";

import React from 'react';
import axios from 'axios';
import type { AgentNode } from '@/types/agents';

function BudgetBar({ used = 0, total = 0 }: { used?: number; total?: number }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;
  return (
    <div className="w-40 h-2 bg-gray-700/50 rounded overflow-hidden">
      <div className="h-full bg-purple-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

function AgentTree({ node, depth = 0 }: { node: AgentNode; depth?: number }) {
  return (
    <div className="ml-3 border-l border-white/10 pl-3">
      <div className="flex items-center gap-2">
        <div className="text-xs uppercase text-gray-400">{node.role}</div>
        <div className="text-sm font-semibold">{node.name}</div>
        <BudgetBar used={node.spentUSDMonthToDate || 0} total={node.budgetUSDMonthly || 0} />
        <div className="text-[11px] text-gray-400">
          ${node.spentUSDMonthToDate?.toFixed(2) ?? '0.00'} / ${node.budgetUSDMonthly?.toFixed(2) ?? '0.00'}
        </div>
      </div>
      {node.children?.map((c) => (
        <AgentTree key={c.id} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function AgentsOrgPage() {
  const [root, setRoot] = React.useState<AgentNode | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchOrg = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/agents/org');
      setRoot(res.data?.root || null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchOrg(); }, [fetchOrg]);

  return (
    <div className="p-4 text-gray-100">
      <h1 className="text-xl font-semibold mb-3">Agents Org & Budgets</h1>
      {loading && <div className="text-gray-400 text-sm">Loading…</div>}
      {!loading && root && <AgentTree node={root} />}
      {!loading && !root && <div className="text-gray-400 text-sm">No data</div>}
    </div>
  );
}

