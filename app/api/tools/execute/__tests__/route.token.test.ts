import { POST } from '../route';

describe('/api/tools/execute token gating', () => {
  const OLD = process.env.TOOL_RUNNER_TOKEN;
  beforeAll(() => { process.env.TOOL_RUNNER_TOKEN = 'secret'; });
  afterAll(() => { process.env.TOOL_RUNNER_TOKEN = OLD; });

  test('rejects without token', async () => {
    const req: any = { json: async () => ({ tool: 'echo', args: {} }), headers: new Headers({}) };
    const res: any = await POST(req as any);
    expect(res.status).toBe(401);
  });

  test('accepts with correct token', async () => {
    const req: any = { json: async () => ({ tool: 'echo', args: { a: 1 } }), headers: new Headers({ 'x-tool-runner-token': 'secret' }) };
    const res: any = await POST(req as any);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.result).toEqual({ echo: { a: 1 } });
  });
});

