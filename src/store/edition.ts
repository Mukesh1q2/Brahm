import { create } from 'zustand';

export type Edition = 'basic' | 'advanced';

type EditionState = {
  edition: Edition;
  setEdition: (e: Edition) => void;
};

const STORAGE_KEY = 'brahm:edition';

function loadEdition(): Edition {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Edition | null;
    if (saved === 'advanced' || saved === 'basic') return saved;
  } catch {}
  const env = (process.env.NEXT_PUBLIC_BRAHM_EDITION || 'basic').toLowerCase();
  return env === 'advanced' ? 'advanced' : 'basic';
}

function saveEdition(e: Edition) {
  try { localStorage.setItem(STORAGE_KEY, e); } catch {}
}

export const useEdition = create<EditionState>((set) => ({
  // Initialize from env only to avoid SSR/CSR mismatch; client will hydrate from localStorage via EditionToggle
  edition: ((process.env.NEXT_PUBLIC_BRAHM_EDITION || 'basic').toLowerCase() === 'advanced' ? 'advanced' : 'basic'),
  setEdition: (e) => set(() => { saveEdition(e); try {
    const root = document.documentElement;
    root.classList.remove('edition-basic','edition-advanced');
    root.classList.add(e === 'advanced' ? 'edition-advanced' : 'edition-basic');
  } catch {} return { edition: e }; }),
}));
