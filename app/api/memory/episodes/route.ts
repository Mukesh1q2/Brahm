import { NextResponse } from 'next/server'
import { listEpisodes } from '../../_lib/pg'
import { parseNumber, parseLabelsFromParams, parseLabelsMode } from '../../_lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sp = url.searchParams
    const q = sp.get('q') || undefined
    const since = parseNumber(sp.get('since'))
    const phi_min = parseNumber(sp.get('phi_min'))
    const phi_max = parseNumber(sp.get('phi_max'))
    const limit = parseNumber(sp.get('limit'))
    const labels = parseLabelsFromParams(sp)
    const labelsMode = parseLabelsMode(sp)
    const opts: any = { q, since, phi_min, phi_max, limit, labels }
    if (labelsMode) opts.labelsMode = labelsMode
    const items = await listEpisodes(opts)
    return NextResponse.json({ items })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}

