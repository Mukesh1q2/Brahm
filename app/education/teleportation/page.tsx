"use client";
import React from 'react';

export default function TeleportationLesson() {
  const [theta, setTheta] = React.useState(Math.PI/4); // |psi> = cosθ|0> + sinθ|1>
  const [prepared, setPrepared] = React.useState(false);
  const [entangled, setEntangled] = React.useState(false);
  const [measured, setMeasured] = React.useState<null | { m0: 0|1; m1: 0|1 }>(null);

  const alpha = Math.cos(theta);
  const beta = Math.sin(theta);

  const steps = [
    {
      title: 'Prepare unknown state',
      desc: 'Alice has qubit A in |ψ⟩ = cosθ|0⟩ + sinθ|1⟩. Use θ to set amplitudes.',
      action: () => setPrepared(true),
      done: prepared,
    },
    {
      title: 'Create Bell pair',
      desc: 'Alice and Bob share an entangled pair on qubits B and C: (|00⟩+|11⟩)/√2.',
      action: () => setEntangled(true),
      done: entangled,
    },
    {
      title: 'Entangle A with B',
      desc: 'Apply CNOT A→B and H on A. This correlates A,B with C so classical bits suffice.',
      action: () => {/* conceptual */},
      done: prepared && entangled,
    },
    {
      title: 'Measure A and B',
      desc: 'Alice measures A and B to get two classical bits m0,m1 and sends them to Bob.',
      action: () => {
        const m0 = Math.random()<0.5? 0:1 as 0|1;
        const m1 = Math.random()<0.5? 0:1 as 0|1;
        setMeasured({ m0, m1 });
      },
      done: measured!=null,
    },
    {
      title: 'Correct at Bob',
      desc: 'Bob applies Z^m0 X^m1 to recover |ψ⟩ on C. Teleportation complete!',
      action: () => {/* conceptual */},
      done: measured!=null,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education  Quantum Teleportation</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-300">
          <label className="flex items-center gap-2">
            <span className="text-gray-300">θ</span>
            <input type="range" min={0} max={Math.PI/2} step={0.01} value={theta} onChange={e=>setTheta(Number(e.target.value))} className="w-48" />
          </label>
          <div className="text-xs text-gray-400">
            <div>|ψ⟩ = cosθ|0⟩ + sinθ|1⟩</div>
            <div>cosθ = {alpha.toFixed(3)} · sinθ = {beta.toFixed(3)}</div>
          </div>
        </div>
        <div className="rounded border border-white/10 bg-black/30 p-3 text-xs text-neutral-300 space-y-2">
          {steps.map((s,i)=> (
            <div key={i} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-200">{i+1}. {s.title}</div>
                <div className="text-neutral-400">{s.desc}</div>
              </div>
              <button className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/15 disabled:opacity-50" onClick={s.action} disabled={s.done}>Apply</button>
            </div>
          ))}
        </div>
        {measured && (
          <div className="text-xs text-neutral-300">
            <div className="mb-1 text-neutral-400">Classical bits from Alice</div>
            <div>m0 = {measured.m0}, m1 = {measured.m1} — Bob applies Z^{measured.m0} X^{measured.m1} on C.</div>
          </div>
        )}
        <div className="text-[11px] text-neutral-400 italic">Tip: In Circuits, load Bell and add CNOT A→B then H on A to mirror the entangle step.</div>
      </div>
    </div>
  );
}
