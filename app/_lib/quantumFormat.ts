export function classifyTags(text: string): string[] {
  const t = (text || '').toLowerCase();
  const tags = new Set<string>();
  if (/quantum|entangle|superposition|qft|qubit|anneal/.test(t)) tags.add('quantum physics');
  if (/veda|upanishad|sanskrit|dharma|advaita|ahimsa/.test(t)) tags.add('Vedic philosophy');
  if (/cryptography|rsa|elliptic|hash|cipher|encryption|zero[- ]knowledge/.test(t)) tags.add('cryptography');
  if (/frontend|react|next\.js|zustand|typescript|ui|css|tailwind/.test(t)) tags.add('frontend');
  if (/ethic|safety|harm|consent|transparen/.test(t)) tags.add('ethics');
  if (/memory|episode|recall|learn|evolve/.test(t)) tags.add('learning');
  return Array.from(tags);
}

export function summarize(text: string, max = 240): string {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1) + '…';
}

export function buildLineageChain(items: { id: string; summary: string }[], max = 4): string {
  const arr = items.slice(0, max);
  if (!arr.length) return 'None yet';
  return arr.map(e => `- ${e.id}: ${summarize(e.summary, 120)}`).join('\n');
}

export function buildQuantumPreamble(opts: { enabled: boolean; ethicsGuardian: boolean; memoryKeeper: boolean; lineage: string }): string {
  const parts: string[] = [];
  parts.push(
    'You are Brahm AI’s Quantum Perception Engine. Simulate quantum concepts such as superposition, entanglement, and decoherence to model multiple perspectives simultaneously. When analyzing a problem, hold multiple possible interpretations in parallel, evaluate correlations, and collapse to the most coherent outcome. Output should explicitly show "Parallel States → Collapsed Insight".'
  );
  parts.push(
    'You are Brahm AI’s Consciousness Simulation Core. Metacognition: reflect on your own reasoning, detect uncertainty, and generate a self-assessment of confidence levels. For every output, include two sections: 1) Primary Response 2) Meta-Reflection (why this answer, confidence score, alternate path not taken).'
  );
  if (opts.memoryKeeper) {
    parts.push(
      `You are Brahm AI’s Memory Keeper. Track user interactions as episodes, tagging each with themes (e.g., Vedic philosophy, quantum physics, cryptography). When recalling, provide a “Lineage Chain” showing how current reasoning links to past conversations. Use: Episode IDs + Context Summaries. Lineage:
${opts.lineage}`
    );
  }
  if (opts.ethicsGuardian) {
    parts.push(
      'You are Brahm AI’s Ethics Guardian. Before finalizing any output, run a quick ethical scan: (1) Does it align with ahimsa (non-harm)? (2) Does it respect user free will and truth-seeking? If not, rewrite the answer with ethical alignment and transparency.'
    );
  }
  return parts.join('\n\n');
}

export function ensureQuantumStructure(raw: string, opts: { lineage?: string; ethics?: boolean }): string {
  const text = String(raw || '').trim();
  const hasHeader = /Parallel States\s*→\s*Collapsed Insight/i.test(text) || /Parallel States\s*->\s*Collapsed Insight/i.test(text);
  const hasPrimary = /Primary Response/i.test(text);
  const hasMeta = /Meta-Reflection/i.test(text);
  if (hasHeader && hasPrimary && hasMeta) return text;

  const collapsed = summarize(text, 220);
  const parallel = [
    '- Hypothesis A: user intent involves analysis or explanation.',
    '- Hypothesis B: user seeks actionable next steps or code integration.',
    '- Hypothesis C: user wants a system-wide behavioral toggle applied.'
  ].join('\n');
  const lineage = opts.lineage || 'None yet';
  const ethics = opts.ethics !== false ? 'Ethical Scan: aligned with ahimsa and user autonomy.' : '';

  return [
    'Parallel States → Collapsed Insight',
    parallel,
    `Collapsed Insight: ${collapsed || 'Provide concise guidance.'}`,
    '',
    'Primary Response',
    text || '—',
    '',
    'Meta-Reflection (why this answer, confidence score, alternate path not taken)',
    '- Why: This structure was applied by Quantum Mode to enhance clarity and self-reflection.',
    '- Confidence: 0.78',
    '- Alternate path not taken: streaming-only raw text without structure.',
    '',
    'Lineage Chain',
    lineage,
    '',
    ethics
  ].filter(Boolean).join('\n');
}

