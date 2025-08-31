import { NextResponse } from 'next/server';
import type { AgentOrgResponse } from '@/types/agents';

export async function GET() {
  const resp: AgentOrgResponse = {
    root: {
      id: 'exec-1', role: 'Executive', name: 'Brahm Executive', budgetUSDMonthly: 500.0, spentUSDMonthToDate: 120.25, children: [
        { id: 'mgr-analytics', role: 'Manager', name: 'Analytics Manager', budgetUSDMonthly: 200, spentUSDMonthToDate: 80.2, children: [
          { id: 'wrk-report', role: 'Worker', name: 'Report Generator', budgetUSDMonthly: 50, spentUSDMonthToDate: 18.5 },
          { id: 'wrk-chart', role: 'Worker', name: 'Chart Synthesizer', budgetUSDMonthly: 40, spentUSDMonthToDate: 12.9 }
        ]},
        { id: 'mgr-code', role: 'Manager', name: 'Code Manager', budgetUSDMonthly: 200, spentUSDMonthToDate: 95.0, children: [
          { id: 'wrk-pr', role: 'Worker', name: 'PR Author', budgetUSDMonthly: 60, spentUSDMonthToDate: 30.0 },
          { id: 'wrk-test', role: 'Worker', name: 'Test Runner', budgetUSDMonthly: 30, spentUSDMonthToDate: 10.0 }
        ]}
      ]
    },
  };
  return NextResponse.json(resp);
}

