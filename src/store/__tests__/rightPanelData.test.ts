import "@testing-library/jest-dom";
import { act } from "@testing-library/react";
import { useRightPanelData } from "@/store/rightPanelData";

test("setAll updates summary/json", () => {
  act(() => {
    useRightPanelData.getState().setAll({ summary: "hello", json: { a: 1 }, codeDiff: null });
  });
  const s = useRightPanelData.getState();
  expect(s.summary).toBe("hello");
  expect(s.json).toEqual({ a: 1 });
  expect(s.codeDiff).toBeNull();
});

test("setCodeDiff updates diff only", () => {
  act(() => {
    useRightPanelData.getState().setAll({ summary: "x", json: { a: 1 }, codeDiff: null });
  });
  act(() => {
    useRightPanelData.getState().setCodeDiff({ original: "o", modified: "m", language: "js" });
  });
  const s = useRightPanelData.getState();
  expect(s.summary).toBe("x");
  expect(s.json).toEqual({ a: 1 });
  expect(s.codeDiff).toEqual({ original: "o", modified: "m", language: "js" });
});

test("council metadata is stored and readable (smoke)", () => {
  const council = { trace: [{ name: 'concise', output: 'ok' }], votes: { concise: 0.7, skeptic: 0.3 }, spotlight: 'concise' };
  act(() => {
    useRightPanelData.getState().setAll({ summary: 's', json: { any: true }, codeDiff: null, council });
  });
  const s = useRightPanelData.getState();
  expect(s.council).toBeTruthy();
  expect(s.council?.trace?.[0]?.name).toBe('concise');
  expect(s.council?.votes?.concise).toBeCloseTo(0.7, 2);
  expect(s.council?.spotlight).toBe('concise');
});

