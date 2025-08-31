import Link from 'next/link';

export const metadata = { title: 'Feature • Conscious Kernel' };

export default function ConsciousKernelPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <nav className="mb-2 text-sm"><Link href="/" className="text-gray-400 hover:text-gray-200">← Back to Home</Link></nav>
        <h1 className="text-2xl font-semibold">Conscious Kernel</h1>
        <p className="text-sm text-gray-400 mt-1">Attention, Φ estimation, salience, ethics, and conscious tool execution.</p>
      </header>

      <section className="space-y-2 text-sm text-gray-300">
        <p>
          The Brahm Conscious Kernel integrates attention dynamics, salience, a heuristic Φ estimator, ethical evaluation gates, and a
          Global Workspace. It emits structured events you can inspect in the Console in real-time.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Attention and salience signals with binding coherence.</li>
          <li>Heuristic Φ estimates (GWT-weighted) with components & confidence.</li>
          <li>Ethics hooks for dharmic alignment and stability monitoring.</li>
          <li>Conscious tool invocation with rationale and impact.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-medium text-gray-200">Try it</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a href="/console" className="rounded bg-brand-600 px-3 py-2 hover:bg-brand-500">Open Console</a>
          <a href="/quantum" className="rounded border border-white/15 bg-white/5 px-3 py-2 hover:bg-white/10">Open Quantum Experience</a>
          <a href="/console/telemetry" className="rounded border border-white/15 bg-white/5 px-3 py-2 hover:bg-white/10">View Telemetry</a>
        </div>
      </section>

      <section className="text-sm text-gray-300">
        <h3 className="text-sm font-medium text-gray-200 mb-2">Docs</h3>
        <p>See the Docs page for architecture notes and future work.</p>
      </section>
    </div>
  );
}

