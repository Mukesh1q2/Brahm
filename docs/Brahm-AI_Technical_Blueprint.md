# Brahm AI — Technical Blueprint & Implementation Scaffold
*A modern, measurement-first, feature-flagged path to a self-evolving AI system with a ChatGPT-style UI and a Futuristic console.*

**Status:** living document • **Scope:** end-to-end plan + code scaffolding • **Audience:** engineers, SRE, product

---

## 0) Why this blueprint
This file unifies our shipped UI work (ChatGPT-style chat, Futuristic Shell, telemetry/debug), the Conscious-AI research blueprint, and the Brahm roadmap (Panini constraints, ethics, agents, eval). It is implementation-ready: you can copy the code snippets into the repo as a baseline or compare against your current modules.

> Everything here is **behind feature flags** and measured with telemetry to keep CI green and production safe.

---

## 1) Architecture at a glance

```mermaid
flowchart LR
  subgraph Frontend (Next.js)
    Chat[/ChatGPT UI/] --> RightPanel[Right Context Panel\nSummary | Trace | JSON | Diff]
    Chat --> Telemetry[Telemetry Emitter]
    FutShell[Futuristic Shell] --> CommandK[Command Palette]
    GraphUI[Agent Graph (R3F/D3)] --> AlgoToggles[Dijkstra | A* | BFS]
    DebugPanel((Debug Drawer))
  end

  subgraph Agents (FE runtime + BE)
    AgentRunner[Agent Runner\nExecutive/Manager/Worker/Auditor]
    RunBus[Agent Run Event Bus\npushRunStart/Trace/Patch/End]
    Pathfind[Pathfinding Service\nDijkstra, A*]
  end

  subgraph Backend APIs
    APIChat[/POST /api/chat (stream)/]
    APIUpload[/POST /files/upload/]
    APIAudit[/POST /audit/query/]
    APITelemetry[/ingest telemetry → ClickHouse/]
  end

  subgraph Safety & Policy
    OPA[OPA/Rego Policies]
    Guardian[Guardian Service\nstatic analysis + policy]
    Panini[Panini/Nyaya Checks]
  end

  Chat -- X-Client-App: chat --> APIChat
  Telemetry --> APITelemetry
  DebugPanel -. listens .-> Telemetry
  RunBus --> RightPanel
  GraphUI --> Pathfind
  AgentRunner --> RunBus
  Guardian --> APIChat
  OPA --> APIChat
  Panini --> APIChat
```
Kosha mapping → modern stack

Annamaya (Body / Data): K8s, Postgres, S3/MinIO, ingestion workers, vLLM; frontend stubs provided here; backend per roadmap.

Prāṇamaya (Energy / APIs): FastAPI gateway, tool runtime, Guardian; headers & contracts documented.

Manomaya (Mind / Reasoning): Agent runner + pathfinding/graph; UI & algorithm hooks implemented.

Vijñānamaya (Meta / Self-evolution): Auto-PR console, eval gating; UI stubs and telemetry stitched.

Ānandamaya (Ethics / Purpose): Constitution, OPA, explainable refusals; contracts & hooks described.

2) Feature flags & runtime config
Flag	Default	Purpose
NEXT_PUBLIC_FUTURISTIC_UI	false	Enables the Futuristic Shell (left nav + right context).
NEXT_PUBLIC_CHATGPT_UI	false	Enables the ChatGPT-style /chat shell.
NEXT_PUBLIC_DEBUG_PANEL	false	Shows floating Telemetry debug drawer.
Local override	CHATGPT_UI_OVERRIDE='true'	Forces /chat on regardless of env flag (set via CommandK).

Headers we standardize for backend calls

X-Model (from ModelContext)

X-Request-Id (uuidv4 per request; echoed in telemetry)

X-Client-App (console | editor | chat | agents)

3) Directory layout (delta to your repo)
bash
Always show details

Copy
app/
  chat/page.tsx                       # ChatGPT-style UI (flagged)
  _components/chatgpt/
    ChatLayout.tsx
    Sidebar.tsx
    ChatHeader.tsx
    ModelPill.tsx
    MessageList.tsx
    MessageBubble.tsx
    ChatComposer.tsx
  _components/
    RightContextPanel/
      RightContextPanel.tsx           # Tabs: Summary | Trace | JSON | Diff
    TelemetryDebug.tsx                # Feature-flagged debug drawer
    FuturisticShell/                  # (existing) left nav + right pane + CommandK
  _stores/
    chatStore.ts                      # Zustand: conversations/messages
    rightPanelStore.ts                # Active tab + activeRun
  _lib/
    api.ts                            # sendChat() streaming + telemetry
    envelope.ts                       # (Option A) metadata envelope parser
    pathfind/
      dijkstra.ts
      astar.ts
      bfs.ts
    agents/
      runEvents.ts                    # pushRunStart/Trace/Patch/End
  api/                                # (existing) routes; BE integration TBD
tests/
  e2e/*.spec.ts                       # Playwright smoke (console/chat/editor/canvas)
  unit/*.test.tsx                     # ModelContext, SiteHeader, stores, panels
4) ChatGPT-style shell — core code
4.1 app/_lib/api.ts (streaming + telemetry)
ts
Always show details

Copy
// app/_lib/api.ts
import { v4 as uuid } from "uuid";

export type ChatStreamInfo = {
  stream: ReadableStream<Uint8Array> | null;
  trace: string;
  status: number;
  requestModel: string;
  responseModel?: string;
  t0: number;
};

const APP = "chat";

export async function sendChat(input: { content: string; model: string }) {
  const trace = uuid();
  const t0 = performance.now();

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": trace,
      "X-Client-App": APP,
      "X-Model": input.model,
    },
    body: JSON.stringify({ messages: [{ role: "user", content: input.content }] }),
  });

  const responseModel = res.headers.get("X-Model") ?? undefined;

  // fire start event
  window.dispatchEvent(new CustomEvent("telemetry:request", {
    detail: { trace, app: APP, model: input.model, status: res.status }
  }));

  if (!res.ok || !res.body) {
    window.dispatchEvent(new CustomEvent("telemetry:request-complete", {
      detail: {
        trace, app: APP, ok: false, status: res.status,
        clientLatencyMs: performance.now() - t0, bytesStreamed: 0, charsStreamed: 0,
        requestModel: input.model, responseModel
      }
    }));
    return { stream: null, trace, status: res.status, requestModel: input.model, responseModel, t0 } as ChatStreamInfo;
  }

  return { stream: res.body, trace, status: res.status, requestModel: input.model, responseModel, t0 } as ChatStreamInfo;
}

// helper to finalize telemetry after the stream is consumed
export function completeTelemetry(info: ChatStreamInfo, bytes: number, chars: number) {
  const { trace, requestModel, responseModel, t0 } = info;
  window.dispatchEvent(new CustomEvent("telemetry:request-complete", {
    detail: {
      trace, app: "chat", ok: true, status: 200,
      clientLatencyMs: performance.now() - t0,
      bytesStreamed: bytes, charsStreamed: chars,
      requestModel, responseModel
    }
  }));
}
4.2 app/_components/chatgpt/ChatComposer.tsx (auto-grow, shortcuts, telemetry finalize)
tsx
Always show details

Copy
"use client";
import { useRef, useState, useEffect } from "react";
import { useChatStore } from "@/app/_stores/chatStore";
import { sendChat, completeTelemetry } from "@/app/_lib/api";
import { useModel } from "@/app/_components/ModelContext";

export default function ChatComposer() {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const { model } = useModel();
  const { appendUserAndStageAssistant, streamAssistant } = useChatStore();

  // auto-grow up to ~8 lines
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const max = 8 * 24; // assuming ~24px line-height
    ta.style.height = Math.min(ta.scrollHeight, max) + "px";
  }, [value]);

  async function onSend() {
    if (!value.trim()) return;
    const content = value;
    setValue("");
    const convoId = appendUserAndStageAssistant(content); // adds user and a placeholder assistant

    const info = await sendChat({ content, model });
    if (!info.stream) return;

    // stream tokens
    const reader = info.stream.getReader();
    let bytes = 0, chars = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        bytes += value.byteLength;
        const text = decoder.decode(value, { stream: true });
        chars += text.length;
        streamAssistant(convoId, text);
      }
    }
    completeTelemetry(info, bytes, chars);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSend();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="w-full bg黑/40 backdrop-blur-md rounded-2xl p-3 border border-white/10">
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder="Type a message…  (Shift+Enter = newline, ⌘/Ctrl+Enter = send)"
        className="w-full bg-transparent outline-none resize-none text-sm md:text-base"
      />
      <div className="flex justify-end pt-2">
        <button onClick={onSend} className="px-3 py-1 rounded-lg border border-white/10 hover:bg-white/5">
          Send
        </button>
      </div>
    </div>
  );
}
4.3 Right panel tabs + agent-run wiring (summary/trace/json/diff)
ts
Always show details

Copy
// app/_lib/agents/runEvents.ts
export type AgentRunId = string;
export type RunEvent =
  | { type: "run:start"; runId: AgentRunId; agent: string; at: number; summary?: string }
  | { type: "run:trace"; runId: AgentRunId; at: number; trace: string | object }
  | { type: "run:patch"; runId: AgentRunId; at: number; diff: string; path?: string }
  | { type: "run:end"; runId: AgentRunId; at: number; result?: string; ok: boolean };

export const AgentBus = {
  listeners: new Set<(e: RunEvent) => void>(),
  on(fn: (e: RunEvent) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit(e: RunEvent) { this.listeners.forEach(l => l(e)); }
};

// helpers for pages to call:
export const pushRunStart = (runId: AgentRunId, agent: string, summary?: string) =>
  AgentBus.emit({ type: "run:start", runId, agent, at: Date.now(), summary });
export const pushTrace = (runId: AgentRunId, trace: any) =>
  AgentBus.emit({ type: "run:trace", runId, at: Date.now(), trace });
export const pushPatch = (runId: AgentRunId, diff: string, path?: string) =>
  AgentBus.emit({ type: "run:patch", runId, at: Date.now(), diff, path });
export const pushRunEnd = (runId: AgentRunId, ok: boolean, result?: string) =>
  AgentBus.emit({ type: "run:end", runId, at: Date.now(), ok, result });
Right panel store (active tab & run):

ts
Always show details

Copy
// app/_stores/rightPanelStore.ts
import { create } from "zustand";

type Tab = "summary" | "trace" | "json" | "diff";
type RunData = { runId: string; summary?: string; traces: any[]; json?: any; diff?: string };

type State = {
  open: boolean;
  tab: Tab;
  activeRun?: string;
  runs: Record<string, RunData>;
  setOpen(open: boolean): void;
  setTab(tab: Tab): void;
  upsertRun(run: RunData): void;
  setActiveRun(id: string): void;
  appendTrace(runId: string, t: any): void;
  setDiff(runId: string, d: string): void;
};

export const useRightPanel = create<State>((set) => ({
  open: false,
  tab: "summary",
  runs: {},
  setOpen: (open) => set({ open }),
  setTab: (tab) => set({ tab }),
  setActiveRun: (activeRun) => set({ activeRun }),
  upsertRun: (run) => set((s) => ({ runs: { ...s.runs, [run.runId]: { traces: [], ...s.runs[run.runId], ...run } }, activeRun: run.runId })),
  appendTrace: (runId, t) => set((s) => (s.runs[runId] ? (s.runs[runId].traces.push(t), { runs: { ...s.runs } }) : s)),
  setDiff: (runId, d) => set((s) => (s.runs[runId] ? (s.runs[runId].diff = d, { runs: { ...s.runs } }) : s)),
}));
A minimal RightPanel component subscribes to AgentBus and writes into the store. (Omitted here for brevity; you already have it wired in your branch.)

5) Agent graph + algorithms (Dijkstra/A*/BFS)
5.1 Pathfinding utilities
ts
Always show details

Copy
// app/_lib/pathfind/dijkstra.ts
export type Edge = { to: string; cost: number };
export type Graph = Record<string, Edge[]>;

export function dijkstra(graph: Graph, start: string, goal?: string) {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const q = new Set(Object.keys(graph));
  for (const v of q) { dist.set(v, Infinity); prev.set(v, null); }
  dist.set(start, 0);

  while (q.size) {
    let u: string | null = null, min = Infinity;
    for (const v of q) { const d = dist.get(v)!; if (d < min) { min = d; u = v; } }
    if (u == null) break;
    q.delete(u);
    if (goal && u === goal) break;
    for (const e of graph[u] || []) {
      const alt = dist.get(u)! + e.cost;
      if (alt < dist.get(e.to)!) { dist.set(e.to, alt); prev.set(e.to, u); }
    }
  }
  const path: string[] = [];
  if (goal) {
    let u: string | null = goal;
    if (prev.get(u) !== null || u === start) {
      while (u) { path.unshift(u); u = prev.get(u) ?? null; }
    }
  }
  return { dist, prev, path };
}
ts
Always show details

Copy
// app/_lib/pathfind/astar.ts
export function astar(graph: Graph, start: string, goal: string, heuristic: (n: string) => number) {
  const open = new Set<string>([start]);
  const came = new Map<string, string | null>();
  const g = new Map<string, number>();
  const f = new Map<string, number>();
  for (const v of Object.keys(graph)) { g.set(v, Infinity); f.set(v, Infinity); }
  g.set(start, 0); f.set(start, heuristic(start)); came.set(start, null);

  while (open size) {
    let current = "", min = Infinity;
    for (const v of open) { const fv = f.get(v)!; if (fv < min) { min = fv; current = v; } }
    if (current === goal) break;
    open.delete(current);
    for (const e of graph[current] || []) {
      const tentative = g.get(current)! + e.cost;
      if (tentative < g.get(e.to)!) {
        came.set(e.to, current);
        g.set(e.to, tentative);
        f.set(e.to, tentative + heuristic(e.to));
        open.add(e.to);
      }
    }
  }
  const path: string[] = []; let cur: string | null = goal;
  while (cur) { path.unshift(cur); cur = came.get(cur) ?? null; }
  return { path, g, f };
}
ts
Always show details

Copy
// app/_lib/pathfind/bfs.ts
export function bfs(graph: Graph, start: string, goal: string) {
  const q: string[] = [start];
  const prev = new Map<string, string | null>(); prev.set(start, null);
  while (q.length) {
    const u = q.shift()!;
    if (u === goal) break;
    for (const e of graph[u] || []) {
      if (!prev.has(e.to)) { prev.set(e.to, u); q.push(e.to); }
    }
  }
  const path: string[] = []; let cur: string | null = goal;
  while (cur) { path.unshift(cur); cur = prev.get(cur) ?? null; }
  return { path, prev };
}
5.2 UI integration (Algorithm toggles + highlights)
Put an “Algorithm” control in the Graph page to switch Dijkstra/A*/BFS.

Animate the current shortest path; show edge latencies on hover.

Telemetry: log algorithm choice and path cost.

6) Metadata envelope (auto-open right drawer)
Chunked streaming contract (example)

css
Always show details

Copy
data: {"type":"token","text":"…"}
data: {"type":"metadata","reasoning":"…","diff":"--- a\n+++ b\n…"}
data: {"type":"complete"}
Parser stub

ts
Always show details

Copy
// app/_lib/envelope.ts
export type Envelope = { type: "token"|"metadata"|"complete"; [k: string]: any };

export function parseSSELine(line: string): Envelope | null {
  if (!line startsWith("data:")) return null;
  try { return JSON.parse(line.slice(5).trim()); } catch { return null; }
}
Auto-open logic

When type === "metadata" → write summary/trace/json/diff into rightPanelStore, set tab (e.g., “diff”), and setOpen(true).

7) Telemetry
Events fired in the browser

telemetry:request → { trace, app, model, status }

telemetry:request-complete → { trace, app, ok, status, clientLatencyMs, bytesStreamed, charsStreamed, requestModel, responseModel }

Headers asserted in E2E

X-Model, X-Request-Id, X-Client-App

ClickHouse weekly rollup (server-side)

sql
Always show details

Copy
SELECT
  toStartOfWeek(ts) AS week,
  count() AS requests,
  round(avg(client_latency_ms),2) AS p50_client_latency_ms,
  sum(bytes_streamed) AS total_bytes,
  anyHeavy(request_model) AS common_request_model
FROM telemetry_events
WHERE ts >= now() - INTERVAL 30 DAY
GROUP BY week
ORDER BY week DESC;
Debug panel

NEXT_PUBLIC_DEBUG_PANEL=true enables floating drawer that subscribes to both events.

8) Tests (what we already have + what to keep adding)
E2E (Playwright)

console.spec.ts → intercept /audit/query; assert headers + telemetry.

editor.spec.ts → intercept /files/upload; assert headers + telemetry.

chat.spec.ts → send message; verify stream UI; verify telemetry:request + request-complete.

canvas.spec.ts → use E2E hook to push run events and assert right panel tabs render.

Unit + snapshots

ModelContext.test.tsx → default model “auto”, rate table.

SiteHeader.test.tsx → visible copy + basic interactions.

rightPanelStore.test.tsx → hydrate + activeRun persistence (recommended).

chatStore.test.ts → append, retry, delete conversation.

9) Backend contracts (to keep FE stable)
Endpoint	Method	Headers (required)	Response (min)
/api/chat	POST (stream)	X-Request-Id, X-Client-App, X-Model	text/event-stream or fetch ReadableStream; optional X-Model in response headers
/files/upload	POST	X-Request-Id, X-Client-App	{ id, name, size }
/audit/query	POST	X-Request-Id, X-Client-App, X-Model	{ ok, findings, costs }
/telemetry/ingest	POST	(server-to-CH)	202

Policy & safety adapters

Guardian: static analysis + policy decision (allow/deny/explain).

OPA: Rego bundle; return {allow: boolean, reason: string[]}.

Panini/Nyaya: return {ok: boolean, sutra?: string, explanation?: string}.

10) Ethics & Panini hooks (FE contract)
ts
Always show details

Copy
// Types exchanged with safety adapters
export type SafetyVerdict = {
  allow: boolean;
  reasons: string[];
  constitution?: { clause: string; rationale: string }[];
  panini?: { sutra: string; valid: boolean; note?: string };
}
UI behavior:

If allow=false, show an inline refusal with an “Explain” accordion that expands to reasons + constitution clauses.

Telemetry counts “blocked-unsafe actions” and ties to requestId.

11) Self-evolution (console UX stubs)
Timeline card schema (FE)

ts
Always show details

Copy
type EvoCard = {
  id: string;
  type: "auto-pr"|"eval"|"deploy";
  title: string;
  summary: string;
  diff?: string;
  kpis?: { success?: number; truth?: number; cost?: number; latency?: number };
  status: "proposed"|"canary"|"merged"|"rolled-back";
  links?: { pr?: string; run?: string; };
}
Right panel “Diff” tab already displays code diffs; reuse it for Auto-PR previews.

12) Security & DevOps (FE-visible parts + roadmap)
Vault secrets and row-level permissions: backend work; FE asserts headers and shows capability UI only when BE advertises support.

Policy audit logs: add a Policy tab in Console once /policy/audit exists.

Kill-switch plumbing: if a kill flag appears in /config, FE disables risky actions and shows a banner.

13) Conscious-AI fusion (GW/IIT/Active-Inference → Brahm)
We incorporate the research blueprint by:

Rendering a Reasoning Trace with cyclic Perception ↔ Introspection phases (as metadata chunks).

Using Agent Graph to visualize Global Workspace broadcasts (active path glow) and integration via edge weights (telemetry overlays).

Exposing a Self-model summary in the right panel (the “I-state” diagnostics) when provided by backend research runners.

Evaluation axes

Task Success, Truthfulness, Safety incidents, Median latency, Learning velocity, Cost per task.

Integration proxy (Φ-inspired) surfaced as a metric in Eval dashboard (future).

14) Roadmap fit (phases & what’s shipped)
Phase 0 Foundations ✅ Chat MVP, telemetry pipeline (client), CI tests, shell behind flags.

Phase 1 Agentic Webapp ✅ Right panel tabs; run event bus; diff viewer; chat/console tests.

Phase 2 Panini & Voice ⏳ UI hooks for refusals + VAD orb placeholder; awaiting BE voice.

Phase 3 Self-Improvement ⏳ Timeline cards + auto-PR diff integration; awaiting BE pipelines.

Phase 4 Advanced ⏳ Graph with algorithm toggles; math verifier UI hook; GenAI worker badges.

Hardening & GA ⏳ Audit/Policy tabs; A11y pass; mobile PWA polish (ongoing).

15) Deployment & ops notes
All new surfaces are opt-in via flags; no regression to legacy Console.

Use a config.json endpoint to flip flags per-user/session for safe canaries.

Ship Playwright smoke in CI for /chat, Console, Editor, and Agent tabs.

16) Initial PR stack (ready-to-implement)
Graph UI v1 with algorithm toggles

Add a small demo graph, run Dijkstra/A*/BFS, animate path, log telemetry.

Metadata envelope (mock) + auto-open right panel

Feature-flag NEXT_PUBLIC_METADATA_ENVELOPE=true.

Policy refusals UI

Inline card with expandable reasons + constitution clauses.

Eval hooks

Add a tiny Eval page that reads latest telemetry aggregates (mock data now).

17) Appendix — tiny snippets you can drop in
Telemetry listener (tests can reuse)

ts
Always show details

Copy
// tests/utils/telemetryListener.ts
export function attachTelemetry(page: Page) {
  return page.evaluate(() => {
    (window as any).__events = [];
    const collect = (e: any) => (window as any).__events.push({ type: e.type, detail: e.detail });
    window.addEventListener("telemetry:request", collect);
    window.addEventListener("telemetry:request-complete", collect);
  });
}
Command palette actions

ts
Always show details

Copy
// In FuturisticShell CommandK
actions.push(
  { id: "open-chat-ui", title: "Open Chat UI", run: () => { localStorage.setItem("CHATGPT_UI_OVERRIDE","true"); location.href="/chat"; } },
  { id: "disable-chat-ui", title: "Disable Chat UI override", run: () => { localStorage.removeItem("CHATGPT_UI_OVERRIDE"); } },
  { id: "toggle-debug", title: "Toggle Debug Panel", run: () => { window.dispatchEvent(new CustomEvent("debug:toggle")); } },
);
Right panel tab types

ts
Always show details

Copy
export type RightTab = "summary" | "trace" | "json" | "diff";
18) Done is better than perfect
This blueprint gives you a safe, modular path to integrate cutting-edge research with a production-grade UI. It preserves your existing routes, gates risk with flags, and instruments everything. As backend capabilities (voice, policy, auto-PR, eval) land, the UI is ready to light up—no rewrites needed.

