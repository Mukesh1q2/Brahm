import "@testing-library/jest-dom";

describe("/api/memory/import route", () => {
  beforeEach(() => { jest.resetModules(); });

  test("imports diary, semantic, and episodes items and returns counts", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: { json: (d: any, init?: any) => ({ status: init?.status || 200, json: async () => d }) },
    }), { virtual: true });

    const insertDiarySafe = jest.fn(async () => true);
    const insertSemanticSafe = jest.fn(async () => true);

    jest.doMock("@/app/api/_lib/pg", () => ({ insertDiarySafe, insertSemanticSafe }), { virtual: true });

    const mod = await import("@/app/api/memory/import/route");
    const req = { method: 'POST', json: async () => ({ diary: [{a:1},{b:2}], semantic: [{x:1}] }) } as any;
    const res = await (mod as any).POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.imported).toEqual({ diary: 2, semantic: 1, episodes: 0 });
    expect(insertDiarySafe).toHaveBeenCalledTimes(2);
    expect(insertSemanticSafe).toHaveBeenCalledTimes(1);
  });

  test("handles non-array payload by importing 0 items", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: { json: (d: any, init?: any) => ({ status: init?.status || 200, json: async () => d }) },
    }), { virtual: true });

    const insertDiarySafe = jest.fn(async () => true);
    const insertSemanticSafe = jest.fn(async () => true);

    jest.doMock("@/app/api/_lib/pg", () => ({ insertDiarySafe, insertSemanticSafe }), { virtual: true });

    const mod = await import("@/app/api/memory/import/route");
    const req = { method: 'POST', json: async () => ({}) } as any;
    const res = await (mod as any).POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.imported).toEqual({ diary: 0, semantic: 0, episodes: 0 });
    expect(insertDiarySafe).not.toHaveBeenCalled();
    expect(insertSemanticSafe).not.toHaveBeenCalled();
  });

  test("returns 500 when insert throws", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: { json: (d: any, init?: any) => ({ status: init?.status || 200, json: async () => d }) },
    }), { virtual: true });

    jest.doMock("@/app/api/_lib/pg", () => ({
      insertDiarySafe: jest.fn(async () => { throw new Error("boom"); }),
      insertSemanticSafe: jest.fn(async () => true),
    }), { virtual: true });

    const mod = await import("@/app/api/memory/import/route");
    const req = { method: 'POST', json: async () => ({ diary: [{a:1}], semantic: [] }) } as any;
    const res = await (mod as any).POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBeTruthy();
  });
});

