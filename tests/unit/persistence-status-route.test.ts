import "@testing-library/jest-dom";

describe("/api/persistence/status route", () => {
  beforeEach(() => { jest.resetModules(); });

  test("returns ok:true when isPgAvailable resolves true", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: { json: (d: any) => ({ status: 200, json: async () => d }) },
    }), { virtual: true });
    jest.doMock("@/app/api/_lib/pg", () => ({ isPgAvailable: jest.fn(async () => true) }));

    const mod = await import("@/app/api/persistence/status/route");
    const res = await (mod as any).GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  test("returns ok:false on error", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: { json: (d: any) => ({ status: 200, json: async () => d }) },
    }), { virtual: true });
    jest.doMock("@/app/api/_lib/pg", () => ({ isPgAvailable: jest.fn(async () => { throw new Error("boom"); }) }));

    const mod = await import("@/app/api/persistence/status/route");
    const res = await (mod as any).GET();
    const body = await res.json();
    expect(body).toEqual({ ok: false });
  });

  test("returns ok:false with reason when BRAHM_E2E_DISABLE_DB is true", async () => {
    process.env.BRAHM_E2E_DISABLE_DB = 'true';
    jest.doMock("next/server", () => ({
      NextResponse: { json: (d: any) => ({ status: 200, json: async () => d }) },
    }), { virtual: true });
    // Mock to true to ensure the override short-circuits
    jest.doMock("@/app/api/_lib/pg", () => ({ isPgAvailable: jest.fn(async () => true) }));

    const mod = await import("@/app/api/persistence/status/route");
    const res = await (mod as any).GET();
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.reason).toBe('e2e-disabled');
    delete process.env.BRAHM_E2E_DISABLE_DB;
  });
});

