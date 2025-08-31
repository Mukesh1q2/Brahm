export type WakewordEngine = {
  start(): Promise<void> | void;
  stop(): Promise<void> | void;
  running: boolean;
};

export type WakewordOptions = {
  keyword?: string; // e.g., "hey brahm"
  onDetected: () => void;
};

// Minimal stub that attempts to use a Porcupine-like engine if present on window.
// In production, provide a proper integration (PPN key, model, keyword files).
export async function createWakewordEngine(opts: WakewordOptions): Promise<WakewordEngine> {
  // Attempt to use Porcupine Web SDK if available and configured via /api/wakeword/config
  try {
    const res = await fetch('/api/wakeword/config');
    if (res.ok) {
      const cfg = await res.json().catch(()=>({}));
      const anyWin: any = typeof window !== 'undefined' ? (window as any) : {};
      if (anyWin.Porcupine && typeof anyWin.Porcupine.create === 'function' && cfg?.enabled) {
        try {
          const engine = await anyWin.Porcupine.create({
            // Note: For real integration, Porcupine typically requires an accessKey.
            // Do NOT send secrets to the client. Use short-lived tokens or vendor-specific flows.
            modelPath: cfg.modelPath,
            keywordPath: cfg.keywordPath,
          });
          let running = false;
          engine.on('detected', () => { try { opts.onDetected(); } catch {} });
          return {
            running,
            start: async () => { running = true; await engine.start?.(); },
            stop: async () => { running = false; await engine.stop?.(); },
          } as WakewordEngine;
        } catch (e) {
          console.warn('Porcupine create failed:', e);
        }
      }
    }
  } catch (e) {
    // ignore
  }
  const anyWin: any = typeof window !== 'undefined' ? (window as any) : {};
  // If a Porcupine instance is present, wire to its detection callback.
  if (anyWin.Porcupine && typeof anyWin.Porcupine.create === 'function') {
    try {
      const engine = await anyWin.Porcupine.create({ keyword: opts.keyword || 'hey brahm' });
      let running = false;
      engine.on('detected', () => { try { opts.onDetected(); } catch {} });
      return {
        running,
        start: async () => { running = true; await engine.start?.(); },
        stop: async () => { running = false; await engine.stop?.(); },
      } as WakewordEngine;
    } catch (e) {
      console.warn('Wakeword engine init failed:', e);
    }
  }
  // Fallback stub: no actual detection.
  let running = false;
  return {
    get running() { return running; },
    start() { running = true; console.info('[wakeword] stub started (no detection engine found)'); },
    stop() { running = false; console.info('[wakeword] stub stopped'); },
  } as WakewordEngine;
}

