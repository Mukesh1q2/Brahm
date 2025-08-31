import "@testing-library/jest-dom";
import { __RIGHT_PANEL_KEY__, useRightPanelStore } from "@/store/rightPanelStore";

beforeEach(() => {
  localStorage.clear();
  // reset store to initial
  useRightPanelStore.setState({ tab: "summary" });
});

test("defaults to summary", () => {
  expect(useRightPanelStore.getState().tab).toBe("summary");
});

test("hydrate reads from localStorage", () => {
  localStorage.setItem(__RIGHT_PANEL_KEY__, "diff");
  useRightPanelStore.getState().hydrate();
  expect(useRightPanelStore.getState().tab).toBe("diff");
});

test("setTab persists to localStorage", () => {
  useRightPanelStore.getState().setTab("json");
  expect(localStorage.getItem(__RIGHT_PANEL_KEY__)).toBe("json");
});

