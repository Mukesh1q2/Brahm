import { NextRequest, NextResponse } from 'next/server';
import { listTools } from '@/lib/tools/execute';

export async function GET(_req: NextRequest) {
  try {
    return NextResponse.json({ items: listTools() });
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || 'error' }, { status: 500 });
  }
}

