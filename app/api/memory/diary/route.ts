import { NextRequest, NextResponse } from 'next/server';
import { insertDiarySafe, insertSemanticSafe } from '@/app/api/_lib/pg';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const text = String(body?.text || '');
    const ts = Number(body?.ts || Date.now());
    const ok = await insertDiarySafe({ role: String(body?.role || 'user'), text, ts });
    // Also store in semantic memory with labels
    await insertSemanticSafe({ text, labels: ['voice','transcript'], ts });
    if (!ok) return NextResponse.json({ ok: false, error: 'db_unavailable' }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
