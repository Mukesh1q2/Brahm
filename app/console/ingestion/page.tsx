"use client";

import React from 'react';
import axios from 'axios';

export default function IngestionPage() {
  const [crawlUrl, setCrawlUrl] = React.useState('https://example.com');
  const [crawl, setCrawl] = React.useState<any>(null);
  const [rssUrl, setRssUrl] = React.useState('https://example.com/feed');
  const [rss, setRss] = React.useState<any>(null);
  const [arxivQ, setArxivQ] = React.useState('LLM reasoning');
  const [arxiv, setArxiv] = React.useState<any>(null);
  const [docText, setDocText] = React.useState('This is a simple document with tokens.');
  const [docRes, setDocRes] = React.useState<any>(null);
  const [embText, setEmbText] = React.useState('hello\nworld');
  const [emb, setEmb] = React.useState<any>(null);
  const [kg, setKg] = React.useState<any>(null);
  const [prov, setProv] = React.useState<any[]>([]);

  async function doCrawl() { const r = await axios.get('/api/ingest/crawl', { params: { url: crawlUrl } }); setCrawl(r.data); }
  async function doRss() { const r = await axios.get('/api/ingest/rss', { params: { url: rssUrl } }); setRss(r.data); }
  async function doArxiv() { const r = await axios.get('/api/ingest/arxiv', { params: { q: arxivQ } }); setArxiv(r.data); }
  async function doDoc() { const r = await axios.post('/api/ingest/doc', { text: docText }); setDocRes(r.data); }
  async function doEmb() { const texts = embText.split('\n').filter(Boolean); const r = await axios.post('/api/embeddings', { texts }); setEmb(r.data); }
  async function loadKg() { const r = await axios.get('/api/kg/neo4j/schema'); setKg(r.data); }
  async function logProv() { await axios.post('/api/provenance/log', { action: 'ingest', meta: { when: Date.now() } }); const g = await axios.get('/api/provenance/log'); setProv(g.data?.items||[]); }

  return (
    <div className="p-4 text-gray-100 space-y-6">
      <h1 className="text-xl font-semibold">Data Ingestion</h1>

      <section className="space-y-2">
        <h2 className="text-lg">Web crawler</h2>
        <div className="flex gap-2">
          <input className="flex-1 bg-white/5 rounded px-2 py-1" value={crawlUrl} onChange={e=>setCrawlUrl(e.target.value)} />
          <button className="bg-white/10 px-3 py-1 rounded" onClick={doCrawl}>Fetch</button>
        </div>
        {crawl && <div className="text-sm">{crawl.title}</div>}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg">RSS</h2>
        <div className="flex gap-2">
          <input className="flex-1 bg-white/5 rounded px-2 py-1" value={rssUrl} onChange={e=>setRssUrl(e.target.value)} />
          <button className="bg-white/10 px-3 py-1 rounded" onClick={doRss}>Fetch</button>
        </div>
        {rss && <ul className="text-sm list-disc pl-4">{(rss.items||[]).map((it:any)=> (<li key={it.id}>{it.title}</li>))}</ul>}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg">ArXiv</h2>
        <div className="flex gap-2">
          <input className="flex-1 bg-white/5 rounded px-2 py-1" value={arxivQ} onChange={e=>setArxivQ(e.target.value)} />
          <button className="bg-white/10 px-3 py-1 rounded" onClick={doArxiv}>Search</button>
        </div>
        {arxiv && <ul className="text-sm list-disc pl-4">{(arxiv.items||[]).map((it:any)=> (<li key={it.id}>{it.title}</li>))}</ul>}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg">Document pipeline</h2>
        <textarea className="w-full h-20 bg-white/5 rounded p-2" value={docText} onChange={e=>setDocText(e.target.value)} />
        <button className="bg-white/10 px-3 py-1 rounded" onClick={doDoc}>Extract</button>
        {docRes && <div className="text-sm">Tokens: {docRes.tokens} • Preview: {(docRes.preview||[]).join(' ')}</div>}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg">Embeddings</h2>
        <textarea className="w-full h-20 bg-white/5 rounded p-2" value={embText} onChange={e=>setEmbText(e.target.value)} />
        <button className="bg-white/10 px-3 py-1 rounded" onClick={doEmb}>Embed</button>
        {emb && <div className="text-xs text-gray-400">dim={emb.dim} • vectors={emb.vectors?.length}</div>}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg">Knowledge graph schema</h2>
        <button className="bg-white/10 px-3 py-1 rounded" onClick={loadKg}>Load</button>
        {kg && <pre className="text-xs bg-white/5 rounded p-2">{kg.cypher}</pre>}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg">Provenance</h2>
        <button className="bg-white/10 px-3 py-1 rounded" onClick={logProv}>Log</button>
        <div className="text-xs text-gray-400">{prov.length} events</div>
      </section>
    </div>
  );
}

