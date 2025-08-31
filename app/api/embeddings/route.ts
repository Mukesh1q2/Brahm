import { NextRequest, NextResponse } from 'next/server'

function hash(s: string): number {
  let h = 2166136261
  for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h += (h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24) }
  return h >>> 0
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const texts = Array.isArray(body.texts) ? body.texts.map(String) : []
  const dim = Number(body.dim || 8)
  const out = texts.map((t:string)=>{
    const h0 = hash(t)
    const v = new Array(dim).fill(0).map((_,i)=> (((h0>>>((i%4)*8)) & 0xff) / 255))
    return v
  })
  return NextResponse.json({ vectors: out, dim })
}

