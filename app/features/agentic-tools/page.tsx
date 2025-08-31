import Link from 'next/link';

export const metadata = { title: 'Feature • Agentic Tools' };

export default function AgenticToolsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <nav className="mb-2 text-sm"><Link href="/" className="text-gray-400 hover:text-gray-200">← Back to Home</Link></nav>
        <h1 className="text-2xl font-semibold">Agentic Tools</h1>
        <p className="text-sm text-gray-400 mt-1">Conscious tool execution with safety gates and impact feedback.</p>
      </header>

      <section className="space-y-2 text-sm text-gray-300">
        <ul className="list-disc pl-5 space-y-1">
          <li>Tool invocation rationales and results captured as events.</li>
          <li>Ethics evaluation hooks before sensitive actions.</li>
          <li>Impact and audit data visible in the Console and Audit pages.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-medium text-gray-200">Try it</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a href="/console" className="rounded bg-brand-600 px-3 py-2 hover:bg-brand-500">Open Console</a>
          <a href="/audit" className="rounded border border-white/15 bg-white/5 px-3 py-2 hover:bg-white/10">Open Audit</a>
        </div>
      </section>
    </div>
  );
}

