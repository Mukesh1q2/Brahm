import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import dynamic from 'next/dynamic';

function readFaq(): string {
  try {
    const p = path.join(process.cwd(), 'brahm-conscious-ai-faq.md');
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '# Brahm Conscious AI – FAQ\n\nDocumentation file not found.';
  }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractToc(md: string) {
  const lines = md.split(/\r?\n/);
  const items: { level: number; text: string; id: string }[] = [];
  for (const line of lines) {
    const m = /^(#{1,3})\s+(.*)$/.exec(line.trim());
    if (!m) continue;
    const level = m[1].length; // 1..3
    const text = m[2].replace(/[#`*\[\]]/g, '').trim();
    const id = slugify(text);
    if (id) items.push({ level, text, id });
  }
  return items;
}

function preprocessMarkdown(md: string) {
  // Wrap H2 sections into <section data-category> and convert H3 Q/A into <details>
  const lines = md.split(/\r?\n/);
  let out: string[] = [];
  let openSection = false;
  let currentSectionId = '';
  let openDetails = false;
  let currentQuestion = '';
  let detailsBuffer: string[] = [];

  const flushDetails = () => {
    if (!openDetails) return;
    // Add feedback controls
    const feedback = `\n<div class="mt-2 text-xs text-gray-400">Was this helpful?\n  <button class="px-2 py-1 rounded bg-white/10 hover:bg-white/15 border border-white/15" data-faq-feedback="yes" data-q="${currentQuestion}">Yes</button>\n  <button class="ml-2 px-2 py-1 rounded bg-white/10 hover:bg-white/15 border border-white/15" data-faq-feedback="no" data-q="${currentQuestion}">No</button>\n</div>`;
    out.push(detailsBuffer.join('\n') + feedback);
    out.push('</details>');
    openDetails = false; detailsBuffer = []; currentQuestion = '';
  };

  const flushSection = () => {
    flushDetails();
    if (openSection) { out.push('</section>'); openSection = false; currentSectionId = ''; }
  };

  for (const raw of lines) {
    const line = raw;
    const h2 = /^##\s+(.*)$/.exec(line);
    const h3 = /^###\s+(.*)$/.exec(line);
    if (h2) {
      const text = h2[1].trim();
      const id = slugify(text);
      flushSection();
      out.push(`<section class="faq-section" data-category="${id}" id="${id}">`);
      out.push(`\n<h2 id="${id}">${text}</h2>`);
      openSection = true; currentSectionId = id;
      continue;
    }
    if (h3) {
      const text = h3[1].trim();
      const id = slugify(text);
      flushDetails();
      currentQuestion = text;
      out.push(`<details class="faq-item" data-section="${currentSectionId}"><summary class="faq-question">${text}</summary>`);
      openDetails = true; detailsBuffer = [];
      continue;
    }
    if (openDetails) {
      detailsBuffer.push(line);
    } else {
      out.push(line);
    }
  }
  flushSection();
  const processed = out.join('\n');
  return processed;
}

const FAQClient = dynamic(() => import('./FAQClient'), { ssr: false });

const FeatureLinks = () => (
  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
    <div className="font-medium text-gray-200 mb-2">Explore Features</div>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <a className="hover:underline" href="/console">Console</a>
      <a className="hover:underline" href="/console/timeline">Timeline</a>
      <a className="hover:underline" href="/console/consciousness">Consciousness</a>
      <a className="hover:underline" href="/chat">Chat</a>
      <a className="hover:underline" href="/agents/org">Agents</a>
      <a className="hover:underline" href="/canvas">Canvas</a>
      <a className="hover:underline" href="/quantum">Quantum</a>
      <a className="hover:underline" href="/panini">Panini Graph</a>
      <a className="hover:underline" href="/features/futuristic-ui">Futuristic UI</a>
      <a className="hover:underline" href="/features/conscious-kernel">Conscious Kernel</a>
    </div>
  </div>
);

export default function FAQPage() {
  const original = readFaq();
  const md = preprocessMarkdown(original);
  const toc = extractToc(original);
  const categories = toc.filter(t => t.level === 2).map(t => ({ id: t.id, label: t.text }));
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6 flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold mb-2">Brahm Conscious AI – Comprehensive FAQ</h1>
          <p className="text-sm text-gray-400 mb-4">Technical documentation covering consciousness, architecture, safety, telemetry, and usage. Use the sidebar to navigate sections.</p>
        </div>
        <div className="hidden lg:block w-72">
          <FeatureLinks />
        </div>
      </div>

      <FAQClient categories={categories} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-8 mt-4">
        <article id="faq-content" className="prose prose-invert max-w-none">
          <ReactMarkdown
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              h1: ({ node, children, ...props }) => {
                const text = String(children as any);
                const id = slugify(text);
                return <h1 id={id} {...props}>{children}</h1>;
              },
              h2: ({ node, children, ...props }) => {
                const text = String(children as any);
                const id = slugify(text);
                return <h2 id={id} {...props}>{children}</h2>;
              },
              a: ({ href = '', children, ...props }) => {
                // Open external links in new tab
                const external = /^https?:\/\//.test(href);
                return <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} {...props}>{children}</a>;
              },
              code: (props) => <code className="whitespace-pre-wrap break-words" {...props} />,
            }}
          >
            {md}
          </ReactMarkdown>
          <div className="mt-8 text-xs text-gray-500"><a className="hover:underline" href="#top">Back to top</a></div>
        </article>

        <aside className="lg:sticky lg:top-16 h-max space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-sm font-medium text-gray-200 mb-2">On this page</div>
            <nav className="text-xs space-y-1">
              {toc.map((t) => (
                <div key={t.id} className={t.level === 1 ? 'font-medium' : t.level === 2 ? 'pl-3' : 'pl-6'}>
                  <a className="text-gray-300 hover:underline" href={`#${t.id}`}>{t.text}</a>
                </div>
              ))}
            </nav>
          </div>
          <FeatureLinks />
        </aside>
      </div>
    </div>
  );
}
