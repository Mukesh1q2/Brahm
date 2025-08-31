export function parseNumber(v: string | null | undefined): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseNumberInRange(v: string | null | undefined, min: number, max: number): number | undefined {
  const n = parseNumber(v);
  if (n == null) return undefined;
  if (n < min || n > max) return undefined;
  return n;
}

export function parseLabelsFromParams(sp: URLSearchParams, key = 'label'): string[] | undefined {
  const ls = sp.getAll(key).map(s => s.trim()).filter(Boolean);
  return ls.length ? Array.from(new Set(ls)) : undefined;
}

export function parseLabelsMode(sp: URLSearchParams, key: string = 'mode'): 'and' | 'or' | undefined {
  const raw = (sp.get(key) || sp.get('labels_mode') || '').toLowerCase().trim();
  if (raw === 'and') return 'and';
  if (raw === 'or') return 'or';
  return undefined;
}

