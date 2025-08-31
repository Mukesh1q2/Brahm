import { NextResponse } from 'next/server'
import { vaultRead } from '@/app/api/_utils/vault'

function devGuard() {
  const dev = process.env.NODE_ENV !== 'production' || (process.env.VAULT_DEMO === 'true')
  if (!dev) throw new Error('Validation route disabled in production')
}

export async function GET() {
  try {
    devGuard()
    // resolve key from env then vault
    let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
    if (!apiKey) {
      try { apiKey = (await vaultRead('GEMINI_API_KEY')) || (await vaultRead('GOOGLE_API_KEY')) || '' } catch {}
    }
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No GEMINI_API_KEY/GOOGLE_API_KEY found' }, { status: 400 })
    const model = 'gemini-1.5-pro'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'hello' }] }] }) })
    const text = await res.text()
    if (!res.ok) return NextResponse.json({ ok: false, status: res.status, detail: text })
    return NextResponse.json({ ok: true, status: res.status })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 })
  }
}

