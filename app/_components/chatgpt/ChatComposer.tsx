"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { useChatStore } from "@/app/_stores/chatStore";
import { sendChat } from "@/app/_lib/api";
import { createEnvelopeParser } from "@/app/_lib/envelope";
import { useRightPanelData } from "@/store/rightPanelData";
import { useRightPanelStore } from "@/store/rightPanelStore";
import { uploadVoice } from "@/app/_lib/voice";
import { useModel } from "../ModelContext";
import { useQuantumSettings } from "@/app/_stores/quantumSettings";
import { useEpisodes } from "@/app/_stores/episodesStore";
import { ensureQuantumStructure, buildLineageChain, classifyTags, summarize, buildQuantumPreamble } from "@/app/_lib/quantumFormat";

export default function ChatComposer() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [busy, setBusy] = useState(false);
  const { conversations, activeId, newConversation, pushMessage, replaceLastAssistant, clearActive } = useChatStore();
  const { model } = useModel();
  const [useGemini, setUseGemini] = useState(false);
  useEffect(() => { try { setUseGemini(localStorage.getItem('chat_use_gemini') === 'true'); } catch {} }, []);
  function toggleUseGemini() {
    const v = !useGemini; setUseGemini(v);
    try { localStorage.setItem('chat_use_gemini', v ? 'true' : 'false'); } catch {}
  }
  const conv = conversations.find(c => c.id === activeId);
  const quantum = useQuantumSettings();
  const episodes = useEpisodes();
  // Right panel global stores
  const setPanelAll = useRightPanelData(s=>s.setAll);
  const setTab = useRightPanelStore(s=>s.setTab);
  const autoOpenEnabled = (process.env.NEXT_PUBLIC_CHAT_METADATA_AUTOOPEN ?? 'true') !== 'false';
  // Assistant metadata (e.g., ethics) captured from envelopes
  const assistantMetaRef = useRef<any>({});
  const revisionAppliedRef = useRef(false);
  const voiceEnabled = (process.env.NEXT_PUBLIC_VOICE_ENABLED ?? 'false') !== 'false';
  const autoSendVoice = (process.env.NEXT_PUBLIC_VOICE_AUTO_SEND ?? 'false') !== 'false';
  const wakewordFlag = (process.env.NEXT_PUBLIC_WAKEWORD_ENABLED ?? 'false') !== 'false';

  // Wakeword engine
  const wakeRef = useRef<{ start(): any; stop(): any; running: boolean } | null>(null);
  const [wakeListening, setWakeListening] = useState(false);
  const [wakeReady, setWakeReady] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  async function toggleWakeListening() {
    if (!wakewordFlag) return;
    if (wakeListening) {
      try { await wakeRef.current?.stop(); } catch {}
      setWakeListening(false);
      return;
    }
    try {
      setWakeReady('loading');
      const { createWakewordEngine } = await import("@/app/_lib/wakeword");
      wakeRef.current = await createWakewordEngine({ keyword: 'hey brahm', onDetected: () => {
        // Start recording on wakeword detection
        if (!isRecording && !voiceDisabled) startRecording();
      }});
      setWakeReady('ready');
      await wakeRef.current.start();
      setWakeListening(true);
    } catch {
      setWakeListening(false);
      setWakeReady('error');
    }
  }

  useEffect(() => () => { try { wakeRef.current?.stop(); } catch {} }, []);

  // Listen for revision apply events
  useEffect(() => {
    const handler = async (ev: any) => {
      try {
        const text = String(ev?.detail?.text || '').trim();
        if (!text) return;
        if (inputRef.current) {
          inputRef.current.value = text;
          await onSubmit({ preventDefault: () => {} } as any);
        }
      } catch {}
    };
    window.addEventListener('chat:apply-revision', handler as any);
    return () => window.removeEventListener('chat:apply-revision', handler as any);
  }, []);

  // Voice state (flag-gated)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [meterLevel, setMeterLevel] = useState(0);
  const [voiceDisabled, setVoiceDisabled] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try { setVoiceDisabled(localStorage.getItem('voiceDisabled') === 'true'); } catch {}
  }, []);

  function stopVisuals() {
    try {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      analyserRef.current?.disconnect();
      sourceRef.current?.disconnect();
    } catch {}
  }

  async function stopRecording(autoUpload = true) {
    try {
      setIsRecording(false);
      mediaRecorderRef.current?.stop();
    } catch {}
    try {
      const ctx = audioCtxRef.current; audioCtxRef.current = null; await ctx?.close();
    } catch {}
    stopVisuals();

    // compose blob
    let blob: Blob | null = null;
    try { blob = new Blob(chunksRef.current, { type: 'audio/webm' }); } catch {}
    chunksRef.current = [];
    if (!blob || blob.size === 0) return;
    const url = URL.createObjectURL(blob);
    setAudioURL(url);

    if (autoUpload) {
      try {
        const transcript = await uploadVoice({ blob });
        if (transcript) {
          if (autoSendVoice) {
            if (inputRef.current) {
              inputRef.current.value = transcript;
              await onSubmit({ preventDefault: () => {} } as any);
            }
          } else {
            if (inputRef.current) inputRef.current.value = transcript;
          }
        }
      } catch {}
    }
  }

  async function startRecording() {
    if (!voiceEnabled || voiceDisabled || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        try { stream.getTracks().forEach(t => t.stop()); } catch {}
      };
      mr.start(100);
      setIsRecording(true);

      // AudioContext for VU + simple VAD
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream); sourceRef.current = src;
      const analyser = ctx.createAnalyser(); analyser.fftSize = 1024; analyserRef.current = analyser;
      src.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);

      let silenceMs = 0;
      const silenceThreshold = 0.015; // ~1.5% RMS
      const maxSilence = 2500; // ms of continuous silence before auto-stop
      let lastT = performance.now();
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        // compute RMS
        let sum = 0; for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / data.length);
        setMeterLevel(rms);
        const now = performance.now();
        const dt = now - lastT; lastT = now;
        if (rms < silenceThreshold) silenceMs += dt; else silenceMs = 0;
        if (silenceMs >= maxSilence) { stopRecording(true); return; }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      setIsRecording(false);
    }
  }

  function toggleRecording() {
    if (isRecording) stopRecording(true); else startRecording();
  }

  function toggleKillSwitch() {
    const v = !voiceDisabled; setVoiceDisabled(v);
    try { localStorage.setItem('voiceDisabled', v ? 'true' : 'false'); } catch {}
  }

  const ensureChat = () => activeId ?? newConversation();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputRef.current?.value.trim() || busy) return;
    const text = inputRef.current.value.trim();
    const id = ensureChat();
    pushMessage({ role: "user", content: text });
    // Local-only ambient buffer (privacy): append to local log when enabled
    try { if (localStorage.getItem('ambient_on') === 'true') {
      const raw = localStorage.getItem('ambient_log');
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({ ts: Date.now(), text });
      localStorage.setItem('ambient_log', JSON.stringify(arr).slice(0, 200_000));
    } } catch {}
    inputRef.current.value = "";
    setBusy(true);
    try {
      // optimistic assistant bubble
      pushMessage({ role: "assistant", content: "…" });

      // E2E: seed a metadata-driven diff to auto-open the Diff tab if hooks enabled
      if ((process.env.NEXT_PUBLIC_E2E_HOOKS ?? 'false') !== 'false') {
        setTimeout(() => {
          try {
            const codeDiff = { original: 'console.log("old")', modified: 'console.log("new")', language: 'javascript' };
            setPanelAll({ codeDiff } as any);
            setTab('diff' as any);
          } catch {}
        }, 200);
      }

      controllerRef.current = new AbortController();
      // Build message payload with optional system preamble (Quantum Mode)
      const baseMsgs = (conversations.find(c => c.id === id)?.messages || []).map(m => ({ role: m.role, content: m.content }));
      let messagesPayload = baseMsgs;
      try {
        if (quantum.enabled) {
          const recent = episodes.recent(6).map(e => ({ id: e.id, summary: e.summary }));
          const lineage = buildLineageChain(recent);
          const preamble = buildQuantumPreamble({ enabled: quantum.enabled, ethicsGuardian: quantum.ethicsGuardian, memoryKeeper: quantum.memoryKeeper, lineage });
          messagesPayload = [ { role: 'system' as const, content: preamble }, ...baseMsgs ];
        }
      } catch {}

      const info = await sendChat({
        messages: messagesPayload,
        model: useGemini ? 'gemini-2.5-pro' : model,
        signal: controllerRef.current.signal,
      });

      if (!info.stream) throw new Error("No stream body");
      const reader = info.stream.getReader();
      const decoder = new TextDecoder();
      let acc = ""; // full raw stream (not shown)
      let accText = ""; // visible content (filters metadata envelopes)
      let bytes = 0;
      let chars = 0;
      // Mocked metadata envelope parser (feature-flagged)
      const parser = createEnvelopeParser((m) => {
        try {
          // Capture ethics metadata for the assistant message
          const anyM: any = m as any;
          if (anyM && anyM.ethics) {
            assistantMetaRef.current = { ...(assistantMetaRef.current || {}), ethics: anyM.ethics };
          }
        } catch {}
        if (!autoOpenEnabled) return;
        try {
          const reasoning = typeof m.reasoning === 'string' ? undefined : (m.reasoning ?? undefined);
          const summary = typeof m.reasoning === 'string' ? m.reasoning : undefined;
          let codeDiff = null as any;
          if ((m as any).diff) {
            const diff: any = (m as any).diff;
            if (typeof diff === 'string') codeDiff = { original: '', modified: diff, language: 'plaintext' };
            else codeDiff = { original: diff.original || '', modified: diff.modified, language: diff.language || 'plaintext' };
          }
          // Council/workspace
          let council = undefined as any;
          const workspace: any = (m as any).workspace;
          if (workspace && Array.isArray(workspace.deliberation_trace)) {
            council = { trace: workspace.deliberation_trace, votes: workspace.votes || {}, spotlight: workspace.spotlight };
            try {
              const rec = { ts: Date.now(), spotlight: workspace.spotlight || null, curiosity: workspace.curiosity ?? null };
              const raw = localStorage.getItem('workspace_timeline');
              const arr = raw ? JSON.parse(raw) : [];
              const next = [...(Array.isArray(arr) ? arr : []), rec].slice(-200);
              localStorage.setItem('workspace_timeline', JSON.stringify(next));
            } catch {}
          }
          // Auto-apply revision if flag enabled
          try {
            const anyM: any = m as any;
            const dec = anyM?.ethics?.decision;
            const revText = anyM?.ethics?.revision?.text;
            const auto = (typeof localStorage !== 'undefined' && localStorage.getItem('ethics_auto_apply') === 'true');
            if (dec === 'revise' && revText && auto && !revisionAppliedRef.current) {
              revisionAppliedRef.current = true;
              setTimeout(() => {
                try { window.dispatchEvent(new CustomEvent('chat:apply-revision', { detail: { text: String(revText) } })); } catch {}
              }, 50);
            }
          } catch {}
          setPanelAll({ summary, json: reasoning, codeDiff, council });
          // Switch to an appropriate tab
          const target = (m as any).tab || (council ? 'council' : codeDiff ? 'diff' : reasoning ? 'trace' : 'summary');
          setTab(target as any);
        } catch {}
      });
      // Listen for mock stream chunks (for demos)
      const onMock = (e: any) => { try { const t = e?.detail?.text; if (t) parser.push(String(t)); } catch {} };
      window.addEventListener('chat:mock-stream-chunk', onMock as any);
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value?.byteLength || 0;
          const chunk = decoder.decode(value, { stream: true });
          chars += chunk.length;
          acc += chunk;
          // Split to identify metadata envelopes and filter from visible text
          const parts = chunk.split(/\r?\n/);
          for (const line of parts) {
            const t = line.trim();
            const looksJson = t.startsWith('{') && t.endsWith('}') && t.includes('\"type\"');
            if (looksJson) {
              try { const obj = JSON.parse(t); if (obj && obj.type === 'metadata') { /* skip from visible */ continue; } } catch {}
            }
            accText += line + (line.endsWith('\n') ? '' : '\n');
          }
          // feed parser a line-based view to allow envelopes like {"type":"metadata",...}\n
          try { parser.push(chunk); } catch {}
          replaceLastAssistant(accText, assistantMetaRef.current);
        }
        // Post-process into Quantum structure and save episode
        try {
          if (quantum.enabled && quantum.enforceStructure) {
            const recent = episodes.recent(4).map(e => ({ id: e.id, summary: e.summary }));
            const lineage = buildLineageChain(recent);
            const structured = ensureQuantumStructure(accText, { lineage, ethics: quantum.ethicsGuardian });
            replaceLastAssistant(structured, assistantMetaRef.current);
            if (quantum.memoryKeeper) {
              const tags = Array.from(new Set([...classifyTags(accText), ...classifyTags(structured)]));
              const summary = summarize(structured, 200);
              episodes.add({ summary, tags, prompt: conv?.messages?.slice(-1)?.[0]?.content || '', response: structured });
            }
          }
        } catch {}
      } finally {
        window.removeEventListener('chat:mock-stream-chunk', onMock as any);
      }
      try {
        const end = Date.now();
        const detail: any = { trace: info.trace, url: '/api/chat', ok: true, status: info.status, clientLatencyMs: end - info.startedAt, bytesStreamed: bytes, charsStreamed: chars, requestModel: info.requestModel || null, responseModel: info.responseModel || null, app: 'chat' };
        window.dispatchEvent(new CustomEvent('telemetry:request-complete', { detail }));
      } catch {}
    } catch (err: any) {
      console.error('[ChatComposer] Request failed:', err);
      
      let errorMessage = `⚠️ ${err.message ?? "Request failed"}`;
      
      // Enhanced error messaging based on common failure modes
      if (err.message?.includes('502') || err.message?.includes('unavailable')) {
        errorMessage = "⚠️ AI services are currently unavailable. The backend may be down or there might be an API configuration issue. Check the console for more details.";
      } else if (err.message?.includes('timeout')) {
        errorMessage = "⚠️ Request timed out. Please try again with a shorter message.";
      } else if (err.message?.includes('network')) {
        errorMessage = "⚠️ Network error. Please check your internet connection and try again.";
      }
      
      replaceLastAssistant(errorMessage);
    } finally {
      controllerRef.current = null;
      setBusy(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function autoGrow(el: HTMLTextAreaElement) {
    const maxLines = 8;
    const cs = window.getComputedStyle(el);
    const lineHeight = parseFloat(cs.lineHeight || '20') || 20;
    const maxHeight = lineHeight * maxLines;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
  }

  return (
    <form onSubmit={onSubmit} className="border-t border-white/5 bg-[var(--app-bg)]">
      <div className="mx-auto max-w-3xl p-4">
        <div className="flex items-end gap-3 bg-[var(--input-bg)] rounded-xl px-4 py-3 border border-[var(--input-border)]">
          {wakewordFlag && voiceEnabled && (
            <div className="flex flex-col items-center gap-1 pr-1">
              <button
                type="button"
                onClick={toggleWakeListening}
                disabled={voiceDisabled}
                role="switch"
                aria-checked={wakeListening}
                className={`px-2 py-1 rounded ${wakeListening ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/80 hover:bg-white/15'} disabled:opacity-40`}
                title={wakeListening ? 'Stop wake-word listening' : 'Start wake-word listening'}
              >
                {wakeListening ? (wakeReady==='ready' ? 'Listening…' : 'Loading…') : 'Wake'}
              </button>
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={() => stopRecording(true)}
                onTouchStart={startRecording}
                onTouchEnd={() => stopRecording(true)}
                disabled={voiceDisabled}
                className="px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/15 disabled:opacity-40"
                title="Push-to-talk"
              >PTT</button>
            </div>
          )}
          {voiceEnabled && (
            <div className="flex flex-col items-center gap-1 pr-1">
              <button
                type="button"
                onClick={toggleRecording}
                disabled={voiceDisabled}
                className={`p-2 rounded-md ${isRecording ? 'bg-red-500/20 text-red-300 animate-pulse' : 'bg-white/10 text-white/80 hover:bg-white/15'} disabled:opacity-40`}
                aria-pressed={isRecording}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <div className="h-1.5 w-8 rounded bg-white/10 overflow-hidden" aria-hidden>
                <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, Math.max(0, Math.round(meterLevel * 100)))}%` }} />
              </div>
            </div>
          )}
          <textarea
            ref={inputRef}
            rows={1}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit(e as any);
            }}
            onInput={(e) => autoGrow(e.currentTarget)}
            placeholder="Message Brahm…"
            className="flex-1 bg-transparent resize-none outline-none placeholder:text-neutral-500 max-h-48 text-white/90 leading-relaxed py-2 px-2"
            style={{ fontSize: '16px', lineHeight: '1.5' }}
            aria-label="Chat message input"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!busy}
              onClick={() => { try { controllerRef.current?.abort(); } catch {}; setBusy(false); }}
              className="px-2 py-1 rounded text-xs border border-white/15 bg-white/10 text-white/80 hover:bg-white/15 disabled:opacity-50"
              title="Stop streaming"
            >Stop</button>
            <button
              type="button"
              onClick={() => clearActive()}
              className="px-2 py-1 rounded text-xs border border-white/15 bg-white/10 text-white/80 hover:bg-white/15"
              title="Clear conversation"
            >Clear</button>
            <button
              type="button"
              onClick={toggleUseGemini}
              className={`px-2 py-1 rounded text-xs border ${useGemini ? 'border-brand-500 bg-brand-600/20 text-brand-200' : 'border-white/15 bg-white/10 text-white/80 hover:bg-white/15'}`}
              title="Use Gemini 2.5 Pro for this chat"
            >
              {useGemini ? 'Gemini ON' : 'Gemini OFF'}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1">
          <span>Press ⌘/Ctrl + Enter to send • Shift+Enter for newline</span>
          {voiceEnabled && (
            <button type="button" onClick={toggleKillSwitch} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-neutral-300">
              {voiceDisabled ? 'Enable Mic' : 'Disable Mic'}
            </button>
          )}
        </div>
        {voiceEnabled && audioURL && (
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
            <audio src={audioURL} controls className="max-w-[320px]" />
            <span>Preview</span>
          </div>
        )}
      </div>
    </form>
  );
}

