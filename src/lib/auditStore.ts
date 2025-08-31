export type AuditEntry = {
  id: number;
  timestamp: string;
  user?: string;
  tool?: string;
  command?: string;
  stage?: string;
  allowed?: boolean;
  reason?: string;
  analysis?: any;
  sandbox?: any;
};

let seq = 1;
const store: AuditEntry[] = [];

export function recordAudit(e: Omit<AuditEntry, 'id'|'timestamp'> & Partial<Pick<AuditEntry,'timestamp'>>) {
  const entry: AuditEntry = {
    id: seq++,
    timestamp: e.timestamp || new Date().toISOString(),
    user: e.user,
    tool: e.tool,
    command: e.command,
    stage: e.stage,
    allowed: e.allowed,
    reason: e.reason,
    analysis: e.analysis,
    sandbox: e.sandbox,
  };
  store.unshift(entry);
  // keep last 2000
  if (store.length > 2000) store.length = 2000;
  return entry;
}

export function latest(limit = 50) {
  return store.slice(0, limit);
}

export type QueryFilters = {
  page?: number;
  page_size?: number;
  allowed?: '' | 'true' | 'false';
  stage?: string;
  user?: string;
  tool?: string;
  model?: string; // optional, may be embedded in analysis
  q?: string; // search in command or reason
  start?: string; // iso
  end?: string; // iso
  order?: 'asc' | 'desc';
};

export function queryAudit(filters: QueryFilters) {
  let rows = store.slice();
  const { allowed, stage, user, tool, q, start, end, order } = filters;
  if (allowed === 'true') rows = rows.filter(r => r.allowed === true);
  if (allowed === 'false') rows = rows.filter(r => r.allowed === false);
  if (stage) rows = rows.filter(r => (r.stage||'').toLowerCase() === stage.toLowerCase());
  if (user) rows = rows.filter(r => (r.user||'').toLowerCase().includes(user.toLowerCase()));
  if (tool) rows = rows.filter(r => (r.tool||'').toLowerCase().includes(tool.toLowerCase()));
  if (q) rows = rows.filter(r => (r.command||'').toLowerCase().includes(q.toLowerCase()) || (r.reason||'').toLowerCase().includes(q.toLowerCase()));
  if (start) rows = rows.filter(r => r.timestamp >= start);
  if (end) rows = rows.filter(r => r.timestamp <= end);
  const total = rows.length;
  const page = Math.max(1, Number(filters.page || 1));
  const pageSize = Math.max(1, Math.min(100, Number(filters.page_size || 20)));
  if ((order||'desc') === 'asc') rows.sort((a,b)=> a.timestamp.localeCompare(b.timestamp));
  else rows.sort((a,b)=> b.timestamp.localeCompare(a.timestamp));
  const startIdx = (page - 1) * pageSize;
  const entries = rows.slice(startIdx, startIdx + pageSize);
  return { total, entries };
}

