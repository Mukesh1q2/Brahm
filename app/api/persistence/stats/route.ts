import { NextResponse } from 'next/server';
import { getStats } from '../../_lib/pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const s = await getStats();
    return NextResponse.json(s);
  } catch {
    return NextResponse.json({ diary_count: 0, semantic_count: 0 });
  }
}
