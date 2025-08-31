# Brahm AI — Technical Blueprint & Implementation Scaffold
*A modern, measurement-first, feature-flagged path to a self-evolving AI system with a ChatGPT-style UI and a Futuristic console.*

**Status:** living document • **Scope:** end-to-end plan + code scaffolding • **Audience:** engineers, SRE, product

---

## 0) Why this blueprint
This file unifies our shipped UI work (ChatGPT-style chat, Futuristic Shell, telemetry/debug), the Conscious-AI research blueprint, and the Brahm roadmap (Panini constraints, ethics, agents, eval). It is implementation-ready: you can copy the code snippets into the repo as a baseline or compare against your current modules.

> Everything here is behind feature flags and measured with telemetry to keep CI green and production safe.

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
```bash
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
```

4) ChatGPT-style shell — core code
See the source blueprint for detailed code snippets.

5) Agent graph + algorithms (Dijkstra/A*/BFS)
Utilities and UI integration guidance included.

6) Metadata envelope (auto-open right drawer)
Contracts and parser stubs included.

7) Telemetry
Browser events and ClickHouse rollups.

8) Tests
Playwright smoke and unit tests guidance.

9) Backend contracts
Header requirements and minimal response shapes.

10) Ethics & Panini hooks (FE contract)
Types and UI behavior.

11) Self-evolution (console UX stubs)
Timeline card schema and diff reuse.

12) Security & DevOps
Vault/secrets, policy audit, kill-switch plumbing.

13) Conscious-AI fusion
Right panel trace, graph workspaces, self-model surfacing.

14) Roadmap fit
Phase summaries covering what’s shipped and planned.

15) Deployment & ops notes
Flags/canaries and CI smoke.

16) Initial PR stack
Graph UI, metadata envelope, policy UI, eval hooks.

17) Appendix
Telemetry listener and CommandK actions.

