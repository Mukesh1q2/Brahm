export type PolicyEvent = {
  actor?: string;
  action: string;
  resource?: string;
  outcome: 'allow' | 'deny' | 'warn' | 'info';
  reason?: string;
  meta?: Record<string, any>;
};

export async function logPolicyEvent(ev: PolicyEvent) {
  try {
    await fetch('/api/policy/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ev),
    });
  } catch {}
}

