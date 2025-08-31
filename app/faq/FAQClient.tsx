"use client";

import React from 'react';

type Cat = { id: string; label: string };

export default function FAQClient({ categories }: { categories: Cat[] }) {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState<string>('all');

  React.useEffect(() => {
    const root = document.getElementById('faq-content');
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>('section.faq-section'));

    // Category filter
    sections.forEach((s) => {
      const id = s.getAttribute('data-category') || '';
      s.style.display = (active === 'all' || id === active) ? '' : 'none';
    });

    // Search filter
    const items = Array.from(root.querySelectorAll<HTMLElement>('details.faq-item'));
    const term = q.trim().toLowerCase();
    items.forEach((d) => {
      const summary = d.querySelector('summary')?.textContent?.toLowerCase() || '';
      const body = d.textContent?.toLowerCase() || '';
      const match = term === '' || summary.includes(term) || body.includes(term);
      d.style.display = match ? '' : 'none';
      // Auto-open if matching and term present
      if (match && term) d.setAttribute('open', 'true');
    });
  }, [q, active]);

  React.useEffect(() => {
    const root = document.getElementById('faq-content');
    if (!root) return;
    const onClick = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t && t.getAttribute('data-faq-feedback')) {
        const val = t.getAttribute('data-faq-feedback');
        const question = t.getAttribute('data-q') || '';
        try {
          fetch('/api/provenance/log', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ action: 'faq:feedback', target: question, meta: { value: val, q } }) });
        } catch {}
      }
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [q]);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
        <input
          type="search"
          placeholder="Search the FAQ…"
          value={q}
          onChange={(e)=> setQ(e.target.value)}
          className="flex-1 rounded-md bg-black/30 border border-white/10 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2 text-xs">
          <button onClick={()=> setActive('all')} className={`px-2 py-1 rounded border ${active==='all' ? 'bg-brand-600 border-brand-500' : 'bg-white/5 border-white/15 hover:bg-white/10'}`}>All</button>
          {categories.map(c => (
            <button key={c.id} onClick={()=> setActive(c.id)} className={`px-2 py-1 rounded border ${active===c.id ? 'bg-brand-600 border-brand-500' : 'bg-white/5 border-white/15 hover:bg-white/10'}`}>{c.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

