import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

function readDoc(): string {
  try {
    const p = path.join(process.cwd(), 'public', 'docs', 'advanced-architecture.md');
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '# Brahm AI – Advanced Architecture\n\nAdd content to public/docs/advanced-architecture.md';
  }
}

export default function AdvancedDocsPage() {
  const md = readDoc();
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Brahm AI – Advanced Architecture</h1>
      <p className="text-sm text-gray-400 mb-4">Enhanced implementation specification for the Advanced edition. Use the Edition toggle in the header to switch between Basic and Advanced.</p>
      <article className="prose prose-invert max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{md}</ReactMarkdown>
      </article>
    </div>
  );
}

