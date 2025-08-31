export type MetadataEnvelope = {
  type: 'metadata';
  // High-level reasoning or summary for the Right Panel
  reasoning?: any; // string or JSON object
  // Optional code diff to render in Diff tab
  diff?:
    | { original?: string; modified: string; language?: string }
    | string;
  // Which tab to auto-open in the Right Panel
  tab?: 'summary' | 'trace' | 'json' | 'diff' | 'memory' | 'council';
  // Telemetry and context
  telemetry?: any;
  consciousness?: any;
  memory_refs?: any;
  workspace?: any;
  // New: confidence and uncertainty estimates
  confidence?: number; // 0..1
  uncertainty?: number; // 0..1
  // New: ethics decision payload for UI (MessageBubble)
  ethics?: {
    decision: 'allow' | 'revise' | 'veto';
    reasons?: string[];
    principles?: string[];
    revision?: { text: string };
  } | null;
};

