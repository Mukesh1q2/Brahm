export type ReplayEvent = {
  ts: number; // epoch ms
  kind: string; // e.g., 'page:open', 'lesson:start'
  page?: string;
  section?: string | null;
  app?: string;
  user?: string | null;
  metadata?: Record<string, any>;
};

export type ReplayBatch = {
  events: ReplayEvent[];
};

export type ReplayList = {
  total: number;
  items: ReplayEvent[];
};

