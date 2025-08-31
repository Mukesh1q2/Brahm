"use client";

import React from 'react';
import { Command } from 'cmdk';
import Link from 'next/link';
import RightContextPanel from '@/components/shell/RightContextPanel';
import { useRightPanelData } from '@/store/rightPanelData';
import { useAgentEventBus } from '@/store/agentEventBus';
import type { AgentEvent } from '@/types/AgentEvents';
import TelemetryDebug from './TelemetryDebug';

export default function FuturisticShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const { summary, json, codeDiff, setAll } = useRightPanelData();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // E2E hook to push agent events from tests (guarded by env flag)
  const bus = useAgentEventBus();
  React.useEffect(() => {
    if (process.env.NEXT_PUBLIC_E2E_HOOKS && process.env.NEXT_PUBLIC_E2E_HOOKS !== 'false') {
      (window as any).__agentEventPush = (e: AgentEvent) => {
        try { bus.push(e); } catch {}
      };
    }
  }, [bus]);

  // Seed demo data if panel is empty (helps e2e and initial UX)
  React.useEffect(() => {
    if (!summary && !json && !codeDiff) {
      setAll({
        summary: 'Planner → Retrieve → Debate → Validate → Answer',
        json: { planner: 'ok', steps: 5, modelVotes: { llama: 0.62, claude: 0.38 } },
        codeDiff: { original: "console.log('v1')\n", modified: "console.log('v2')\n", language: 'javascript' },
      });
    }
  }, [summary, json, codeDiff, setAll]);

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr_320px] grid-rows-[auto_1fr]">
      {/* Left Sidebar */}
      <aside className="row-span-2 col-start-1 col-end-2 border-r border-white/5 bg-[#0f0f10]/80 backdrop-blur-xl">
        <div className="p-4 text-[11px] uppercase tracking-widest text-white/60">Brahm</div>
        <nav className="p-3 space-y-1 text-sm">
          {[
            { href: '/console', label: 'Console' },
            { href: '/console/timeline', label: 'Timeline' },
            { href: '/console/auto-prs', label: 'Auto-PRs' },
            { href: '/agents/org', label: 'Agents' },
            { href: '/panini', label: 'Graph' },
            { href: '/audit', label: 'Audit' },
            { href: '/terminal', label: 'Eval' },
            { href: '/education', label: 'Education' },
            { href: '/faq', label: 'FAQ' },
            { href: '/voice', label: 'Voice' },
          ].map((it) => (
            <Link key={it.href} href={it.href} className="block px-3 py-2 rounded-md hover:bg-white/5 text-white/80 hover:text-cyan-300">
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="p-3">
          <button onClick={() => setOpen(true)} className="w-full text-left text-xs px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white/70">
            ⌘K Command
          </button>
        </div>
      </aside>

      {/* Top Bar (empty for now) */}
      <header className="col-start-2 col-end-4 border-b border-white/5 bg-[#0b0b0c]/60 backdrop-blur-xl">
        <div className="h-12 flex items-center justify-between px-4 text-white/70">
          <div className="text-sm">Futuristic UI (flag on)</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden md:inline">Press ⌘K</span>
            {/* Theme toggle */}
            {React.createElement(require('./ThemeToggle').default)}
            {React.createElement(require('./EditionToggle').default)}
          </div>
        </div>
      </header>

      {/* Main Pane */}
      <main className="col-start-2 col-end-3 p-4">
        <div className="glass-card">
          {children}
        </div>
      </main>

      {/* Debug Panel (feature-flagged) */}
      <TelemetryDebug />

      {/* Right Sidebar */}
      <aside className="col-start-3 col-end-4 p-4 space-y-3">
        <RightContextPanel
          reasoningSummary={summary}
          reasoningJson={json}
          codeDiff={codeDiff}
        />
      </aside>

      {/* Command Palette */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="mx-auto mt-24 max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a]">
              <Command>
                <Command.Input placeholder="Search commands, agents, pages…" className="w-full bg-transparent p-3 text-white outline-none" />
                <Command.List className="max-h-[320px] overflow-auto">
                  <Command.Empty className="p-3 text-sm text-white/50">No results</Command.Empty>
                  <Command.Group heading="Navigate" className="text-white/50">
                    <Command.Item onSelect={() => (window.location.href = '/console')}>Go to Console</Command.Item>
                    <Command.Item onSelect={() => (window.location.href = '/console/timeline')}>Go to Timeline</Command.Item>
                    <Command.Item onSelect={() => (window.location.href = '/console/auto-prs')}>Go to Auto-PRs</Command.Item>
                    <Command.Item onSelect={() => (window.location.href = '/agents/org')}>Go to Agents</Command.Item>
                    <Command.Item onSelect={() => (window.location.href = '/audit')}>Go to Audit</Command.Item>
                    <Command.Item onSelect={() => (window.location.href = '/panini')}>Go to Graph</Command.Item>
                    <Command.Item onSelect={() => { localStorage.setItem('CHATGPT_UI_OVERRIDE','true'); window.location.href='/chat'; }}>Open Chat UI</Command.Item>
                    <Command.Item onSelect={() => { localStorage.removeItem('CHATGPT_UI_OVERRIDE'); alert('Chat UI override disabled'); }}>Disable Chat UI override</Command.Item>
                    <Command.Item onSelect={() => { if ((window as any).__toggleDebugPanel) (window as any).__toggleDebugPanel(); }}>Toggle Debug Panel</Command.Item>
                  </Command.Group>
                </Command.List>
              </Command>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

