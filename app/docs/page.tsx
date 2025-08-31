"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

function CodeBlock({ inline, className, children }: any) {
  const code = String(children || '');
  if (inline) return <code className={className}>{children}</code>;
  const onCopy = async () => {
    try { await navigator.clipboard.writeText(code); (window as any).__brahm_toast?.('Copied code', 'success'); } catch {}
  };
  return (
    <div className="group relative">
      <pre className={className}>{children}</pre>
      <button onClick={onCopy} className="absolute right-2 top-2 hidden rounded bg-white/10 px-2 py-1 text-[11px] text-white group-hover:block hover:bg-white/20">
        Copy
      </button>
    </div>
  );
}

export default function DocsIndex() {
  const nav = [
    { id: 'intro', label: 'Introduction' },
    { id: 'faq', label: 'FAQ' },
    { id: 'blueprint', label: 'Technical Blueprint' },
    { id: 'kernel', label: 'Conscious Kernel' },
    { id: 'conscious', label: 'Conscious AI' },
    { id: 'pp', label: 'Predictive Processing' },
    { id: 'cips', label: 'CIPS' },
    { id: 'ethics', label: 'Ethics & Safety' },
    { id: 'ui', label: 'UI & SSE' },
    { id: 'episodes', label: 'Episodic Memory' },
    { id: 'persistence-rfc', label: 'Persistence RFC' },
    { id: 'ingestion', label: 'Ingestion' },
    { id: 'ops', label: 'Ops & Deploy' },
    { id: 'panini-sanskrit-graph', label: 'Sanskrit Rule Graph' },
    { id: 'panini-constrained-decoding', label: 'Constrained Decoding' },
    { id: 'nyaya-checker', label: 'Nyaya Checker' },
  ];
  const [slug, setSlug] = React.useState('intro');
  const [md, setMd] = React.useState<string>('');
  const [query, setQuery] = React.useState('');
  const [index, setIndex] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    fetch(`/docs/${slug}.md`).then(r=>r.text()).then(setMd).catch(()=>setMd('# Not found'));
  }, [slug]);

  // Prefetch all docs for simple client-side search
  React.useEffect(() => {
    Promise.all(nav.map(n => fetch(`/docs/${n.id}.md`).then(r=>r.text()).then(t=>[n.id, t] as const).catch(()=>[n.id, '']))).then(pairs => {
      const obj: Record<string,string> = {}; pairs.forEach(([k,v]) => { obj[k]=v; }); setIndex(obj);
    });
  }, []);

  const filtered = nav.filter(n => {
    if (!query) return true;
    const t = (n.label + ' ' + (index[n.id]||'')).toLowerCase();
    return t.includes(query.toLowerCase());
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="border-r border-white/10 bg-white/5 p-4">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search docs…" className="mb-2 w-full rounded bg-black/30 px-2 py-1 text-sm text-gray-200 placeholder-gray-500 outline-none focus:ring-2 focus:ring-brand-500" />
        <div className="text-xs font-medium text-gray-400 mb-2">Docs</div>
        <nav className="space-y-1 text-sm">
          {filtered.map((n) => (
            <button key={n.id} onClick={()=>setSlug(n.id)} className={`block w-full rounded px-2 py-1 text-left ${slug===n.id?'bg-white/15 text-white':'text-gray-300 hover:bg-white/10'}`}>
              {n.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="prose prose-invert max-w-none p-6">
        <ReactMarkdown rehypePlugins={[rehypeHighlight as any]} components={{ code: CodeBlock }}>{md}</ReactMarkdown>
      </main>
    </div>
  );
}
