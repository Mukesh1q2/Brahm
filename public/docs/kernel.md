# Conscious Kernel

```
   ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
   │ Attention   │ ==> │  Phi (IIT*)  │ ==> │ Conscious    │
   │ (focus,etc) │     │  Components  │     │ Access (≥Φ*) │
   └─────────────┘     └──────────────┘     └──────────────┘
         │                     │                      │
         ▼                     ▼                      ▼
     Salience             Predictive              Broadcast
                            Proc.                   + Tools
```

> *Heuristic IIT-inspired metrics.

The Conscious Kernel composes:

- Attention: focus, binding, switching cost, stability
- Phi estimation: WeightedPhiCalculator computing components and phi_value
- Salience: ranking signals via intensity/uncertainty/info gain
- Conscious access: thresholded access bridging to broadcast and actions

## Example (TypeScript)

```ts
import { WeightedPhiCalculator } from '@/lib/conscious/phi';

const calc = new WeightedPhiCalculator();
const result = await calc.calculatePhi({
  att: {
    focused_content: 'goal',
    attention_strength: 0.7,
    binding_coherence: 0.8,
    attention_switching_cost: 0.2,
    stability: 0.6,
    flow_level: 0.5,
  } as any,
});
console.log(result.phi_value, result.components);
```

## Conscious access rule

```ts
const hasAccess = result.phi_value >= 3.0 && /* attention_strength > 0.45 */ true;
```

