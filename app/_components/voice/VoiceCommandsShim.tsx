"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { parseVoiceIntents } from './intent';

export default function VoiceCommandsShim() {
  const router = useRouter();
  React.useEffect(() => {
    try {
      const enable = (process.env.NEXT_PUBLIC_E2E_HOOKS ?? 'false') !== 'false' || (process.env.NEXT_PUBLIC_VOICE_ENABLED ?? 'false') !== 'false';
      if (!enable) return;
      // Expose a minimal hook for tests and simple voice navigation
      // @ts-ignore
      (window as any).__voice_cmd__ = (utterance: string) => {
        const t = String(utterance || '');
        const acts = parseVoiceIntents(t);
        const nav = acts.find(a => a.type === 'navigate');
        if (nav && (nav as any).path) {
          router.push((nav as any).path);
        }
        // Dispatch light-weight DOM events so pages can react (e.g., persist snapshot)
        try {
          for (const a of acts) {
            if (a.type === 'saveSnapshot') {
              window.dispatchEvent(new CustomEvent('voice:saveSnapshot'));
            } else if (a.type === 'saveDiary') {
              window.dispatchEvent(new CustomEvent('voice:saveDiary'));
            } else if (a.type === 'greet') {
              window.dispatchEvent(new CustomEvent('voice:greet'));
            } else if (a.type === 'mic') {
              window.dispatchEvent(new CustomEvent('voice:mic', { detail: { state: a.state } }));
            }
          }
          // Special verbs not encoded as actions above
          if (/(run|start|execute) (the )?(qft|fourier)/i.test(t)) {
            window.dispatchEvent(new CustomEvent('voice:runQFT'));
          }
        } catch {}
      };
    } catch {}
  }, [router]);
  return null;
}
