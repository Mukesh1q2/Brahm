import { NextResponse } from 'next/server';
import type { AuditLogResponse, AuditLog } from '@/types/audit';

export async function GET() {
  const now = new Date();
  const items: AuditLog[] = [
    { id: '1', ts: now.toISOString(), actor: 'system', action: 'read', resourceType: 'secret', resourceId: 'openai_key', outcome: 'DENY', ip: '127.0.0.1', metadata: { reason: 'missing policy' } },
    { id: '2', ts: new Date(now.getTime() - 60_000).toISOString(), actor: 'alice', action: 'write', resourceType: 'project', resourceId: 'brahm', outcome: 'ALLOW', ip: '10.0.0.5' },
    { id: '3', ts: new Date(now.getTime() - 120_000).toISOString(), actor: 'service:console', action: 'read', resourceType: 'dataset', resourceId: 'memories', outcome: 'ALLOW' },
  ];
  const resp: AuditLogResponse = { total: items.length, items };
  return NextResponse.json(resp);
}

