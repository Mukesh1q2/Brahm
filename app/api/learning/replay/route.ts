import { NextRequest, NextResponse } from 'next/server'
import type { ReplayItem } from '@/types/learning'
import { promises as fs } from 'fs'
import path from 'path'

// In-memory cache; persisted to .data/replay.json for dev durability
const g: any = globalThis as any
if (!g.__replay__) g.__replay__ = [] as ReplayItem[]
const DATA_DIR = path.join(process.cwd(), '.data')
const DATA_FILE = path.join(DATA_DIR, 'replay.json')

async function readFromDisk(): Promise<ReplayItem[]> {
  try {
    const buf = await fs.readFile(DATA_FILE)
    const arr = JSON.parse(buf.toString()) as ReplayItem[]
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}
async function writeToDisk(items: ReplayItem[]): Promise<void> {
  try { await fs.mkdir(DATA_DIR, { recursive: true }) } catch {}
  try { await fs.writeFile(DATA_FILE, JSON.stringify(items).slice(0, 5_000_000)) } catch {}
}

export async function GET() {
  // Refresh cache from disk if empty
  if ((g.__replay__ as ReplayItem[]).length === 0) {
    try { g.__replay__ = await readFromDisk() } catch {}
  }
  const items = (g.__replay__ as ReplayItem[]).slice(-500).reverse()
  return NextResponse.json({ total: items.length, items })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}))
    const item: ReplayItem = {
      id: String(body.id || (crypto as any).randomUUID?.() || Date.now()),
      ts: new Date().toISOString(),
      input: String(body.input || ''),
      target: body.target ? String(body.target) : undefined,
      meta: body.meta && typeof body.meta === 'object' ? body.meta : undefined,
    }
    if (!item.input) return NextResponse.json({ ok: false, error: 'missing input' }, { status: 400 })
    g.__replay__.push(item)
    if (g.__replay__.length > 5000) g.__replay__ = g.__replay__.slice(-5000)
    // Fire-and-forget persistence
    writeToDisk(g.__replay__).catch(()=>{})
    return NextResponse.json({ ok: true, item })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}

