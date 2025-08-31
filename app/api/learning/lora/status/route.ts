import { NextRequest, NextResponse } from 'next/server'
import type { LoRAJob } from '@/types/learning'

const g: any = globalThis as any
if (!g.__lora_jobs__) g.__lora_jobs__ = [] as LoRAJob[]

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const id = sp.get('id') || ''
  if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 })
  const job = (g.__lora_jobs__ as LoRAJob[]).find(j => j.id === id)
  if (!job) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true, job })
}

