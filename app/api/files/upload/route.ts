import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function ocrImageDevLang(file: File, lang: string): Promise<string | null> {
  // Dev-only OCR using tesseract.js; if anything fails, return null
  if (process.env.NODE_ENV === 'production') return null;
  try {
    const { createWorker } = await import('tesseract.js');
    const ab = await file.arrayBuffer();
    const buf = Buffer.from(ab);
    const worker = await createWorker();
    await (worker as any).loadLanguage?.(lang || 'eng');
    if (typeof (worker as any).initialize === 'function') {
      await (worker as any).initialize(lang || 'eng');
    } else if (typeof (worker as any).reinitialize === 'function') {
      await (worker as any).reinitialize(lang || 'eng');
    }
    const { data } = await (worker as any).recognize(buf);
    await (worker as any).terminate();
    const txt = (data?.text || '').trim();
    return txt || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ detail: "multipart/form-data expected" }, { status: 400 });
    }
    const form = await req.formData();
    const f = form.get("file") as File | null;
    if (!f) return NextResponse.json({ detail: "file missing" }, { status: 400 });
    const lang = String(form.get('lang') || 'eng');

    let text = '';
    if (f.type?.startsWith('image/')) {
      // Try OCR if image; otherwise stub
      text = (await ocrImageDevLang(f, lang)) || '';
    }
    if (!text) {
      // Fallback stub text
      text = `OCR-STUB: Parsed ${f.name} (${f.size} bytes) and found 2 lines.`;
    }

    const headers = new Headers({
      "x-llm-model": req.headers.get("x-model") || "auto",
      "x-llm-cost-usd": "0.0000",
      "x-server-latency-ms": String(Math.floor(Math.random() * 15) + 5),
    });
    return new NextResponse(
      JSON.stringify({
        filename: f.name,
        size: f.size,
        mime: f.type || "application/octet-stream",
        text,
        tokens: Math.ceil(text.length / 4),
      }),
      { status: 200, headers }
    );
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "OCR failed" }, { status: 500 });
  }
}

