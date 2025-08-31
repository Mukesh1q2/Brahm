import Link from 'next/link';

export const metadata = { title: 'Feature • Memory & Experiences' };

export default function MemoryExperiencesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <nav className="mb-2 text-sm"><Link href="/" className="text-gray-400 hover:text-gray-200">← Back to Home</Link></nav>
        <h1 className="text-2xl font-semibold">Memory & Experiences</h1>
        <p className="text-sm text-gray-400 mt-1">Episodic store with filters, playback, and summaries.</p>
      </header>

      <section className="space-y-2 text-sm text-gray-300">
        <ul className="list-disc pl-5 space-y-1">
          <li>Episode list and drawer with JSON.</li>
          <li>Filters and persistence for queries (phi ranges, time window, text search).</li>
          <li>Label filters with AND/OR modes when DB-backed persistence is enabled.</li>
          <li>Client auto-detects DB availability via /api/persistence/status to avoid brittle calls.</li>
          <li>Live updates when runs stream events.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-medium text-gray-200">Try it</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a href="/console" className="rounded bg-brand-600 px-3 py-2 hover:bg-brand-500">Open Console</a>
          <a href="/console/telemetry" className="rounded border border-white/15 bg-white/5 px-3 py-2 hover:bg-white/10">View Telemetry</a>
        </div>
      </section>
    </div>
  );
}

