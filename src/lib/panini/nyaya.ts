export type NyayaCategory = 'pramana' | 'hetu' | 'drstanta' | 'upanaya' | 'nigamana';

export type Proposition = {
  text: string;
  category: NyayaCategory;
};

export type CheckResult = {
  ok: boolean;
  issues: string[];
};

export function checkNyaya(steps: Proposition[]): CheckResult {
  const issues: string[] = [];
  const hasConclusion = steps.some(s => s.category === 'nigamana');
  if (!hasConclusion) issues.push('Missing conclusion (nigamana)');
  return { ok: issues.length === 0, issues };
}

