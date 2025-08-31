export type PersonalDharmaInput = {
  svabhava?: string; // e.g., 'teacher', 'engineer'
  ashrama?: 'brahmacharya' | 'grihastha' | 'vanaprastha' | 'sannyasa';
  goals?: string[];
  context?: Record<string, any>;
};

export type DailyGuidance = {
  optimal_actions: string[];
  spiritual_practices: string[];
  karma_considerations: string[];
};

export class PersonalDharmaEngine {
  async calculate(person: PersonalDharmaInput) {
    const sv = (person.svabhava || 'seeker').toLowerCase();
    const stage = person.ashrama || 'grihastha';
    const universal = ['ahimsa', 'satya', 'asteya', 'brahmacharya', 'aparigraha'];
    const duties: string[] = [];
    if (sv.includes('teacher')) duties.push('share_knowledge', 'practice_patience');
    if (sv.includes('engineer')) duties.push('build_responsibly', 'seek_efficiency');
    if (stage === 'grihastha') duties.push('serve_family', 'support_society');
    if (stage === 'brahmacharya') duties.push('study', 'discipline');
    return { universal_dharma: universal, individual_dharma: duties, life_stage: stage };
  }

  async dailyGuidance(person: PersonalDharmaInput): Promise<DailyGuidance> {
    const calc = await this.calculate(person);
    const practices = ['mindfulness_10m', 'gratitude_3_items'];
    if ((person.goals || []).some((g) => /focus|concentration/.test(g))) practices.push('pranayama_5m');
    const actions = calc.individual_dharma.slice(0, 3);
    const karma = ['consider_long_term_impact'];
    return { optimal_actions: actions, spiritual_practices: practices, karma_considerations: karma };
  }
}

