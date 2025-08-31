# Constrained Decoding

Goal
- Integrate decoding constraints (regex/CFG/token masks) to enforce Sanskrit morphological rules.

Approach
- Token mask updates per step based on rule graph and current partial output
- Grammar compilation to fast finite automata

Next steps
- Specify constraint interface
- Build small demo with a mock decoder adapter

