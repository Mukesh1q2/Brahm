"use client";

import React from 'react';
import { Brain, Sparkles, Network, Activity, Rocket, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useRightPanelData } from '@/store/rightPanelData';
import { useRightPanelStore } from '@/store/rightPanelStore';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-100">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl bg-brand-700/30" />
          <div className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl bg-neon-purple from-brand-500/10 to-neon-purple/10" />
        </div>
        <div className="container px-6 py-24">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
              <Sparkles size={14} className="text-neon-purple" /> Experimental consciousness-inspired AI
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Brahm-AI
              <span className="block text-lg font-normal text-gray-400 md:text-xl">Vedic-inspired, agentic, quantum-aware.</span>
            </h1>
            <p className="mt-6 max-w-xl text-gray-300">
              An evolving framework unifying attention, predictive processing, memory, ethics and tools into a single conscious kernel.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/console" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400">
                Open Console
              </Link>
              <Link href="/chat" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20">
                Try Chat
              </Link>
              <a href="#stack" className="text-sm text-gray-400 hover:text-gray-200">Learn more ↓</a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">Why Brahm?</h2>
          <p className="mt-2 text-sm text-gray-400">Core capabilities built for adaptive, self-reflective systems.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<Brain className="text-brand-400" />} title="Conscious Kernel" desc="Integrated attention, phi estimation, salience, ethics, tools." href="/features/conscious-kernel" />
          <Feature icon={<Network className="text-neon.cyan" />} title="Predictive Processing" desc="PP modulation with evolution and live weights telemetry." href="/features/predictive-processing" />
          <Feature icon={<Terminal className="text-neon.blue" />} title="Agentic Tools" desc="Conscious tool execution with impact feedback and safety gates." href="/features/agentic-tools" />
          <Feature icon={<Activity className="text-brand-300" />} title="Memory & Experiences" desc="Episodic store with filters, playback and summaries." href="/features/memory-experiences" />
          <Feature icon={<Rocket className="text-neon-purple" />} title="CIPS" desc="Coalitions, qualia, active inference, evolution—visualized in UI." href="/features/cips" />
          <Feature icon={<Sparkles className="text-gray-300" />} title="Futuristic UI" desc="Dark, glassy, neon aesthetics with strong a11y foundations." href="/features/futuristic-ui" />
        </div>
      </section>

      {/* Stack Diagram / What is Brahm */}
      <section id="stack" className="container px-6 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">What is Brahm-AI?</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            Brahm blends Vedic principles with modern AI: attention dynamics, predictive processing, causal integration, and ethical scaffolding.
            The UI streams live kernel events so you can observe, iterate, and evolve behavior safely.
          </p>
        </div>
        <div className="grid items-start gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-200">Brahm Stack</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Conscious Kernel: attention, phi, salience</li>
              <li>• Predictive Processing: error → weights modulation</li>
              <li>• CIPS: coalitions → qualia → active inference → evolution</li>
              <li>• Ethics & Safety: dharmic principles, stability monitor</li>
              <li>• Tools: conscious execution + impact</li>
              <li>• Memory: episodic store and summaries</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-200">Progress Timeline</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• PP modulation tests + UI badges ✓</li>
              <li>• CIPS events + evolution weights ✓</li>
              <li>• E2E stability (agent bus waits) ✓</li>
              <li>• Marketing landing v1 (this page) •</li>
              <li>• Quantum graph & state playback (coming)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Minimal Chat on home for E2E */}
      <HomeChat />

      {/* CTA */}
      <section className="container px-6 pb-20">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-brand-700/20 to-black p-6 text-center">
          <h3 className="text-xl font-semibold">Explore the live Console</h3>
          <p className="mt-2 text-sm text-gray-300">Stream kernel events, tune weights, and watch PP modulation in real time.</p>
          <div className="mt-4">
            <Link href="/console" className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400">
              Open Console
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HomeChat() {
  const [input, setInput] = React.useState('');
  const [msgs, setMsgs] = React.useState<{ id: string; sender: 'user'|'brahm'; text: string; codeDiff?: { original: string; modified: string; language?: string } }[]>([]);
  const setAll = useRightPanelData(s=>s.setAll);
  const setTab = useRightPanelStore(s=>s.setTab);
  async function send() {
    const text = input.trim();
    if (!text) return;
    setMsgs(prev => [...prev, { id: crypto.randomUUID(), sender: 'user', text }]);
    setInput('');
    try {
      const res = await fetch('/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
      const j = await res.json().catch(()=>({}));
      const response = j.response || '…';
      const code_diff = j.code_diff || (j.diff_modified ? { original: j.diff_original || '', modified: j.diff_modified, language: j.diff_language || 'plaintext' } : null);
      setMsgs(prev => [...prev, { id: crypto.randomUUID(), sender: 'brahm', text: response, codeDiff: code_diff || undefined }]);
    } catch (e:any) {
      setMsgs(prev => [...prev, { id: crypto.randomUUID(), sender: 'brahm', text: `Error: ${e?.message||'failed'}` }]);
    }
  }
  return (
    <section className="container px-6 pb-10">
      <div className="glass-card p-4">
        <div className="mb-3 text-sm text-gray-300">Quick chat</div>
        <div className="space-y-2 mb-3">
          {msgs.map(m => (
            <div key={m.id} className={`flex ${m.sender==='user'?'justify-end':'justify-start'}`}>
              <div className={`max-w-xl rounded-2xl px-3 py-2 ${m.sender==='user'?'bg-white/10':'bg-white/5'}`}>
                <div className="text-sm text-gray-200 whitespace-pre-wrap">{m.text}</div>
                {m.sender==='brahm' && m.codeDiff && (
                  <div className="mt-2">
                    <button
                      className="px-2 py-1 text-xs rounded border border-white/10 text-white/80 hover:text-white hover:bg-white/10"
                      data-testid="view-diff-btn"
                      onClick={() => { setAll({ codeDiff: m.codeDiff! } as any); setTab('diff' as any); }}
                    >
                      View Diff
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if (e.key==='Enter') send(); }}
            placeholder="Ask Brahm anything..."
            className="flex-1 rounded-md bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/15" onClick={send}>Send</button>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title, desc, href }: { icon: React.ReactNode; title: string; desc: string; href?: string }) {
  const card = (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-brand-500/60 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
        {icon}
      </div>
      <div className="text-sm font-medium text-gray-200">{title}</div>
      <div className="mt-1 text-sm text-gray-400">{desc}</div>
      {href && (
        <div className="mt-3 text-xs text-brand-400">Learn more →</div>
      )}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}
