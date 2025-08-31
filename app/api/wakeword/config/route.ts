import { NextResponse } from 'next/server'

// NOTE: This endpoint returns only file paths; do not return any secret keys.
// For production Porcupine Web SDK, prefer a short-lived token flow instead.
export async function GET() {
  const enabled = (process.env.NEXT_PUBLIC_WAKEWORD_ENABLED ?? 'false') !== 'false';
  if (!enabled) return NextResponse.json({ enabled: false });
  // These files should be hosted under /public/porcupine and replaced with real models/keywords
  return NextResponse.json({
    enabled: true,
    modelPath: '/porcupine/porcupine_model.pv',
    keywordPath: '/porcupine/hey-brahm.ppn'
  });
}

