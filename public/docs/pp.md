# Predictive Processing

```
   predictionError → scales PP term by (1 - e)
   higher e ⇒ lower PP ⇒ lower φ
```

Brahm uses a PP proxy that scales a PP component by (1 - predictionError) when provided.

- Higher predictionError reduces phi by diminishing the PP term.
- Evolution may propose increasing pp weight, which is renormalized.

## Example

```ts
const resultLow = await calc.calculatePhi({ att, weights: { gwt: 0.2, causal: 0.2, pp: 0.6 }, predictionError: 0.0 });
const resultHigh = await calc.calculatePhi({ att, weights: { gwt: 0.2, causal: 0.2, pp: 0.6 }, predictionError: 0.9 });
console.log(resultHigh.phi_value < resultLow.phi_value);
```

