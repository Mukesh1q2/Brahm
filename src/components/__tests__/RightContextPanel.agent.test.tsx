import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import RightContextPanel from "@/components/shell/RightContextPanel";
import { useAgentEventBus } from "@/store/agentEventBus";
import { useRightPanelStore } from "@/store/rightPanelStore";

jest.mock("@/components/panels/CodeDiffViewer", () => ({ __esModule: true, default: (p: any) => (
  <div data-testid="code-diff-viewer" data-lang={p.language} />
)}));

// Ensure initial hydrate doesn't break tests
beforeEach(() => {
  localStorage.clear();
  useRightPanelStore.setState({ tab: "summary", activeRunId: null } as any);
});

test("renders summary/trace/diff from agent event bus and run selector", async () => {
  const bus = useAgentEventBus.getState();
  bus.push({ type: "run:start", runId: "r1", agent: "planner", timestamp: 0 });
  bus.push({ type: "trace", runId: "r1", summary: "did planning", json: { step: 1 } });
  bus.push({ type: "patch", runId: "r1", original: "a", modified: "b", language: "ts" });

  render(<RightContextPanel />);

  // Summary tab
  expect(screen.getByTestId("reasoning-summary")).toHaveTextContent("did planning");

  // Switch to Diff
  fireEvent.click(screen.getByTestId("right-panel-tab-diff"));
  await screen.findByTestId("code-diff-viewer");

  // Switch to JSON (trace json)
  fireEvent.click(screen.getByTestId("right-panel-tab-json"));
  expect(screen.getByTestId("json-raw")).toBeInTheDocument();
});

