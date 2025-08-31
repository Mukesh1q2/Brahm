export type AgentLifecycle =
  | 'plan'
  | 'retrieve'
  | 'debate'
  | 'validate'
  | 'answer'
  | 'tool'
  | 'patch';

export type AgentEvent =
  | { type: "run:start"; runId: string; agent: string; timestamp: number }
  | { type: "run:end"; runId: string; success: boolean; timestamp: number }
  | { type: "trace"; runId: string; summary: string; json: unknown }
  | { type: "patch"; runId: string; original: string; modified: string; language?: string }
  | { type: "lifecycle"; runId: string; stage: AgentLifecycle; detail?: unknown; ts?: number };

