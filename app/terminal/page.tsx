"use client";

import React, { useState } from "react";
import { TerminalSquare, Play, ShieldCheck, Eye, CheckCircle2, Send, History } from "lucide-react";

export default function TerminalPage() {
// Use local Next.js API routes for MCP stubs
const API_URL = "";
  const [command, setCommand] = useState("ls -l");
  const [approvalToken, setApprovalToken] = useState("APPROVE");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);

  async function callStage(stage: "plan" | "dry-run" | "shadow-run" | "approve" | "execute") {
    setBusy(true);
    setResult(null);
    try {
const res = await fetch(`/api/mcp/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, stage, approval_token: approvalToken })
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ error: e?.message || "Request failed" });
    } finally {
      setBusy(false);
    }
  }

  async function loadAudit() {
    try {
const res = await fetch(`/api/mcp/audit?limit=50`);
      const data = await res.json();
      setAudit(data.entries || []);
    } catch (e) {
      setAudit([]);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="p-4 border-b border-purple-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TerminalSquare className="text-purple-400" />
          <h1 className="text-xl font-semibold">Brahm Terminal (MCP)</h1>
          <span className="text-xs text-purple-300/70">Plan → Dry-run → Shadow-run → Approve → Execute</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAudit} className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 flex items-center gap-2 text-sm">
            <History size={16} /> Audit
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="bg-black/30 border border-purple-500/20 rounded-lg p-4 space-y-3">
          <label className="text-sm text-purple-300">Command</label>
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="w-full bg-gray-900 text-white px-3 py-2 rounded outline-none border border-gray-700 focus:border-purple-600"
            placeholder="echo hello"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-sm text-purple-300">Approval token (demo)</label>
              <input
                value={approvalToken}
                onChange={(e) => setApprovalToken(e.target.value)}
                className="w-full bg-gray-900 text-white px-3 py-2 rounded outline-none border border-gray-700 focus:border-purple-600"
              />
            </div>
            <div className="flex items-end gap-2">
              <button disabled={busy} onClick={() => callStage("plan")} className="flex-1 px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm flex items-center gap-2">
                <Eye size={16} /> Plan
              </button>
              <button disabled={busy} onClick={() => callStage("dry-run")} className="flex-1 px-3 py-2 rounded bg-blue-700 hover:bg-blue-800 text-sm flex items-center gap-2">
                <Play size={16} /> Dry-run
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => callStage("shadow-run")} className="px-3 py-2 rounded bg-indigo-700 hover:bg-indigo-800 text-sm flex items-center gap-2">
              <ShieldCheck size={16} /> Shadow-run
            </button>
            <button disabled={busy} onClick={() => callStage("approve")} className="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} /> Approve
            </button>
            <button disabled={busy} onClick={() => callStage("execute")} className="px-3 py-2 rounded bg-purple-700 hover:bg-purple-800 text-sm flex items-center gap-2">
              <Send size={16} /> Execute
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/30 border border-purple-500/20 rounded-lg p-3">
            <div className="text-sm text-purple-300 mb-2">Result</div>
            <pre className="text-xs bg-gray-900 rounded p-3 overflow-auto h-72">{JSON.stringify(result, null, 2)}</pre>
          </div>
          <div className="bg-black/30 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-purple-300">Audit (latest 50)</div>
              <button onClick={loadAudit} className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs">Refresh</button>
            </div>
            <div className="text-xs bg-gray-900 rounded p-3 overflow-auto h-72">
              {audit.length === 0 ? (
                <div className="text-gray-400">No audit entries yet.</div>
              ) : (
                audit.map((entry, idx) => (
                  <div key={idx} className="mb-3 border-b border-gray-800 pb-2">
                    <div className="text-gray-400">{entry.timestamp}</div>
                    <div><span className="text-gray-400">stage:</span> {entry.stage || entry.mode || "-"}</div>
                    <div><span className="text-gray-400">user:</span> {entry.user}</div>
                    <div className="truncate"><span className="text-gray-400">cmd:</span> {entry.command}</div>
                    <div><span className="text-gray-400">allowed:</span> {String(entry.allowed)}</div>
                    {entry.sandbox && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-gray-300">sandbox output</summary>
                        <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(entry.sandbox, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

