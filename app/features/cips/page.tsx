import Link from 'next/link';

export const metadata = { title: 'Feature • CIPS' };

export default function CipsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <nav className="mb-2 text-sm"><Link href="/" className="text-gray-400 hover:text-gray-200">← Back to Home</Link></nav>
        <h1 className="text-2xl font-semibold">CIPS</h1>
        <p className="text-sm text-gray-400 mt-1">Coalitions, qualia, active inference, evolution.</p>
      </header>

      <section className="space-y-2 text-sm text-gray-300">
        <ul className="list-disc pl-5 space-y-1">
          <li>Coalitions forming on the workspace.</li>
          <li>Qualia signals (sensory, emotional, cognitive).</li>
          <li>Active inference with value alignment.</li>
          <li>Evolutionary improvements via apply/accept cycles.</li>
        </ul>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-medium text-gray-200">Try it</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a href="/console" className="rounded bg-brand-600 px-3 py-2 hover:bg-brand-500">Open Console</a>
          <a href="/console/learning" className="rounded border border-white/15 bg-white/5 px-3 py-2 hover:bg-white/10">Learning (LoRA & Replay)</a>
        </div>
      </section>
    </div>
  );
}

