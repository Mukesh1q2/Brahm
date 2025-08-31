"use client";

import React from "react";

const DEFAULT_KEYS = [
  { name: "GEMINI_API_KEY", label: "Google Gemini API key" },
  { name: "GOOGLE_API_KEY", label: "Google API key (alias)" },
  { name: "OPENAI_API_KEY", label: "OpenAI API key" },
  { name: "ANTHROPIC_API_KEY", label: "Anthropic API key" },
  { name: "AZURE_OPENAI_API_KEY", label: "Azure OpenAI API key" },
] as const;

type KeyInfo = { name: string; present: boolean };

export default function KeysSettingsPage() {
  const [keys, setKeys] = React.useState<KeyInfo[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string>("");
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [validateMsg, setValidateMsg] = React.useState<string>("");

  const load = React.useCallback(async () => {
    setMsg("");
    try {
      const res = await fetch("/api/keys", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setKeys(Array.isArray(data?.keys) ? data.keys : []);
    } catch (e: any) {
      setMsg(`Failed to load: ${e?.message || e}`);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const onSave = async (name: string) => {
    setBusy(true);
    setMsg("");
    try {
      const value = values[name] || "";
      const res = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, value }) });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setValues(v => ({ ...v, [name]: "" }));
      await load();
      setMsg("Saved");
      setTimeout(()=> setMsg(""), 1200);
    } catch (e: any) {
      setMsg(`Save failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">API Keys (Dev)</h1>
        <div className="flex items-center gap-2">
          {validateMsg && <span className="text-xs text-gray-400">{validateMsg}</span>}
          <button
            className="px-2 py-1 rounded bg-white/10 border border-white/10 hover:bg-white/15 text-xs"
            title="Validate Gemini key with a live request"
            onClick={async()=>{
              setValidateMsg('');
              try {
                const res = await fetch('/api/keys/validate/gemini', { cache: 'no-store' });
                const data = await res.json();
                if (!res.ok || !data?.ok) {
                  setValidateMsg(`Gemini: ${data?.status || res.status} • ${String(data?.error || data?.detail || 'invalid')}`);
                } else {
                  setValidateMsg('Gemini: ok');
                }
              } catch (e:any) {
                setValidateMsg(`Validate failed: ${e?.message || e}`);
              }
            }}
          >Validate Gemini</button>
          {msg && <div className="text-sm text-gray-400">{msg}</div>}
        </div>
      </div>
      <div className="text-sm text-gray-400">
        This settings page stores keys using the server vault helper in development. Keys are never sent back to the client; presence-only checks are used. In production, configure environment variables securely.
      </div>
      {/* OCR settings */}
      <div className="rounded border border-white/10 bg-white/5 p-3 text-sm">
        <div className="font-semibold mb-2">OCR Settings (Dev)</div>
        <div className="flex items-center gap-2">
          <label className="text-xs opacity-80">Language</label>
          <select
            className="px-2 py-1 rounded bg-white/10 border border-white/10"
            defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('ocr_lang') || 'eng') : 'eng'}
            onChange={(e)=>{ try { localStorage.setItem('ocr_lang', e.target.value); } catch {} }}
          >
            <option value="eng">English (eng)</option>
            <option value="san">Sanskrit (san)</option>
            <option value="hin">Hindi (hin)</option>
            <option value="deu">German (deu)</option>
          </select>
          <span className="text-xs opacity-70">Used by /api/files/upload in dev</span>
        </div>
      </div>

      <div className="space-y-4">
        {DEFAULT_KEYS.map((k) => {
          const info = keys.find(x => x.name === k.name);
          const present = !!info?.present;
          return (
            <div key={k.name} className="border border-gray-800 rounded p-3 bg-black/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{k.label}</div>
                  <div className="text-[11px] text-gray-500 font-mono">{k.name}</div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${present ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${present ? 'bg-green-400' : 'bg-gray-500'}`} />
                    {present ? 'present' : 'not set'}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="password"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                  placeholder="Enter key (will not be shown)"
                  value={values[k.name] || ''}
                  onChange={(e)=> setValues(v => ({ ...v, [k.name]: e.target.value }))}
                />
                <button
                  className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  onClick={()=>onSave(k.name)}
                  disabled={busy}
                >
                  Save
                </button>
                <button
                  className="px-3 py-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50"
                  onClick={()=>{ setValues(v => ({ ...v, [k.name]: '' })); onSave(k.name); }}
                  disabled={busy}
                  title="Clear key"
                >
                  Clear
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

