import { NextRequest, NextResponse } from 'next/server';
import { listRules } from '@/lib/paniniStore';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get('q') || '').toLowerCase();
    const limit = Math.max(1, Math.min(2000, Number(sp.get('limit') || 50)));
    const all = listRules(5000, 0);
    const filtered = !q
      ? all
      : all.filter(r => r.id.toLowerCase().includes(q) || String(r.text || '').toLowerCase().includes(q));
    return NextResponse.json(filtered.slice(0, limit), { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ detail: e?.message || 'bad request' }, { status: 400 });
  }
}

