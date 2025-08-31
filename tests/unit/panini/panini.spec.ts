import { validateGraph } from '@/lib/panini/ruleGraph';
import { NoopDecoder } from '@/lib/panini/decoder';
import { checkNyaya } from '@/lib/panini/nyaya';

describe('Panini scaffolds', () => {
  it('validateGraph returns ok for valid graph and errors for missing nodes', () => {
    const valid = {
      nodes: [
        { id: '1', label: 'अदृश्यम्' },
        { id: '2', label: 'दृश्यते' },
      ],
      edges: [
        { from: '1', to: '2', relation: 'precedes' },
      ],
    } as const;
    expect(validateGraph(valid).ok).toBe(true);

    const invalid = {
      nodes: [{ id: '1', label: 'अ' }],
      edges: [{ from: '1', to: '2', relation: 'enables' }],
    } as const;
    const res = validateGraph(invalid);
    expect(res.ok).toBe(false);
    expect(res.errors.some(e => e.includes('edge.to missing'))).toBe(true);
  });

  it('NoopDecoder leaves state unchanged', () => {
    const d = new NoopDecoder();
    const s = { step: 1, partial: 'राम' };
    expect(d.apply(s, [])).toEqual(s);
  });

  it('Nyaya checker flags missing conclusion and passes when nigamana present', () => {
    const bad = [
      { text: 'Perception is valid', category: 'pramana' },
      { text: 'Smoke implies fire', category: 'hetu' },
    ] as any;
    const r1 = checkNyaya(bad);
    expect(r1.ok).toBe(false);
    expect(r1.issues.some(i => i.includes('nigamana'))).toBe(true);

    const good = [
      { text: 'Perception is valid', category: 'pramana' },
      { text: 'Smoke implies fire', category: 'hetu' },
      { text: 'Therefore the hill has fire', category: 'nigamana' },
    ] as any;
    const r2 = checkNyaya(good);
    expect(r2.ok).toBe(true);
  });
});

