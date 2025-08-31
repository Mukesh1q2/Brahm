// Types for console timeline events and evolution states
export type EvolutionState = 'planned' | 'running' | 'succeeded' | 'failed';

export interface ConsoleEvent {
  id: string;
  ts: string; // ISO
  kind: string; // e.g., 'plan', 'retrieve', 'debate', 'validate', 'answer'
  title: string;
  summary?: string;
  state?: EvolutionState;
  costUSD?: number;
  meta?: Record<string, any>;
}

export interface ConsoleEventResponse {
  total: number;
  items: ConsoleEvent[];
}

