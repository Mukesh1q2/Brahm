export type VedicPassage = { ref: string; text: string; theme: string[] };

// Small sample corpus (expandable)
const corpus: VedicPassage[] = [
  { ref: 'Gita 2.47', text: 'You have the right to perform your prescribed duties, but you are not entitled to the fruits of your actions.', theme: ['duty','detachment','karma'] },
  { ref: 'Gita 3.19', text: 'Therefore, without attachment, always perform your duty because work done without attachment reaches the Supreme.', theme: ['duty','detachment','yoga'] },
  { ref: 'Gita 12.12', text: 'Better indeed is knowledge than practice; than knowledge, meditation is better; than meditation, renunciation of the fruits of actions; for peace immediately follows renunciation.', theme: ['knowledge','meditation','renunciation','peace'] },
  { ref: 'Isa Upanishad 1', text: 'All this—whatever exists in this changing universe—should be covered by the Lord.', theme: ['unity','nonduality'] },
  { ref: 'Chandogya Upanishad 6.8.7', text: 'Tat Tvam Asi — Thou art That.', theme: ['identity','nonduality','self'] },
  { ref: 'Mandukya Upanishad 7', text: 'The Self is the Lord of all; the omniscient; the inner controller; the source of all; the origin and end of beings.', theme: ['self','awareness','source'] },
  { ref: 'Katha Upanishad 2.20', text: 'The self is not born, nor does it die.', theme: ['self','atman','immortality'] },
  { ref: 'Taittiriya Upanishad 2.1', text: 'From bliss all beings are born; by bliss they live; into bliss they return.', theme: ['bliss','ananda','cosmos'] },
  { ref: 'Yoga Sutras 1.2', text: 'Yoga is the restraint of the modifications of the mind.', theme: ['mind','yoga','concentration'] },
  { ref: 'Yoga Sutras 1.12', text: 'Practice and detachment are the means to still the fluctuations of consciousness.', theme: ['practice','detachment','mind'] },
  { ref: 'Brihadaranyaka Upanishad 4.4.5', text: 'As is one’s desire, so is one’s will; as is one’s will, so is one’s deed; as is one’s deed, so is one’s destiny.', theme: ['desire','karma','destiny'] },
  { ref: 'Gita 6.26', text: 'Wherever the restless and unsteady mind wanders, one should restrain it and bring it back under the control of the Self.', theme: ['mind','discipline','meditation'] },
  { ref: 'Gita 18.66', text: 'Abandon all varieties of dharma and simply surrender unto Me.', theme: ['surrender','dharma','grace'] },
];

export class VedicCorpus {
  list(): VedicPassage[] { return corpus.slice(); }
  searchTheme(q: string): VedicPassage[] {
    const t = String(q || '').toLowerCase();
    return corpus.filter((p) => p.theme.some((x) => x.includes(t)) || p.text.toLowerCase().includes(t));
  }
}
