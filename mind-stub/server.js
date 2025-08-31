const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = Number(process.env.MIND_PORT || 7071);

// In-memory stores (M1 simulation)
const metricsLog = [];
const semanticMem = []; // { id, text, labels, session_id, ts }
const diaryEntries = []; // { id, session_id, ts, summary, episode_id }

let tick = 0;
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function rnd(n=1) { return (Math.random() - 0.5) * n; }
// Optional integrations (M1) — disabled unless env set
const QDRANT_URL = process.env.QDRANT_URL || null;
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'brahm_semantic';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || null;
async function qdrantEnsureCollection() {
  if (!QDRANT_URL) return;
  try {
    // Create with small vector size for stub if not exists
    await fetch(`${QDRANT_URL.replace(/\/$/, '')}/collections/${encodeURIComponent(QDRANT_COLLECTION)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(QDRANT_API_KEY ? { 'api-key': QDRANT_API_KEY } : {}) },
      body: JSON.stringify({ vectors: { size: 8, distance: 'Cosine' } })
    });
  } catch {}
}
async function qdrantUpsert(id, vector, payload) {
  if (!QDRANT_URL) return;
  try {
    await qdrantEnsureCollection();
    await fetch(`${QDRANT_URL.replace(/\/$/, '')}/collections/${encodeURIComponent(QDRANT_COLLECTION)}/points?wait=true`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(QDRANT_API_KEY ? { 'api-key': QDRANT_API_KEY } : {}) },
      body: JSON.stringify({ points: [{ id, vector, payload }] })
    });
  } catch {}
}
async function qdrantSearch(vector, limit=10) {
  if (!QDRANT_URL) return null;
  try {
    await qdrantEnsureCollection();
    const resp = await fetch(`${QDRANT_URL.replace(/\/$/, '')}/collections/${encodeURIComponent(QDRANT_COLLECTION)}/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(QDRANT_API_KEY ? { 'api-key': QDRANT_API_KEY } : {}) },
      body: JSON.stringify({ vector, limit, with_payload: true, with_vectors: false })
    });
    const j = await resp.json();
    if (Array.isArray(j?.result)) return j.result;
  } catch {}
  return null;
}

const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || null;
const CLICKHOUSE_BASIC_AUTH = process.env.CLICKHOUSE_BASIC_AUTH || null; // "Basic base64(user:pass)"
async function chExecute(sql) {
  if (!CLICKHOUSE_URL) return null;
  const res = await fetch(CLICKHOUSE_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain', ...(CLICKHOUSE_BASIC_AUTH ? { 'Authorization': CLICKHOUSE_BASIC_AUTH } : {}) }, body: sql });
  if (!res.ok) throw new Error(`CH HTTP ${res.status}`);
  return res.text();
}
async function chInsertMetric(row) {
  if (!CLICKHOUSE_URL) return;
  try {
    const sql = `INSERT INTO consciousness_metrics (ts, phi, valence, arousal, coherence) VALUES ('${row.ts}', ${row.phi}, ${row.qualia.valence}, ${row.qualia.arousal}, ${row.qualia.coherence})`;
    await chExecute(sql);
  } catch {}
}

function nextMetrics() {
  tick += 1;
  const phi = clamp01(0.55 + 0.32 * Math.sin(tick / 12) + rnd(0.12));
  const valence = clamp01(0.5 + 0.25 * Math.sin(tick / 15 + 0.8) + rnd(0.08));
  const arousal = clamp01(0.5 + 0.35 * Math.sin(tick / 11 + 1.7) + rnd(0.1));
  const coherence = clamp01(0.4 + 0.45 * Math.cos(tick / 18 + 0.3) + 0.2*(phi-0.5) + rnd(0.08));
  const obj = { ts: new Date().toISOString(), phi, qualia: { valence, arousal, coherence } };
  // log to timeseries (ClickHouse simulation)
  metricsLog.push(obj);
  if (metricsLog.length > 2000) metricsLog.splice(0, metricsLog.length - 2000);
  // optional ClickHouse write
  chInsertMetric(obj).catch(()=>{});
  return obj;
}

app.get('/consciousness/metrics', (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.json(nextMetrics());
});

// Deeper metrics (M4 stubs)
app.get('/consciousness/deep', (req, res) => {
  const base = nextMetrics();
  const iit = clamp01(base.phi + rnd(0.1));
  const binding = clamp01(0.5 + 0.3 * Math.sin(tick / 7) + rnd(0.1));
  const predictive = clamp01(0.5 + 0.2 * Math.cos(tick / 9) + rnd(0.1));
  res.set('Cache-Control', 'no-store');
  res.json({ ts: base.ts, iit_phi_v4_estimate: iit, temporal_binding: binding, predictive_signal: predictive });
});
app.get('/consciousness/neuromorphic', (req, res) => {
  const spikes = Math.floor(50 + Math.random()*50);
  const synchrony = clamp01(0.5 + rnd(0.3));
  res.set('Cache-Control', 'no-store');
  res.json({ ts: new Date().toISOString(), spikes_per_s: spikes, synchrony });
});
app.get('/consciousness/quantum', (req, res) => {
  const coherence = clamp01(0.5 + 0.2 * Math.sin(tick/10) + rnd(0.2));
  res.set('Cache-Control', 'no-store');
  res.json({ ts: new Date().toISOString(), coherence });
});

app.get('/consciousness/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders && res.flushHeaders();

  const write = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  // send initial
  write(nextMetrics());

  const timer = setInterval(() => write(nextMetrics()), 1000);

  req.on('close', () => {
    clearInterval(timer);
    res.end();
  });
});

// Ethics check (pre/post)
function ethicsCheck(text) {
  const s = String(text || '');
  const veto = /harm|abuse|weapon|illegal|explosive|ddos|malware|self-harm/i.test(s);
  const revise = !veto && /(password|personal\s+data|ssn|credit\s*card|pii)/i.test(s);
  let decision = 'allow';
  if (veto) decision = 'veto'; else if (revise) decision = 'revise';
  const reasons = decision === 'allow' ? ['no policy violations detected'] : decision === 'revise' ? ['content may include sensitive material; revised suggestion provided'] : ['content matched safety veto patterns'];
  const principles = decision === 'allow' ? ['Satya'] : decision === 'revise' ? ['Ahimsa','Satya'] : ['Ahimsa','Satya'];
  const revision = decision === 'revise' ? { text: 'I cannot process or expose sensitive information. Consider masking private data and rephrasing your request for a safe alternative.', note: 'Sensitive-content redaction recommended.' } : null;
  return { decision, reasons, principles, revision };
}
// Council (M2 simulation)
function councilAggregate(message) {
  const strategies = [
    {
      name: 'concise',
      run: (m) => `Summary: ${m.slice(0, 120)}${m.length>120?'…':''}`
    },
    {
      name: 'verbose',
      run: (m) => `Considering your intent, here are details and steps to proceed. Input: "${m.slice(0, 240)}${m.length>240?'…':''}"`,
    },
    {
      name: 'skeptic',
      run: (m) => `Before proceeding, a few clarifying questions: What is the exact outcome? What constraints apply? Input: "${m.slice(0,120)}${m.length>120?'…':''}"`,
    },
  ];
  const results = strategies.map(s => ({ name: s.name, output: s.run(message) }));
  // Simple voting heuristic: prefer concise unless question-heavy input
  const vote = (r) => (r.name === 'concise' ? 1 : 0.9) + (/[?]/.test(message) && r.name === 'skeptic' ? 0.3 : 0);
  const votes = Object.fromEntries(results.map(r => [r.name, vote(r)]));
  const winner = results.reduce((a,b) => (votes[a.name] >= votes[b.name] ? a : b));
  const aggregate = `${winner.output}\n\nAlt perspectives:\n- ${results.filter(r => r.name!==winner.name).map(r=>`${r.name}: ${r.output}`).join('\n- ')}`;
  return { aggregate, trace: results, votes, spotlight: winner.name };
}
// Curiosity (M3): novelty score based on unique tokens
function curiosityOf(text) {
  const toks = String(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const uniq = new Set(toks).size;
  const ratio = toks.length ? uniq / toks.length : 0;
  return clamp01(0.3 + ratio * 0.7 + rnd(0.1));
}

app.post('/workspace/act', (req, res) => {
  const body = req.body || {};
  const message = String(body.message || '').slice(0, 2000);
  const metrics = nextMetrics();

  // Pre ethics gate
  const pre = ethicsCheck(message);
  if (pre.decision === 'veto') {
    const payload = {
      council_output: { text: '', sources: [], tool_calls: [] },
      ethics: pre,
      memory_refs: { semantic_ids: [], episode_id: `ep_${Date.now()}` },
      telemetry: { model_cost_usd: 0.0, latency_ms: Math.floor(50 + Math.random()*40) },
      consciousness: { phi: metrics.phi, qualia: metrics.qualia },
      workspace: { spotlight: null, curiosity: curiosityOf(message), deliberation_trace: [] },
    };
    res.set('Cache-Control', 'no-store');
    return res.json(payload);
  }

  // Council deliberation
  const { aggregate, trace, votes, spotlight } = councilAggregate(message);

  // Post ethics gate
  const post = ethicsCheck(aggregate);
  const payload = {
    council_output: { text: aggregate, sources: [], tool_calls: [] },
    ethics: post,
    memory_refs: { semantic_ids: [], episode_id: `ep_${Date.now()}` },
    telemetry: { model_cost_usd: +(Math.random()*0.002).toFixed(6), latency_ms: Math.floor(120 + Math.random()*240) },
    consciousness: { phi: metrics.phi, qualia: metrics.qualia },
    workspace: { spotlight, curiosity: curiosityOf(message), deliberation_trace: trace, votes },
  };
  res.set('Cache-Control', 'no-store');
  return res.json(payload);
});

app.post('/ethics/evaluate', (req, res) => {
  const body = req.body || {};
  const text = String(body.message || body.text || '').slice(0, 4000);
  const out = ethicsCheck(text);
  res.set('Cache-Control', 'no-store');
  return res.json(out);
});

// Memory endpoints (M1)
app.get('/memory', (req, res) => {
  const list = (req.query.list || '').toString();
  res.set('Cache-Control', 'no-store');
  if (list === 'diary') return res.json({ items: diaryEntries.slice(-200).reverse() });
  if (list === 'semantic') return res.json({ items: semanticMem.slice(-200).reverse() });
  return res.json({ items: [] });
});
app.post('/memory', async (req, res) => {
  const body = req.body || {};
  const id = `mem_${Math.random().toString(36).slice(2, 10)}`;
  const ts = Date.now();
  // Treat generic POST as a note/diary entry
  const entry = { id, session_id: body.session_id || null, ts, summary: String(body.text || body.summary || '').slice(0, 2000), episode_id: body.messageId || `ep_${Date.now()}` };
  diaryEntries.push(entry);
  if (diaryEntries.length > 2000) diaryEntries.splice(0, diaryEntries.length - 2000);
  try { await pgInsertDiary(entry); } catch {}
  res.set('Cache-Control', 'no-store');
  return res.json({ id, ok: true });
});
const EMBEDDINGS_URL = process.env.EMBEDDINGS_URL || 'http://localhost:3000/api/embeddings';
async function fetchEmbedding(text, dim=8) {
  try {
    const r = await fetch(EMBEDDINGS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texts: [String(text||'')], dim }) });
    const j = await r.json();
    const v = Array.isArray(j?.vectors) && j.vectors[0] ? j.vectors[0] : null;
    if (Array.isArray(v) && v.length === dim) return v;
  } catch {}
  // fallback random
  return Array.from({ length: dim }, () => Math.random());
}

app.post('/memory/semantic', async (req, res) => {
  const body = req.body || {};
  const id = `sem_${Math.random().toString(36).slice(2, 10)}`;
  const rec = { id, text: String(body.text || ''), labels: body.labels || [], session_id: body.session_id || null, ts: Date.now(), vector: null };
  semanticMem.push(rec);
  if (semanticMem.length > 5000) semanticMem.splice(0, semanticMem.length - 5000);
  // Get embedding from Next.js /api/embeddings (stub) and upsert to Qdrant if configured
  const vec = await fetchEmbedding(rec.text, 8);
  try { rec.vector = vec; } catch {}
  qdrantUpsert(id, vec, { text: rec.text, labels: rec.labels, session_id: rec.session_id, ts: rec.ts }).catch(()=>{});
  try { await pgInsertSemantic({ id, text: rec.text, labels: rec.labels, session_id: rec.session_id, ts: rec.ts, vector: JSON.stringify(vec) }); } catch {}
  res.set('Cache-Control', 'no-store');
  return res.json({ id, ok: true });
});
app.post('/memory/episode', (req, res) => {
  const id = `ep_${Math.random().toString(36).slice(2, 10)}`;
  const entry = { id, session_id: req.body?.session_id || null, ts: Date.now(), summary: String(req.body?.summary || '').slice(0, 2000), episode_id: id };
  diaryEntries.push(entry);
  res.set('Cache-Control', 'no-store');
  res.json({ episode_id: id });
});

// Semantic search endpoint (uses Qdrant if configured, else in-memory vector sim)
app.post('/memory/search', async (req, res) => {
  const body = req.body || {};
  const q = String(body.q || body.query || '').slice(0, 2000);
  const top = Math.min(50, Math.max(1, Number(body.top || 10)));
  if (!q) return res.json({ items: [] });
  const qVec = await fetchEmbedding(q, 8);
  let items = [];
  if (QDRANT_URL) {
    const result = await qdrantSearch(qVec, top);
    if (Array.isArray(result)) {
      items = result.map((r) => ({ id: String(r.id ?? r.payload?.id ?? ''), text: r.payload?.text || '', labels: r.payload?.labels || [], ts: r.payload?.ts || null, score: r.score }));
    }
  }
  if (!items.length) {
    // fallback: cosine similarity over in-memory vectors
    function dot(a,b){ let s=0; for(let i=0;i<Math.min(a.length,b.length);i++) s+=a[i]*b[i]; return s; }
    function mag(a){ return Math.sqrt(dot(a,a)); }
    const qm = mag(qVec)||1;
    const scored = semanticMem.filter(m=>Array.isArray(m.vector)).map(m=>{
      const s = dot(qVec, m.vector);
      const score = s / (qm * (mag(m.vector)||1));
      return { id: m.id, text: m.text, labels: m.labels||[], ts: m.ts, score };
    }).sort((a,b)=>b.score-a.score).slice(0, top);
    items = scored;
  }
  res.set('Cache-Control', 'no-store');
  return res.json({ items });
});

// Memory consolidation job (batch)
function consolidateDiary() {
  if (diaryEntries.length < 5) return;
  const last = diaryEntries.slice(-5);
  const text = last.map(e => e.summary).join(' ');
  // Tiny summarizer: pick top frequent words (toy)
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 3);
  const freq = Object.create(null);
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([w])=>w).join(', ');
  const summary = `Consolidation: ${top}`;
  diaryEntries.push({ id: `diary_${Date.now()}`, session_id: null, ts: Date.now(), summary, episode_id: `ep_${Date.now()}` });
}
setInterval(consolidateDiary, 60_000);
app.post('/memory/consolidate', (req, res) => { consolidateDiary(); res.json({ ok: true }); });

// ClickHouse bootstrap
app.post('/metrics/bootstrap-clickhouse', async (req, res) => {
  if (!CLICKHOUSE_URL) return res.status(200).json({ ok: false, detail: 'CLICKHOUSE_URL not set' });
  try {
    await chExecute(`CREATE TABLE IF NOT EXISTS consciousness_metrics (ts DateTime, phi Float64, valence Float64, arousal Float64, coherence Float64) ENGINE = MergeTree ORDER BY ts`);
    await chExecute(`CREATE TABLE IF NOT EXISTS consciousness_metrics_daily (day Date, phi_avg Float64, phi_min Float64, phi_max Float64, valence_avg Float64, arousal_avg Float64, coherence_avg Float64) ENGINE = MergeTree ORDER BY day`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: String(e?.message || e) }); }
});
// Rollup daily
app.post('/metrics/rollup/daily', async (req, res) => {
  if (CLICKHOUSE_URL) {
    try {
      await chExecute(`INSERT INTO consciousness_metrics_daily SELECT toDate(ts) AS day, avg(phi) AS phi_avg, min(phi) AS phi_min, max(phi) AS phi_max, avg(valence) AS valence_avg, avg(arousal) AS arousal_avg, avg(coherence) AS coherence_avg FROM consciousness_metrics GROUP BY day`);
      return res.json({ ok: true });
    } catch (e) { return res.status(500).json({ ok: false, error: String(e?.message || e) }); }
  }
  // fallback: compute from in-memory log and return JSON
  const byDay = new Map();
  for (const r of metricsLog) {
    const day = r.ts.slice(0,10);
    let a = byDay.get(day); if (!a) { a = []; byDay.set(day, a); }
    a.push(r);
  }
  const rows = Array.from(byDay.entries()).map(([day, arr]) => {
    const phi = arr.map(x=>x.phi); const v = arr.map(x=>x.qualia.valence); const ar = arr.map(x=>x.qualia.arousal); const c = arr.map(x=>x.qualia.coherence);
    const avg = (t)=> t.reduce((s,x)=>s+x,0) / Math.max(1,t.length);
    return { day, phi_avg: avg(phi), phi_min: Math.min(...phi), phi_max: Math.max(...phi), valence_avg: avg(v), arousal_avg: avg(ar), coherence_avg: avg(c) };
  });
  res.json({ ok: true, rows });
});

// Postgres (optional)
const PG_DSN = process.env.PG_DSN || null;
let pgPool = null;
try {
  if (PG_DSN) {
    const { Pool } = require('pg');
    pgPool = new Pool({ connectionString: PG_DSN });
  }
} catch {}
async function pgExecute(sql, params) {
  if (!pgPool) return null;
  const c = await pgPool.connect();
  try { return await c.query(sql, params); } finally { c.release(); }
}
async function pgBootstrap() {
  if (!pgPool) return;
  await pgExecute(`CREATE TABLE IF NOT EXISTS diary_entries (id text primary key, session_id text, ts bigint, summary text, episode_id text)`, []);
  await pgExecute(`CREATE TABLE IF NOT EXISTS semantic_mem (id text primary key, session_id text, ts bigint, text text, labels jsonb, vector jsonb)`, []);
}
async function pgInsertDiary(entry) { try { await pgExecute(`INSERT INTO diary_entries(id, session_id, ts, summary, episode_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`, [entry.id, entry.session_id, entry.ts, entry.summary, entry.episode_id]); } catch {} }
async function pgInsertSemantic(rec) { try { await pgExecute(`INSERT INTO semantic_mem(id, session_id, ts, text, labels, vector) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`, [rec.id, rec.session_id, rec.ts, rec.text, JSON.stringify(rec.labels||[]), rec.vector||null]); } catch {} }

app.post('/persistence/bootstrap-pg', async (req, res) => {
  if (!pgPool) return res.json({ ok: false, detail: 'PG_DSN not set' });
  try { await pgBootstrap(); res.json({ ok: true }); } catch (e) { res.status(500).json({ ok: false, error: String(e?.message || e) }); }
});

app.get('/', (req, res) => {
  res.type('text/plain').send('Mind stub running. Endpoints: /workspace/act, /ethics/evaluate, /memory, /consciousness/metrics, /consciousness/stream');
});

app.listen(PORT, () => {
  console.log(`Mind stub listening on http://localhost:${PORT}`);
});

