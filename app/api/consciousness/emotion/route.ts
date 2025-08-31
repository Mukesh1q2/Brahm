import { NextRequest, NextResponse } from 'next/server';
import { EmotionSynthesizer } from '@/lib/conscious/emotion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function num(v: any, d = 0) { const n = Number(v); return Number.isFinite(n) ? n : d; }
function bool(v: any) { if (v == null) return false; const s = String(v).toLowerCase(); return s === '1' || s === 'true' || s === 'yes'; }

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ctx = {
      text: url.searchParams.get('text') || undefined,
      requires_compassion: bool(url.searchParams.get('compassion')),
      requires_courage: bool(url.searchParams.get('courage')),
      stress: num(url.searchParams.get('stress'), undefined as any),
      curiosity: num(url.searchParams.get('curiosity'), undefined as any),
      harmony: num(url.searchParams.get('harmony'), undefined as any),
    } as any;
    const weights = {
      sattva: num(url.searchParams.get('sattva'), NaN),
      rajas: num(url.searchParams.get('rajas'), NaN),
      tamas: num(url.searchParams.get('tamas'), NaN),
    };
    const hasWeights = Object.values(weights).some((v) => Number.isFinite(v));
    const es = new EmotionSynthesizer(hasWeights ? (weights as any) : undefined);
    const emotion = await es.synthesize(ctx);
    return NextResponse.json({ ok: true, emotion, weights: es.getWeights() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

