import { NextRequest, NextResponse } from 'next/server';
import { listRules } from '@/lib/paniniStore';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = Math.max(1, Math.min(2000, Number(sp.get('limit') || 100)));
  const offset = Math.max(0, Number(sp.get('offset') || 0));
  const rows = listRules(limit, offset);
  return NextResponse.json(rows);
}

