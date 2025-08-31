import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const diffs = Array.isArray(body?.diffs) ? body.diffs : [];
    const code = typeof body?.code === 'string' ? body.code : '';
    // Very simple heuristic: if code/diffs contain 'error' fail; else pass
    const text = [code, ...diffs.map((d:any)=>`${d.original||''}\n${d.modified||''}`)].join('\n');
    const hasError = /\berror\b|\bfail\b/i.test(text);
    const score = hasError ? 0.2 : 0.9;
    const details = {
      cases: [
        { name: 'lint', pass: !/\btodo\b/i.test(text) },
        { name: 'typecheck', pass: !/TS\d{3,5}/.test(text) },
        { name: 'unit', pass: !hasError },
      ],
    };
    return NextResponse.json({ ok: true, passed: !hasError, score, details }, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || 'bad request' }, { status: 400 });
  }
}

