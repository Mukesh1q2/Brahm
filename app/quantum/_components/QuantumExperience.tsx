"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useGlobalWorkspace } from '@/store/globalWorkspace';
import { flags } from '@/lib/flags';
import QuantumMetricsDashboard from './QuantumMetricsDashboard';

function BellTestPanel() {
  const [a, setA] = React.useState(0);
  const [aP, setAP] = React.useState(Math.PI/4);
  const [b, setB] = React.useState(Math.PI/8);
  const [bP, setBP] = React.useState(-Math.PI/8);
  const [trials, setTrials] = React.useState(500);
  const [result, setResult] = React.useState<null | { Eab: number; Eabp: number; Eapb: number; Eapbp: number; S: number }>(null);

  function simulateE(alpha: number, beta: number, n: number) {
    const Etarget = Math.cos(2*(alpha - beta));
    let sum = 0;
    for (let i=0;i<n;i++) {
      const A = Math.random() < 0.5 ? 1 : -1;
      const pSame = (1 + Etarget)/2;
      const B = (Math.random() < pSame) ? A : -A;
      sum += A * B;
    }
    return sum / n;
  }

  async function run() {
    const Eab = simulateE(a, b, trials);
    const Eabp = simulateE(a, bP, trials);
    const Eapb = simulateE(aP, b, trials);
    const Eapbp = simulateE(aP, bP, trials);
    const S = Math.abs(Eab + Eabp + Eapb - Eapbp);
    setResult({ Eab, Eabp, Eapb, Eapbp, S });
    try {
      await fetch('/api/telemetry/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'entanglement:bell', page: '/quantum', section: 'entanglement', metadata: { a, aP, b, bP, trials, Eab, Eabp, Eapb, Eapbp, S } }) });
    } catch {}
  }

  function presetOptimal() {
    setA(0);
    setAP(Math.PI/4);
    setB(Math.PI/8);
    setBP(-Math.PI/8);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-gray-200">Bell test (CHSH)</div>
          <div className="text-xs text-gray-400">Compute S = |E(a,b) + E(a,b') + E(a',b) - E(a',b')| from ±1 outcomes</div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button className="px-2 py-1 rounded border border-white/15 bg-white/5 hover:bg-white/10" onClick={presetOptimal}>Preset optimal</button>
          <label className="flex items-center gap-1">
            <span>a</span>
            <input type="number" step={0.01} value={a} onChange={(e)=>setA(Number(e.target.value))} className="w-20 bg-white/5 border border-white/10 rounded px-1 py-0.5" />
          </label>
          <label className="flex items-center gap-1">
            <span>a'</span>
            <input type="number" step={0.01} value={aP} onChange={(e)=>setAP(Number(e.target.value))} className="w-20 bg-white/5 border border-white/10 rounded px-1 py-0.5" />
          </label>
          <label className="flex items-center gap-1">
            <span>b</span>
            <input type="number" step={0.01} value={b} onChange={(e)=>setB(Number(e.target.value))} className="w-20 bg-white/5 border border-white/10 rounded px-1 py-0.5" />
          </label>
          <label className="flex items-center gap-1">
            <span>b'</span>
            <input type="number" step={0.01} value={bP} onChange={(e)=>setBP(Number(e.target.value))} className="w-20 bg-white/5 border border-white/10 rounded px-1 py-0.5" />
          </label>
          <label className="flex items-center gap-1">
            <span>trials</span>
            <input type="number" min={100} step={100} value={trials} onChange={(e)=>setTrials(Math.max(100, Number(e.target.value||500)))} className="w-24 bg-white/5 border border-white/10 rounded px-1 py-0.5" />
          </label>
          <button className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500" onClick={run}>Run</button>
        </div>
      </div>
      {result && (
        <div className="mt-2 text-xs text-gray-300">
          <div>E(a,b)={result.Eab.toFixed(3)} • E(a,b')={result.Eabp.toFixed(3)} • E(a',b)={result.Eapb.toFixed(3)} • E(a',b')={result.Eapbp.toFixed(3)}</div>
          <div className="mt-1">S = {result.S.toFixed(3)} {result.S > 2 ? '→ violation' : ''}</div>
        </div>
      )}
    </div>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function speak(text: string) {
  try {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      window.speechSynthesis.speak(utter);
    }
  } catch {}
}

export default function QuantumExperience() {
  const enabled = flags.quantum;
  const reduced = usePrefersReducedMotion();
  const { currentSection, setCurrentSection, setAttention, setPhi, attention, phiEstimate, superpositionTheta: theta, setSuperpositionTheta, superpositionOutcome: measured, recordMeasurement, resetMeasurement, entanglementPhi: entPhi, setEntanglementPhi, recordEntanglementUpdate } = useGlobalWorkspace();
  const [webgl2, setWebgl2] = React.useState(false);
  const [greeted, setGreeted] = React.useState(false);

  React.useEffect(() => {
    // Detect WebGL2 capability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      setWebgl2(!!gl);
    } catch { setWebgl2(false); }
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    // page open event
    fetch('/api/telemetry/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'page:open', page: '/quantum', metadata: { webgl2 } }) }).catch(()=>{});
    setCurrentSection('hero');
    return () => {
      fetch('/api/telemetry/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'page:close', page: '/quantum' }) }).catch(()=>{});
    };
  }, [enabled, webgl2, setCurrentSection]);

  // Stabilization controls
  const [effectsIntensity, setEffectsIntensity] = React.useState(0.5);
  const [isStabilized, setIsStabilized] = React.useState(false);

  React.useEffect(() => {
    const handleStabilize = () => {
      setIsStabilized(true);
      try {
        document.querySelectorAll('.quantum-visualization, .three-scene').forEach((el) => {
          (el as HTMLElement).style.transform = 'none';
        });
      } catch {}
    };
    window.addEventListener('quantum-stabilize', handleStabilize);
    return () => window.removeEventListener('quantum-stabilize', handleStabilize);
  }, []);

  React.useEffect(() => {
    if (reduced || isStabilized) return;
    // lightweight attention + phi animation loop with bound intensity
    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      if (isStabilized) { cancelAnimationFrame(raf); return; }
      const t = (performance.now() - t0) / 1000;
      const att = 0.5 + 0.4 * Math.sin(t * 0.7) * effectsIntensity;
      const phi = 2
        + 1.5 * Math.sin(t * 0.4 + 1.2) * effectsIntensity
        + 1.5 * Math.sin(t * 0.9 + 0.3) * effectsIntensity;
      setAttention(att);
      setPhi(phi);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, setAttention, setPhi, effectsIntensity, isStabilized]);

  React.useEffect(() => {
    // throttle phi telemetry a bit
    const id = setInterval(() => {
      fetch('/api/telemetry/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'phi:update', page: '/quantum', metadata: { phi: phiEstimate } }) }).catch(()=>{});
    }, 4000);
    return () => clearInterval(id);
  }, [phiEstimate]);

  // Telemetry for superposition control changes (debounced)
  React.useEffect(() => {
    if (currentSection !== 'superposition') return;
    const a0 = Math.cos(theta);
    const a1 = Math.sin(theta);
    const p0 = a0 * a0;
    const p1 = a1 * a1;
    const id = setTimeout(() => {
      fetch('/api/telemetry/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'superposition:update', page: '/quantum', section: 'superposition', metadata: { theta, a0, a1, p0, p1 } }) }).catch(()=>{});
    }, 300);
    return () => clearTimeout(id);
  }, [theta, currentSection]);

  function startLesson(topic: 'superposition' | 'entanglement') {
    setCurrentSection(topic);
    fetch('/api/telemetry/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'lesson:start', page: '/quantum', section: topic, metadata: { topic } }) }).catch(()=>{});
    if (topic === 'entanglement') {
      fetch('/api/telemetry/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'entanglement:start', page: '/quantum', section: 'entanglement' }) }).catch(()=>{});
    }
    if (!greeted) {
      setGreeted(true);
      speak(`Welcome to the ${topic} demo. I will guide you through key intuitions.`);
    }
  }

  function measure() {
    const p0 = Math.cos(theta) ** 2;
    const p1 = Math.sin(theta) ** 2;
    const r = Math.random();
    const outcome: 0 | 1 = r < p0 ? 0 : 1;
    recordMeasurement(outcome);
    fetch('/api/telemetry/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'superposition:measure', page: '/quantum', section: 'superposition', metadata: { theta, p0, p1, r, outcome } }) }).catch(()=>{});
  }
  function onResetMeasurement() {
    resetMeasurement();
    fetch('/api/telemetry/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'superposition:reset', page: '/quantum', section: 'superposition' }) }).catch(()=>{});
  }

  if (!enabled) {
    return (
      <div className="min-h-[60vh] mx-auto max-w-3xl flex flex-col items-start justify-center gap-3 p-6">
        <h1 className="text-2xl font-semibold">Quantum Experience</h1>
        <p className="text-sm text-gray-400">This feature is disabled. Set NEXT_PUBLIC_QUANTUM_ENABLED=true to enable.</p>
      </div>
    );
  }

  const ThreeScene = React.useMemo(() => dynamic(() => import('./ThreeScene'), { ssr: false }), []);
  const SuperpositionScene = React.useMemo(() => dynamic(() => import('./SuperpositionScene'), { ssr: false }), []);
  const EntanglementScene = React.useMemo(() => dynamic(() => import('./EntanglementScene'), { ssr: false }), []);

  // Telemetry for entanglement updates (debounced)
  React.useEffect(() => {
    if (currentSection !== 'entanglement') return;
    const correlation = Math.cos(2 * entPhi);
    const id = setTimeout(() => {
      recordEntanglementUpdate(entPhi, correlation);
      fetch('/api/telemetry/replay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'entanglement:update', page: '/quantum', section: 'entanglement', metadata: { phi: entPhi, correlation } }) }).catch(()=>{});
    }, 300);
    return () => clearTimeout(id);
  }, [entPhi, currentSection, recordEntanglementUpdate]);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0b0b0c] to-black" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #6ee7ff22 0, transparent 40%), radial-gradient(circle at 80% 70%, #a78bfa22 0, transparent 40%)' }} />
      </div>

      {/* Hero */}
      <section id="hero" className="container mx-auto px-6 py-16">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
            Quantum • Consciousness • Guided
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Quantum-Conscious Experience</h1>
          <p className="mt-3 text-gray-300 max-w-2xl text-sm">A minimal, performance-safe MVP. Visuals adapt to your device; telemetry powers learning systems.</p>

          <div className="mt-6 flex items-center gap-3">
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm hover:bg-brand-500" onClick={() => startLesson('superposition')}>Start Superposition</button>
            <button className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" onClick={() => startLesson('entanglement')}>Start Entanglement</button>
          </div>
        </div>
      </section>

      {/* Live indicators */}
      <section className="container mx-auto px-6 pb-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-gray-400">Attention</div>
            <div className="mt-1 text-lg font-semibold">{(attention*100).toFixed(0)}%</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-gray-400">Φ (heuristic)</div>
            <div className="mt-1 text-lg font-semibold">{phiEstimate.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-gray-400">Graphics</div>
            <div className="mt-1 text-lg font-semibold">{webgl2 ? (flags.three ? 'WebGL2 + Three' : 'WebGL2') : '2D'}</div>
          </div>
        </div>
        {/* Persist latest (DB only) */}
        <PersistLatestQuantum phi={phiEstimate} entPhi={entPhi} section={currentSection} />
        {/* Voice Agent (P1) */}
        <div className="mt-4">
          {React.createElement(require('@/app/_components/voice/VoiceAgent').default)}
        </div>
      </section>

      {/* Stabilization controls */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, background: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 6 }}>
        <label style={{ fontSize: 12, color: 'white' }}>
          Effects Intensity
          <input type="range" min={0} max={1} step={0.1} value={effectsIntensity}
                 onChange={(e)=> setEffectsIntensity(parseFloat((e.target as HTMLInputElement).value))}
                 style={{ marginLeft: 8, width: 100 }} />
        </label>
        <div className="mt-1">
          <button onClick={()=> setIsStabilized(s=>!s)}
                  style={{ background: isStabilized ? '#4CAF50' : '#f44336', color: 'white', border: 'none', padding: '6px 8px', borderRadius: 4, fontSize: 12 }}>
            {isStabilized ? 'Effects Paused' : 'Pause Effects'}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <section className="container mx-auto px-6 pb-8">
        <QuantumMetricsDashboard />
      </section>

      {/* Demo area */}
      <section id="demo" className="container mx-auto px-6 pb-24 space-y-4">
        {currentSection === 'superposition' ? (
          <>
            {/* Controls */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-200">Superposition |ψ⟩ = cos(θ)|0⟩ + sin(θ)|1⟩</div>
                  <div className="text-xs text-gray-400">Adjust θ to change amplitudes; probabilities are cos²(θ) and sin²(θ). Click Measure to collapse.</div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <span className="text-gray-300">θ</span>
                    <input type="range" min={0} max={1.5707963267948966} step={0.01} value={theta} onChange={(e)=>setSuperpositionTheta(Number(e.target.value))} className="w-48" disabled={measured !== null} />
                  </label>
                  <div className="text-xs text-gray-400">
                    <div>a0 = cos(θ) = {Math.cos(theta).toFixed(3)} → p(|0⟩) = {(Math.cos(theta)**2).toFixed(3)}</div>
                    <div>a1 = sin(θ) = {Math.sin(theta).toFixed(3)} → p(|1⟩) = {(Math.sin(theta)**2).toFixed(3)}</div>
                  </div>
                  <button className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500 disabled:opacity-60" onClick={measure} disabled={measured !== null}>Measure</button>
                  {measured !== null && (
                    <button className="px-3 py-1 rounded border border-white/15 bg-white/5 hover:bg-white/10" onClick={onResetMeasurement}>Reset</button>
                  )}
                </div>
              </div>
              {measured !== null && (
                <div className="mt-2 text-xs text-gray-300">Outcome: |{measured}\u27e9 (collapsed)</div>
              )}
            </div>

            {/* Visualization */}
            {webgl2 && flags.three ? (
              <SuperpositionScene theta={theta} measurement={measured !== null ? { target: measured, t: Date.now() } : null} />
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 min-h-[240px]">
                <div className="text-sm text-gray-300 mb-3">2D fallback</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">|0⟩ probability</div>
                    <div className="h-2 rounded bg-white/10 overflow-hidden">
                      <div className={`h-2 ${measured === 0 ? 'bg-brand-400' : 'bg-brand-500'}`} style={{ width: `${Math.min(100, Math.max(0, Math.cos(theta)**2 * 100))}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">|1⟩ probability</div>
                    <div className="h-2 rounded bg-white/10 overflow-hidden">
                      <div className={`h-2 ${measured === 1 ? 'bg-neon-purple/90' : 'bg-neon-purple'}`} style={{ width: `${Math.min(100, Math.max(0, Math.sin(theta)**2 * 100))}%` }} />
                    </div>
                  </div>
                </div>
                {measured !== null && (
                  <div className="mt-3 text-xs text-gray-300">Outcome: |{measured}\u27e9 (collapsed)</div>
                )}
              </div>
            )}
          </>
        ) : currentSection === 'entanglement' ? (
          <>
            {/* Controls */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-200">Entanglement correlation</div>
                  <div className="text-xs text-gray-400">Adjust φ to change phase offset; correlation E(φ) = cos(2φ).</div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <span className="text-gray-300">φ</span>
                    <input type="range" min={0} max={1.5707963267948966} step={0.01} value={entPhi} onChange={(e)=>setEntanglementPhi(Number(e.target.value))} className="w-48" />
                  </label>
                  <div className="text-xs text-gray-400">
                    <div>φ = {entPhi.toFixed(3)} rad</div>
                    <div>E(φ) = cos(2φ) = {Math.cos(2*entPhi).toFixed(3)}</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Visualization */}
            {webgl2 && flags.three ? (
              <EntanglementScene phi={entPhi} />
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 min-h-[240px]">
                <div className="text-sm text-gray-300 mb-2">2D fallback</div>
                <div className="text-xs text-gray-400">Correlation E(φ) = cos(2φ)</div>
                <div className="mt-2 text-lg">E(φ) = {Math.cos(2*entPhi).toFixed(3)}</div>
                <div className="mt-3 h-2 rounded bg-white/10 overflow-hidden">
                  <div className="h-2 bg-brand-500" style={{ width: `${(Math.abs(Math.cos(2*entPhi))*100).toFixed(1)}%` }} />
                </div>
              </div>
            )}

            {/* Bell-type measurement (CHSH) */}
            <BellTestPanel />
          </>
        ) : (
          webgl2 && flags.three ? (
            <ThreeScene />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 min-h-[280px] flex items-center justify-center text-gray-300">
              {webgl2 ? (
                <span>Three.js disabled by flag - set NEXT_PUBLIC_THREE_ENABLED=true to enable.</span>
              ) : (
                <span>2D fallback - WebGL2 not available on this device.</span>
              )}
            </div>
          )
        )}
      </section>

      {/* Kernel chooser (appears after Entanglement lesson) */}
      {currentSection === 'entanglement' && (
        <section className="container mx-auto px-6 pb-28 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-medium text-gray-200">Kernel Chooser</div>
                <div className="text-xs text-gray-400">Select kernel and options, then start a live stream.</div>
              </div>
            </div>

            {/* Controls */}
            <KernelChooserControls />
          </div>
        </section>
      )}
    </div>
  );
}

function PersistLatestQuantum({ phi, entPhi, section }: { phi: number; entPhi: number; section: string }) {
  const [ok, setOk] = React.useState<boolean|null>(null);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(()=>{ (async()=>{ try { const r = await fetch('/api/persistence/status', { cache: 'no-store' }); const j = await r.json(); setOk(Boolean(j?.ok)); } catch { setOk(false); } })(); },[]);
  if (ok !== true) return null;
  const onSave = async () => {
    setSaving(true);
    try {
      const body = { main_content: `Quantum ${section} snapshot`, timestamp: Date.now(), phi_level: Number(phi||0), qualia_count: 0, duration_ms: 0 };
      await fetch('/api/experiences', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) });
      (window as any).__brahm_toast?.('Saved snapshot to DB','success');
    } catch {}
    setSaving(false);
  };
  return (
    <div className="mt-3 text-xs text-neutral-300">
      <button className="rounded bg-white/10 px-2 py-1 hover:bg-white/15" onClick={onSave} disabled={saving}>{saving? 'Saving…':'Persist latest snapshot'}</button>
    </div>
  );
}

function KernelChooserControls() {
  const [enhanced, setEnhanced] = React.useState(false);
  const [moduleProfile, setModuleProfile] = React.useState<'basic'|'enhanced'>('enhanced');
  const [steps, setSteps] = React.useState(6);
  const [seed, setSeed] = React.useState<string>('');
  const [enableEthics, setEnableEthics] = React.useState(true);
  const [enableTools, setEnableTools] = React.useState(false);
  const [enableSalience, setEnableSalience] = React.useState(true);
  const [enableCIPS, setEnableCIPS] = React.useState(false);
  const [enableCIPSApplyEvolution, setEnableCIPSApplyEvolution] = React.useState(false);
  const [wGwt, setWGwt] = React.useState(0.7);
  const [wCausal, setWCausal] = React.useState(0.2);
  const [wPp, setWPp] = React.useState(0.1);
  const [goal, setGoal] = React.useState('Conscious kernel live stream');
  const [events, setEvents] = React.useState<any[]>([]);
  const [connected, setConnected] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const sseRef = React.useRef<EventSource | null>(null);

  // Persist settings to localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('quantumKernelSettings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.enhanced === 'boolean') setEnhanced(s.enhanced);
      if (s.moduleProfile === 'basic' || s.moduleProfile === 'enhanced') setModuleProfile(s.moduleProfile);
      if (Number.isFinite(s.steps)) setSteps(Number(s.steps));
      if (typeof s.seed === 'string') setSeed(s.seed);
      if (typeof s.enableEthics === 'boolean') setEnableEthics(s.enableEthics);
      if (typeof s.enableTools === 'boolean') setEnableTools(s.enableTools);
      if (typeof s.enableSalience === 'boolean') setEnableSalience(s.enableSalience);
      if (typeof s.enableCIPS === 'boolean') setEnableCIPS(s.enableCIPS);
      if (typeof s.enableCIPSApplyEvolution === 'boolean') setEnableCIPSApplyEvolution(s.enableCIPSApplyEvolution);
      if (Number.isFinite(s.wGwt)) setWGwt(Number(s.wGwt));
      if (Number.isFinite(s.wCausal)) setWCausal(Number(s.wCausal));
      if (Number.isFinite(s.wPp)) setWPp(Number(s.wPp));
      if (typeof s.goal === 'string' && s.goal) setGoal(s.goal);
    } catch {}
  }, []);
  React.useEffect(() => {
    try {
      const s = { enhanced, moduleProfile, steps, seed, enableEthics, enableTools, enableSalience, enableCIPS, enableCIPSApplyEvolution, wGwt, wCausal, wPp, goal };
      localStorage.setItem('quantumKernelSettings', JSON.stringify(s));
    } catch {}
  }, [enhanced, moduleProfile, steps, seed, enableEthics, enableTools, enableSalience, enableCIPS, enableCIPSApplyEvolution, wGwt, wCausal, wPp, goal]);

  const applyPreset = React.useCallback((preset: 'safety'|'balanced'|'exploration'|'cips') => {
    if (preset === 'safety') {
      setEnhanced(false);
      setModuleProfile('basic');
      setEnableEthics(true);
      setEnableTools(false);
      setEnableSalience(true);
      setEnableCIPS(false);
      setEnableCIPSApplyEvolution(false);
      setSteps(4);
      setWGwt(0.70); setWCausal(0.25); setWPp(0.05);
    } else if (preset === 'balanced') {
      setEnhanced(false);
      setModuleProfile('enhanced');
      setEnableEthics(true);
      setEnableTools(true);
      setEnableSalience(true);
      setEnableCIPS(false);
      setEnableCIPSApplyEvolution(false);
      setSteps(6);
      setWGwt(0.50); setWCausal(0.30); setWPp(0.20);
    } else if (preset === 'exploration') {
      setEnhanced(true);
      setModuleProfile('enhanced');
      setEnableEthics(true);
      setEnableTools(true);
      setEnableSalience(true);
      setEnableCIPS(true);
      setEnableCIPSApplyEvolution(true);
      setSteps(10);
      setWGwt(0.50); setWCausal(0.20); setWPp(0.30);
    } else if (preset === 'cips') {
      setEnhanced(true);
      setModuleProfile('enhanced');
      setEnableEthics(true);
      setEnableTools(false);
      setEnableSalience(true);
      setEnableCIPS(true);
      setEnableCIPSApplyEvolution(true);
      setSteps(8);
      setWGwt(0.40); setWCausal(0.30); setWPp(0.30);
    }
  }, []);

  const resetDefaults = React.useCallback(() => {
    setEnhanced(false);
    setModuleProfile('enhanced');
    setSteps(6);
    setSeed('');
    setEnableEthics(true);
    setEnableTools(false);
    setEnableSalience(true);
    setEnableCIPS(false);
    setEnableCIPSApplyEvolution(false);
    setWGwt(0.7); setWCausal(0.2); setWPp(0.1);
    // keep goal as-is
  }, []);

  const clearSaved = React.useCallback(() => {
    try { localStorage.removeItem('quantumKernelSettings'); } catch {}
  }, []);

  const syncFromConsole = React.useCallback(() => {
    try {
      const raw = localStorage.getItem('sseSettings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.enhanced === 'boolean') setEnhanced(s.enhanced);
      if (s.moduleProfile === 'basic' || s.moduleProfile === 'enhanced') setModuleProfile(s.moduleProfile);
      if (Number.isFinite(s.steps)) setSteps(Number(s.steps));
      if (typeof s.seed === 'string') setSeed(s.seed);
      if (typeof s.enableEthics === 'boolean') setEnableEthics(s.enableEthics);
      if (typeof s.enableTools === 'boolean') setEnableTools(s.enableTools);
      if (typeof s.enableSalience === 'boolean') setEnableSalience(s.enableSalience);
      if (typeof s.enableCIPS === 'boolean') setEnableCIPS(s.enableCIPS);
      if (typeof s.enableCIPSApplyEvolution === 'boolean') setEnableCIPSApplyEvolution(s.enableCIPSApplyEvolution);
      if (Number.isFinite(s.wGwt)) setWGwt(Number(s.wGwt));
      if (Number.isFinite(s.wCausal)) setWCausal(Number(s.wCausal));
      if (Number.isFinite(s.wPp)) setWPp(Number(s.wPp));
    } catch {}
  }, []);

  const start = React.useCallback(() => {
    try { sseRef.current?.close(); } catch {}
    setConnecting(true); setConnected(false); setEvents([]);
    const sp = new URLSearchParams();
    sp.set('goal', goal);
    sp.set('steps', String(steps));
    if (seed) sp.set('seed', seed);
    sp.set('enhanced', String(enhanced));
    sp.set('profile', moduleProfile);
    sp.set('enableEthics', String(enableEthics));
    sp.set('enableTools', String(enableTools));
    sp.set('enableSalience', String(enableSalience));
    sp.set('enableCIPS', String(enableCIPS));
    sp.set('enableCIPSApplyEvolution', String(enableCIPSApplyEvolution));
    sp.set('weightGwt', String(wGwt));
    sp.set('weightCausal', String(wCausal));
    sp.set('weightPp', String(wPp));
    const url = `/api/agents/stream?${sp.toString()}`;
    try {
      const src = new EventSource(url);
      sseRef.current = src;
      // @ts-ignore
      (window as any).__brahm_kernel_sse__ = src;
      src.addEventListener('open', () => { setConnecting(false); setConnected(true); });
      src.addEventListener('ev', (msg: MessageEvent) => {
        try { setEvents(prev => [...prev.slice(-199), JSON.parse((msg as any).data)]); } catch {}
      });
      src.addEventListener('error', () => {
        try { src.close(); } catch {}
        setConnected(false); setConnecting(false);
      });
    } catch {
      setConnecting(false); setConnected(false);
    }
  }, [goal, steps, seed, enhanced, moduleProfile, enableEthics, enableTools, enableSalience, enableCIPS, enableCIPSApplyEvolution, wGwt, wCausal, wPp]);

  const stop = React.useCallback(() => {
    try { sseRef.current?.close(); } catch {}
    setConnected(false); setConnecting(false);
  }, []);

  React.useEffect(() => () => { try { sseRef.current?.close(); } catch {} }, []);

  const weightsLabel = React.useMemo(() => `w_gwt:${wGwt.toFixed(2)} w_causal:${wCausal.toFixed(2)} w_pp:${wPp.toFixed(2)}`, [wGwt, wCausal, wPp]);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-gray-300">Kernel</span>
            <select value={enhanced ? 'enhanced' : 'base'} onChange={e=>setEnhanced(e.target.value==='enhanced')} className="rounded bg-black/30 border border-white/10 px-2 py-1">
              <option value="base">Base</option>
              <option value="enhanced">Enhanced</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-gray-300">Profile</span>
            <select value={moduleProfile} onChange={e=>setModuleProfile((e.target.value as any)||'enhanced')} className="rounded bg-black/30 border border-white/10 px-2 py-1">
              <option value="enhanced">enhanced</option>
              <option value="basic">basic</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-gray-300">Preset</span>
            <select onChange={(e)=>{ const v = e.target.value as any; if (v) applyPreset(v); e.currentTarget.selectedIndex = 0; }} className="rounded bg-black/30 border border-white/10 px-2 py-1">
              <option value="">Select…</option>
              <option value="safety">Safety</option>
              <option value="balanced">Balanced</option>
              <option value="exploration">Exploration</option>
              <option value="cips">CIPS Learning</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-gray-300">Steps</span>
            <input type="number" min={1} max={20} value={steps} onChange={e=>setSteps(Math.max(1, Math.min(20, Number(e.target.value)||6)))} className="w-20 rounded bg-black/30 border border-white/10 px-2 py-1" />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-gray-300">Seed</span>
            <input value={seed} onChange={e=>setSeed(e.target.value)} placeholder="optional" className="w-28 rounded bg-black/30 border border-white/10 px-2 py-1" />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-gray-300">Goal</span>
            <input value={goal} onChange={e=>setGoal(e.target.value)} className="w-64 rounded bg-black/30 border border-white/10 px-2 py-1" />
          </label>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {!connected ? (
            <button className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500" onClick={start} disabled={connecting}>{connecting ? 'Connecting…' : 'Start stream'}</button>
          ) : (
            <button className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600" onClick={stop}>Stop</button>
          )}
          <button className="px-3 py-1 rounded border border-white/15 bg-white/5 hover:bg-white/10" onClick={resetDefaults}>Reset defaults</button>
          <button className="px-3 py-1 rounded border border-white/15 bg-white/5 hover:bg-white/10" onClick={clearSaved}>Clear saved</button>
          <button className="px-3 py-1 rounded border border-white/15 bg-white/5 hover:bg-white/10" onClick={syncFromConsole}>Sync from Console</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[12px] text-neutral-300">
        <label className="flex items-center gap-1"><input type="checkbox" checked={enableEthics} onChange={e=>setEnableEthics(e.target.checked)} /> Ethics</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={enableTools} onChange={e=>setEnableTools(e.target.checked)} /> Tools</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={enableSalience} onChange={e=>setEnableSalience(e.target.checked)} /> Salience</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={enableCIPS} onChange={e=>setEnableCIPS(e.target.checked)} /> CIPS</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={enableCIPSApplyEvolution} onChange={e=>setEnableCIPSApplyEvolution(e.target.checked)} /> Apply evolution</label>
        <span className="text-[11px] text-neutral-400">{weightsLabel}</span>
        <span className="text-[11px] text-neutral-400">kernel:{enhanced ? 'enh' : 'base'}</span>
        <span className="text-[11px] text-neutral-400">profile:{moduleProfile}</span>
      </div>

      <div className="flex items-center gap-4 text-[12px]">
        <label className="flex items-center gap-1">w_gwt
          <input className="w-16 rounded bg-black/30 px-1 py-0.5" type="number" step="0.05" value={wGwt} onChange={e=>setWGwt(Number(e.target.value)||0)} />
        </label>
        <label className="flex items-center gap-1">w_causal
          <input className="w-16 rounded bg-black/30 px-1 py-0.5" type="number" step="0.05" value={wCausal} onChange={e=>setWCausal(Number(e.target.value)||0)} />
        </label>
        <label className="flex items-center gap-1">w_pp
          <input className="w-16 rounded bg-black/30 px-1 py-0.5" type="number" step="0.05" value={wPp} onChange={e=>setWPp(Number(e.target.value)||0)} />
        </label>
      </div>

      <div className="mt-3 rounded border border-white/10 bg-black/40 p-3 text-xs text-neutral-200">
        <div className="mb-2 text-[11px] text-neutral-400">Events (last {events.length})</div>
        <div className="max-h-64 overflow-auto">
          <pre className="whitespace-pre-wrap">{JSON.stringify(events, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

