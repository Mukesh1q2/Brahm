import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import RightContextPanel from "@/components/shell/RightContextPanel";
import { __RIGHT_PANEL_KEY__ } from "@/store/rightPanelStore";

beforeEach(() => localStorage.clear());

test("renders tabs and switches between them", () => {
  render(<RightContextPanel reasoningSummary="hello" reasoningJson={{ a: 1 }} codeDiff={null} />);

  // default: summary
  expect(screen.getByTestId("reasoning-summary")).toBeInTheDocument();

  fireEvent.click(screen.getByTestId("right-panel-tab-json"));
  expect(screen.getByTestId("json-raw")).toBeInTheDocument();
});

test("persists tab selection in localStorage", () => {
  render(<RightContextPanel reasoningSummary="x" reasoningJson={{}} codeDiff={null} />);
  fireEvent.click(screen.getByTestId("right-panel-tab-diff"));
  expect(localStorage.getItem(__RIGHT_PANEL_KEY__)).toBe("diff");
});

