import { NextRequest, NextResponse } from 'next/server';
import { upsertRule, getRuleById } from '@/lib/paniniStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}));
    const id = String(body.id || '').trim();
    const text = String(body.text || '');
    const attrs = (body.attrs && typeof body.attrs === 'object') ? body.attrs : undefined;
    if (!id) return NextResponse.json({ detail: 'id required' }, { status: 400 });
    const saved = upsertRule({ id, text, attrs });
    return NextResponse.json(saved, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'bad request' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = String(sp.get('id') || '').trim();
  if (!id) return NextResponse.json({ detail: 'id required' }, { status: 400 });
  const r = getRuleById(id);
  if (!r) return NextResponse.json({ detail: 'not found' }, { status: 404 });
  return NextResponse.json(r);
}

