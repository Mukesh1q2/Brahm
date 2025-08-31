import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const deps = Array.isArray(body?.deps) ? body.deps : []
  const allowed = Array.isArray(body?.allowedLicenses) ? new Set(body.allowedLicenses) : new Set(['MIT','Apache-2.0','BSD-3-Clause'])
  const results = deps.map((d:any)=> ({ name: String(d.name||''), license: String(d.license||''), ok: allowed.has(String(d.license||'')) }))
  return NextResponse.json({ results })
}

