# Changelog

## 2025-08-25

Highlights
- Added comprehensive PP modulation unit tests (extremes, clamping, monotonicity, sensitivity, component invariance).
- Added kernel tests: predictionError threading into calculatePhi and CIPS weights evolution application.
- Added UI integration tests for RightContextPanel (PP badge updates, weight badge updates, toggle badges).
- Stabilized Playwright E2E tests with robust waits against agent event bus and safer selectors.
- Fixed JSX escaping in RightContextPanel badges.
- Ensured full Jest + Playwright green locally.

Details
- src/lib/conscious/__tests__/phi-weights.test.ts: PP modulation tests and component monotonicity checks.
- src/lib/conscious/__tests__/kernel-phiweights.test.ts: predictionError threading + evolution weights.
- src/components/__tests__/RightContextPanel.ppmod.test.tsx: EventSource-driven badge updates.
- src/components/__tests__/RightContextPanel.toggles.test.tsx: SSE config toggle badges.
- tests/e2e/*: updates to agents-trace, chat-envelopes, cips-* and sse-controls-* specs for stability.
- src/components/shell/RightContextPanel.tsx: corrected className quoting and badges.
- .github/workflows/ci.yml: broadened triggers and ensured Jest + Playwright run on push/PR.
