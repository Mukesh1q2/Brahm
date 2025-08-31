export default function AboutPage() {
  return (
    <div className="container px-6 py-10">
      <h1 className="text-3xl font-semibold">About Brahm-AI</h1>
      <p className="mt-3 max-w-2xl text-gray-300">
        Brahm-AI is an experimental consciousness-inspired AI system blending Vedic principles with modern AI.
        It explores attention, predictive processing, causal integration, memory, ethics, and conscious tool use inside a single evolving kernel.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-lg font-medium">Vision</h2>
          <p className="mt-2 text-sm text-gray-300">
            Build safe, adaptive, and self-reflective agentic systems that learn from experience, reason ethically, and expose their inner dynamics to humans.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-lg font-medium">Contributors</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li>• Core team — engineering + research</li>
            <li>• Community contributors — issues, ideas, experiments</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
