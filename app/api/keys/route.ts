import { NextResponse } from 'next/server'
import { vaultRead, vaultWrite } from '../_utils/vault'

function devGuard() {
  const dev = process.env.NODE_ENV !== 'production' || (process.env.VAULT_DEMO === 'true')
  if (!dev) throw new Error('Keys route disabled in production')
}

const DEFAULT_KEYS = [
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'AZURE_OPENAI_API_KEY',
]

export async function GET(req: Request) {
  try {
    devGuard()
    const { searchParams } = new URL(req.url)
    const namesParam = searchParams.get('names') || ''
    const keys = namesParam
      ? namesParam.split(',').map(s => s.trim()).filter(Boolean)
      : DEFAULT_KEYS

    const set = new Set(DEFAULT_KEYS)
    const filtered = keys.filter(k => set.has(k))

    const results: { name: string; present: boolean }[] = []
    for (const name of filtered) {
      let present = false
      try {
        const valEnv = process.env[name]
        if (valEnv && String(valEnv).length > 0) {
          present = true
        } else {
          const val = await vaultRead(name)
          present = !!(val && val.length > 0)
        }
      } catch {
        present = false
      }
      results.push({ name, present })
    }
    return NextResponse.json({ ok: true, keys: results })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    devGuard()
    const body = await req.json().catch(() => ({}))
    const name = String(body.name || '')
    const value = String(body.value || '')
    if (!name) return NextResponse.json({ ok: false, error: 'missing name' }, { status: 400 })
    if (!DEFAULT_KEYS.includes(name)) return NextResponse.json({ ok: false, error: 'key not allowed' }, { status: 400 })
    const ok = await vaultWrite(name, value)
    return NextResponse.json({ ok, name })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}

