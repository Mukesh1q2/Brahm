// Types for replay buffer and LoRA jobs

export type ReplayItem = {
  id: string;
  ts: string; // ISO
  input: string;
  target?: string;
  meta?: Record<string, any>;
};

export type ReplayList = {
  total: number;
  items: ReplayItem[];
};

export type LoRAJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type LoRAJob = {
  id: string;
  createdAt: string; // ISO
  status: LoRAJobStatus;
  model: string;
  datasetSize?: number;
  epochs?: number;
  learningRate?: number;
  loss?: number;
  valLoss?: number;
  artifacts?: { checkpointUrl?: string };
};

