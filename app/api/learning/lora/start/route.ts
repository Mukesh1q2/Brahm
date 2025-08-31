import { NextRequest, NextResponse } from 'next/server'
import type { LoRAJob } from '@/types/learning'

const g: any = globalThis as any
if (!g.__lora_jobs__) g.__lora_jobs__ = [] as LoRAJob[]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}))
    const id = String(body.id || `lora_${Math.random().toString(36).slice(2,10)}`)
    const job: LoRAJob = {
      id,
      createdAt: new Date().toISOString(),
      status: 'queued',
      model: String(body.model || 'local-llama'),
      datasetSize: Number(body.datasetSize || 0),
      epochs: Number(body.epochs || 3),
      learningRate: Number(body.learningRate || 1e-4),
    }
    g.__lora_jobs__.push(job)

    // simulate async
    setTimeout(() => {
      try {
        const j = (g.__lora_jobs__ as LoRAJob[]).find((x)=>x.id===id)
        if (!j) return
        j.status = 'running'
        j.loss = 0.42
        j.valLoss = 0.50
      } catch {}
    }, 500)
    setTimeout(() => {
      try {
        const j = (g.__lora_jobs__ as LoRAJob[]).find((x)=>x.id===id)
        if (!j) return
        j.status = 'succeeded'
        j.loss = 0.12
        j.valLoss = 0.20
        j.artifacts = { checkpointUrl: `/artifacts/${id}.safetensors` }
      } catch {}
    }, 1800)

    return NextResponse.json({ ok: true, job })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}

