# Sanskrit Rule Graph (Panini)

Goal
- Represent ~400 sutras as a directed graph with categories, precedence, and application constraints.

Schema (proposal)
- Node: id, label (Sanskrit), gloss, category (sandhi, samasa, etc.)
- Edge: from, to, relation (precedes, blocks, enables)
- Metadata: examples, counter-examples, notes

Next steps
- Define JSON schema and load into a visual graph (Panini tab)
- Author seed set (~50) and expand to ~400

