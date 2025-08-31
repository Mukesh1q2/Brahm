// Types for agent org and budgets
export interface AgentNode {
  id: string;
  role: 'Executive' | 'Manager' | 'Worker';
  name: string;
  budgetUSDMonthly?: number;
  spentUSDMonthToDate?: number;
  children?: AgentNode[];
}

export interface AgentOrgResponse {
  root: AgentNode;
}

