import { NextRequest, NextResponse } from 'next/server';
import { DreamSimulationEngine } from '@/lib/conscious/dream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const duration_ms = Number(body?.duration_ms ?? 1500);
    const dream = await new DreamSimulationEngine().enterDreamState(
      Number.isFinite(duration_ms) ? duration_ms : 1500,
    );
    return NextResponse.json({ ok: true, dream });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

