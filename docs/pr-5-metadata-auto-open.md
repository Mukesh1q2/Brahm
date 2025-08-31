# PR-5: Mocked metadata envelope and right-panel auto-open

Status: Ready behind flags

Summary
- Adds a tolerant newline-delimited JSON parser for “metadata envelopes” streamed within normal assistant text.
- On envelope, updates the global right panel and auto-switches to the most relevant tab (Diff, Trace, or Summary).
- Fully feature-flagged and backed by a mocked streaming endpoint for demos.

Envelope format (mock)
- Accepted payload (line-delimited JSON):
  - { "type": "metadata", "reasoning": string | object, "diff": string | { original?: string, modified: string, language?: string }, "tab"?: "summary"|"trace"|"json"|"diff"|"memory" }
- Notes:
  - reasoning can be a short summary string (maps to Summary) or a JSON object (maps to Trace/JSON).
  - diff can be a raw string (modified only) or an object with original/modified/language (maps to Diff).
  - tab is optional and overrides the inferred tab when provided.

Feature flags
- NEXT_PUBLIC_CHATGPT_UI=true to enable the chat UI (or use the palette “Open Chat UI” override).
- NEXT_PUBLIC_CHAT_METADATA_AUTOOPEN=true to enable auto-switching (default true).

Files
- app/_lib/envelope.ts — envelope parser (createEnvelopeParser) and types.
- app/_components/chatgpt/ChatComposer.tsx — wires the stream to the parser and triggers right-panel updates.
- app/api/chat/route.ts — mocked streaming endpoint emitting reasoning and diff envelopes for demos.

How to demo
1) Ensure flags are set in .env.local:
   - NEXT_PUBLIC_CHATGPT_UI=true
   - NEXT_PUBLIC_CHAT_METADATA_AUTOOPEN=true
2) Navigate to /chat.
3) Send any message.
4) Observe: the right drawer updates with reasoning, then auto-switches to Diff when the diff envelope arrives.

Testing
- Unit: tests/unit/envelope-parser.test.ts validates parsing, filtering, and partial-chunk handling.
- E2E: e2e/chat-auto-open-diff.spec.ts sends a chat and asserts the Diff tab auto-opens and renders the CodeDiff viewer.

Backend alignment
- The parser is intentionally forgiving; when the real backend schema is finalized, swap the envelope mapping in one place (onMetadata callback).
- If the backend emits a different field name (e.g., metadata.reasoning_trace), adapt the mapping without changing the UI surface.

Limitations
- The mocked endpoint emits text/plain with line-delimited JSON for simplicity.
- Large diffs and non-line-delimited formats would require minor parser tweaks but the UI contract remains.

