export type C = { re: number; im: number };
export const C = (re=0, im=0): C => ({ re, im });
export const add = (a: C, b: C): C => ({ re: a.re+b.re, im: a.im+b.im });
export const mul = (a: C, b: C): C => ({ re: a.re*b.re - a.im*b.im, im: a.re*b.im + a.im*b.re });
export const conj = (a: C): C => ({ re: a.re, im: -a.im });
export const scale = (a: C, s: number): C => ({ re: a.re*s, im: a.im*s });
export const abs2 = (a: C): number => a.re*a.re + a.im*a.im;
export const expi = (phi: number): C => ({ re: Math.cos(phi), im: Math.sin(phi) });

export type State = C[]; // length 2^n

export function initState(n: number, psi?: { alpha: C; beta: C; onQubit?: number }): State {
  const dim = 1<<n; const st: State = Array.from({length: dim}, () => C(0,0));
  if (!psi) { st[0] = C(1,0); return st; }
  const q = Math.max(0, Math.min(n-1, psi.onQubit ?? 0));
  // set |alpha>|0...> + |beta>|1...> on qubit q, rest 0
  for (let i=0;i<dim;i++) {
    const bit = (i >> q) & 1;
    const base = (i & ~(1<<q));
    if (i === base) st[i] = psi.alpha; // when bit 0
    if (bit===1 && (i & ~(1<<q)) === base) st[i] = psi.beta;
  }
  return st;
}

export function cloneState(s: State): State { return s.map(x => ({ re: x.re, im: x.im })); }

// Single-qubit gates
export const H = [C(1/Math.SQRT2,0), C(1/Math.SQRT2,0), C(1/Math.SQRT2,0), C(-1/Math.SQRT2,0)]; // row-major 2x2
export const X = [C(0,0), C(1,0), C(1,0), C(0,0)];
export const Z = [C(1,0), C(0,0), C(0,0), C(-1,0)];
export const S = [C(1,0), C(0,0), C(0,0), C(0,1)]; // phase pi/2

export function applySingle(n: number, target: number, U: C[], state: State): State {
  const dim = 1<<n; const out = Array.from({length: dim}, ()=> C(0,0));
  for (let i=0;i<dim;i++) {
    const b = (i>>target)&1; const i0 = i & ~(1<<target); const i1 = i0 | (1<<target);
    const a0 = state[i0]; const a1 = state[i1];
    // out[i0] = U00*a0 + U01*a1; out[i1] = U10*a0 + U11*a1
    out[i0] = add(mul(U[0], a0), mul(U[1], a1));
    out[i1] = add(mul(U[2], a0), mul(U[3], a1));
    i = i1; // skip partner processed
  }
  return out;
}

export function applyCNOT(n: number, control: number, target: number, state: State): State {
  // Map amplitudes from input state into output indices.
  // If control bit is 1, flip target bit; else keep index.
  const dim = 1<<n; const out: State = Array.from({length: dim}, ()=> C(0,0));
  for (let i=0;i<dim;i++) {
    const ctrl = ((i>>control)&1)===1;
    const j = ctrl ? (i ^ (1<<target)) : i;
    // Since CNOT is a permutation, direct assignment is sufficient.
    out[j] = state[i];
  }
  return out;
}

export function applyCPHASE(n: number, control: number, target: number, phi: number, state: State): State {
  const dim = 1<<n; const out = cloneState(state);
  const phase = expi(phi);
  for (let i=0;i<dim;i++) {
    if (((i>>control)&1)===1 && ((i>>target)&1)===1) out[i] = mul(out[i], phase);
  }
  return out;
}

export function probabilities(state: State): number[] { return state.map(abs2); }
