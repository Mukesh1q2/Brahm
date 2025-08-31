import { VedicCorpus, type VedicPassage } from './vedicCorpus';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h += (h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24); }
  return h >>> 0;
}

function embed(text: string, dim = 16): number[] {
  const h0 = hash(text || '');
  return new Array(dim).fill(0).map((_, i) => (((h0 >>> ((i % 4) * 8)) & 0xff) / 255));
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const d = Math.sqrt(Math.max(1e-9, na)) * Math.sqrt(Math.max(1e-9, nb));
  return d ? dot / d : 0;
}

export class VedicSemanticSearch {
  private corpus = new VedicCorpus();
  private dim = 16;
  private index: Array<{ p: VedicPassage; v: number[] }> | null = null;

  private ensureIndex() {
    if (this.index) return;
    const list = this.corpus.list();
    this.index = list.map((p) => ({ p, v: embed([p.ref, p.text, p.theme.join(' ')].join(' | '), this.dim) }));
  }

  async search(q: string, k = 5) {
    this.ensureIndex();
    const vq = embed(q, this.dim);
    const scored = (this.index || []).map(({ p, v }) => ({ p, score: cosine(vq, v) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}

