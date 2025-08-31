import { VedicCorpus } from './vedicCorpus';
import { QuantumVedantaBridge } from './quantumVedantaBridge';
import { PersonalDharmaEngine } from './dharma';

export class UniversalVedicTeacher {
  private corpus = new VedicCorpus();
  private bridge = new QuantumVedantaBridge();
  private dharma = new PersonalDharmaEngine();

  async teach(query: string, profile?: { svabhava?: string; ashrama?: any }) {
    const passages = this.corpus.searchTheme(query).slice(0, 3);
    const bridges = await this.bridge.findParallels(query);
    const dharma = await this.dharma.dailyGuidance({ svabhava: profile?.svabhava, ashrama: profile?.ashrama, goals: [query] });
    return {
      vedic_passages: passages,
      scientific_bridges: bridges,
      daily_guidance: dharma,
      synthesis: this.synthesize(passages.map((p) => p.text), bridges.map((b) => b.mapping)),
    };
  }

  private synthesize(texts: string[], bridges: string[]) {
    const t = texts.join(' | ');
    const m = bridges.join('; ');
    return `Principle: ${t ? t.slice(0, 120) : 'seek clarity and compassion'}. Bridges: ${m || 'mind/attention ↔ discipline/yoga'}`;
  }
}

