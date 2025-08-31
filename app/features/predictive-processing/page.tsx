import Link from 'next/link';

export const metadata = { title: 'Feature • Predictive Processing' };

export default function PredictiveProcessingPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <nav className="mb-2 text-sm"><Link href="/" className="text-gray-400 hover:text-gray-200">← Back to Home</Link></nav>
        <h1 className="text-2xl font-semibold">Predictive Processing</h1>
        <p className="text-sm text-gray-400 mt-1">PP modulation with error-driven weight updates and live badges.</p>
      </header>

      <section className="space-y-2 text-sm text-gray-300">
        <p>Brahm surfaces prediction error and modulates PP weights. You can view live weights and config badges in the Console.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Target Φ and seed controls.</li>
          <li>Ethics / Tools / Salience toggle badges.</li>
          <li>Dynamic badge for PP weights and predictions.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-medium text-gray-200">Try it</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a href="/console" className="rounded bg-brand-600 px-3 py-2 hover:bg-brand-500">Open Console</a>
          <a href="/console" className="rounded border border-white/15 bg-white/5 px-3 py-2 hover:bg-white/10">Toggle PP badges</a>
        </div>
      </section>
    </div>
  );
}

