import { NextRequest, NextResponse } from 'next/server'

type Step = { action: string; query?: string; docId?: string; excerpt?: string; citation?: string }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const q = String(body.question || '')
  const hops = Number(body.hops || 2)
  if (!q) return NextResponse.json({ error: 'missing question' }, { status: 400 })
  const steps: Step[] = []
  steps.push({ action: 'search', query: q })
  for (let i=0;i<Math.max(1, hops-1);i++) {
    steps.push({ action: 'read', docId: `doc_${i+1}`, excerpt: `Excerpt related to ${q}`, citation: `https://example.com/${encodeURIComponent(q)}#${i}` })
  }
  const answer = `Stubbed multi-hop answer for: ${q}`
  return NextResponse.json({ steps, answer, citations: steps.filter(s=>s.citation).map(s=>s.citation) })
}

