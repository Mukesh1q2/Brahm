"use client";

import React from 'react';

function applyTheme(t: 'dark' | 'light') {
  try {
    const el = document.documentElement;
    // Toggle Tailwind dark class
    if (t === 'dark') el.classList.add('dark'); else el.classList.remove('dark');
    // Toggle explicit theme classes for CSS variables
    el.classList.remove('theme-dark', 'theme-light');
    el.classList.add(t === 'dark' ? 'theme-dark' : 'theme-light');
    localStorage.setItem('theme', t);
  } catch {}
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  // Avoid SSR/CSR mismatch: do not read localStorage during initial render
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = React.useState(false);

  // Hydrate saved theme after mount
  React.useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
      if (saved) {
        if (saved !== theme) setTheme(saved);
      } else {
        const def = (process.env.NEXT_PUBLIC_DEFAULT_THEME ?? 'dark') as 'dark' | 'light';
        if (def !== theme) setTheme(def);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={`rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`}
      aria-pressed={theme === 'dark'}
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      suppressHydrationWarning
    >
      Theme: {mounted ? theme : 'dark'}
    </button>
  );
}
