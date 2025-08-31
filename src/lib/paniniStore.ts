export type PaniniRule = { id: string; text: string; attrs?: Record<string, any> };
export type PaniniLink = { id?: number; rel: string; src: string; dst: string; attrs?: Record<string, any> };

type StoreShape = {
  rules: Map<string, PaniniRule>;
  links: PaniniLink[];
  nextLinkId: number;
  seeded: boolean;
};

function getStore(): StoreShape {
  const g = globalThis as any;
  if (!g.__panini_store) {
    g.__panini_store = { rules: new Map(), links: [], nextLinkId: 1, seeded: false } as StoreShape;
  }
  const store = g.__panini_store as StoreShape;
  if (!store.seeded) seed(store);
  return store;
}

function seed(store: StoreShape) {
  const addRule = (id: string, text: string, attrs?: any) => store.rules.set(id, { id, text, attrs });
  const addLink = (rel: string, src: string, dst: string, attrs?: any) => store.links.push({ id: store.nextLinkId++, rel, src, dst, attrs });
  // Minimal seed
  addRule('A.1.1', 'vṛddhir ādaiC');
  addRule('A.1.1a', 'echo of sample');
  addLink('precedes', 'A.1.1', 'A.1.1a', { strength: 1 });

  addRule('A.2.1', 'ikoyanaci');
  addRule('A.2.2', 'guna vrddhi context');
  addLink('precedes', 'A.2.1', 'A.2.2', { note: 'ordering' });

  addRule('A.6.1.77', 'iko yanaci');
  addRule('A.6.1.78', 'vṛddhi substitution');
  addLink('strengthens', 'A.6.1.77', 'A.6.1.78', { priority: 2 });

  store.seeded = true;
}

export function listRules(limit = 50, offset = 0): PaniniRule[] {
  const { rules } = getStore();
  const arr = Array.from(rules.values());
  return arr.slice(offset, offset + limit);
}

export function upsertRule(rule: PaniniRule): PaniniRule {
  const { rules } = getStore();
  rules.set(rule.id, rule);
  return rule;
}

export function getRuleById(id: string): PaniniRule | null {
  const { rules } = getStore();
  return rules.get(id) || null;
}

export function deleteRule(id: string): boolean {
  const store = getStore();
  const existed = store.rules.delete(id);
  // Optionally, remove links connected to this rule
  store.links = store.links.filter(l => l.src !== id && l.dst !== id);
  return existed;
}

export function listLinks(limit = 100, offset = 0): PaniniLink[] {
  const { links } = getStore();
  return links.slice(offset, offset + limit);
}

export function createLink(link: Omit<PaniniLink, 'id'>): PaniniLink {
  const store = getStore();
  const row: PaniniLink = { ...link, id: store.nextLinkId++ };
  store.links.push(row);
  return row;
}

export function deleteLinkByIdOrTuple(params: { id?: number; rel?: string; src?: string; dst?: string }): boolean {
  const store = getStore();
  const before = store.links.length;
  store.links = store.links.filter(l => {
    if (typeof params.id === 'number') return l.id !== params.id;
    if (params.rel && params.src && params.dst) return !(l.rel === params.rel && l.src === params.src && l.dst === params.dst);
    return true;
  });
  return store.links.length < before;
}

// Simple weighted shortest path (Dijkstra/A*)
export function shortestPath(start: string, goal: string, opts?: {
  defaultWeight?: number;
  relAllow?: string[];
  fields?: string[]; // weight fields used from link.attrs
  algorithm?: 'dijkstra' | 'astar';
  heuristic?: 'zero' | 'levenshtein' | 'dotpath';
}): { cost: number; path: string[] } | null {
  const store = getStore();
  const defaultW = Math.max(0, Number(opts?.defaultWeight ?? 1)) || 1;
  const allow = opts?.relAllow && opts.relAllow.length ? new Set(opts.relAllow.map(String)) : null;
  const fields = Array.isArray(opts?.fields) ? opts!.fields : [];
  const algo = opts?.algorithm || 'dijkstra';
  const heuristic = opts?.heuristic || 'zero';

  const neighbors = (u: string) => store.links
    .filter(l => l.src === u && (!allow || allow.has(l.rel)))
    .map(l => ({ v: l.dst, w: weight(l) }));

  function weight(l: PaniniLink): number {
    let w = defaultW;
    if (fields.length && l.attrs && typeof l.attrs === 'object') {
      let sum = 0, seen = 0;
      for (const f of fields) {
        const val = Number((l.attrs as any)[f]);
        if (Number.isFinite(val)) { sum += val; seen++; }
      }
      if (seen > 0) w = sum;
    }
    return Math.max(0, w);
  }

  function h(n: string): number {
    if (heuristic === 'levenshtein') return levenshtein(n, goal);
    if (heuristic === 'dotpath') return dotpathDistance(n, goal);
    return 0;
  }

  // A* (with h=0 reduces to Dijkstra)
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const open = new Set<string>();
  dist.set(start, 0); prev.set(start, null); open.add(start);

  while (open.size) {
    // pick node in open with smallest f = g + h
    let u: string | null = null;
    let bestF = Infinity;
    for (const n of open) {
      const g = dist.get(n) ?? Infinity;
      const f = g + (algo === 'astar' ? h(n) : 0);
      if (f < bestF) { bestF = f; u = n; }
    }
    if (!u) break;
    open.delete(u);
    if (u === goal) break;
    for (const { v, w } of neighbors(u)) {
      const alt = (dist.get(u) ?? Infinity) + w;
      if (alt < (dist.get(v) ?? Infinity)) {
        dist.set(v, alt);
        prev.set(v, u);
        open.add(v);
      }
    }
  }

  if (!dist.has(goal)) return null;
  const path: string[] = [];
  for (let cur: string | null = goal; cur != null; cur = prev.get(cur) ?? null) path.unshift(cur);
  const cost = dist.get(goal) ?? Infinity;
  return { cost, path };
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function dotpathDistance(a: string, b: string): number {
  // Very rough heuristic: difference in dot-separated segments
  const as = a.split('.');
  const bs = b.split('.');
  const len = Math.max(as.length, bs.length);
  let diff = 0;
  for (let i = 0; i < len; i++) if (as[i] !== bs[i]) diff++;
  return diff;
}

