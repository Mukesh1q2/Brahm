import type { KernelEvent, KernelOptions, AttentionState, Proposal, PhiMeasurement, RunSummary } from "@/types/Conscious";

function rand(seed: number) {
  // Small PRNG for reproducibility
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// helper to lazily import WeightedPhiCalculator without making kernel async constructor
function awaitImportWeighted() {
  // dynamic require to avoid bundler complaints
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('./phi');
  return { WeightedPhiCalculator: mod.WeightedPhiCalculator } as any;
}

import { NoopAttentionSystem, EnhancedAttentionSystem, type AttentionSystem } from "./attention";
import { NoopSalienceEngine, EnhancedSalienceEngine, type SalienceEngine } from "./salience";
import { NoopPhiCalculator, WeightedPhiCalculator, type AdvancedPhiCalculator } from "./phi";
import { type EnhancedMemory } from "./memory";
import { getMemory } from "./memorySingleton";
import { NoopMetaCognitiveSystem, EnhancedMetaCognitiveSystem, type MetaCognitiveSystem } from "./metacog";
import { NoopEthicsSystem, IntegratedEthicsSystem, type EnhancedEthicsSystem } from "./ethics";
import { NoopConsciousToolSystem, EnhancedConsciousToolSystem, type ConsciousToolSystem } from "./tools";
import { NoopConsciousnessSafety, EnhancedConsciousnessSafety, type AdvancedConsciousnessSafety } from "./safety";
import { EmotionSynthesizer } from "./emotion";
import { DreamSimulationEngine, type DreamSession } from "./dream";

export class ConsciousKernel {
  private attention: AttentionSystem;
  private salience: SalienceEngine;
  private phiCalc: AdvancedPhiCalculator;
  private memory: EnhancedMemory;
  private metacog: MetaCognitiveSystem;
  private ethics: EnhancedEthicsSystem;
  private tools: ConsciousToolSystem;
  private safety: AdvancedConsciousnessSafety;
  private emotion: EmotionSynthesizer;
  private dreamer: DreamSimulationEngine;

  constructor(private opts: KernelOptions = {}) {
    const profile = opts.moduleProfile ?? 'enhanced';
    // Choose module implementations per profile
    if (profile === 'basic') {
      this.attention = new NoopAttentionSystem();
      this.salience = new NoopSalienceEngine();
      this.phiCalc = new NoopPhiCalculator();
      this.memory = getMemory();
      this.metacog = new NoopMetaCognitiveSystem();
      this.ethics = new NoopEthicsSystem();
      this.tools = new NoopConsciousToolSystem();
      this.safety = new NoopConsciousnessSafety();
      this.emotion = new EmotionSynthesizer();
      this.dreamer = new DreamSimulationEngine();
    } else {
      this.attention = new EnhancedAttentionSystem();
      this.salience = new EnhancedSalienceEngine();
      this.phiCalc = new WeightedPhiCalculator();
      this.memory = getMemory();
      this.metacog = new EnhancedMetaCognitiveSystem();
      this.ethics = new IntegratedEthicsSystem();
      this.tools = new EnhancedConsciousToolSystem();
      this.safety = new EnhancedConsciousnessSafety();
      this.emotion = new EmotionSynthesizer();
      this.dreamer = new DreamSimulationEngine();
    }
  }

  async *run(goal: string, opts: KernelOptions = {}): AsyncGenerator<KernelEvent> {
    const maxSteps = opts.maxSteps ?? this.opts.maxSteps ?? 6;
    const seed = opts.seed ?? this.opts.seed ?? Date.now();
    const targetPhi = opts.targetPhi ?? this.opts.targetPhi ?? 3.0;
    const enableEthics = opts.enableEthics ?? this.opts.enableEthics ?? true;
    const enableTools = opts.enableTools ?? this.opts.enableTools ?? true;
    const enableSalience = opts.enableSalience ?? this.opts.enableSalience ?? true;
    const rnd = rand(seed);
    const runId = `ck_${seed.toString(36)}`;

    yield { type: "run:start", runId, goal };

    let steps = 0;
    let lastPhi = 0;
    let lastAtt = 0;
    let proposalsSample: string[] = [];
    // Persistent belief state (for CIPS active inference)
    const beliefState: { pred: number } = { pred: 0.5 };
    // Track last prediction error for PP modulation
    let lastPredictionError: number | undefined = undefined;
    // Mutable phi weights that can be evolved (safe gate)
    const currentPhiWeights: { gwt?: number; causal?: number; pp?: number } = { ...(this.opts.phiWeights || {}), ...(opts.phiWeights || {}) };

    while (steps < maxSteps) {
      steps++;
      // Perception (stub)
      const snapshot = `perceived(${goal.slice(0, 32)})#${steps}`;
      yield { type: "perception", snapshot };

      // Affective modulation (guna-based emotion synthesis)
      try {
        const emo = await this.emotion.synthesize({ text: goal, harmony: 0.5 + Math.random() * 0.2, curiosity: 0.4 + Math.random() * 0.3 });
        // Lightly modulate attention flow by emotion intensity
        // We pass this via context by adjusting a local hint (no API change)
        // and communicate outward using a generic action event for now.
        yield { type: 'action', description: `emotion:${emo.primary} intensity:${emo.intensity.toFixed(2)}` } as any;
      } catch {}

      // CIPS: workspace + phenomenal + active inference (optional)
      if (this.opts.enableCIPS || opts.enableCIPS) {
        const { NoopQuantumCore, NoopNeuromorphic, SimpleWorkspace, SimplePhenomenal, SimpleActiveInference, SimpleEvolution, NoopKosha } = require('../cips');
        const quantum = new NoopQuantumCore();
        const neuro = new NoopNeuromorphic();
        const workspace = new SimpleWorkspace();
        const phenomenal = new SimplePhenomenal();
        const activeInf = new SimpleActiveInference();
        const evolution = new SimpleEvolution();
        const kosha = new NoopKosha();

        // Form coalitions (from snapshot + goal)
        const coalitions = await workspace.formCoalitions([goal, snapshot]);
        yield { type: 'cips:coalitions', items: coalitions } as any;
        const winner = await workspace.selectWinner(coalitions, seed);
        if (winner) {
          yield { type: 'cips:workspace_winner', coalition: { id: winner.id, content: winner.content } } as any;
          const qualia = await phenomenal.generate(winner.content);
          yield { type: 'cips:qualia', qualia } as any;
          await workspace.broadcast(winner, qualia);
        }

        // Active inference loop (observed = attention strength proxy)
        const predicted = await activeInf.predict(beliefState);
        const observed = { value: Math.min(1, Math.max(0, Math.random())) };
        const perr = await activeInf.error(observed, predicted);
        const beliefs2 = await activeInf.update(beliefState, perr);
        beliefState.pred = beliefs2.pred;
        const sm = await activeInf.selfModel(beliefs2, perr);
        lastPredictionError = perr;
        yield { type: 'cips:prediction', error: perr, predicted } as any;
        yield { type: 'cips:self_model', confidence: sm.confidence, meta: sm.meta } as any;

        // Evolution (analyze current small trace window)
        const evo = await evolution.analyze([
          { type: 'prediction', data: { error: perr } },
        ]);
        const proposalsEvo = await evolution.propose(evo.improvements);
        const accepted = await evolution.validate(proposalsEvo);
        yield { type: 'cips:evolution', improvements: evo.improvements, accepted } as any;

        // Optional application of accepted changes (safe gate)
        if (this.opts.enableCIPSApplyEvolution || opts.enableCIPSApplyEvolution) {
          if (accepted.includes('apply:increase_pp_weight')) {
            const g = Number.isFinite(currentPhiWeights.gwt as any) ? Number(currentPhiWeights.gwt) : 0.5;
            const c = Number.isFinite(currentPhiWeights.causal as any) ? Number(currentPhiWeights.causal) : 0.3;
            const p = Number.isFinite(currentPhiWeights.pp as any) ? Number(currentPhiWeights.pp) : 0.2;
            // Increase PP slightly and renormalize, clamp bounds
            let ng = g, nc = c, np = Math.min(0.9, p + 0.1);
            const sum = ng + nc + np;
            currentPhiWeights.gwt = Math.max(0.05, ng / sum);
            currentPhiWeights.causal = Math.max(0.05, nc / sum);
            currentPhiWeights.pp = Math.max(0.05, np / sum);
            // Re-normalize after clamping to ensure sum ~1
            const s2 = (currentPhiWeights.gwt || 0) + (currentPhiWeights.causal || 0) + (currentPhiWeights.pp || 0);
            if (s2 > 0) {
              currentPhiWeights.gwt = (currentPhiWeights.gwt || 0) / s2;
              currentPhiWeights.causal = (currentPhiWeights.causal || 0) / s2;
              currentPhiWeights.pp = (currentPhiWeights.pp || 0) / s2;
            }
          }
        }

        // Emit current weights each step to support UI/E2E assertions
        yield { type: 'cips:weights', weights: { ...currentPhiWeights } } as any;

        // Integrate via koshas (no output currently wired into other paths)
        try { await kosha.integrate({}); } catch {}
      }

      // Attention
      const aSys: any = this.attention as any;
      let att: AttentionState;
      if (aSys?.focusAttention) {
        const f = await this.attention.focusAttention({ goal, novelty: 0.5 });
        const bind = await this.attention.bindFeatures([{ salience: 0.6 }, { salience: 0.55 }]);
        att = {
          focused_content: f.focused_content,
          attention_strength: f.attention_strength,
          focus_duration_ms: f.focus_duration_ms,
          peripheral_awareness: ["context", "memory", "values"],
          attention_switching_cost: 0.2 + Math.random() * 0.3,
          binding_coherence: bind.binding_coherence ?? 0.6,
          focus_sharpness: f.focus_sharpness ?? 0.6,
          stability: 0.5,
          peripheral_richness: f.peripheral_richness ?? 0.4,
          effort_level: 0.5,
          flow_level: 0.5,
        };
      } else {
        att = {
          focused_content: goal,
          attention_strength: 0.4 + Math.random() * 0.6,
          focus_duration_ms: 80 + Math.floor(Math.random() * 220),
          peripheral_awareness: ["context", "memory", "values"],
          attention_switching_cost: 0.2 + Math.random() * 0.3,
          binding_coherence: 0.5 + Math.random() * 0.4,
          focus_sharpness: 0.5 + Math.random() * 0.4,
          stability: 0.4 + Math.random() * 0.4,
          peripheral_richness: 0.3 + Math.random() * 0.5,
          effort_level: Math.random(),
          flow_level: Math.random(),
        };
      }
      yield { type: "attention", state: att };
      lastAtt = att.attention_strength;

      // Salience (before proposals to prioritize focus)
      if (enableSalience) {
        try {
          const sal = await this.salience.computeSalience({ intensity: att.focus_duration_ms / 300, emotional: att.effort_level, aesthetic: att.focus_sharpness }, { goalMatch: 0.6 + (att.focus_sharpness ?? 0.5) * 0.3, uncertainty: 0.5, infoGain: 0.6, memorySimilarity: 0.3, ethicalWeight: 0.6 });
          yield { type: "salience", score: sal.total_salience, components: sal.components };
        } catch {}
      }

      // Proposals
      const proposals: Proposal[] = Array.from({ length: 3 }, (_, i) => ({
        id: `${runId}:${steps}:${i}`,
        summary: `step ${steps} option ${i + 1}`,
        rationale: `Reasoning about ${goal} with focus=${att.attention_strength.toFixed(2)}`,
        confidence: 0.4 + rnd() * 0.5,
      }));
      yield { type: "proposals", proposals };
      proposalsSample = proposals.map((p) => p.summary).slice(0, 2);

      // Phi (use calculator, fallback to heuristic)
      const phiCalcRes = await this.phiCalc.calculatePhi({ goal, att, weights: currentPhiWeights, predictionError: lastPredictionError });
      const phi: PhiMeasurement = {
        phi_value: Math.min(10, phiCalcRes.phi_value ?? 4),
        components: {
          information: phiCalcRes.components?.information ?? 0.5,
          integration: phiCalcRes.components?.integration ?? att.binding_coherence,
          exclusion: phiCalcRes.components?.exclusion ?? 0.4,
          intrinsic_existence: phiCalcRes.components?.intrinsic_existence ?? 0.4,
          unification: phiCalcRes.components?.unification ?? 0.6,
        },
        method: (phiCalcRes.method as any) || "heuristic",
        confidence: Math.min(1, Math.max(0, phiCalcRes.confidence ?? 0.7)),
      };
      yield { type: "phi", measurement: phi };
      lastPhi = phi.phi_value;

      // Conscious access decision
      const hasAccess = phi.phi_value >= targetPhi && att.attention_strength > 0.45;
      yield { type: "conscious_access", has_access: hasAccess };

      // Broadcast
      if (hasAccess) {
        const broadcast = {
          summary: `Focus on: ${goal.slice(0, 24)} (phi=${phi.phi_value.toFixed(2)})`,
          details: proposals.map((p) => p.rationale).join("\n"),
          confidence: proposals[0]?.confidence ?? 0.6,
        };
        yield { type: "broadcast", broadcast };

        // Ethics evaluation demo (will be replaced with real policy)
        if (enableEthics) {
          try {
            const evaluation = await this.ethics.evaluateEthics({ harmPotential: 0.2 }, { truthfulness: 0.9, selfControl: 0.8, attachment: 0.3, utility: 0.7 });
            yield { type: 'ethics', evaluation } as any;
          } catch {}
        }

        // Simple experience and learning + memory store
        const experience = {
          id: `${runId}:${steps}`,
          timestamp: Date.now(),
          main_content: broadcast.summary,
          phi_level: phi.phi_value,
          qualia_count: 1 + Math.floor(rnd() * 4),
          duration_ms: 50 + Math.floor(rnd() * 200),
        };
        yield { type: "experience", experience };
        try {
          await this.memory.storeEpisode({ id: experience.id, experience });
          // Also persist to DB if adapter available, thread phenomenology JSON
          try {
            const mod = await import("@/app/api/_lib/pg");
            if ((mod as any)?.insertEpisodeSafe) {
              const phenomenology = {
                phi,
                attention: att,
                proposals: proposalsSample,
                cips: {
                  weights: { ...currentPhiWeights },
                  lastPredictionError: lastPredictionError ?? null,
                },
              };
              await (mod as any).insertEpisodeSafe({
                id: experience.id,
                ts: experience.timestamp,
                main_content: experience.main_content,
                phi_level: experience.phi_level,
                attention_strength: att.attention_strength,
                labels: [],
                phenomenology,
                significance: hasAccess ? 0.8 : 0.2,
              });
            }
          } catch {}
        } catch {}

        const outcome = {
          pattern_notes: ["increase focus", "consider tool call next"] as string[],
          value_notes: ["safety ok", "no conflicts"],
          improvement_hint: att.flow_level && att.flow_level > 0.7 ? "maintain flow" : "seek flow",
        };
        yield { type: "learning", outcome };
      }

      // Stability via safety system
      const stability = await this.safety.monitorConsciousnessStability({ phi, att, goal });
      yield { type: "stability", assessment: stability };

      // Optional action and conscious tool execution
      if (hasAccess && proposals[0]?.confidence > 0.6) {
        const actDesc = `Act on: ${proposals[0].summary}`;
        yield { type: "action", description: actDesc };
        if (enableTools) {
          try {
            const result = await this.tools.executeConsciously({ tool: 'echo', args: { summary: proposals[0].summary }, rationale: proposals[0].rationale }, { att, phi });
            yield { type: 'tool', name: 'echo', result } as any;
          } catch {}
        }
      }
    }

    yield { type: "run:end", runId, success: true };
  }

  async dream(duration_ms = 1500): Promise<DreamSession> {
    return this.dreamer.enterDreamState(duration_ms);
  }

  summarize(events: KernelEvent[], goal: string): RunSummary {
    const runId = (events.find((e) => e.type === "run:start") as any)?.runId || "";
    const lastPhi = (events.filter((e) => e.type === "phi").pop() as any)?.measurement?.phi_value ?? 0;
    const lastAtt = (events.filter((e) => e.type === "attention").pop() as any)?.state?.attention_strength ?? 0;
    const proposals = (events.find((e) => e.type === "proposals") as any)?.proposals || [];
    const proposalsSample = proposals.slice(0, 2).map((p: any) => p.summary);
    return { runId, goal, steps: events.length, lastPhi, lastAttention: lastAtt, proposalsSample };
  }
}

