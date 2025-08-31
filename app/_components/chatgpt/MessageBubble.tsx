"use client";
import React from "react";
import type { Message } from "@/app/_stores/chatStore";
import { Copy, RotateCcw, Trash2, BookmarkPlus, ChevronDown, ChevronUp, Database } from "lucide-react";
import { useChatStore } from "@/app/_stores/chatStore";

export default function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const ethics = (msg.meta as any)?.ethics as undefined | { decision: string; reasons?: string[]; principles?: string[] };
  const [showEthics, setShowEthics] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<string>("");
  const [savingSem, setSavingSem] = React.useState(false);
  const [saveSemMsg, setSaveSemMsg] = React.useState<string>("");
  const { deleteMessage, pushMessage, replaceLastAssistant } = useChatStore();
  const conf = typeof (msg.meta as any)?.confidence === 'number' ? (msg.meta as any).confidence as number : undefined;
  const unc = typeof (msg.meta as any)?.uncertainty === 'number' ? (msg.meta as any).uncertainty as number : undefined;

  async function onCopy() {
    try { await navigator.clipboard.writeText(msg.content); } catch {}
  }
  async function onRetry() {
    // True retry: use the same flow as composer send, by appending a new user message
    try {
      const lastUser = { role: 'user' as const, content: msg.content };
      pushMessage(lastUser);
      // Optimistic assistant placeholder; ChatComposer logic expects an assistant bubble and streams into it
      replaceLastAssistant('retrying…');
    } catch {}
  }
  function onDelete() {
    deleteMessage(msg.id);
  }
  async function onSaveMemory() {
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'note', role: msg.role, text: msg.content, ts: msg.createdAt, messageId: msg.id }),
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setSaveMsg('Saved');
      setTimeout(()=> setSaveMsg(''), 1200);
    } catch (e:any) {
      setSaveMsg(`Failed: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  }
  async function onSaveSemantic() {
    setSavingSem(true); setSaveSemMsg("");
    const labels = ["chat", msg.role];
    async function once(signal?: AbortSignal) {
      const res = await fetch('/api/memory/semantic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: msg.content, labels }), signal });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      return data;
    }
    try {
      const ctrl = new AbortController();
      const t = setTimeout(()=> ctrl.abort(), 5000);
      try { await once(ctrl.signal); clearTimeout(t); setSaveSemMsg('Saved semantic'); }
      catch (e:any) {
        clearTimeout(t);
        // retry once after short delay
        setSaveSemMsg('Retrying…');
        await new Promise(r=>setTimeout(r, 400));
        const ctrl2 = new AbortController();
        const t2 = setTimeout(()=> ctrl2.abort(), 5000);
        try { await once(ctrl2.signal); setSaveSemMsg('Saved semantic'); }
        finally { clearTimeout(t2); }
      }
      setTimeout(()=> setSaveSemMsg(''), 1200);
    } catch (e:any) {
      setSaveSemMsg(`Failed: ${e?.message || e}`);
    } finally {
      setSavingSem(false);
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow border ${
        isUser ? "bg-[var(--panel-bg)] border-[var(--panel-border)]" : "bg-[var(--panel-bg)] border-[var(--panel-border)]"
      }`}>
        {/* Confidence/Ethics chips */}
        {!isUser && (ethics || (conf != null && unc != null)) && (
          <div className="mb-2 flex items-center gap-2 text-[11px]">
            {conf != null && unc != null && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-white/5 border-white/10 text-gray-200">
                Conf: {(conf).toFixed(2)} • Unc: {(unc).toFixed(2)}
              </span>
            )}
            {ethics && (
              <>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${ethics.decision === 'allow' ? 'bg-green-900/30 border-green-700 text-green-300' : ethics.decision === 'revise' ? 'bg-amber-900/30 border-amber-700 text-amber-300' : 'bg-red-900/30 border-red-700 text-red-300'}`}>
                  {ethics.decision === 'allow' ? 'Ethics: allow' : ethics.decision === 'revise' ? 'Ethics: revise' : 'Ethics: veto'}
                </span>
                <button className="hover:underline opacity-80" onClick={()=>setShowEthics(s=>!s)}>
                  {showEthics ? <span className="inline-flex items-center gap-1">Hide reasoning <ChevronUp className="w-3 h-3" /></span> : <span className="inline-flex items-center gap-1">View reasoning <ChevronDown className="w-3 h-3" /></span>}
                </button>
              </>
            )}
          </div>
        )}

        {showEthics && ethics && (
          <div className="mb-2 rounded border border-white/10 bg-white/5 p-2 text-[11px] text-gray-300">
            {ethics.reasons?.length ? (
              <div className="mb-1"><span className="text-gray-400">Reasons:</span> {ethics.reasons.join('; ')}</div>
            ) : null}
            {ethics.principles?.length ? (
              <div><span className="text-gray-400">Principles:</span> {ethics.principles.join(', ')}</div>
            ) : null}
            {ethics.decision === 'revise' && (ethics as any).revision?.text && (
              <div className="mt-1"><span className="text-gray-400">Revision:</span> {(ethics as any).revision.text}</div>
            )}
            {ethics.decision === 'revise' && (
              <div className="mt-2 flex items-center gap-2">
                <button className="px-2 py-1 rounded border border-amber-700 bg-amber-900/30 text-amber-200" onClick={()=>{
                  try { window.dispatchEvent(new CustomEvent('chat:apply-revision', { detail: { text: String((ethics as any).revision?.text || '') } })); } catch {}
                }}>Apply revision</button>
                <label className="flex items-center gap-1 text-amber-200/80">
                  <input type="checkbox" defaultChecked={typeof window!=='undefined' && localStorage.getItem('ethics_auto_apply')==='true'} onChange={(e)=>{ try { localStorage.setItem('ethics_auto_apply', e.target.checked ? 'true' : 'false'); } catch {} }} /> Auto-apply next time
                </label>
              </div>
            )}
          </div>
        )}

        <div className="prose prose-invert prose-p:my-2 whitespace-pre-wrap selectable">{msg.content}</div>
        <div className="mt-2 flex flex-wrap gap-2 opacity-70 hover:opacity-100 text-xs">
          <button onClick={onCopy} className="hover:underline flex items-center gap-1"><Copy className="w-3 h-3" />Copy</button>
          {!isUser && <button onClick={onRetry} className="hover:underline flex items-center gap-1"><RotateCcw className="w-3 h-3" />Retry</button>}
          <button onClick={onDelete} className="hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3" />Delete</button>
          <button onClick={onSaveMemory} disabled={saving} className="hover:underline flex items-center gap-1"><BookmarkPlus className="w-3 h-3" />Save</button>
          <button onClick={onSaveSemantic} disabled={savingSem} className="hover:underline flex items-center gap-1"><Database className="w-3 h-3" />Save semantic</button>
          {(saveMsg || saveSemMsg) && <span className="text-[11px] text-gray-400">{saveMsg || saveSemMsg}</span>}
        </div>
      </div>
    </div>
  );
}

