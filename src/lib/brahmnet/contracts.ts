export type ConsciousnessInsight = { summary: string; phi?: number; tags?: string[] };

export interface BrahmNetNode {
  id(): string;
  share(insight: ConsciousnessInsight): Promise<{ accepted: boolean; receipt: string }>;
  receive(): Promise<ConsciousnessInsight[]>;
}

export class LocalBrahmNetNode implements BrahmNetNode {
  private inbox: ConsciousnessInsight[] = [];
  constructor(private nodeId = `node_${Math.random().toString(36).slice(2, 8)}`) {}
  id() { return this.nodeId; }
  async share(insight: ConsciousnessInsight) {
    this.inbox.push({ ...insight, tags: [...(insight.tags || []), 'local'] });
    return { accepted: true, receipt: `${this.nodeId}-${Date.now()}` };
  }
  async receive() { const items = this.inbox.slice(); this.inbox = []; return items; }
}

