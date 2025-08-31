import { NextRequest, NextResponse } from 'next/server';
import { VedicSemanticSearch } from '@/lib/wisdom/semantic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const k = Math.max(1, Math.min(20, Number(url.searchParams.get('k') || 5)));
    if (!q) return NextResponse.json({ ok: false, error: 'missing q' }, { status: 400 });
    const engine = new VedicSemanticSearch();
    const res = await engine.search(q, k);
    return NextResponse.json({ ok: true, items: res.map(r => ({ ref: r.p.ref, text: r.p.text, theme: r.p.theme, score: r.score })) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

