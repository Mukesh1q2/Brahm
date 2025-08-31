"use client";

import React from 'react';
import { useEdition } from '@/store/edition';

export default function EditionBadge() {
  const { edition, setEdition } = useEdition();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const toggle = async () => {
    const next = edition === 'advanced' ? 'basic' : 'advanced';
    try {
      await fetch('/api/edition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ edition: next }) });
    } catch {}
    setEdition(next);
  };

  // Avoid SSR mismatch; render after mount
  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={`Current: ${edition}. Click to switch.`}
      className="fixed bottom-4 right-4 z-[1000] inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 backdrop-blur"
      aria-label={`Edition ${edition}`}
    >
      <span className="h-2 w-2 rounded-full"
        style={{ backgroundColor: edition === 'advanced' ? '#7c3aed' : '#64748b' }}
      />
      <span>Edition: <strong className="ml-1 capitalize">{edition}</strong></span>
      <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-[11px]">Switch</span>
    </button>
  );
}

