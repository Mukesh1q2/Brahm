// Types for pull requests with diffs
export type PRStatus = 'open' | 'merged' | 'closed' | 'draft' | 'failing';

export interface PRDiff {
  filePath: string;
  original?: string;
  modified: string;
  language?: string;
}

export interface PullRequestMeta {
  id: string;           // e.g., #42
  title: string;
  author: string;
  status: PRStatus;
  createdAt: string;    // ISO
  url?: string;         // external link
  summary?: string;
  diffs?: PRDiff[];     // subset of files
}

export interface PRListResponse {
  total: number;
  items: PullRequestMeta[];
}

