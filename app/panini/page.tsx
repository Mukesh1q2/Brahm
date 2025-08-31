"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import 'reactflow/dist/style.css';
import { useModel, ratePer1k } from "../_components/ModelContext";
import { useRightPanelData } from "@/store/rightPanelData";
import { useRightPanelStore } from "@/store/rightPanelStore";

// Optional remote persistence toggle (no-op if backend not ready)
const HISTORY_REMOTE = process.env.NEXT_PUBLIC_HISTORY_REMOTE === 'true';

// Simple client-only page for Panini Rule Graph editing and DSL upload
// Expects backend endpoints:
//  - POST /auth/token { username }
//  - POST /panini/rule { id, text, attrs? }
//  - POST /panini/link { rel, src, dst, attrs? }
//  - GET  /panini/rule/{id}
//  - GET  /panini/search?q=...&limit=...
//  - POST /panini/apply { program }

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

type Rule = { id: string; text: string; attrs?: Record<string, any> };

type Link = { rel: string; src: string; dst: string; attrs?: Record<string, any> };

const LS_KEYS = {
  ruleId: "panini_ruleId",
  ruleText: "panini_ruleText",
  ruleAttrs: "panini_ruleAttrs",
  rel: "panini_rel",
  src: "panini_src",
  dst: "panini_dst",
  linkAttrs: "panini_linkAttrs",
  program: "panini_program",
  appliedHistory: "panini_appliedHistory",
  autoCopyAfterApply: "panini_autoCopyAfterApply",
} as const;

const SAMPLES: { label: string; code: string }[] = [
  {
    label: "Panini: vṛddhir ādaiC with precedence",
    code: `# Pāṇini sample\nrule A.1.1 : "vṛddhir ādaiC"\nrule A.1.1a : "echo of sample"\nlink precedes A.1.1 -> A.1.1a {"strength": 1}`,
  },
  {
    label: "Phonological rule chain",
    code: `rule A.2.1 : "ikoyanaci"\nrule A.2.2 : "guna vrddhi context"\nlink precedes A.2.1 -> A.2.2 {"note": "ordering"}`,
  },
  {
    label: "Sandhi example",
    code: `rule A.6.1.77 : "iko yanaci"\nrule A.6.1.78 : "vṛddhi substitution"\nlink strengthens A.6.1.77 -> A.6.1.78 {"priority": 2}`,
  },
];

function GraphView({ token, pushToast, xModel }: { token: string | null, pushToast: (k: any, t: string) => void, xModel?: string }) {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // Highlighted path from optimizer
  const [pathHighlight, setPathHighlight] = useState<string[]>([]);
  const highlightPairs = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < pathHighlight.length - 1; i++) s.add(`${String(pathHighlight[i])}->${String(pathHighlight[i+1])}`);
    return s;
  }, [pathHighlight]);
  // Right panel global stores
  const setPanelAll = useRightPanelData(s => s.setAll);
  const setTab = useRightPanelStore(s => s.setTab);
  const renderedNodes = useMemo(() => nodes.map(n => (
    pathHighlight.includes(String(n.id)) ? { ...n, style: { ...(n.style||{}), border: '2px solid #8b5cf6' } } : n
  )), [nodes, pathHighlight]);
  const renderedEdges = useMemo(() => edges.map(e => (
    highlightPairs.has(`${e.source}->${e.target}`)
      ? { ...e, animated: true, style: { ...(e.style||{}), stroke: '#8b5cf6', strokeWidth: 2 }, labelStyle: { ...(e.labelStyle||{}), fill: '#8b5cf6', fontWeight: 700 } }
      : e
  )), [edges, highlightPairs]);
  // Server-side pagination to keep graph light
  const [rulePage, setRulePage] = useState(1);
  const [rulePageSize, setRulePageSize] = useState(200);
  const [linkPage, setLinkPage] = useState(1);
  const [linkPageSize, setLinkPageSize] = useState(400);

  // Side panel forms state
  const [nodeId, setNodeId] = useState("");
  const [nodeText, setNodeText] = useState("");
  const [nodeAttrs, setNodeAttrs] = useState("{}");
  const [nodeAttrsValid, setNodeAttrsValid] = useState(true);
  const [nodeAttrsErr, setNodeAttrsErr] = useState("");

  const [edgeRel, setEdgeRel] = useState("precedes");
  const [edgeSrc, setEdgeSrc] = useState("");
  const [edgeDst, setEdgeDst] = useState("");
  const [edgeAttrs, setEdgeAttrs] = useState("{}");
  const [edgeAttrsValid, setEdgeAttrsValid] = useState(true);
  const [edgeAttrsErr, setEdgeAttrsErr] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const relInputRef = React.useRef<HTMLInputElement | null>(null);

  // Layout controls
  const [lockPositions, setLockPositions] = useState(false);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  const [snapGridSize, setSnapGridSize] = useState(20);
  const [instantSave, setInstantSave] = useState(true);
  const queuedPositionsRef = React.useRef<Map<string, { x:number, y:number }>>(new Map());

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (xModel) h["X-Model"] = xModel;
    return h;
  }, [token, xModel]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const roff = Math.max(0, (rulePage - 1) * rulePageSize);
      const loff = Math.max(0, (linkPage - 1) * linkPageSize);
      const [rulesRes, linksRes] = await Promise.all([
        fetch(`${API_BASE}/panini/rules?limit=${rulePageSize}&offset=${roff}`, { headers: authHeaders }),
        fetch(`${API_BASE}/panini/links?limit=${linkPageSize}&offset=${loff}`, { headers: authHeaders }),
      ]);
      const rules = await rulesRes.json().catch(()=>[]);
      const links = await linksRes.json().catch(()=>[]);
      const nodeList = (Array.isArray(rules) ? rules : []).map((r: any) => {
        const ui = (r?.attrs && r.attrs.ui) || {};
        const x = Number.isFinite(ui.x) ? ui.x : Math.random()*500;
        const y = Number.isFinite(ui.y) ? ui.y : Math.random()*300;
        return { id: r.id, data: { label: r.id, id: r.id, text: r.text, attrs: r.attrs || {} }, position: { x, y } };
      });
      const edgeList = (Array.isArray(links) ? links : []).map((e: any) => ({ id: String(e.id ?? `${e.rel}:${e.src}->${e.dst}`), source: e.src, target: e.dst, label: e.rel, data: { rel: e.rel, src: e.src, dst: e.dst, id: e.id } }));
      setNodes(nodeList);
      setEdges(edgeList);
      // Update shell right panel
      setPanelAll({
        summary: `Graph loaded: ${nodeList.length} nodes, ${edgeList.length} links`,
        json: { nodes: nodeList.length, links: edgeList.length, rulePage, rulePageSize, linkPage, linkPageSize },
        codeDiff: null,
      });
    } catch {
      setNodes([]); setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, rulePage, rulePageSize, linkPage, linkPageSize, setPanelAll]);

  useEffect(() => { refresh(); }, [refresh]);
  // Listen for external refresh requests (e.g., from list manager)
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('panini:refresh-graph', handler as any);
    return () => window.removeEventListener('panini:refresh-graph', handler as any);
  }, [refresh]);
  // Listen for highlight path events
  useEffect(() => {
    const handler = (ev: any) => {
      const detail = ev?.detail;
      const p = (detail && detail.path) || detail || [];
      if (Array.isArray(p)) {
        const ph = p.map((x:any)=>String(x));
        setPathHighlight(ph);
        // Push into right panel and switch to Trace
        setPanelAll({ json: { highlightPath: ph } });
        setTab('trace');
      }
    };
    window.addEventListener('panini:highlight-path', handler as any);
    return () => window.removeEventListener('panini:highlight-path', handler as any);
  }, [setPanelAll, setTab]);

  // Validate JSON inputs
  useEffect(() => {
    if (!nodeAttrs.trim()) { setNodeAttrsValid(true); setNodeAttrsErr(""); return; }
    try { JSON.parse(nodeAttrs); setNodeAttrsValid(true); setNodeAttrsErr(""); } catch (e: any) { setNodeAttrsValid(false); setNodeAttrsErr(e?.message || 'Invalid JSON'); }
  }, [nodeAttrs]);
  useEffect(() => {
    if (!edgeAttrs.trim()) { setEdgeAttrsValid(true); setEdgeAttrsErr(""); return; }
    try { JSON.parse(edgeAttrs); setEdgeAttrsValid(true); setEdgeAttrsErr(""); } catch (e: any) { setEdgeAttrsValid(false); setEdgeAttrsErr(e?.message || 'Invalid JSON'); }
  }, [edgeAttrs]);

  // Lazy import to avoid SSR issues
  const ReactFlow = useMemo(() => require('reactflow').default, []);
  const Background = useMemo(() => require('reactflow').Background, []);
  const Controls = useMemo(() => require('reactflow').Controls, []);
  const MiniMap = useMemo(() => require('reactflow').MiniMap, []);

  const onNodesDelete = useCallback(async (nds: any[]) => {
    for (const n of nds) {
      try { await fetch(`${API_BASE}/panini/rule/${encodeURIComponent(n.id)}`, { method: 'DELETE', headers: authHeaders }); } catch {}
    }
    refresh();
  }, [authHeaders, refresh]);

  const onEdgesDelete = useCallback(async (eds: any[]) => {
    for (const e of eds) {
      const d = e?.data || {};
      const params = new URLSearchParams();
      if (typeof d.id === 'number') params.set('id', String(d.id));
      else {
        if (d.rel) params.set('rel', String(d.rel));
        params.set('src', String(d.src || e.source));
        params.set('dst', String(d.dst || e.target));
      }
      try { await fetch(`${API_BASE}/panini/link?${params.toString()}`, { method: 'DELETE', headers: authHeaders }); } catch {}
    }
    refresh();
  }, [authHeaders, refresh]);

  const onConnect = useCallback((params: any) => {
    setEdgeSrc(params.source || "");
    setEdgeDst(params.target || "");
    setTimeout(() => { try { relInputRef.current?.focus(); } catch {} }, 0);
  }, []);

  const createNode = useCallback(async () => {
    if (!nodeId.trim()) { pushToast('error', 'Node ID is required'); return; }
    if (!nodeAttrsValid) { pushToast('error', 'Fix node attrs JSON'); return; }
    let attrs: any = {};
    try { attrs = nodeAttrs?.trim() ? JSON.parse(nodeAttrs) : {}; } catch { attrs = {}; }
    try {
      const res = await fetch(`${API_BASE}/panini/rule`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ id: nodeId.trim(), text: nodeText || '', attrs }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      pushToast('success', `Created/updated rule ${nodeId.trim()}`);
      refresh();
    } catch (e:any) {
      pushToast('error', `Create node failed: ${e?.message || e}`);
    }
  }, [nodeId, nodeText, nodeAttrs, nodeAttrsValid, authHeaders, refresh, pushToast]);

  const savePosition = useCallback(async (id: string, x: number, y: number, nodeData: any) => {
    try {
      const text = nodeData?.text ?? '';
      const prevAttrs = (nodeData?.attrs && typeof nodeData.attrs === 'object') ? nodeData.attrs : {};
      const attrs = { ...(prevAttrs || {}), ui: { x, y } };
      await fetch(`${API_BASE}/panini/rule`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ id, text, attrs })
      });
    } catch (e:any) {
      pushToast('error', `Position save failed: ${e?.message || e}`);
    }
  }, [authHeaders, pushToast]);

  const createEdge = useCallback(async () => {
    if (!edgeRel.trim() || !edgeSrc.trim() || !edgeDst.trim()) { pushToast('error', 'rel, src, dst are required'); return; }
    if (!edgeAttrsValid) { pushToast('error', 'Fix edge attrs JSON'); return; }
    let attrs: any = {};
    try { attrs = edgeAttrs?.trim() ? JSON.parse(edgeAttrs) : {}; } catch { attrs = {}; }
    try {
      const res = await fetch(`${API_BASE}/panini/link`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ rel: edgeRel.trim(), src: edgeSrc.trim(), dst: edgeDst.trim(), attrs }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      pushToast('success', `Created edge ${edgeRel} ${edgeSrc} -> ${edgeDst}`);
      refresh();
    } catch (e:any) {
      pushToast('error', `Create edge failed: ${e?.message || e}`);
    }
  }, [edgeRel, edgeSrc, edgeDst, edgeAttrs, edgeAttrsValid, authHeaders, refresh, pushToast]);

  return (
    <div>
      <div className="flex gap-2" style={{ height: 420 }}>
        <div className="flex-1 border rounded overflow-hidden">
          {loading ? (
            <div className="p-2 text-sm text-gray-600">Loading graph...</div>
          ) : (
            <ReactFlow
              nodes={renderedNodes}
              edges={renderedEdges}
              fitView
              onNodesDelete={onNodesDelete}
              onEdgesDelete={onEdgesDelete}
              onConnect={onConnect}
              nodesDraggable={!lockPositions}
              snapToGrid={snapToGridEnabled}
              snapGrid={[snapGridSize, snapGridSize]}
              onNodeDragStop={async (_e:any, n:any) => {
                if (lockPositions) return;
                const id = String(n?.id || '');
                if (!id) return;
                const x = n?.position?.x ?? 0;
                const y = n?.position?.y ?? 0;
                if (instantSave) {
                  await savePosition(id, x, y, n?.data);
                } else {
                  queuedPositionsRef.current.set(id, { x, y });
                }
              }}
              onSelectionChange={(sel:any)=>{ try { const n = (sel?.nodes||[])[0]; setSelectedNode(n? n.id: null); } catch {} }}
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          )}
        </div>
        <div className="w-[320px] border rounded p-2 space-y-3 overflow-auto">
          <div>
            <div className="font-semibold text-sm mb-1">Create/Update Node</div>
            <div className="space-y-2">
              <input className="border rounded px-2 py-1 w-full" placeholder="Rule ID (e.g., A.1.1)" value={nodeId} onChange={e=>setNodeId(e.target.value)} />
              <input className="border rounded px-2 py-1 w-full" placeholder="Rule Text" value={nodeText} onChange={e=>setNodeText(e.target.value)} />
              <textarea className={`border rounded px-2 py-1 w-full min-h-[70px] ${nodeAttrsValid ? '' : 'border-red-500'}`} placeholder="Attrs JSON (optional)" value={nodeAttrs} onChange={e=>setNodeAttrs(e.target.value)} />
              {!nodeAttrsValid && <div className="text-xs text-red-600">{nodeAttrsErr}</div>}
              <button className="px-2 py-1 bg-green-200 rounded" onClick={createNode}>Create/Update</button>
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm mb-1">Create Edge</div>
            <div className="space-y-2">
              <input ref={relInputRef} className="border rounded px-2 py-1 w-full" placeholder="rel (e.g., precedes)" value={edgeRel} onChange={e=>setEdgeRel(e.target.value)} />
              <div className="flex gap-2">
                <input className="border rounded px-2 py-1 w-full" placeholder="src" value={edgeSrc} onChange={e=>setEdgeSrc(e.target.value)} />
                <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>{ if (selectedNode) setEdgeSrc(selectedNode); }}>Use selected</button>
              </div>
              <div className="flex gap-2">
                <input className="border rounded px-2 py-1 w-full" placeholder="dst" value={edgeDst} onChange={e=>setEdgeDst(e.target.value)} />
                <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>{ if (selectedNode) setEdgeDst(selectedNode); }}>Use selected</button>
              </div>
              <textarea className={`border rounded px-2 py-1 w-full min-h-[70px] ${edgeAttrsValid ? '' : 'border-red-500'}`} placeholder="Attrs JSON (optional)" value={edgeAttrs} onChange={e=>setEdgeAttrs(e.target.value)} />
              {!edgeAttrsValid && <div className="text-xs text-red-600">{edgeAttrsErr}</div>}
              <button className="px-2 py-1 bg-indigo-200 rounded" onClick={createEdge}>Create Edge</button>
              <div className="text-xs text-gray-600">Tip: drag from one node to another to prefill src/dst.</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 p-2 items-center text-sm">
        <button className="px-2 py-1 bg-gray-200 rounded" onClick={refresh}>Refresh</button>
        <label className="flex items-center gap-1"><input type="checkbox" checked={lockPositions} onChange={e=>setLockPositions(e.target.checked)} /> Lock positions</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={snapToGridEnabled} onChange={e=>setSnapToGridEnabled(e.target.checked)} /> Snap</label>
        <span>grid</span>
        <input className="border rounded px-1 py-0.5 w-16" type="number" value={snapGridSize} onChange={e=>setSnapGridSize(Math.max(2, parseInt(e.target.value||'20',10)))} />
        <label className="flex items-center gap-1"><input type="checkbox" checked={instantSave} onChange={e=>setInstantSave(e.target.checked)} /> Instant save</label>
        <button className="px-2 py-1 bg-green-200 rounded" onClick={async()=>{
          if (queuedPositionsRef.current.size === 0) { pushToast('info', 'No pending layout changes'); return; }
          // Save queued positions sequentially
          const m = queuedPositionsRef.current;
          for (const [id, pos] of Array.from(m.entries())) {
            const n = nodes.find(nn=>String(nn.id)===String(id));
            await savePosition(id, pos.x, pos.y, n?.data);
          }
          queuedPositionsRef.current.clear();
          pushToast('success', 'Layout saved');
        }}>Save Layout</button>
        <button className="px-2 py-1 bg-yellow-200 rounded" onClick={()=>{ queuedPositionsRef.current.clear(); pushToast('info','Pending layout changes discarded'); }}>Discard</button>
        <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>{ queuedPositionsRef.current.clear(); refresh(); pushToast('info','Layout reset to saved positions'); }}>Reset to saved</button>
        <button className="px-2 py-1 bg-gray-100 rounded" onClick={()=>{ try { window.dispatchEvent(new CustomEvent('panini:highlight-path', { detail: { path: [] } })); } catch {} }}>Clear Highlight</button>
        <button className="px-2 py-1 bg-blue-200 rounded" onClick={async()=>{
          // simple grid auto-layout
          const cols = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, nodes.length))));
          const cellX = Math.max(120, snapGridSize * 6);
          const cellY = Math.max(90, snapGridSize * 4);
          const updated = nodes.map((n, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = col * cellX + 40;
            const y = row * cellY + 40;
            return { ...n, position: { x, y } };
          });
          setNodes(updated);
          if (instantSave) {
            for (const n of updated) {
              await savePosition(String(n.id), n.position.x, n.position.y, n.data);
            }
            pushToast('success','Auto layout applied and saved');
          } else {
            // queue positions
            const m = queuedPositionsRef.current;
            updated.forEach(n=> m.set(String(n.id), { x: n.position.x, y: n.position.y }));
            pushToast('info','Auto layout applied (pending save)');
          }
        }}>Auto Layout (grid)</button>
        <span className="mx-2">|</span>
        <span>Rules page</span>
        <button className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50" disabled={rulePage<=1} onClick={()=>setRulePage(p=>Math.max(1,p-1))}>Prev</button>
        <span>{rulePage}</span>
        <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>setRulePage(p=>p+1)}>Next</button>
        <span>size</span>
        <select className="border rounded px-2 py-1" value={rulePageSize} onChange={e=>setRulePageSize(parseInt(e.target.value,10)||200)}>
          {[50,100,200,400,800].map(n=> <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="mx-2">|</span>
        <span>Links page</span>
        <button className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50" disabled={linkPage<=1} onClick={()=>setLinkPage(p=>Math.max(1,p-1))}>Prev</button>
        <span>{linkPage}</span>
        <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>setLinkPage(p=>p+1)}>Next</button>
        <span>size</span>
        <select className="border rounded px-2 py-1" value={linkPageSize} onChange={e=>setLinkPageSize(parseInt(e.target.value,10)||400)}>
          {[100,200,400,800,1600].map(n=> <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}

function RulesLinksManager({ token, pushToast, xModel }: { token: string | null, pushToast: (k: 'success'|'error'|'info', t: string)=>void, xModel?: string }) {
  type RuleRow = { id: string; text: string; attrs?: Record<string, any> };
  type LinkRow = { id?: number; rel: string; src: string; dst: string; attrs?: Record<string, any> };
  const authHeaders = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (xModel) h["X-Model"] = xModel;
    return h;
  }, [token, xModel]);
  // Rules list
  const [rPage, setRPage] = useState(1);
  const [rSize, setRSize] = useState(50);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [rLoading, setRLoading] = useState(false);
  const fetchRules = useCallback(async ()=>{
    setRLoading(true);
    try {
      const off = (rPage-1)*rSize;
      const res = await fetch(`${API_BASE}/panini/rules?limit=${rSize}&offset=${off}`, { headers: authHeaders });
      const data = await res.json().catch(()=>[]);
      if (!res.ok) return;
      setRules(Array.isArray(data)? data: []);
    } catch {
      setRules([]);
    } finally { setRLoading(false); }
  }, [authHeaders, rPage, rSize]);

  // Links list
  const [lPage, setLPage] = useState(1);
  const [lSize, setLSize] = useState(50);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [lLoading, setLLoading] = useState(false);
  const fetchLinks = useCallback(async ()=>{
    setLLoading(true);
    try {
      const off = (lPage-1)*lSize;
      const res = await fetch(`${API_BASE}/panini/links?limit=${lSize}&offset=${off}`, { headers: authHeaders });
      const data = await res.json().catch(()=>[]);
      if (!res.ok) return;
      setLinks(Array.isArray(data)? data: []);
    } catch {
      setLinks([]);
    } finally { setLLoading(false); }
  }, [authHeaders, lPage, lSize]);

  useEffect(()=>{ fetchRules(); }, [fetchRules]);
  useEffect(()=>{ fetchLinks(); }, [fetchLinks]);

  const deleteRule = useCallback(async (rid: string)=>{
    try {
      const res = await fetch(`${API_BASE}/panini/rule/${encodeURIComponent(rid)}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      pushToast('success', `Deleted rule ${rid}`);
      fetchRules();
      window.dispatchEvent(new Event('panini:refresh-graph'));
    } catch (e:any) {
      pushToast('error', `Delete failed: ${e?.message || e}`);
    }
  }, [authHeaders, fetchRules, pushToast]);

  const deleteLink = useCallback(async (row: LinkRow)=>{
    try {
      const params = new URLSearchParams();
      if (typeof row.id === 'number') params.set('id', String(row.id)); else { params.set('rel', row.rel); params.set('src', row.src); params.set('dst', row.dst); }
      const res = await fetch(`${API_BASE}/panini/link?${params.toString()}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      pushToast('success', `Deleted link ${row.rel} ${row.src} -> ${row.dst}`);
      fetchLinks();
      window.dispatchEvent(new Event('panini:refresh-graph'));
    } catch (e:any) {
      pushToast('error', `Delete failed: ${e?.message || e}`);
    }
  }, [authHeaders, fetchLinks, pushToast]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm mb-2">
          <b>Rules</b>
          <button className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50" disabled={rPage<=1} onClick={()=>setRPage(p=>Math.max(1,p-1))}>Prev</button>
          <span>{rPage}</span>
          <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>setRPage(p=>p+1)}>Next</button>
          <span>size</span>
          <select className="border rounded px-2 py-1" value={rSize} onChange={e=>setRSize(parseInt(e.target.value,10)||50)}>
            {[20,50,100,200,400].map(n=> <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="px-2 py-1 bg-gray-200 rounded" onClick={fetchRules}>Reload</button>
        </div>
        <div className="overflow-auto border rounded">
          {rLoading ? <div className="p-2 text-sm text-gray-600">Loading...</div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Text</th><th className="p-2 text-left">Actions</th></tr></thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 font-mono align-top">{r.id}</td>
                    <td className="p-2 align-top">{(r.text||'').slice(0,140)}</td>
                    <td className="p-2 align-top">
                      <button className="px-2 py-1 bg-red-200 rounded" onClick={()=>deleteRule(r.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {rules.length===0 && (
                  <tr><td className="p-2" colSpan={3}>No rules on this page.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm mb-2">
          <b>Links</b>
          <button className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50" disabled={lPage<=1} onClick={()=>setLPage(p=>Math.max(1,p-1))}>Prev</button>
          <span>{lPage}</span>
          <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>setLPage(p=>p+1)}>Next</button>
          <span>size</span>
          <select className="border rounded px-2 py-1" value={lSize} onChange={e=>setLSize(parseInt(e.target.value,10)||50)}>
            {[20,50,100,200,400].map(n=> <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="px-2 py-1 bg-gray-200 rounded" onClick={fetchLinks}>Reload</button>
        </div>
        <div className="overflow-auto border rounded">
          {lLoading ? <div className="p-2 text-sm text-gray-600">Loading...</div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">rel</th><th className="p-2 text-left">src</th><th className="p-2 text-left">dst</th><th className="p-2 text-left">Actions</th></tr></thead>
              <tbody>
                {links.map((e, idx) => (
                  <tr key={e.id ?? `${e.rel}:${e.src}->${e.dst}:${idx}`} className="border-t">
                    <td className="p-2 align-top">{typeof e.id === 'number' ? e.id : '-'}</td>
                    <td className="p-2 align-top">{e.rel}</td>
                    <td className="p-2 align-top font-mono">{e.src}</td>
                    <td className="p-2 align-top font-mono">{e.dst}</td>
                    <td className="p-2 align-top">
                      <button className="px-2 py-1 bg-red-200 rounded" onClick={()=>deleteLink(e)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {links.length===0 && (
                  <tr><td className="p-2" colSpan={5}>No links on this page.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function PaniniOptimizer({ token, pushToast, xModel }: { token: string | null, pushToast: (k: 'success'|'error'|'info', t: string)=>void, xModel?: string }) {
  const { model } = useModel();
  const [startId, setStartId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [fieldsCsv, setFieldsCsv] = useState("cost,energy,time");
  const [formula, setFormula] = useState("");
  const [defaultWeight, setDefaultWeight] = useState<number>(1);
  const [relAllowCsv, setRelAllowCsv] = useState("");
  const [useDb, setUseDb] = useState(true);
  const [result, setResult] = useState<{ cost: number; path: string[] } | null>(null);
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [heuristic, setHeuristic] = useState('zero');
  const [algorithms, setAlgorithms] = useState<string[]>(['dijkstra','astar']);
  const [heuristics, setHeuristics] = useState<string[]>(['zero','levenshtein','dotpath']);
  const [defaults, setDefaults] = useState<{ algorithm: string; heuristic: string }>({ algorithm: 'dijkstra', heuristic: 'zero' });
  const authHeaders = useMemo(() => {
    const eff = xModel || model;
    const h: Record<string, string> = { "Content-Type": "application/json", "X-Model": eff };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token, model, xModel]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/optimize/panini/algorithms`, { headers: authHeaders });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const algos = Array.isArray(data?.algorithms) ? data.algorithms.map((x:any)=>String(x)) : [];
        const heurs = Array.isArray(data?.heuristics) ? data.heuristics.map((x:any)=>String(x)) : [];
        const defs = (data && data.defaults && typeof data.defaults === 'object') ? { algorithm: String(data.defaults.algorithm||'dijkstra'), heuristic: String(data.defaults.heuristic||'zero') } : { algorithm: 'dijkstra', heuristic: 'zero' };
        if (!cancelled) {
          if (algos.length) setAlgorithms(algos);
          if (heurs.length) setHeuristics(heurs);
          setDefaults(defs);
          // align current selections to available sets
          setAlgorithm(prev => (algos.includes(prev) ? prev : defs.algorithm));
          setHeuristic(prev => (heurs.includes(prev) ? prev : defs.heuristic));
        }
      } catch {
        // ignore; keep fallbacks
      }
    })();
    return () => { cancelled = true; };
  }, [authHeaders]);

  const runOptimize = async () => {
    if (!startId || !goalId) { pushToast('error', 'Start and Goal are required'); return; }
    const fields = fieldsCsv.trim() ? fieldsCsv.split(',').map(s=>s.trim()).filter(Boolean) : undefined;
    const rel_allow = relAllowCsv.trim() ? relAllowCsv.split(',').map(s=>s.trim()).filter(Boolean) : undefined;
    const body: any = { start: startId.trim(), goal: goalId.trim(), default_weight: Number(defaultWeight) || 1, use_db: useDb };
    if (fields && fields.length) body.fields = fields;
    if (rel_allow && rel_allow.length) body.rel_allow = rel_allow;
    if (formula.trim()) body.formula = formula.trim();
    body.algorithm = algorithm;
    if (algorithm === 'astar' && heuristic) body.heuristic = heuristic;

    const request = async (url: string, payload: any) => {
      const res = await fetch(url, { method: 'POST', headers: authHeaders, body: JSON.stringify(payload) });
      const data = await res.json().catch(()=>({}));
      return { res, data } as const;
    };

    try {
      let { res, data } = await request(`${API_BASE}/optimize/panini/path`, body);
      if (!res.ok && algorithm === 'dijkstra') {
        const legacyBody = { ...body };
        delete (legacyBody as any).algorithm;
        delete (legacyBody as any).heuristic;
        ({ res, data } = await request(`${API_BASE}/optimize/panini/dijkstra`, legacyBody));
      }
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      const p: string[] = Array.isArray(data?.path) ? data.path.map((x:any)=>String(x)) : [];
      setResult({ cost: Number(data?.cost ?? NaN), path: p });
      try { window.dispatchEvent(new CustomEvent('panini:highlight-path', { detail: { path: p } })); } catch {}
      pushToast('success', 'Optimal path computed');
    } catch (e:any) {
      pushToast('error', `Optimize failed: ${e?.message || e}`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="border rounded px-2 py-1" placeholder="Start ID" value={startId} onChange={e=>setStartId(e.target.value)} />
        <input className="border rounded px-2 py-1" placeholder="Goal ID" value={goalId} onChange={e=>setGoalId(e.target.value)} />
        <input className="border rounded px-2 py-1" placeholder="Fields CSV (e.g., cost,energy,time)" value={fieldsCsv} onChange={e=>setFieldsCsv(e.target.value)} />
        <input className="border rounded px-2 py-1 md:col-span-2" placeholder="Formula (optional, e.g., 0.7*energy + 0.3*time)" value={formula} onChange={e=>setFormula(e.target.value)} />
        <div className="flex items-center gap-2">
          <span className="text-sm">Default</span>
          <input className="border rounded px-2 py-1 w-20" type="number" value={defaultWeight} onChange={e=>setDefaultWeight(parseFloat(e.target.value||'1'))} />
        </div>
        <input className="border rounded px-2 py-1" placeholder="Allow relations (CSV)" value={relAllowCsv} onChange={e=>setRelAllowCsv(e.target.value)} />
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-xs text-gray-600">Model (effective): <b>{(xModel || model)}</b></span>
        <label className="flex items-center gap-1">
          <span>Algorithm</span>
          <select className="border rounded px-2 py-1" value={algorithm} onChange={e=>setAlgorithm(e.target.value)}>
            {algorithms.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        {algorithm === 'astar' && (
          <label className="flex items-center gap-1">
            <span>Heuristic</span>
            <select className="border rounded px-2 py-1" value={heuristic} onChange={e=>setHeuristic(e.target.value)}>
              {heuristics.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-1"><input type="checkbox" checked={useDb} onChange={e=>setUseDb(e.target.checked)} /> Use DB if links not provided</label>
        <button className="px-3 py-1 rounded bg-purple-600 text-white" onClick={runOptimize}>Run</button>
        {result && (
          <>
            <span>Cost: <b>{Number.isFinite(result.cost) ? result.cost : '∞'}</b></span>
            <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>{ try { window.dispatchEvent(new CustomEvent('panini:highlight-path', { detail: { path: result?.path || [] } })); } catch {} }}>Highlight</button>
          </>
        )}
        <button className="px-2 py-1 bg-gray-100 rounded" onClick={()=>{ setResult(null); try { window.dispatchEvent(new CustomEvent('panini:highlight-path', { detail: { path: [] } })); } catch {} }}>Clear</button>
      </div>
      {result && (
        <div className="text-sm">
          <div className="text-gray-600 mb-1">Path</div>
          <div className="flex flex-wrap gap-2">
            {result.path.map((id, i) => (
              <span key={`${id}:${i}`} className="px-2 py-1 border rounded bg-gray-50">{id}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TelemetryBadge() {
  const [last, setLast] = useState<{ ok: boolean; status: number; clientLatencyMs: number | null; model?: string; url?: string; ts: string } | null>(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const handler = (ev: any) => {
      const d = ev?.detail || {};
      setLast({ ok: !!d.ok, status: Number(d.status||0), clientLatencyMs: Number.isFinite(d.clientLatencyMs) ? d.clientLatencyMs : null, model: d.responseModel || d.requestModel, url: d.url, ts: new Date().toISOString() });
      setCount(c => c + 1);
    };
    window.addEventListener('telemetry:request', handler as any);
    return () => window.removeEventListener('telemetry:request', handler as any);
  }, []);
  return (
    <div className="text-xs text-gray-500 flex items-center gap-2">
      <span className="hidden md:inline">Requests:</span>
      <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700">{count}</span>
      {last && (
        <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700">
          {last.model || '-'} • {last.clientLatencyMs != null ? `${last.clientLatencyMs.toFixed(0)}ms` : '-'} • {last.ok ? 'ok' : `err ${last.status}`}
        </span>
      )}
    </div>
  );
}

export default function PaniniPage() {
  const { model, setModel, options, rates, expert } = useModel();
  // Rough cost estimate based on DSL program length
  const [programForCost, setProgramForCost] = useState<string>("");
  const [estCost, setEstCost] = useState<number>(0);
  const [estTokens, setEstTokens] = useState<number>(0);
  const [useOverride, setUseOverride] = useState<boolean>(false);
  const [pageModel, setPageModel] = useState<string>(model);
  const effectiveModel = useMemo(()=> useOverride ? pageModel : model, [useOverride, pageModel, model]);
  type HistoryEntry = { ts: string; ids: string[] };
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(5);
  const totalHistoryPages = useMemo(() => Math.max(1, Math.ceil(history.length / historyPageSize)), [history.length, historyPageSize]);
  const historySlice = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return history.slice(start, start + historyPageSize);
  }, [history, historyPage, historyPageSize]);
  useEffect(() => {
    // clamp page if history shrinks
    if (historyPage > totalHistoryPages) setHistoryPage(totalHistoryPages);
  }, [totalHistoryPages, historyPage]);

  // Toasts
  type Toast = { id: number; kind: 'success' | 'error' | 'info'; text: string; actionLabel?: string; onAction?: () => void };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = useCallback((kind: Toast['kind'], text: string, actionLabel?: string, onAction?: ()=>void) => {
    const id = Date.now() + Math.floor(Math.random()*1000);
    setToasts((t) => [...t, { id, kind, text, actionLabel, onAction }]);
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), 3800);
  }, []);
  useEffect(()=>{
    const chars = (programForCost||"").length;
    const tokens = Math.ceil(chars/4);
    setEstTokens(tokens);
    const rate = (rates && rates[effectiveModel]) ? rates[effectiveModel] : 0;
    setEstCost((tokens/1000)*rate);
  }, [programForCost, effectiveModel, rates]);

  const Toasts = () => (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-2 rounded shadow text-sm text-white flex items-center gap-3 ${t.kind==='success'?'bg-green-600': t.kind==='error'?'bg-red-600':'bg-gray-800'}`}>
          <span>{t.text}</span>
          {t.actionLabel && t.onAction && (
            <button className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25" onClick={()=>{ t.onAction?.(); setToasts(x=>x.filter(y=>y.id!==t.id)); }}> {t.actionLabel} </button>
          )}
        </div>
      ))}
    </div>
  );
  const buildConsoleLinkFromIds = useCallback((ids: string[]) => {
    const sp = new URLSearchParams();
    // join with space so Console gets a combined substring query
    sp.set('q', ids.join(' '));
    return `/console?${sp.toString()}`;
  }, []);
  const copyConsoleLink = useCallback((ids: string[]) => {
    try {
      const path = buildConsoleLinkFromIds(ids);
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      const full = base + path;
      navigator.clipboard.writeText(full);
      pushToast('success', 'Console link copied');
    } catch (e:any) {
      pushToast('error', `Copy failed: ${e?.message || e}`);
    }
  }, [buildConsoleLinkFromIds, pushToast]);
  const undoDelete = useCallback((idx: number, entry: HistoryEntry) => {
    const insertIdx = Math.min(idx, history.length);
    const restored = [...history.slice(0, insertIdx), entry, ...history.slice(insertIdx)];
    saveHistory(restored);
    pushToast('success', 'History restored');
  }, [history, pushToast]);

  const deleteHistoryIndex = useCallback((idx: number) => {
    const entry = history[idx];
    const next = history.filter((_, i) => i !== idx);
    saveHistory(next);
    pushToast('info', 'History entry removed', 'Undo', () => undoDelete(idx, entry));
  }, [history, pushToast, undoDelete]);
  const recordHistory = useCallback((ids: string[]) => {
    if (!ids || !ids.length) return;
    const ts = new Date().toISOString();
    const next = [{ ts, ids }, ...history].slice(0, 100);
    saveHistory(next);
  }, [history]);
  // Auth
  const [username, setUsername] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [authMsg, setAuthMsg] = useState<string>("");
  const [autoCopyAfterApply, setAutoCopyAfterApply] = useState<boolean>(false);
  const ALL_SCOPES = [
    "panini:history:read",
    "panini:history:write",
    "panini:modify",
    "panini:read",
  ];
  const [requestedScopes, setRequestedScopes] = useState<string[]>([...ALL_SCOPES]);
  const [ttlHours, setTtlHours] = useState<number>(8);

  // Early declarations to avoid TDZ in effects below
  const [ruleId, setRuleId] = useState("");
  const [ruleText, setRuleText] = useState("");
  const [ruleAttrs, setRuleAttrs] = useState("{}");
  const [rel, setRel] = useState("");
  const [src, setSrc] = useState("");
  const [dst, setDst] = useState("");
  const [linkAttrs, setLinkAttrs] = useState("{}");
  const [program, setProgram] = useState(
    `# Example\nrule A.1.1 : \"vṛddhir ādaiC\"\nrule A.1.1a : \"echo of sample\"\nlink precedes A.1.1 -> A.1.1a {\"strength\": 1}`
  );
  // feed program into cost estimator
  useEffect(()=>{ setProgramForCost(program); }, [program]);

  useEffect(() => {
    const t = window.localStorage.getItem("access_token");
    if (t) setToken(t);
    try {
      const rid = window.localStorage.getItem(LS_KEYS.ruleId);
      const rtx = window.localStorage.getItem(LS_KEYS.ruleText);
      const rat = window.localStorage.getItem(LS_KEYS.ruleAttrs);
      const rel0 = window.localStorage.getItem(LS_KEYS.rel);
      const src0 = window.localStorage.getItem(LS_KEYS.src);
      const dst0 = window.localStorage.getItem(LS_KEYS.dst);
      const lat = window.localStorage.getItem(LS_KEYS.linkAttrs);
      const prog = window.localStorage.getItem(LS_KEYS.program);
      if (rid) setRuleId(rid);
      if (rtx) setRuleText(rtx);
      if (rat) setRuleAttrs(rat);
      if (rel0) setRel(rel0);
      if (src0) setSrc(src0);
      if (dst0) setDst(dst0);
      if (lat) setLinkAttrs(lat);
      if (prog) setProgram(prog);
      const hist = window.localStorage.getItem(LS_KEYS.appliedHistory);
      let loadedLocal: HistoryEntry[] | null = null;
      if (hist) {
        try { loadedLocal = JSON.parse(hist); setHistory(loadedLocal); } catch {}
      }
      const ac = window.localStorage.getItem(LS_KEYS.autoCopyAfterApply);
      if (ac) setAutoCopyAfterApply(ac === 'true');
    } catch {}
  }, []);
  useEffect(() => { try { window.localStorage.setItem(LS_KEYS.autoCopyAfterApply, String(autoCopyAfterApply)); } catch {} }, [autoCopyAfterApply]);

  // persist drafts
  useEffect(() => { try { window.localStorage.setItem(LS_KEYS.ruleId, ruleId); } catch {} }, [ruleId]);
  useEffect(() => { try { window.localStorage.setItem(LS_KEYS.ruleText, ruleText); } catch {} }, [ruleText]);
  useEffect(() => { try { window.localStorage.setItem(LS_KEYS.ruleAttrs, ruleAttrs); } catch {} }, [ruleAttrs]);
  useEffect(() => { try { window.localStorage.setItem(LS_KEYS.rel, rel); } catch {} }, [rel]);
  useEffect(() => { try { window.localStorage.setItem(LS_KEYS.src, src); } catch {} }, [src]);
  useEffect(() => { try { window.localStorage.setItem(LS_KEYS.dst, dst); } catch {} }, [dst]);
  useEffect(() => { try { window.localStorage.setItem(LS_KEYS.linkAttrs, linkAttrs); } catch {} }, [linkAttrs]);
  useEffect(() => { try { window.localStorage.setItem(LS_KEYS.program, program); } catch {} }, [program]);

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    h["X-Model"] = effectiveModel;
    return h;
  }, [token, effectiveModel]);

  // History persistence helpers (with Authorization when enabled)
  const saveHistoryRemote = useCallback(async (h: HistoryEntry[]) => {
    if (!HISTORY_REMOTE || !token) return;
    try {
      await fetch(`${API_BASE}/panini/history`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ history: h })
      });
    } catch {}
  }, [token, authHeaders]);

  const saveHistory = useCallback((h: HistoryEntry[]) => {
    setHistory(h);
    try { window.localStorage.setItem(LS_KEYS.appliedHistory, JSON.stringify(h)); } catch {}
    // best-effort remote persist
    saveHistoryRemote(h);
  }, [saveHistoryRemote]);

  // Remote history load when token is present
  useEffect(() => {
    if (!HISTORY_REMOTE || !token) return;
    let cancelled = false;
    (async () => {
      try {
      const res = await fetch(`${API_BASE}/panini/history`, { headers: authHeaders });
        if (res.status === 429) {
          const ra = res.headers.get('Retry-After');
          pushToast('error', `Rate limited. Try again later${ra ? ` (Retry-After: ${ra}s)` : ''}`);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.history)) setHistory(data.history);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [token, authHeaders]);

  const handleIssueToken = useCallback(async () => {
    setAuthMsg("");
    try {
      const res = await fetch(`${API_BASE}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username || "guest", scopes: requestedScopes, ttl_hours: ttlHours }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const t = data?.access_token as string;
      if (!t) throw new Error("No token in response");
      window.localStorage.setItem("access_token", t);
      setToken(t);
      const ttl = typeof data?.expires_in === 'number' ? Math.max(0, data.expires_in) : null;
      if (ttl) {
        const mins = Math.floor(ttl / 60);
        setAuthMsg(`Token acquired (expires in ~${mins} min)`);
      } else {
        setAuthMsg("Token acquired and stored in localStorage");
      }
      pushToast('success', 'Token acquired');
    } catch (e: any) {
      setAuthMsg(`Failed to get token: ${e?.message || e}`);
      pushToast('error', `Auth failed: ${e?.message || e}`);
    }
  }, [username]);

  // Upsert Rule
  const [ruleAttrsValid, setRuleAttrsValid] = useState(true);
  const [ruleAttrsErr, setRuleAttrsErr] = useState<string>("");
  const [ruleMsg, setRuleMsg] = useState("");

  useEffect(() => {
    if (!ruleAttrs.trim()) {
      setRuleAttrsValid(true);
      setRuleAttrsErr("");
      return;
    }
    try {
      JSON.parse(ruleAttrs);
      setRuleAttrsValid(true);
      setRuleAttrsErr("");
    } catch (e: any) {
      setRuleAttrsValid(false);
      setRuleAttrsErr(e?.message || "Invalid JSON");
    }
  }, [ruleAttrs]);

  const formatRuleAttrs = useCallback(() => {
    try {
      const obj = ruleAttrs?.trim() ? JSON.parse(ruleAttrs) : {};
      setRuleAttrs(JSON.stringify(obj, null, 2));
    } catch {
      /* ignore */
    }
  }, [ruleAttrs]);

  const upsertRule = useCallback(async () => {
    setRuleMsg("");
    try {
      const attrs = ruleAttrs?.trim() ? JSON.parse(ruleAttrs) : {};
      const res = await fetch(`${API_BASE}/panini/rule`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ id: ruleId, text: ruleText, attrs }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) throw new Error('Rate limited. Please try again later.');
        if (res.status === 401) throw new Error("Unauthorized. Please get a token.");
        if (res.status === 403) throw new Error(`Insufficient scope: ${JSON.stringify(data?.detail || {})}`);
        throw new Error(data?.detail || JSON.stringify(data));
      }
      setRuleMsg(`Upserted rule ${data.id}`);
      pushToast('success', `Upserted rule ${data.id}`);
    } catch (e: any) {
      setRuleMsg(`Error: ${e?.message || e}`);
      pushToast('error', `Upsert failed: ${e?.message || e}`);
    }
  }, [ruleId, ruleText, ruleAttrs, authHeaders]);

  // Link rules
  const [linkAttrsValid, setLinkAttrsValid] = useState(true);
  const [linkAttrsErr, setLinkAttrsErr] = useState<string>("");
  const [linkMsg, setLinkMsg] = useState("");

  useEffect(() => {
    if (!linkAttrs.trim()) {
      setLinkAttrsValid(true);
      setLinkAttrsErr("");
      return;
    }
    try {
      JSON.parse(linkAttrs);
      setLinkAttrsValid(true);
      setLinkAttrsErr("");
    } catch (e: any) {
      setLinkAttrsValid(false);
      setLinkAttrsErr(e?.message || "Invalid JSON");
    }
  }, [linkAttrs]);

  const formatLinkAttrs = useCallback(() => {
    try {
      const obj = linkAttrs?.trim() ? JSON.parse(linkAttrs) : {};
      setLinkAttrs(JSON.stringify(obj, null, 2));
    } catch {
      /* ignore */
    }
  }, [linkAttrs]);

  const linkRules = useCallback(async () => {
    setLinkMsg("");
    try {
      const attrs = linkAttrs?.trim() ? JSON.parse(linkAttrs) : {};
      const res = await fetch(`${API_BASE}/panini/link`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ rel, src, dst, attrs }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) throw new Error('Rate limited. Please try again later.');
        if (res.status === 401) throw new Error("Unauthorized. Please get a token.");
        if (res.status === 403) throw new Error(`Insufficient scope: ${JSON.stringify(data?.detail || {})}`);
        throw new Error(data?.detail || JSON.stringify(data));
      }
      setLinkMsg(`Linked ${data.src} -[${data.rel}]-> ${data.dst}`);
      pushToast('success', `Linked ${data.src} -> ${data.dst}`);
    } catch (e: any) {
      setLinkMsg(`Error: ${e?.message || e}`);
      pushToast('error', `Link failed: ${e?.message || e}`);
    }
  }, [rel, src, dst, linkAttrs, authHeaders]);

  // Apply DSL
  const [selectedSample, setSelectedSample] = useState<number>(0);
  const [uploadMode, setUploadMode] = useState<"replace" | "append">("replace");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const applySample = useCallback((mode: "replace" | "append") => {
    const code = SAMPLES[selectedSample]?.code || "";
    if (!code) return;
    if (mode === "replace") setProgram(code);
    else setProgram((prev) => (prev ? prev + "\n\n" + code : code));
  }, [selectedSample]);

  const clearDraft = useCallback(() => {
    try {
      Object.values(LS_KEYS).forEach((k) => window.localStorage.removeItem(k));
    } catch {}
  }, []);

  const timestamp = () => {
    const d = new Date();
    const pad = (n:number)=> String(n).padStart(2,'0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  };

  const downloadDSL = useCallback((filename?: string) => {
    const blob = new Blob([program || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "panini_program.dsl";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [program]);

  const triggerUpload = useCallback((mode: "replace" | "append") => {
    setUploadMode(mode);
    fileInputRef.current?.click();
  }, []);

  const onUploadFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string) || "";
      setProgram((prev) => (uploadMode === "replace" ? text : (prev ? prev + "\n\n" + text : text)));
      e.target.value = "";
    };
    reader.readAsText(f, "utf-8");
  }, [uploadMode]);
  const [applyMsg, setApplyMsg] = useState("");
  const historyFileRef = React.useRef<HTMLInputElement | null>(null);
  const exportHistory = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'panini_appliedHistory.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      pushToast('success', 'History exported');
    } catch (e:any) {
      pushToast('error', `Export failed: ${e?.message || e}`);
    }
  }, [history, pushToast]);
  const importHistory = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '[]');
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error('Invalid format');
        // Basic shape check
        const sanitized = parsed
          .filter((x:any) => x && typeof x.ts === 'string' && Array.isArray(x.ids))
          .map((x:any) => ({ ts: String(x.ts), ids: x.ids.map((y:any)=>String(y)) }));
        saveHistory(sanitized);
        pushToast('success', 'History imported');
      } catch (err:any) {
        pushToast('error', `Import failed: ${err?.message || err}`);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(f, 'utf-8');
  }, [saveHistory, pushToast]);
  const [applied, setApplied] = useState<any[]>([]);

  const extractRuleIds = useCallback((appliedList: any[]): string[] => {
    return Array.from(new Set((appliedList||[]).filter((x:any)=>x.op==='rule' && x.result?.id).map((x:any)=>x.result.id)));
  }, []);

  const doApply = useCallback(async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/panini/apply`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ program }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 429) throw new Error('Rate limited. Please try again later.');
      if (res.status === 401) throw new Error("Unauthorized. Please get a token.");
      if (res.status === 403) throw new Error(`Insufficient scope: ${JSON.stringify(data?.detail || {})}`);
      throw new Error(data?.detail || JSON.stringify(data));
    }
    return data;
  }, [program, authHeaders]);

  const applyDSL = useCallback(async () => {
    setApplyMsg("");
    setApplied([]);
    try {
      const data = await doApply();
      const appliedNow = data?.applied || [];
      setApplied(appliedNow);
      setApplyMsg(`Applied ${appliedNow.length || 0} statements`);
      pushToast('success', `Applied ${appliedNow.length || 0} statements`);
      const ids = extractRuleIds(appliedNow);
      recordHistory(ids);
      if (autoCopyAfterApply) copyConsoleLink(ids);
    } catch (e: any) {
      setApplyMsg(`Error: ${e?.message || e}`);
      pushToast('error', `Apply failed: ${e?.message || e}`);
    }
  }, [program, authHeaders]);

  // Search & Get Rule
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(20);
  const [results, setResults] = useState<Rule[]>([]);
  const [searchMsg, setSearchMsg] = useState("");

  const search = useCallback(async () => {
    setSearchMsg("");
    try {
      const res = await fetch(`${API_BASE}/panini/search?q=${encodeURIComponent(q)}&limit=${limit}`, {
        method: "GET",
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) throw new Error('Rate limited. Please try again later.');
        if (res.status === 401) throw new Error("Unauthorized. Please get a token.");
        if (res.status === 403) throw new Error(`Insufficient scope: ${JSON.stringify(data?.detail || {})}`);
        throw new Error(data?.detail || JSON.stringify(data));
      }
      setResults(Array.isArray(data) ? data : []);
      setSearchMsg(`Found ${Array.isArray(data) ? data.length : 0} results`);
    } catch (e: any) {
      setSearchMsg(`Error: ${e?.message || e}`);
    }
  }, [q, limit, authHeaders]);

  const [rid, setRid] = useState("");
  const [ruleView, setRuleView] = useState<Rule | null>(null);
  const [ruleViewMsg, setRuleViewMsg] = useState("");

  const getRule = useCallback(async () => {
    setRuleView(null);
    setRuleViewMsg("");
    try {
      const res = await fetch(`${API_BASE}/panini/rule/${encodeURIComponent(rid)}`, {
        method: "GET",
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429) throw new Error('Rate limited. Please try again later.');
        if (res.status === 401) throw new Error("Unauthorized. Please get a token.");
        if (res.status === 403) throw new Error(`Insufficient scope: ${JSON.stringify(data?.detail || {})}`);
        throw new Error(data?.detail || JSON.stringify(data));
      }
      setRuleView(data as Rule);
      setRuleViewMsg("Loaded rule");
    } catch (e: any) {
      setRuleViewMsg(`Error: ${e?.message || e}`);
    }
  }, [rid, authHeaders]);

  return (
    <div className="panini-light p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Panini Rule Graph & Sanskrit DSL (Phase 2)</h1>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-1">
            <span>Model</span>
            <select className="border rounded px-2 py-1"
              value={useOverride ? pageModel : model}
              onChange={(e)=> useOverride ? setPageModel(e.target.value) : setModel(e.target.value)}
            >
              {options.map((opt)=> (<option key={opt} value={opt}>{opt}</option>))}
            </select>
            {expert && useOverride && (
              <span
                className={`ml-2 text-[10px] px-1 rounded border ${pageModel !== model ? 'bg-yellow-100 text-yellow-900 border-yellow-300' : 'bg-gray-200 text-gray-700 border-gray-300'}`}
                title={pageModel !== model ? 'Override active' : 'Override active (same as global)'}
                aria-label={pageModel !== model ? 'override' : 'override (global)'}
              >
                {pageModel !== model ? 'override' : 'override (global)'}
              </span>
            )}
          </label>
          {expert && (
            <>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={useOverride} onChange={(e)=>{ setUseOverride(e.target.checked); if (!e.target.checked) setPageModel(model); }} />
                Page override
              </label>
              <button
                className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                onClick={()=>{ setUseOverride(false); setPageModel(model); }}
                title="Revert to global model"
              >
                Use global
              </button>
            </>
          )}
          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 border">
            Est. cost: ${estCost.toFixed(5)} ({estTokens} tok)
          </span>
        </div>
      </div>

      {/* Auth */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Authentication</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="border rounded px-2 py-1 min-w-[16rem]"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 w-28"
            placeholder="TTL (hours)"
            type="number"
            value={ttlHours}
            onChange={(e)=> setTtlHours(Math.max(1, parseInt(e.target.value || "8", 10)))}
          />
          <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleIssueToken}>
            Get Token
          </button>
          {token ? (
            <button
              className="bg-gray-700 text-white px-3 py-1 rounded"
              onClick={() => { try { window.localStorage.removeItem('access_token'); } catch {}; setToken(null); setAuthMsg('Signed out'); }}
            >
              Sign out
            </button>
          ) : null}
          <span className="text-sm text-gray-600">{token ? "Token present" : "No token yet"}</span>
        </div>
        <div className="text-sm text-gray-700 space-y-2">
          <div className="font-medium">Requested scopes</div>
          <div className="flex flex-wrap gap-3">
            {ALL_SCOPES.map(sc => {
              const checked = requestedScopes.includes(sc);
              return (
                <label key={sc} className="inline-flex items-center gap-1">
                  <input type="checkbox" checked={checked} onChange={(e)=>{
                    setRequestedScopes(prev => e.target.checked ? Array.from(new Set([...(prev||[]), sc])) : prev.filter(x=>x!==sc));
                  }} />
                  <span className="font-mono text-xs">{sc}</span>
                </label>
              );
            })}
          </div>
        </div>
        {authMsg && <div className="text-sm text-gray-700">{authMsg}</div>}
      </section>

      {/* Upsert Rule */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Upsert Rule</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded px-2 py-1" placeholder="Rule ID (e.g., A.1.1)" value={ruleId} onChange={(e) => setRuleId(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="Rule Text" value={ruleText} onChange={(e) => setRuleText(e.target.value)} />
          <textarea className={`border rounded px-2 py-1 md:col-span-2 min-h-[80px] ${ruleAttrsValid ? '' : 'border-red-500'}`} placeholder="Attributes JSON (optional)" value={ruleAttrs} onChange={(e) => setRuleAttrs(e.target.value)} />
          {!ruleAttrsValid && <div className="text-xs text-red-600 md:col-span-2">{ruleAttrsErr}</div>}
        </div>
        <div className="flex gap-2 items-center">
          <button className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50" onClick={upsertRule} disabled={!ruleId || !ruleText || !ruleAttrsValid}>
            Upsert
          </button>
          <button className="bg-gray-200 px-3 py-1 rounded" onClick={formatRuleAttrs}>
            Format JSON
          </button>
          {ruleMsg && <span className="text-sm text-gray-700">{ruleMsg}</span>}
        </div>
        {/* History pagination controls */}
        {history.length > 0 && (
          <div className="flex items-center justify-between text-xs mt-2">
            <div>Showing {(historyPage-1)*historyPageSize+1}–{Math.min(history.length, historyPage*historyPageSize)} of {history.length}</div>
            <div className="flex items-center gap-2">
              <label>Page size</label>
              <select className="border rounded px-2 py-1" value={historyPageSize} onChange={(e)=>{setHistoryPageSize(parseInt(e.target.value,10)||5); setHistoryPage(1);}}>
                {[5,10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}
              </select>
              <button className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50" disabled={historyPage<=1} onClick={()=>setHistoryPage(p=>Math.max(1,p-1))}>Prev</button>
              <div>Page {historyPage} / {totalHistoryPages}</div>
              <button className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50" disabled={historyPage>=totalHistoryPages} onClick={()=>setHistoryPage(p=>Math.min(totalHistoryPages,p+1))}>Next</button>
            </div>
          </div>
        )}
      </section>

      {/* Link Rules */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Link Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded px-2 py-1" placeholder="Relation (e.g., precedes)" value={rel} onChange={(e) => setRel(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="Source ID" value={src} onChange={(e) => setSrc(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="Destination ID" value={dst} onChange={(e) => setDst(e.target.value)} />
          <textarea className={`border rounded px-2 py-1 md:col-span-3 min-h-[80px] ${linkAttrsValid ? '' : 'border-red-500'}`} placeholder="Edge Attributes JSON (optional)" value={linkAttrs} onChange={(e) => setLinkAttrs(e.target.value)} />
          {!linkAttrsValid && <div className="text-xs text-red-600 md:col-span-3">{linkAttrsErr}</div>}
        </div>
        <div className="flex gap-2 items-center">
          <button className="bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-50" onClick={linkRules} disabled={!rel || !src || !dst || !linkAttrsValid}>
            Link
          </button>
          <button className="bg-gray-200 px-3 py-1 rounded" onClick={formatLinkAttrs}>
            Format JSON
          </button>
          {linkMsg && <span className="text-sm text-gray-700">{linkMsg}</span>}
        </div>
      </section>

      {/* Apply DSL */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Apply DSL Program</h2>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm">Samples:</label>
            <select className="border rounded px-2 py-1" value={selectedSample} onChange={(e) => setSelectedSample(parseInt(e.target.value, 10))}>
              {SAMPLES.map((s, i) => (
                <option key={i} value={i}>{s.label}</option>
              ))}
            </select>
            <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => applySample("replace")}>Load</button>
            <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => applySample("append")}>Append</button>
            <span className="mx-2">|</span>
            <button className="bg-gray-200 px-3 py-1 rounded" onClick={()=>downloadDSL()}>Download</button>
            <input ref={fileInputRef} type="file" accept=".dsl,.txt" className="hidden" onChange={onUploadFile} />
            <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => triggerUpload("replace")}>Upload (Replace)</button>
            <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => triggerUpload("append")}>Upload (Append)</button>
            <span className="mx-2">|</span>
            <button className="bg-yellow-200 px-3 py-1 rounded" onClick={clearDraft}>Clear Draft</button>
          </div>
          <div className="border rounded">
            <Editor
              height="240px"
              defaultLanguage="plaintext"
              value={program}
              onChange={(val) => setProgram(val ?? "")}
              options={{ minimap: { enabled: false }, wordWrap: "on", fontSize: 13 }}
            />
          </div>
        </div>
        <div className="flex gap-2 items-center mt-2">
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={autoCopyAfterApply} onChange={(e)=>setAutoCopyAfterApply(e.target.checked)} />
            Auto-copy Console link after Apply
          </label>
          <button className="bg-purple-600 text-white px-3 py-1 rounded" onClick={applyDSL}>
            Apply
          </button>
          <button className="bg-green-700 text-white px-3 py-1 rounded" onClick={async()=>{
            try {
              const data = await doApply();
              const appliedNow = data?.applied || [];
              setApplied(appliedNow);
              setApplyMsg(`Applied ${appliedNow.length || 0} statements`);
              const ids = extractRuleIds(appliedNow);
              recordHistory(ids);
              if (autoCopyAfterApply) copyConsoleLink(ids);
              pushToast('success', 'Applied. Downloading snapshot...');
              downloadDSL(`panini_program_${timestamp()}.dsl`);
            } catch (e:any) {
              setApplyMsg(`Error: ${e?.message || e}`);
              pushToast('error', `Apply failed: ${e?.message || e}`);
            }
          }}>
            Apply & Save
          </button>
          {applyMsg && <span className="text-sm text-gray-700">{applyMsg}</span>}
        </div>
        {!!applied.length && (
          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Op</th>
                  <th className="text-left p-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {applied.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 align-top">{row.op}</td>
                    <td className="p-2 align-top">
                      <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(row.result, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Graph */}
      <section className="border rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Graph View</h2>
          <TelemetryBadge />
        </div>
        <GraphView token={token} pushToast={pushToast} xModel={effectiveModel} />
      </section>

      {/* Optimization */}
      <section className="border rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Decision Optimization (Pathfinding)</h2>
          <TelemetryBadge />
        </div>
        <div className="text-sm text-gray-600">Compute optimal path by weighted attributes or a formula and highlight it in the graph.</div>
        <PaniniOptimizer token={token} pushToast={pushToast} xModel={effectiveModel} />
      </section>

      {/* Manager: List & Delete */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Rules & Links Manager</h2>
        <RulesLinksManager token={token} pushToast={pushToast} xModel={effectiveModel} />
      </section>

      {/* Search */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Search Rules</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input className="border rounded px-2 py-1" placeholder="query" value={q} onChange={(e) => setQ(e.target.value)} />
          <input
            className="border rounded px-2 py-1 w-24"
            placeholder="limit"
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value || "20", 10))}
          />
          <button className="bg-gray-800 text-white px-3 py-1 rounded" onClick={search}>
            Search
          </button>
          {searchMsg && <span className="text-sm text-gray-700">{searchMsg}</span>}
        </div>
        {!!results.length && (
          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Text</th>
                  <th className="text-left p-2">Attrs</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 align-top font-mono">{r.id}</td>
                    <td className="p-2 align-top">{r.text}</td>
                    <td className="p-2 align-top text-xs">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(r.attrs || {}, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Get Rule */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Get Rule</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input className="border rounded px-2 py-1" placeholder="Rule ID" value={rid} onChange={(e) => setRid(e.target.value)} />
          <button className="bg-gray-800 text-white px-3 py-1 rounded" onClick={getRule}>
            Load
          </button>
          {ruleViewMsg && <span className="text-sm text-gray-700">{ruleViewMsg}</span>}
        </div>
        {ruleView && (
          <div className="border rounded p-2">
            <div className="text-sm"><b>ID:</b> {ruleView.id}</div>
            <div className="text-sm"><b>Text:</b> {ruleView.text}</div>
            <div className="text-sm"><b>Attrs:</b></div>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(ruleView.attrs || {}, null, 2)}</pre>
          </div>
        )}
      </section>

      {/* History of applied rule IDs (persisted) */}
      <section className="border rounded p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recently Applied</h2>
          <div className="flex items-center gap-2">
            <button className="text-xs px-2 py-1 bg-gray-200 rounded" onClick={exportHistory}>Export JSON</button>
            <input ref={historyFileRef} type="file" accept="application/json" className="hidden" onChange={importHistory} />
            <button className="text-xs px-2 py-1 bg-gray-200 rounded" onClick={()=>historyFileRef.current?.click()}>Import JSON</button>
            <button className="text-xs px-2 py-1 bg-gray-200 rounded" onClick={()=>saveHistory([])}>Clear History</button>
          </div>
        </div>
        {history.length === 0 && (
          <div className="text-sm text-gray-600">No history yet. Apply a DSL program to populate.</div>
        )}
        <div className="space-y-3">
          {historySlice.map((h, idxLocal)=> {
            const idx = (historyPage - 1) * historyPageSize + idxLocal;
            return (
              <div key={idx} className="border rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-gray-600">{new Date(h.ts).toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <a className="text-xs px-2 py-1 bg-gray-200 rounded" href={buildConsoleLinkFromIds(h.ids)}>Open Combined</a>
                    <button className="text-xs px-2 py-1 bg-gray-200 rounded" onClick={()=>copyConsoleLink(h.ids)}>Copy Console Link</button>
                    <button className="text-xs px-2 py-1 bg-red-200 rounded" onClick={()=>deleteHistoryIndex(idx)}>Delete</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {h.ids.map((id)=> (
                    <a key={id} href={`/console?q=${encodeURIComponent(id)}`} className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">q={id}</a>
                  ))}
                  <a href="/console" className="px-2 py-1 rounded bg-gray-800 text-white text-sm">Open Console</a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick links to Console for this session's last apply */}
      {!!applied.length && (
        <section className="border rounded p-4 space-y-2">
          <h2 className="font-semibold">Console Shortcuts (latest)</h2>
          <div className="text-sm text-gray-600">Open Self-Evolving Console filtered by rule IDs you just applied.</div>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set((applied||[]).filter((x:any)=>x.op==='rule' && x.result?.id).map((x:any)=>x.result.id))).map((id:string)=>(
              <a key={id} href={`/console?q=${encodeURIComponent(id)}`} className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">q={id}</a>
            ))}
            <a href="/console" className="px-2 py-1 rounded bg-gray-800 text-white text-sm">Open Console</a>
          </div>
        </section>
      )}

      <Toasts />
    </div>
  );
}

