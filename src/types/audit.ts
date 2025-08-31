// Types for audit logs
export type AuditOutcome = 'ALLOW' | 'DENY' | 'ERROR';

export interface AuditLog {
  id: string;
  ts: string; // ISO timestamp
  actor: string; // user/service name
  action: string; // e.g., 'read', 'write', 'deploy'
  resourceType: string; // e.g., 'secret', 'project', 'dataset'
  resourceId?: string;
  ip?: string;
  outcome: AuditOutcome;
  metadata?: Record<string, any>;
}

export interface AuditLogResponse {
  total: number;
  items: AuditLog[];
}

