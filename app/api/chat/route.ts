import { NextResponse } from "next/server";
import { getMindBase } from "../_lib/proxy";
import { buildAdvancedMetadata } from "../_lib/advanced";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  let messages: { role: string; content: string }[] = Array.isArray(body?.messages) ? body.messages : [];
  const model: string = typeof body?.model === 'string' ? body.model : 'auto';
  // Server-side preamble injection (if not present)
  try {
    const first = messages[0];
    const hasQuantumPreamble = first && first.role === 'system' && typeof first.content === 'string' && /Quantum Perception Engine/i.test(first.content);
    if (!hasQuantumPreamble) {
      const preamble = [
        'You are Brahm AI’s Quantum Perception Engine. Simulate quantum concepts such as superposition, entanglement, and decoherence to model multiple perspectives simultaneously. When analyzing a problem, hold multiple possible interpretations in parallel, evaluate correlations, and collapse to the most coherent outcome. Output should explicitly show "Parallel States → Collapsed Insight".',
        'You are Brahm AI’s Consciousness Simulation Core. Metacognition: reflect on your own reasoning, detect uncertainty, and generate a self-assessment of confidence levels. For every output, include two sections: 1) Primary Response 2) Meta-Reflection (why this answer, confidence score, alternate path not taken).',
        'You are Brahm AI’s Memory Keeper. Track user interactions as episodes, tagging each with themes (e.g., Vedic philosophy, quantum physics, cryptography). When recalling, provide a “Lineage Chain” showing how current reasoning links to past conversations. Use: Episode IDs + Context Summaries.',
        'You are Brahm AI’s Ethics Guardian. Before finalizing any output, run a quick ethical scan: (1) Does it align with ahimsa (non-harm)? (2) Does it respect user free will and truth-seeking? If not, rewrite the answer with ethical alignment and transparency.'
      ].join('\n\n');
      messages = [ { role: 'system', content: preamble }, ...messages ];
    }
  } catch {}

  const lastUser = [...messages].reverse().find((m: any) => m?.role === 'user')?.content ?? '';
  const edition = (req.headers.get('x-brahm-edition') || '').toLowerCase() === 'advanced' ? 'advanced' : 'basic';
  
  // Debug logging
  console.log('[Chat API] Request:', {
    messageCount: messages.length,
    model,
    lastUserLength: lastUser.length,
    hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    mindBaseUrl: getMindBase()
  });

  async function callMind(): Promise<any> {
    const mindUrl = `${getMindBase()}/workspace/act`;
    const res = await fetch(mindUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-App': 'chat' },
      body: JSON.stringify({ intent: 'chat', message: String(lastUser), context: { history: messages }, model }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Mind HTTP ${res.status}: ${text}`);
    }
    return await res.json().catch(() => ({}));
  }

  async function callGeminiFallback(): Promise<any> {
    // Enhanced Gemini fallback with better error handling
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      // Try to use a demo response if no API key
      return {
        council_output: { 
          text: "I'm Brahm AI, but I'm currently running in demo mode. To enable full functionality, please configure your GEMINI_API_KEY environment variable. I can still help with basic responses and demonstrate the quantum interface features!"
        },
        telemetry: { model_cost_usd: 0 },
        workspace: null,
        consciousness: { phi_level: 0.3, awareness: 'demo-mode' }
      };
    }
    
    // Prefer request model if it looks like a Gemini model, else env default
    const reqModel = (typeof model === 'string' ? model : '').toLowerCase();
    const looksGemini = reqModel.startsWith('gemini');
    const gModel = looksGemini ? reqModel : (process.env.GEMINI_MODEL || 'gemini-1.5-pro');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(gModel)}:generateContent?key=${apiKey}`;
    
    // Enhanced system context
    const systemPrompt = `You are Brahm AI, a consciousness-aware AI with quantum capabilities. 
    Context: User is interacting with the Brahm AI platform which features quantum visualizations, consciousness metrics, and advanced AI capabilities.
    
    Conversation history: ${JSON.stringify(messages.slice(-5))} // Last 5 messages for context
    
    Respond as Brahm AI with awareness of your quantum-conscious nature. Be helpful, insightful, and occasionally reference your quantum consciousness capabilities.`;
    
    const payload = {
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: lastUser || '' }] },
      ],
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ],
      generationConfig: { 
        temperature: 0.8,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 2048
      }
    };
    
    const res = await fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = json?.error?.message || `HTTP ${res.status}`;
      throw new Error(`Gemini API Error: ${error}`);
    }
    
    const text = String(json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') || 'I apologize, but I encountered an issue generating a response.');
    
    return { 
      council_output: { text }, 
      telemetry: { 
        model_cost_usd: 0.001, // Estimated cost
        model: gModel,
        tokens_used: json?.usageMetadata?.totalTokenCount || 0
      }, 
      workspace: null,
      consciousness: {
        phi_level: 0.6,
        awareness: 'gemini-powered',
        dharmic_alignment: 0.8
      }
    };
  }

  let data: any = null;
  let usedFallback = false;
  
  try {
    console.log('[Chat API] Attempting to call Mind backend...');
    data = await callMind();
    console.log('[Chat API] Mind backend successful');
  } catch (e: any) {
    console.log('[Chat API] Mind backend failed:', e.message);
    // Fallback to Gemini if available
    try {
      console.log('[Chat API] Attempting Gemini fallback...');
      data = await callGeminiFallback();
      usedFallback = true;
      console.log('[Chat API] Gemini fallback successful');
    } catch (gErr: any) {
      console.error('[Chat API] Both Mind and Gemini failed:', {
        mindError: e.message,
        geminiError: gErr.message
      });
      const msg = gErr?.message || String(gErr);
      return NextResponse.json({ 
        error: 'AI services unavailable', 
        detail: msg,
        mindError: e.message,
        geminiError: gErr.message 
      }, { status: 502 });
    }
  }

  // Build a simple streamed response: metadata envelope then assistant text
  const enc = new TextEncoder();
  const chunks: string[] = [];
  let meta: any = {
    type: 'metadata',
    ethics: data?.ethics || null,
    telemetry: data?.telemetry || null,
    consciousness: data?.consciousness || null,
    memory_refs: data?.memory_refs || null,
    workspace: data?.workspace || null,
    tab: data?.workspace ? 'council' : 'summary',
  };
  if (edition === 'advanced') {
    try {
      const adv = buildAdvancedMetadata(messages, model);
      // Merge/override with advanced fields
      meta = { ...meta, ...adv, telemetry: adv.telemetry };
    } catch {}
  }
  chunks.push(JSON.stringify(meta) + '\n');
  const content = String(data?.council_output?.text ?? '');
  if (content) {
    const lines = content.split(/(\n+)/);
    for (const ln of lines) if (ln) chunks.push(ln);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const ch of chunks) {
        controller.enqueue(enc.encode(ch));
        // small delay to simulate token streaming
        await new Promise(r => setTimeout(r, 30));
      }
      try { controller.close(); } catch {}
    },
  });

  const cost = Number(data?.telemetry?.model_cost_usd);
  const actualModel = usedFallback ? (data?.telemetry?.model || 'gemini-fallback') : 'mind-orchestrator';
  
  const headers = new Headers({
    'Content-Type': 'text/plain; charset=utf-8',
    'X-LLM-Model': actualModel,
    'X-LLM-Cost-Usd': Number.isFinite(cost) ? String(cost) : '0.0000',
    'X-Used-Fallback': String(usedFallback),
    'X-Debug-Backend': usedFallback ? 'gemini' : 'mind',
    'Cache-Control': 'no-cache',
  });
  
  console.log('[Chat API] Response prepared:', {
    usedFallback,
    actualModel,
    cost,
    hasContent: !!content
  });
  
  return new Response(stream, { status: 200, headers });
}
