import { NextRequest, NextResponse } from 'next/server';
import { createLink, deleteLinkByIdOrTuple } from '@/lib/paniniStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const rel = String(body.rel || '').trim();
    const src = String(body.src || '').trim();
    const dst = String(body.dst || '').trim();
    const attrs = (body.attrs && typeof body.attrs === 'object') ? body.attrs : undefined;
    if (!rel || !src || !dst) return NextResponse.json({ detail: 'rel, src, dst required' }, { status: 400 });
    const saved = createLink({ rel, src, dst, attrs });
    return NextResponse.json(saved, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'bad request' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get('id');
  const rel = sp.get('rel') || undefined;
  const src = sp.get('src') || undefined;
  const dst = sp.get('dst') || undefined;
  const ok = deleteLinkByIdOrTuple({ id: id ? Number(id) : undefined, rel: rel || undefined, src, dst });
  if (!ok) return NextResponse.json({ detail: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

