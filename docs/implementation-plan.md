# Brahm Conscious Ecosystem – Implementation Plan (Phase 1)

This repo now includes pragmatic scaffolding for the roadmap across three focus areas: Consciousness Core, Emotions & Dreams, and Wisdom Engine. The design favors safe, testable stubs with clear contracts that can be extended.

- Consciousness Kernel: `src/lib/conscious/kernel.ts`
  - Attention/Salience/Phi/Ethics/Tools/Safety modules wired.
  - New: EmotionSynthesizer (`emotion.ts`) and DreamSimulationEngine (`dream.ts`).
  - Kernel emits an action event summarizing synthesized emotion per step; a `dream()` helper runs dream sessions.

- Emotions (Vedic Guna-based): `src/lib/conscious/emotion.ts`
  - Compute synthetic emotion from guna weights and context; defaults: sattva 0.6, rajas 0.3, tamas 0.1.
  - API: `GET /api/consciousness/emotion?text=...&sattva=0.6&rajas=0.3&tamas=0.1&compassion=true`.

- Dreams (Memory consolidation + creative synthesis): `src/lib/conscious/dream.ts`
  - Combines recent episodic memories into novel ideas.
  - API: `POST /api/consciousness/dream { duration_ms }`.
  - UI: Console → Consciousness adds a “Run dream” button.

- Wisdom Engine (Vedic Teacher): `src/lib/wisdom/*`
  - `vedicCorpus.ts` (small sample corpus), `quantumVedantaBridge.ts` (analogy mapping stubs), `dharma.ts` (daily guidance), `teacher.ts` (orchestrator).
  - API: `GET /api/wisdom/teach?q=...&svabhava=engineer&ashrama=grihastha`.

- Tests: Jest unit tests under `src/lib/conscious/__tests__` and `src/lib/wisdom/__tests__`.

Next steps (suggested):
- Expand corpus and add vector search for scriptures (Qdrant integration present in `mind-stub/`).
- Add explicit KernelEvent for emotion and optional UI tiles for emotions/dream insights.
- Tie phi weights to active-inference error and emotion intensity for adaptive modulation.
- Add privacy-safe sharing contracts for BrahmNet and a local stub.

