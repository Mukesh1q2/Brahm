import "@testing-library/jest-dom";

// Test the Next.js route by mocking next/server and the pg helper

describe("/api/persistence/bootstrap-pg route", () => {
  const ORIGS = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGS };
  });

  afterAll(() => { process.env = ORIGS; });

  test("returns 200 when bootstrapPgSafe resolves true", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: {
        json: (data: any, init?: any) => ({
          status: init?.status ?? 200,
          async json() { return data; },
        }),
      },
    }), { virtual: true });
    jest.doMock("@/app/api/_lib/pg", () => ({ bootstrapPgSafe: jest.fn(async () => true) }));

    const mod = await import("@/app/api/persistence/bootstrap-pg/route");
    const res = await (mod as any).POST();
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j).toEqual({ ok: true });
  });

  test("returns 400 when bootstrapPgSafe resolves false", async () => {
    jest.doMock("next/server", () => ({
      NextResponse: {
        json: (data: any, init?: any) => ({
          status: init?.status ?? 200,
          async json() { return data; },
        }),
      },
    }), { virtual: true });
    jest.doMock("@/app/api/_lib/pg", () => ({ bootstrapPgSafe: jest.fn(async () => false) }));

    const mod = await import("@/app/api/persistence/bootstrap-pg/route");
    const res = await (mod as any).POST();
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.ok).toBe(false);
  });
});

