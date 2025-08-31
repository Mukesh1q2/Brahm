import "@testing-library/jest-dom";

describe("/api/memory/export route", () => {
  beforeEach(() => { jest.resetModules(); });

  test("returns ok:true with diary and semantic arrays and uses expected limits", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: { json: (d: any, init?: any) => ({ status: init?.status || 200, json: async () => d }) },
    }), { virtual: true });

    const listDiary = jest.fn(async (n:number) => [{ id: "d1", ts: 1, summary: "s", episode_id: null }]);
    const listSemantic = jest.fn(async (n:number) => [{ id: "s1", text: "t", labels: [], ts: 1 }]);
    const listEpisodes = jest.fn(async (_opts?: any) => [{ id: "e1", ts: 2, main_content: "mc", phi_level: 4.2 }]);

    jest.doMock("@/app/api/_lib/pg", () => ({ listDiary, listSemantic, listEpisodes }), { virtual: true });

    const mod = await import("@/app/api/memory/export/route");
    const res = await (mod as any).GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.diary)).toBe(true);
    expect(Array.isArray(body.semantic)).toBe(true);
    expect(Array.isArray(body.episodes)).toBe(true);
    expect(listDiary).toHaveBeenCalledWith(2000);
    expect(listSemantic).toHaveBeenCalledWith(5000);
  });

  test("returns 500 with ok:false on error", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: { json: (d: any, init?: any) => ({ status: init?.status || 200, json: async () => d }) },
    }), { virtual: true });

    jest.doMock("@/app/api/_lib/pg", () => ({
      listDiary: jest.fn(async () => { throw new Error("boom"); }),
      listSemantic: jest.fn(async () => []),
    }), { virtual: true });

    const mod = await import("@/app/api/memory/export/route");
    const res = await (mod as any).GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBeTruthy();
  });
});

