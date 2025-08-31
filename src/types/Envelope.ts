export type MetadataEnvelope = {
  type: 'metadata';
  reasoning?: any; // string or JSON object
  diff?:
    | { original?: string; modified: string; language?: string }
    | string;
  tab?: 'summary' | 'trace' | 'json' | 'diff' | 'memory';
};

