export type ToolCall = { tool: string; args: any };

export type ToolResult = {
  ok: boolean;
  tool: string;
  args: any;
  duration_ms: number;
  result?: any;
  error?: string;
};

async function toolEcho(args: any): Promise<any> {
  return { echo: args };
}

async function toolWebSearch(args: { q?: string }): Promise<any> {
  const q = String(args?.q || '').slice(0, 200);
  // Stub results; replace with real search integration later
  const now = new Date().toISOString();
  return {
    query: q,
    results: [
      { title: `About ${q}`, url: `https://example.com/search?q=${encodeURIComponent(q)}`, snippet: `Stub result for ${q}` },
      { title: `${q} – overview`, url: `https://example.org/${encodeURIComponent(q)}`, snippet: `High-level overview for ${q}` },
    ],
    fetched_at: now,
  };
}

type ToolDef = { name: string; run: (args: any) => Promise<any>; desc: string };
const registry: Record<string, ToolDef> = {
  echo: { name: 'echo', run: toolEcho, desc: 'Returns the input args for debugging.' },
  web_search: { name: 'web_search', run: toolWebSearch, desc: 'Stub web search that returns sample results.' },
};

export function listTools(): Array<{ name: string; desc: string }> {
  return Object.values(registry).map(t => ({ name: t.name, desc: t.desc }));
}

export async function executeTool(call: ToolCall): Promise<ToolResult> {
  const start = Date.now();
  try {
    const def = registry[call.tool];
    if (!def) {
      return { ok: false, tool: call.tool, args: call.args, duration_ms: Date.now() - start, error: 'unknown_tool' };
    }
    const result = await def.run(call.args);
    return { ok: true, tool: call.tool, args: call.args, duration_ms: Date.now() - start, result };
  } catch (e: any) {
    return { ok: false, tool: call.tool, args: call.args, duration_ms: Date.now() - start, error: e?.message || 'tool_error' };
  }
}

// --- Calc tool (safe expression evaluator) ---
// Supports +, -, *, /, parentheses, and unary minus. Numbers only.
function parseNumber(str: string, i: number) {
  let j = i;
  while (j < str.length && /[0-9.]/.test(str[j])) j++;
  const s = str.slice(i, j);
  if (!s || s === '.' || /\.\./.test(s)) throw new Error('invalid_number');
  return { value: parseFloat(s), next: j };
}
function evalExpr(input: string): number {
  const s = input.replace(/\s+/g, '');
  let i = 0;
  function parsePrimary(): number {
    if (s[i] === '+') { i++; return parseFactor(); }
    if (s[i] === '-') { i++; return -parseFactor(); }
    if (s[i] === '(') { i++; const v = parseExpression(); if (s[i] !== ')') throw new Error('missing_close'); i++; return v; }
    if (!/[0-9.]/.test(s[i] || '')) throw new Error('unexpected_token');
    const { value, next } = parseNumber(s, i); i = next; return value;
  }
  function parseFactor(): number {
    // Right-associative exponentiation
    let v = parsePrimary();
    while (s[i] === '^') {
      i++;
      const r = parseFactor();
      v = Math.pow(v, r);
    }
    return v;
  }
  function parseTerm(): number {
    let v = parseFactor();
    while (i < s.length && (s[i] === '*' || s[i] === '/')) {
      const op = s[i++];
      const r = parseFactor();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function parseExpression(): number {
    let v = parseTerm();
    while (i < s.length && (s[i] === '+' || s[i] === '-')) {
      const op = s[i++];
      const r = parseTerm();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  let out = parseExpression();
  if (i !== s.length) throw new Error('trailing_input');
  // Clamp non-finite or extreme outputs into a safe numeric range
  const LIMIT = 1e12;
  if (!Number.isFinite(out)) out = LIMIT;
  if (out > LIMIT) out = LIMIT;
  if (out < -LIMIT) out = -LIMIT;
  return out;
}
async function toolCalc(args: { expr?: string }) {
  const expr = String(args?.expr ?? '').slice(0, 200);
  if (!expr) throw new Error('missing_expr');
  const value = evalExpr(expr);
  return { expr, value };
}

// Register calc tool
registry['calc'] = { name: 'calc', run: toolCalc as any, desc: 'Evaluates a safe arithmetic expression (numbers, + - * /, parentheses).' };
