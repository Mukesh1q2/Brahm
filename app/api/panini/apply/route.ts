import { NextRequest, NextResponse } from 'next/server';
import { upsertRule, createLink } from '@/lib/paniniStore';

export const runtime = 'nodejs';

function parseProgram(program: string) {
  const lines = String(program || '').split(/\r?\n/);
  const applied: any[] = [];
  for (let raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    // rule A.1.1 : "text" {optional json}
    const mRule = line.match(/^rule\s+([^:]+?)\s*:\s*("[\s\S]*?")(\s*\{[\s\S]*\})?\s*$/i);
    if (mRule) {
      const id = mRule[1].trim();
      let text = '';
      try { text = JSON.parse(mRule[2]); } catch { text = mRule[2].replace(/^"|"$/g, ''); }
      let attrs: any = undefined;
      if (mRule[3]) {
        try { attrs = JSON.parse(mRule[3]); } catch { attrs = undefined; }
      }
      const res = upsertRule({ id, text, attrs });
      applied.push({ op: 'rule', result: res });
      continue;
    }
    // link precedes A.1.1 -> A.1.1a {json}
    const mLink = line.match(/^link\s+(\S+)\s+(\S+)\s*->\s*(\S+)(\s*\{[\s\S]*\})?\s*$/i);
    if (mLink) {
      const rel = mLink[1];
      const src = mLink[2];
      const dst = mLink[3];
      let attrs: any = undefined;
      if (mLink[4]) {
        try { attrs = JSON.parse(mLink[4]); } catch { attrs = undefined; }
      }
      const res = createLink({ rel, src, dst, attrs });
      applied.push({ op: 'link', result: res });
      continue;
    }
    // unknown: skip but record
    applied.push({ op: 'unknown', line });
  }
  return applied;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const program = String(body.program || '');
    const applied = parseProgram(program);
    return NextResponse.json({ applied }, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ detail: e?.message || 'bad request' }, { status: 400 });
  }
}

