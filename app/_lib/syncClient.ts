export type SyncConversation = { id: string; title: string; createdAt: string; updatedAt: string };
export type SyncMessage = { id: string; conversationId: string; role: 'user'|'assistant'|'system'; content: string; meta?: any; createdAt: string; updatedAt: string };

export type SyncClientOptions = {
  base?: string; // default '' (same origin)
  enabled?: boolean; // gated by NEXT_PUBLIC_PERSIST_REMOTE
  getAuthToken?: () => string | null; // optional bearer token provider
};

export class SyncClient {
  private base = '';
  private enabled = false;
  private getAuthToken?: () => string | null;
  constructor(opts?: SyncClientOptions) {
    this.base = opts?.base || '';
    this.enabled = !!opts?.enabled;
    this.getAuthToken = opts?.getAuthToken;
  }
  isEnabled() { return this.enabled; }

  private headers(): Record<string,string> {
    const h: Record<string,string> = { 'Content-Type': 'application/json' };
    try {
      const t = this.getAuthToken?.();
      if (t) h['Authorization'] = `Bearer ${t}`;
    } catch {}
    return h;
  }

  async upsertConversation(c: SyncConversation): Promise<void> {
    if (!this.enabled) return;
    await fetch(`${this.base}/api/conversations`, { method: 'POST', headers: this.headers(), body: JSON.stringify(c) });
  }
  async upsertMessage(m: SyncMessage): Promise<void> {
    if (!this.enabled) return;
    await fetch(`${this.base}/api/messages`, { method: 'POST', headers: this.headers(), body: JSON.stringify(m) });
  }
  async listConversations(since: number): Promise<SyncConversation[]> {
    if (!this.enabled) return [];
    const r = await fetch(`${this.base}/api/conversations?since=${since}`, { headers: this.headers() });
    if (!r.ok) return [];
    const j = await r.json().catch(()=>({ items: [] }));
    return j.items || [];
  }
  async listMessages(conversationId: string, since: number): Promise<SyncMessage[]> {
    if (!this.enabled) return [];
    const r = await fetch(`${this.base}/api/messages?conversationId=${encodeURIComponent(conversationId)}&since=${since}`, { headers: this.headers() });
    if (!r.ok) return [];
    const j = await r.json().catch(()=>({ items: [] }));
    return j.items || [];
  }
}

