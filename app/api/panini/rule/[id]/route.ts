import { NextRequest, NextResponse } from 'next/server';
import { deleteRule, getRuleById } from '@/lib/paniniStore';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const r = getRuleById(id);
  if (!r) return NextResponse.json({ detail: 'not found' }, { status: 404 });
  return NextResponse.json(r);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const ok = deleteRule(id);
  if (!ok) return NextResponse.json({ detail: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

