"use client";
import React from 'react';
import { flags } from '@/lib/flags';

type Mode = '1q'|'2q';
type Bell = 'phi+'|'phi-'|'psi+'|'psi-';

function dmPure1q(theta: number, phi: number) {
  const c = Math.cos(theta/2), s = Math.sin(theta/2);
  const re = Math.cos(phi), im = Math.sin(phi);
  const r00 = c*c; const r11 = s*s; const off = c*s;
  return { r00, r11, r01: { re: off*re, im: -off*im }, r10: { re: off*re, im: off*im } };
}

function bellVec(kind: Bell): [number, number, number, number] {
  const s = 1/Math.SQRT2;
  switch (kind) {
    case 'phi+': return [s, 0, 0, s];      // |00> + |11>
    case 'phi-': return [s, 0, 0, -s];     // |00> - |11>
    case 'psi+': return [0, s, s, 0];      // |01> + |10>
    case 'psi-': return [0, s, -s, 0];     // |01> - |10>
  }
}

function outer4(v: number[]): number[][] {
  const m = Array.from({length:4}, ()=> Array(4).fill(0));
  for (let i=0;i<4;i++) for (let j=0;j<4;j++) m[i][j] = v[i]*v[j];
  return m;
}

function mixWithIdentity(m: number[][], p: number): number[][] {
  const out = Array.from({length:4}, ()=> Array(4).fill(0));
  for (let i=0;i<4;i++) for (let j=0;j<4;j++) out[i][j] = (1-p)*m[i][j] + (p/4)*(i===j?1:0);
  return out;
}

function partialTrace(m4: number[][], over: 'A'|'B'): number[][] {
  // Basis |AB>, A is high bit, B is low bit
  const r = [[0,0],[0,0]] as number[][];
  for (let i=0;i<4;i++) {
    const a = (i>>1)&1, b = i&1;
    for (let j=0;j<4;j++) {
      const a2 = (j>>1)&1, b2 = j&1;
      if (over === 'B' && b===b2) r[a][a2] += m4[i][j];
      if (over === 'A' && a===a2) r[b][b2] += m4[i][j];
    }
  }
  return r;
}

function purity(m: number[][]): number {
  let s = 0;
  const n = m.length;
  for (let i=0;i<n;i++) for (let j=0;j<n;j++) s += m[i][j]*m[j][i];
  return s;
}

function eigenvals2x2(m: number[][]): [number, number] {
  const a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1];
  const t = a + d;
  const det = a*d - b*c;
  const disc = Math.max(0, t*t - 4*det);
  const s = Math.sqrt(disc);
  const l1 = 0.5*(t + s);
  const l2 = 0.5*(t - s);
  return [l1, l2];
}

function vnFromEigenvalsBase2(lams: number[]): number {
  const eps = 1e-12;
  let s = 0;
  for (const l of lams) {
    const x = Math.max(0, Math.min(1, l));
    if (x > eps) s += -x * (Math.log(x) / Math.log(2));
  }
  return s;
}

function vnEntropy2x2(m: number[][]): number {
  return vnFromEigenvalsBase2(eigenvals2x2(m));
}

function vnEntropyIsoBell(p: number): number {
  // Spectrum for (1-p)|Bell><Bell| + (p/4) I: [1 - 3p/4, p/4, p/4, p/4]
  const l0 = 1 - 3*p/4;
  const l = [l0, p/4, p/4, p/4];
  return vnFromEigenvalsBase2(l);
}

export default function DensityMatrixPage() {
  const voiceHint = flags.voiceEnabled || flags.e2eHooks;
  const [mode, setMode] = React.useState<Mode>('1q');
  const [theta, setTheta] = React.useState(Math.PI/4);
  const [phi, setPhi] = React.useState(0);
  const [p, setP] = React.useState(0.2); // depolarizing strength
  const [bell, setBell] = React.useState<Bell>('phi+');
  const [traceOver, setTraceOver] = React.useState<'A'|'B'>('B');
  const [hist, setHist] = React.useState<Array<{ ts: number; mode: Mode; theta: number; phi: number; p: number; bell?: Bell }>>([]);
  const [pgOk, setPgOk] = React.useState<boolean|null>(null);
  React.useEffect(()=>{ (async()=>{ try { const r=await fetch('/api/persistence/status',{cache:'no-store'}); const j=await r.json(); setPgOk(Boolean(j?.ok)); } catch { setPgOk(false); } })(); },[]);

  // 1-qubit mixed density
  const one = dmPure1q(theta, phi);
  const I2 = p/2;
  const rho1 = [
    [ (1-p)*one.r00 + I2, (1-p)*one.r01.re ],
    [ (1-p)*one.r10.re, (1-p)*one.r11 + I2 ],
  ];

  // 2-qubit isotropic Bell mixture
  const v = bellVec(bell);
  const rhoBellPure = outer4(v);
  const rho2 = mixWithIdentity(rhoBellPure, p);
  const rhoRed = partialTrace(rho2, traceOver);
  const S1 = vnEntropy2x2(rho1);
  const S2 = vnEntropyIsoBell(p);
  const Sred = vnEntropy2x2(rhoRed);

  const snapshot = async () => {
    const ts = Date.now();
    try { const next=[{ ts, mode, theta, phi, p, bell }, ...hist].slice(0,50); setHist(next); localStorage.setItem('edu_density_hist', JSON.stringify(next)); } catch {}
    if (pgOk) { try { await fetch('/api/experiences',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id:`edu_density_${ts}`, timestamp: ts, main_content:`Density ${mode} p=${p.toFixed(2)} theta=${theta.toFixed(2)} phi=${phi.toFixed(2)} bell=${bell}`, phi_level:0, qualia_count:0, duration_ms:0 }) }); } catch {} }
  };

  React.useEffect(() => {
    const handler = () => { snapshot(); };
    try { window.addEventListener('voice:saveSnapshot', handler as any); } catch {}
    return () => { try { window.removeEventListener('voice:saveSnapshot', handler as any); } catch {} };
  }, [snapshot]);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education • Density Matrices</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
          <label className="flex items-center gap-1">mode
            <select className="rounded bg-black/30 px-1 py-0.5" value={mode} onChange={e=> setMode((e.target.value as Mode)||'1q')}>
              <option value="1q">1‑qubit (θ,φ)</option>
              <option value="2q">2‑qubit (Bell + depol)</option>
            </select>
          </label>
          {mode==='1q' && <>
            <label className="flex items-center gap-1">θ
              <input type="range" min={0} max={Math.PI} step={0.01} value={theta} onChange={e=> setTheta(Number(e.target.value))} />
              <span>{theta.toFixed(2)}</span>
            </label>
            <label className="flex items-center gap-1">φ
              <input type="range" min={-Math.PI} max={Math.PI} step={0.01} value={phi} onChange={e=> setPhi(Number(e.target.value))} />
              <span>{phi.toFixed(2)}</span>
            </label>
          </>}
          {mode==='2q' && <>
            <label className="flex items-center gap-1">Bell
              <select className="rounded bg-black/30 px-1 py-0.5" value={bell} onChange={e=> setBell((e.target.value as Bell)||'phi+') }>
                <option value="phi+">Φ⁺</option>
                <option value="phi-">Φ⁻</option>
                <option value="psi+">Ψ⁺</option>
                <option value="psi-">Ψ⁻</option>
              </select>
            </label>
            <label className="flex items-center gap-1">trace over
              <select className="rounded bg-black/30 px-1 py-0.5" value={traceOver} onChange={e=> setTraceOver((e.target.value as 'A'|'B')||'B')}>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </label>
          </>}
          <label className="flex items-center gap-1">depolarize p
            <input type="range" min={0} max={1} step={0.01} value={p} onChange={e=> setP(Number(e.target.value))} />
            <span>{p.toFixed(2)}</span>
          </label>
          <button className="rounded bg-brand-600 px-2 py-1 hover:bg-brand-500" onClick={snapshot}>Record snapshot</button>
          <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={()=>{ try { const blob=new Blob([JSON.stringify(hist, null, 2)], { type:'application/json' }); const url=URL.createObjectURL(blob); const a=document.createElement('a'); const ts=new Date().toISOString().replace(/[:.]/g,'-'); a.href=url; a.download=`density-history-${ts}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);} catch {} }}>Export history</button>
          {pgOk && <span className="rounded bg-emerald-900/30 border border-emerald-700 px-2 py-0.5 text-emerald-300">DB:on</span>}
          {voiceHint && <span className="text-[11px] text-neutral-400 italic">Voice: say "persist snapshot"</span>}
        </div>
        {mode==='1q' ? (
          <div className="text-xs text-neutral-300">
            <div className="text-neutral-400 mb-1">ρ (1‑qubit, depolarized)</div>
            <pre className="rounded bg-black/30 p-2">{`[ [ ${rho1[0][0].toFixed(3)}, ${(rho1[0][1]).toFixed(3)} ],\n  [ ${(rho1[1][0]).toFixed(3)}, ${rho1[1][1].toFixed(3)} ] ]`}</pre>
            <div className="text-[11px] text-neutral-400 mt-1">Purity tr(ρ²) = {purity(rho1).toFixed(3)} · Entropy S(ρ) = {S1.toFixed(3)} bits</div>
          </div>
        ) : (
          <div className="text-xs text-neutral-300 space-y-2">
            <div>
              <div className="text-neutral-400 mb-1">ρ (2‑qubit, {bell.toUpperCase()} with depolarization)</div>
              <pre className="rounded bg-black/30 p-2">{`[ [ ${rho2[0][0].toFixed(3)}, ${rho2[0][1].toFixed(3)}, ${rho2[0][2].toFixed(3)}, ${rho2[0][3].toFixed(3)} ],\n  [ ${rho2[1][0].toFixed(3)}, ${rho2[1][1].toFixed(3)}, ${rho2[1][2].toFixed(3)}, ${rho2[1][3].toFixed(3)} ],\n  [ ${rho2[2][0].toFixed(3)}, ${rho2[2][1].toFixed(3)}, ${rho2[2][2].toFixed(3)}, ${rho2[2][3].toFixed(3)} ],\n  [ ${rho2[3][0].toFixed(3)}, ${rho2[3][1].toFixed(3)}, ${rho2[3][2].toFixed(3)}, ${rho2[3][3].toFixed(3)} ] ]`}</pre>
              <div className="text-[11px] text-neutral-400">Global purity tr(ρ²) = {purity(rho2).toFixed(3)} · Entropy S(ρ) = {S2.toFixed(3)} bits</div>
            </div>
            <div>
              <div className="text-neutral-400 mb-1">Reduced ρ (trace over {traceOver})</div>
              <pre className="rounded bg-black/30 p-2">{`[ [ ${rhoRed[0][0].toFixed(3)}, ${rhoRed[0][1].toFixed(3)} ],\n  [ ${rhoRed[1][0].toFixed(3)}, ${rhoRed[1][1].toFixed(3)} ] ]`}</pre>
              <div className="text-[11px] text-neutral-400">Purity tr(ρ²) = {purity(rhoRed).toFixed(3)} · Entropy S(ρ) = {Sred.toFixed(3)} bits</div>
            </div>
          </div>
        )}
        <div className="text-[11px] text-neutral-400 mt-2">
          Entropy S(ρ) = −Tr(ρ log ρ). S = 0 for pure states; for a single qubit S ∈ [0, 1] bits. Purity tr(ρ²) ∈ [1/d, 1] and decreases as mixedness increases. For a Bell pair at p = 0, the global state is pure (S = 0) while each reduced qubit is maximally mixed (S = 1 bit).
        </div>
      </div>
    </div>
  );
}
