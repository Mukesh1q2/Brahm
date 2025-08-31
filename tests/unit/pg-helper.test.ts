import "@testing-library/jest-dom";

// We test the helper directly with mocked pg client

describe("pg helper (optional Postgres)", () => {
  const ORIGS = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGS };
  });

  afterAll(() => {
    process.env = ORIGS;
  });

  test("returns false when PG_DSN is not set", async () => {
    delete process.env.PG_DSN;
    const mod = await import("../../app/api/_lib/pg");
    await expect(mod.bootstrapPgSafe()).resolves.toBe(false);
    await expect(mod.insertDiarySafe({ text: "x" })).resolves.toBe(false);
    await expect(mod.insertSemanticSafe({ text: "x", labels: ["a"] })).resolves.toBe(false);
  });

  test("boots tables and inserts rows when pg is mocked and PG_DSN is set", async () => {
    process.env.PG_DSN = "postgres://user:pass@localhost:5432/db";
    // mock pg Client
    const queries: any[] = [];
    jest.doMock("pg", () => ({
      Client: class MockClient {
        constructor(opts: any) { this.opts = opts; this.connected = false; }
        async connect() { this.connected = true; }
        async query(sql: string, params?: any[]) { queries.push({ sql, params }); return { rows: [] }; }
        async end() { this.connected = false; }
      }
    }), { virtual: true });

    const mod = await import("../../app/api/_lib/pg");
    await expect(mod.bootstrapPgSafe()).resolves.toBe(true);
    await expect(mod.insertDiarySafe({ role: "user", text: "hello", ts: 1, messageId: "m1" })).resolves.toBe(true);
    await expect(mod.insertSemanticSafe({ text: "sem", labels: ["l1"], ts: 2 })).resolves.toBe(true);

    // ensure at least one create table and two inserts ran
    expect(queries.some(q => /CREATE TABLE IF NOT EXISTS diary_entries/i.test(q.sql))).toBe(true);
    expect(queries.some(q => /CREATE TABLE IF NOT EXISTS semantic_memory/i.test(q.sql))).toBe(true);
    expect(queries.some(q => /INSERT INTO diary_entries/i.test(q.sql))).toBe(true);
    expect(queries.some(q => /INSERT INTO semantic_memory/i.test(q.sql))).toBe(true);
  });

  test("listEpisodes uses @> for AND labels and ?| for OR labels", async () => {
    process.env.PG_DSN = "postgres://user:pass@localhost:5432/db";
    const queries: any[] = [];
    jest.doMock("pg", () => ({
      Client: class MockClient {
        async connect() {}
        async query(sql: string, params?: any[]) { queries.push({ sql, params }); return { rows: [] }; }
        async end() {}
      }
    }), { virtual: true });
    const mod = await import("../../app/api/_lib/pg");
    queries.length = 0;
    await mod.listEpisodes({ labels: ['a','b'] });
    expect(queries.some(q => /labels\s*@>/i.test(q.sql))).toBe(true);
    queries.length = 0;
    await mod.listEpisodes({ labels: ['a','b'], labelsMode: 'or' });
    expect(queries.some(q => /labels\s*\?\|/i.test(q.sql))).toBe(true);
  });
});

