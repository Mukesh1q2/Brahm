import "@testing-library/jest-dom";

describe("memory routes with PG reads", () => {
  beforeEach(() => { jest.resetModules(); });

  test("GET /api/memory?list=diary returns items from pg helper", async () => {
    jest.doMock("next/server", () => ({
      // Not used directly because route returns new Response; keep mapper consistent
    }), { virtual: true });
    jest.doMock("@/app/api/_lib/pg", () => ({ listDiary: jest.fn(async (n:number) => ([{ id: "d1", ts: 1, summary: "s", episode_id: null }])) }), { virtual: true });
    jest.doMock("@/app/api/_lib/proxy", () => ({ proxyRequest: jest.fn(async () => ({ status: 200, json: async () => ({ items: [] }) })) }), { virtual: true });

    const mod = await import("@/app/api/memory/route");
    const req = { url: "http://localhost/api/memory?list=diary&limit=1", method: 'GET', headers: new Headers() } as any;
    const res = await (mod as any).GET(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(Array.isArray(j.items)).toBe(true);
    const pg = jest.requireMock("@/app/api/_lib/pg");
    expect(pg.listDiary).toHaveBeenCalled();
  });

  test("POST /api/memory/search uses pg helper when q provided", async () => {
    jest.doMock("@/app/api/_lib/pg", () => ({ searchSemanticText: jest.fn(async (q:string,top:number)=> ([{ id: "s1", text: "t", labels: [], ts: 1, score: 1 }])) }), { virtual: true });
    jest.doMock("@/app/api/_lib/proxy", () => ({ proxyRequest: jest.fn(async () => ({ status: 200, json: async () => ({ items: [] }) })) }), { virtual: true });
    const mod = await import("@/app/api/memory/search/route");
    const req = { url: "http://localhost/api/memory/search", method: "POST", headers: new Headers(), json: async () => ({ q: "hello", top: 1 }), arrayBuffer: async () => new ArrayBuffer(0) } as any;
    const res = await (mod as any).POST(req);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(Array.isArray(j.items)).toBe(true);
    const pg = jest.requireMock("@/app/api/_lib/pg");
    expect(pg.searchSemanticText).toHaveBeenCalledWith("hello", 1, undefined);
  });
});

