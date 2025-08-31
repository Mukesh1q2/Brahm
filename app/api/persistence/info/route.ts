import { NextResponse } from 'next/server';
import { isPgAvailable, getDsnInfoSafe } from '../../_lib/pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ok = await isPgAvailable();
    const info = getDsnInfoSafe();
    return NextResponse.json({ ok, ...info });
  } catch {
    const info = getDsnInfoSafe();
    return NextResponse.json({ ok: false, ...info });
  }
}
