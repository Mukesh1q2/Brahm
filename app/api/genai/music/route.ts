import { NextRequest, NextResponse } from 'next/server'

function makeSineWaveWavBase64(durationSec=1, freq=440, sampleRate=16000) {
  const samples = durationSec * sampleRate
  const data = new Uint8Array(44 + samples*2)
  const view = new DataView(data.buffer)
  function writeStr(off: number, s: string) { for (let i=0;i<s.length;i++) data[off+i] = s.charCodeAt(i) }
  function write32(off: number, v: number) { view.setUint32(off, v, true) }
  function write16(off: number, v: number) { view.setUint16(off, v, true) }
  writeStr(0, 'RIFF'); write32(4, 36 + samples*2); writeStr(8, 'WAVE')
  writeStr(12, 'fmt '); write32(16, 16); write16(20, 1); write16(22, 1); write32(24, sampleRate)
  write32(28, sampleRate*2); write16(32, 2); write16(34, 16)
  writeStr(36, 'data'); write32(40, samples*2)
  let off = 44
  for (let i=0;i<samples;i++) {
    const t = i / sampleRate
    const s = Math.sin(2*Math.PI*freq*t)
    const v = Math.max(-1, Math.min(1, s))
    const iv = Math.round(v * 32767)
    write16(off, iv); off += 2
  }
  return Buffer.from(data).toString('base64')
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const prompt = String(body.prompt || '')
  if (!prompt) return NextResponse.json({ error: 'missing prompt' }, { status: 400 })
  const b64 = makeSineWaveWavBase64(1, 523.25)
  return NextResponse.json({ audio: `data:audio/wav;base64,${b64}`, prompt })
}

