import "@testing-library/jest-dom";

describe("memory routes fallback when PG unavailable", () => {
  beforeEach(() => { jest.resetModules(); });

  test("GET /api/memory?list=diary proxies when pg.listDiary throws", async () => {
    jest.doMock("@/app/api/_lib/pg", () => ({ listDiary: jest.fn(async () => { throw new Error("pg down"); }) }), { virtual: true });
    const proxyRequest = jest.fn(async (_req: any, _path: string) => ({ status: 200, json: async () => ({ ok: true, via: "proxy" }) }));
    jest.doMock("@/app/api/_lib/proxy", () => ({ proxyRequest }), { virtual: true });

    const mod = await import("@/app/api/memory/route");
    const req = { url: "http://localhost/api/memory?list=diary", method: 'GET', headers: new Headers() } as any;
    const res = await (mod as any).GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, via: "proxy" });
    expect(proxyRequest).toHaveBeenCalledWith(req, "/memory");
  });

  test("POST /api/memory/search proxies when pg.searchSemanticText throws", async () => {
    jest.doMock("@/app/api/_lib/pg", () => ({ searchSemanticText: jest.fn(async () => { throw new Error("pg down"); }) }), { virtual: true });
    const proxyRequest = jest.fn(async (_req: any, _path: string) => ({ status: 200, json: async () => ({ ok: true, via: "proxy" }) }));
    jest.doMock("@/app/api/_lib/proxy", () => ({ proxyRequest }), { virtual: true });

    const mod = await import("@/app/api/memory/search/route");
    const req = { url: "http://localhost/api/memory/search", method: "POST", headers: new Headers(), json: async () => ({ q: "hello" }), arrayBuffer: async () => new ArrayBuffer(0) } as any;
    const res = await (mod as any).POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, via: "proxy" });
    expect(proxyRequest).toHaveBeenCalledWith(req, "/memory/search");
  });
});

