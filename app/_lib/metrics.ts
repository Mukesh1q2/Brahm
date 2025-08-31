export function pushBounded<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  return arr.slice(-max);
}

