"use client";

import React from 'react';
import axios from 'axios';

export default function MathVerifierPage() {
  const [exprA, setExprA] = React.useState('sin(x)^2 + cos(x)^2');
  const [exprB, setExprB] = React.useState('1');
  const [equiv, setEquiv] = React.useState<boolean|null>(null);
  const [err, setErr] = React.useState<string|null>(null);

  function safeEval(expr: string, x: number): number {
    // highly simplified parser: allow numbers, x, + - * / ^ ( ) and Math. tokens
    const whitelist = /^[0-9x+\-*/^(). \t\n]*$/i;
    if (!whitelist.test(expr)) throw new Error('Invalid characters');
    // replace ^ with ** for JS
    const js = expr.replace(/\^/g, '**').replace(/sin/gi,'Math.sin').replace(/cos/gi,'Math.cos').replace(/tan/gi,'Math.tan');
    // eslint-disable-next-line no-new-func
    const f = new Function('x', `return (${js});`);
    const v = Number(f(x));
    if (!Number.isFinite(v)) throw new Error('Non-finite result');
    return v;
  }

  function verify() {
    try {
      setErr(null);
      let maxDiff = 0;
      for (let i=0;i<20;i++) {
        const x = -3.0 + i * (6.0/19);
        const a = safeEval(exprA, x);
        const b = safeEval(exprB, x);
        maxDiff = Math.max(maxDiff, Math.abs(a-b));
      }
      setEquiv(maxDiff < 1e-6);
    } catch (e: any) {
      setErr(e?.message || 'failed');
      setEquiv(null);
    }
  }

  return (
    <div className="p-4 text-gray-100 space-y-3">
      <h1 className="text-xl font-semibold">Math Verifier (numeric sampling)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input className="bg-white/5 rounded px-2 py-1" value={exprA} onChange={e=>setExprA(e.target.value)} />
        <input className="bg-white/5 rounded px-2 py-1" value={exprB} onChange={e=>setExprB(e.target.value)} />
      </div>
      <button className="bg-white/10 px-3 py-1 rounded" onClick={verify}>Verify equivalence</button>
      {equiv!=null && (
        <div className={`text-sm ${equiv?'text-emerald-400':'text-rose-400'}`}>{equiv? 'Equivalent (approx)': 'Not equivalent (approx)'}</div>
      )}
      {err && <div className="text-sm text-rose-400">{err}</div>}
    </div>
  );
}

