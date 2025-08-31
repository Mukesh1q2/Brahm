"use client";

import React from "react";

// Lightweight bounded push helper
function pushBounded<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  return arr.slice(arr.length - max);
}

// ---------- CodeBlock with simple highlighting and copy ----------
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(code: string, lang: string): string {
  // Super-naive highlighter for js/ts/tsx/json/bash — good enough for docs
  const esc = escapeHtml(code);
  let out = esc;
  if (["js","ts","tsx","typescript","javascript"].includes(lang)) {
    // comments
    out = out.replace(/(^|\n)\s*(\/\/.*)$/g, (m, a, b) => `${a}<span class=\"text-gray-500 italic\">${b}</span>`);
    // strings
    out = out.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, (m) => `<span class=\"text-emerald-300\">${m}</span>`);
    // keywords
    out = out.replace(/\b(const|let|var|function|return|if|else|try|catch|await|async|import|from|export|class|new|throw|switch|case|break|for|while|of|in|type|interface|extends|implements|public|private|protected)\b/g,
      '<span class="text-purple-300">$1</span>');
    // numbers
    out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="text-amber-300">$1</span>');
  } else if (["json"].includes(lang)) {
    out = out
      .replace(/(".*?")(?=\s*:)/g, '<span class="text-sky-300">$1</span>') // keys
      .replace(/:\s*(".*?")/g, ': <span class="text-emerald-300">$1</span>') // string values
      .replace(/:\s*(true|false|null)/g, ': <span class="text-purple-300">$1</span>') // booleans/null
      .replace(/:\s*(\d+(?:\.\d+)?)/g, ': <span class="text-amber-300">$1</span>'); // numbers
  } else if (["bash","sh","shell"].includes(lang)) {
    out = out
      .replace(/(^|\n)(\$\s.*)$/g, (m, a, b) => `${a}<span class=\"text-emerald-300\">${b}</span>`) // prompts
      .replace(/(#.*$)/gm, '<span class="text-gray-500 italic">$1</span>');
  }
  return out;
}

function CodeBlock({ code, language, label }: { code: string; language: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {}
  };
  const html = React.useMemo(() => highlight(code, language), [code, language]);
  return (
    <div className="relative rounded border border-white/10 bg-black/60">
      <div className="flex items-center justify-between text-[11px] text-gray-400 px-2 py-1 border-b border-white/10">
        <span>{label || language}</span>
        <button className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700 text-white/80 hover:text-white"
                onClick={onCopy}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre className="p-3 overflow-auto text-[12px] leading-5"><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
    </div>
  );
}

// ---------- Mini Consciousness Simulator ----------
function PhiGauge({ value }: { value: number | null }) {
  const min = 0; const max = 2.0;
  const v = value == null ? null : Math.max(min, Math.min(max, value));
  const pct = v == null ? 0 : (v - min) / (max - min);
  const size = 80; const stroke = 8; const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const dash = v == null ? 0 : c * pct;
  const color = v == null ? '#555' : `hsl(${200 + 140*pct}, 90%, 60%)`;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#222" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke}
              fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c-dash}`}
              transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="#ddd">{v==null? '–' : v.toFixed(2)}</text>
    </svg>
  );
}

function MiniConsciousnessSim() {
  const [phi, setPhi] = React.useState<number>(1.0);
  const [hist, setHist] = React.useState<number[]>([]);
  React.useEffect(() => {
    let t = 0; let raf: number; let mounted = true;
    const tick = () => {
      t += 0.12;
      const next = 1.0 + 0.4*Math.sin(t/1.8) + (Math.random()-0.5)*0.05;
      if (!mounted) return;
      setPhi(Number(next.toFixed(3)));
      setHist(h => pushBounded([...h, Number(next.toFixed(3))], 30));
      raf = window.setTimeout(tick, 180);
    };
    raf = window.setTimeout(tick, 180);
    return () => { mounted = false; window.clearTimeout(raf); };
  }, []);
  // sparkline
  const w = 140, h = 40, pad = 4;
  const minY = Math.min(0, ...hist);
  const maxY = Math.max(2, ...hist);
  const rangeY = maxY - minY || 1;
  const maxX = Math.max(1, hist.length - 1);
  const pts = hist.map((y, i) => {
    const x = pad + (i / maxX) * (w - pad*2);
    const yy = h - pad - ((y - minY)/rangeY) * (h - pad*2);
    return `${x.toFixed(1)},${yy.toFixed(1)}`;
  }).join(' ');
  return (
    <div className="rounded border border-purple-500/30 bg-black/40 p-2 flex items-center gap-3">
      <PhiGauge value={phi} />
      <div>
        <div className="text-[11px] text-gray-400">φ mini-sim</div>
        <svg width={w} height={h} className="max-w-full h-auto">
          <polyline fill="none" stroke="#a855f7" strokeWidth="2" points={pts} />
        </svg>
      </div>
    </div>
  );
}

// ---------- FAQ Types and Data ----------
type FaqCode = { language: string; content: string; label?: string };
type FaqItem = { id: string; question: string; answer: string; tags: string[]; code?: FaqCode[] };

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "e2e-db-less",
    question: "How do I run E2E tests without a database?",
    answer: "Set the DB-disabled override and run tests with retries and tracing to avoid flakiness.",
    tags: ["e2e", "db", "env"],
    code: [
      {
        language: "bash",
        label: "Playwright example",
        content: "BRAHM_E2E_DISABLE_DB=true NEXT_PUBLIC_PERSIST_REMOTE=false NEXT_PUBLIC_E2E_HOOKS=true \\\nnpx playwright test tests/e2e/smoke.spec.ts --retries=2 --trace=on"
      }
    ]
  },
  {
    id: "cips-badge",
    question: "Why does the CIPS PredErr badge start at 0 instead of ‘–’?",
    answer: "To avoid a flaky initial UI, we seed the PredErr badge to 0 when a CIPS-enabled stream starts.",
    tags: ["ui", "cips", "prederr"],
    code: [
      {
        language: "ts",
        label: "Conceptual snippet",
        content: "// On stream open with CIPS enabled, seed to 0 to avoid a transient ‘–’.\nsetPredErr(0);"
      }
    ]
  },
  {
    id: "consciousness-stream",
    question: "How does the Consciousness Dashboard stay responsive if the stream drops?",
    answer: "After a short grace period, it switches to a local simulation to keep charts and gauges alive.",
    tags: ["consciousness", "ui", "resilience"],
    code: [
      {
        language: "ts",
        label: "Simulation idea",
        content: "// If EventSource is disconnected for >2s, start a 100ms timer\n// to produce φ, valence, and coherence metrics."
      }
    ]
  },
  {
    id: "chat-fallback",
    question: "What happens if the Mind orchestrator is unavailable?",
    answer: "Chat API falls back to Gemini with consciousness context injection while retaining streamed response format.",
    tags: ["chat", "fallback", "api"],
    code: [
      {
        language: "ts",
        label: "Conceptual flow",
        content: "try { /* call primary Mind */ } catch { /* fallback to Gemini */ }"
      }
    ]
  }
];

// ---------- Expandable Card ----------
function FaqCard({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded border ${open ? 'border-purple-500/40' : 'border-white/10'} bg-gradient-to-br from-black/50 to-purple-950/10`}>
      <button onClick={onToggle}
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-white/5">
        <div className="text-white font-medium">{item.question}</div>
        <span className="text-xs text-gray-400">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3 items-start">
            <div className="space-y-3">
              <div className="text-sm text-gray-300 whitespace-pre-wrap">{item.answer}</div>
              {item.code?.map((c, i) => (
                <CodeBlock key={`${item.id}:code:${i}`} code={c.content} language={c.language} label={c.label} />
              ))}
            </div>
            <div className="pt-1">
              <MiniConsciousnessSim />
            </div>
          </div>
          {!!item.tags?.length && (
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {item.tags.map(t => (
                <span key={t} className="text-[11px] text-white/80 bg-white/10 border border-white/15 rounded-full px-2 py-0.5">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Search / Filter ----------
export default function FAQPage() {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const [tagFilter, setTagFilter] = React.useState<string[]>([]);

  const allTags = React.useMemo(() => {
    const s = new Set<string>();
    FAQ_ITEMS.forEach(i => i.tags.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, []);

  const toggleTag = (t: string) => setTagFilter(arr => arr.includes(t) ? arr.filter(x => x !== t) : [...arr, t]);
  const clearFilters = () => { setTagFilter([]); setQ(""); };

  const items = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return FAQ_ITEMS.filter(it => {
      const matchesQuery = !query ||
        it.question.toLowerCase().includes(query) ||
        it.answer.toLowerCase().includes(query) ||
        it.tags.some(t => t.toLowerCase().includes(query));
      const matchesTags = !tagFilter.length || it.tags.some(t => tagFilter.includes(t));
      return matchesQuery && matchesTags;
    });
  }, [q, tagFilter]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Consciousness-themed header */}
      <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-fuchsia-900/10 to-cyan-900/10 p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.15),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.12),transparent_40%)] pointer-events-none" />
        <div className="relative">
          <h1 className="text-2xl font-semibold text-white">Project Brahm FAQ</h1>
          <p className="text-sm text-gray-300 mt-1">Answers about consciousness UI, memory, testing, and fallbacks.</p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-300">
            <div className="rounded bg-black/30 border border-white/10 p-2">Live φ mini-sim keeps visuals alive during outages.</div>
            <div className="rounded bg-black/30 border border-white/10 p-2">Search/filter quickly finds relevant topics.</div>
            <div className="rounded bg-black/30 border border-white/10 p-2">Copyable, highlighted code snippets for quick use.</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-center">
        <div className="flex-1 flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions, answers, or tags…"
            className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder:text-gray-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearFilters}
                  className="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white/80 hover:text-white">
            Clear
          </button>
        </div>
      </div>
      {!!allTags.length && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {allTags.map(t => (
            <button key={t} onClick={() => toggleTag(t)}
                    className={`text-[11px] rounded-full px-2 py-0.5 border ${tagFilter.includes(t) ? 'bg-purple-900/40 border-purple-700 text-white' : 'bg-white/10 border-white/15 text-white/80'}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* FAQ List */}
      <div className="mt-5 space-y-3">
        {items.map(it => (
          <FaqCard key={it.id} item={it} open={!!open[it.id]} onToggle={() => setOpen(s => ({ ...s, [it.id]: !s[it.id] }))} />
        ))}
        {!items.length && (
          <div className="rounded border border-white/10 bg-black/40 p-4 text-sm text-gray-400">No results. Try a different search or clear filters.</div>
        )}
      </div>

      {/* Footer mini-sim row */}
      <div className="mt-8">
        <div className="text-xs text-gray-400 mb-2">Ambient φ</div>
        <MiniConsciousnessSim />
      </div>
    </div>
  );
}

