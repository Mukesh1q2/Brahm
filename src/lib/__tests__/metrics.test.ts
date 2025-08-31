import "@testing-library/jest-dom";
import { pushBounded } from "@/app/_lib/metrics";

test("pushBounded trims array to max size", () => {
  const arr = Array.from({ length: 5 }, (_, i) => i);
  const out = pushBounded(arr, 3);
  expect(out).toEqual([2,3,4]);
});

test("pushBounded returns same array if under limit", () => {
  const arr = [1,2];
  const out = pushBounded(arr, 3);
  expect(out).toEqual([1,2]);
});

