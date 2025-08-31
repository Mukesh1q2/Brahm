export type SutraNode = {
  id: string;
  label: string; // Sanskrit
  gloss?: string;
  category?: string; // sandhi, samasa, etc.
};

export type SutraEdge = {
  from: string;
  to: string;
  relation: 'precedes' | 'blocks' | 'enables';
};

export type RuleGraph = {
  nodes: SutraNode[];
  edges: SutraEdge[];
};

export type GraphValidation = {
  ok: boolean;
  errors: string[];
};

export function validateGraph(g: RuleGraph): GraphValidation {
  const errors: string[] = [];
  const ids = new Set(g.nodes.map(n=>n.id));
  for (const e of g.edges) {
    if (!ids.has(e.from)) errors.push(`edge.from missing: ${e.from}`);
    if (!ids.has(e.to)) errors.push(`edge.to missing: ${e.to}`);
  }
  return { ok: errors.length === 0, errors };
}

