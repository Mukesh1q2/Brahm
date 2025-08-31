"use client";

import React from 'react';

export type Toast = { id: string; message: string; type?: 'info' | 'success' | 'error' };

const ToastCtx = React.createContext<{ toasts: Toast[]; push: (t: Omit<Toast, 'id'>) => void; remove: (id: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts((arr) => [...arr, { id, ...t }]);
    setTimeout(() => remove(id), 3500);
  }, []);
  const remove = React.useCallback((id: string) => setToasts((arr) => arr.filter((t) => t.id !== id)), []);

  // expose simple global for convenience
  React.useEffect(() => {
    (window as any).__brahm_toast = (msg: string, type: 'info'|'success'|'error'='info') => push({ message: msg, type });
  }, [push]);

  return (
    <ToastCtx.Provider value={{ toasts, push, remove }}>
      {children}
      <div className="pointer-events-none fixed right-3 top-3 z-50 flex w-[320px] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-md ${t.type==='error'?'border-red-500/40 bg-red-900/20 text-red-200': t.type==='success'?'border-emerald-500/40 bg-emerald-900/20 text-emerald-200':'border-white/15 bg-white/10 text-white/90'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error('ToastProvider missing');
  return ctx;
}
