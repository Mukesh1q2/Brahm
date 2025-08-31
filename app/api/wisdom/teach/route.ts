import { NextRequest, NextResponse } from 'next/server';
import { UniversalVedicTeacher } from '@/lib/wisdom/teacher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const svabhava = url.searchParams.get('svabhava') || undefined;
    const ashrama = url.searchParams.get('ashrama') || undefined;
    if (!q) return NextResponse.json({ ok: false, error: 'missing q' }, { status: 400 });
    const teach = new UniversalVedicTeacher();
    const out = await teach.teach(q, { svabhava, ashrama });
    return NextResponse.json({ ok: true, result: out });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

