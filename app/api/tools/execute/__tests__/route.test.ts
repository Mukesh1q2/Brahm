import { POST } from '../route';

describe('/api/tools/execute route', () => {
  test('executes echo tool', async () => {
    const req: any = { json: async () => ({ tool: 'echo', args: { hello: 'world' } }) };
    const res: any = await POST(req as any);
    expect(res).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.result).toEqual({ echo: { hello: 'world' } });
    expect(body.guard?.pre?.allow).toBe(true);
  });

  test('blocks dangerous tool', async () => {
    const req: any = { json: async () => ({ tool: 'shell', args: { cmd: 'rm -rf /' } }) };
    const res: any = await POST(req as any);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.blocked).toBe(true);
  });
});

