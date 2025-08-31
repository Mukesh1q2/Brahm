"use client";

import React from 'react';
import { useEdition } from '@/store/edition';

export default function EditionToggle({ className = '' }: { className?: string }) {
  const { edition, setEdition } = useEdition();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Ensure html has a class for CSS hooks on mount
    try {
      const root = document.documentElement;
      root.classList.remove('edition-basic','edition-advanced');
      root.classList.add(edition === 'advanced' ? 'edition-advanced' : 'edition-basic');
    } catch {}
  }, [edition]);

  // Hydrate from localStorage after mount to avoid hydration mismatch
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('brahm:edition') as 'basic' | 'advanced' | null;
      if (saved && saved !== edition) setEdition(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`inline-flex items-center gap-1 text-xs ${className}`} suppressHydrationWarning>
      <span className="text-gray-400">Edition</span>
      <div className="inline-flex rounded-md overflow-hidden border border-white/10">
        <button
          type="button"
          onClick={async () => { try { await fetch('/api/edition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ edition: 'basic' }) }); } catch {} setEdition('basic'); }}
          className={`px-2 py-1 ${(mounted && edition==='basic') ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
          aria-pressed={edition==='basic'}
          title="Switch to Basic"
        >Basic</button>
        <button
          type="button"
          onClick={async () => { try { await fetch('/api/edition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ edition: 'advanced' }) }); } catch {} setEdition('advanced'); }}
          className={`px-2 py-1 ${(mounted && edition==='advanced') ? 'bg-brand-600/60 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
          aria-pressed={edition==='advanced'}
          title="Switch to Advanced"
        >Advanced</button>
      </div>
    </div>
  );
}
