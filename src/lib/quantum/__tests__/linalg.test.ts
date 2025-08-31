import { C, initState, applySingle, H, X, Z, applyCNOT, probabilities } from '@/lib/quantum/linalg';

function approx(a: number, b: number, eps=1e-6) { expect(Math.abs(a-b)).toBeLessThan(eps); }

describe('linalg gates', () => {
  test('H on |0> creates equal superposition', () => {
    const s0 = initState(1); // |0>
    const s1 = applySingle(1, 0, H, s0);
    const p = probabilities(s1);
    approx(p[0], 0.5); approx(p[1], 0.5);
  });

  test('X flips |0> to |1>', () => {
    const s0 = initState(1);
    const s1 = applySingle(1, 0, X, s0);
    const p = probabilities(s1);
    approx(p[0], 0); approx(p[1], 1);
  });

  test('Z leaves |0> invariant', () => {
    const s0 = initState(1);
    const s1 = applySingle(1, 0, Z, s0);
    const p = probabilities(s1);
    approx(p[0], 1); approx(p[1], 0);
  });

  test('CNOT on |10> flips target', () => {
    // |10> = index 2
    const s = Array.from({length: 4}, (_,i) => i===2? C(1,0):C(0,0));
    const out = applyCNOT(2, 1, 0, s); // control q1, target q0
    const p = probabilities(out);
    approx(p[2], 0); approx(p[3], 1);
  });
});

