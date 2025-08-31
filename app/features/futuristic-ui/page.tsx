import Link from 'next/link';

export const metadata = { title: 'Feature • Futuristic UI' };

export default function FuturisticUiPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <nav className="mb-2 text-sm"><Link href="/" className="text-gray-400 hover:text-gray-200">← Back to Home</Link></nav>
        <h1 className="text-2xl font-semibold">Futuristic UI</h1>
        <p className="text-sm text-gray-400 mt-1">Dark, glassy, neon aesthetics with strong accessibility foundations.</p>
      </header>

      <section className="space-y-2 text-sm text-gray-300">
        <ul className="list-disc pl-5 space-y-1">
          <li>MDX-like docs with syntax highlighting and copy buttons.</li>
          <li>Quantum canvas visuals and progressive enhancement.</li>
          <li>Global Toast provider and telemetry panel.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-medium text-gray-200">Try it</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a href="/docs" className="rounded bg-brand-600 px-3 py-2 hover:bg-brand-500">Open Docs</a>
          <a href="/quantum" className="rounded border border-white/15 bg-white/5 px-3 py-2 hover:bg-white/10">Open Quantum Experience</a>
        </div>
      </section>
    </div>
  );
}

