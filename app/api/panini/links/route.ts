import { NextRequest, NextResponse } from 'next/server';
import { listLinks } from '@/lib/paniniStore';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = Math.max(1, Math.min(4000, Number(sp.get('limit') || 200)));
  const offset = Math.max(0, Number(sp.get('offset') || 0));
  const rows = listLinks(limit, offset);
  return NextResponse.json(rows);
}

