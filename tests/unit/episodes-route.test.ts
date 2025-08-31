import "@testing-library/jest-dom";

describe("/api/memory/episodes route", () => {
  beforeEach(() => { jest.resetModules(); });

  test("GET returns items via pg helper with filters applied", async () => {
    const NextResponse = { json: (d: any, init?: any) => ({ status: init?.status || 200, json: async () => d }) } as any;
    jest.doMock("next/server", () => ({ NextResponse }), { virtual: true });

    const listEpisodes = jest.fn(async (opts?: any) => ([{ id: "e1", ts: Date.now(), main_content: "hello", phi_level: 4.2 }]));
    jest.doMock("@/app/api/_lib/pg", () => ({ listEpisodes }), { virtual: true });

    const mod = await import("@/app/api/memory/episodes/route");
    const req = { url: "http://localhost/api/memory/episodes?q=hel&phi_min=3&phi_max=7&since=123&limit=10&label=a&label=b" } as any;
    const res = await (mod as any).GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(listEpisodes).toHaveBeenCalledWith({ q: "hel", since: 123, phi_min: 3, phi_max: 7, limit: 10, labels: ["a","b"] });
  });

  test("GET passes labelsMode=or when mode=or is provided", async () => {
    const NextResponse = { json: (d: any, init?: any) => ({ status: init?.status || 200, json: async () => d }) } as any;
    jest.doMock("next/server", () => ({ NextResponse }), { virtual: true });

    const listEpisodes = jest.fn(async (opts?: any) => ([{ id: "e1", ts: Date.now(), main_content: "hello", phi_level: 4.2 }]));
    jest.doMock("@/app/api/_lib/pg", () => ({ listEpisodes }), { virtual: true });

    const mod = await import("@/app/api/memory/episodes/route");
    const req = { url: "http://localhost/api/memory/episodes?limit=5&label=a&label=b&mode=or" } as any;
    const res = await (mod as any).GET(req);
    expect(res.status).toBe(200);
    await res.json();
    expect(listEpisodes).toHaveBeenCalledWith({ limit: 5, labels: ["a","b"], labelsMode: 'or' });
  });

  test("GET returns 500 on error", async () => {
    const NextResponse = { json: (d: any, init?: any) => ({ status: init?.status || 200, json: async () => d }) } as any;
    jest.doMock("next/server", () => ({ NextResponse }), { virtual: true });

    jest.doMock("@/app/api/_lib/pg", () => ({ listEpisodes: jest.fn(async () => { throw new Error("boom"); }) }), { virtual: true });

    const mod = await import("@/app/api/memory/episodes/route");
    const req = { url: "http://localhost/api/memory/episodes" } as any;
    const res = await (mod as any).GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});

