import { NextResponse } from 'next/server';
import type { PRListResponse, PullRequestMeta, PRDiff } from '@/types/prs';

function seed(): PullRequestMeta[] {
  return [
    {
      id: '#42',
      title: 'feat: add memory filters and drawer',
      author: 'auto-brahm',
      status: 'open',
      createdAt: new Date().toISOString(),
      url: 'https://example.com/repo/pulls/42',
      summary: 'Implements memory tab filters and drawer with url persistence',
      diffs: [
        { filePath: 'src/components/MemoryList.tsx', original: "const a=1\n", modified: "const a=2\n", language: 'typescript' },
      ],
    },
    {
      id: '#43',
      title: 'fix: debounce telemetry listener',
      author: 'auto-brahm',
      status: 'draft',
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      url: 'https://example.com/repo/pulls/43',
    },
  ];
}

function getStore() {
  const g: any = globalThis as any;
  if (!g.__prs_store) g.__prs_store = seed();
  return g.__prs_store as PullRequestMeta[];
}

export async function GET() {
  const items = getStore();
  const resp: PRListResponse = { total: items.length, items };
  return NextResponse.json(resp);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
    const title = String(body.title || 'demo: improve docs');
    const summary = typeof body.summary === 'string' ? body.summary : 'Demo PR created from the Auto-PRs console.';
    const diffs = Array.isArray(body.diffs) ? (body.diffs as PRDiff[]) : [
      { filePath: 'README.md', original: '# Readme\n', modified: '# Readme\n\nMinor tweak.\n', language: 'markdown' }
    ];
    const store = getStore();
    const num = 100 + store.length;
    const id = `#${num}`;
    const pr: PullRequestMeta = {
      id,
      title,
      author: 'auto-brahm',
      status: 'open',
      createdAt: new Date().toISOString(),
      url: undefined,
      summary,
      diffs,
    };
    store.unshift(pr);
    const resp: PRListResponse = { total: store.length, items: store };
    return NextResponse.json(resp, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

