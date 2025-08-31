import { test, expect } from '@playwright/test';

// E2E: SSE options influence event stream (toggle ethics/tools/salience; set targetPhi high to suppress conscious_access)

test('SSE options affect kernel events', async ({ page }) => {
  await page.goto('/console');

  // Start an EventSource with toggles disabled and targetPhi very high (so no conscious_access)
  await page.evaluate(() => {
    // @ts-ignore
    window.__events = [];
    const url = '/api/agents/stream?goal=E2E+Options&steps=4&enableEthics=false&enableTools=false&enableSalience=false&targetPhi=9.9&seed=12345';
    const src = new EventSource(url);
    // @ts-ignore
    window.__src = src;
    src.addEventListener('ev', (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data);
        // @ts-ignore
        window.__events.push(data);
      } catch {}
    });
  });

  // Wait for run:end
  await page.waitForFunction(() => {
    // @ts-ignore
    const evs = (window as any).__events || [];
    return evs.some((e: any) => e.type === 'run:end');
  }, { timeout: 15000 });

  // Gather events and assert toggles took effect
  const evs = await page.evaluate(() => {
    // @ts-ignore
    return (window as any).__events || [];
  });

  const hasEthics = evs.some((e: any) => e.type === 'ethics');
  const hasTool = evs.some((e: any) => e.type === 'tool');
  const hasSalience = evs.some((e: any) => e.type === 'salience');
  const hasConscious = evs.some((e: any) => e.type === 'conscious_access' && e.has_access);

  expect(hasEthics).toBe(false);
  expect(hasTool).toBe(false);
  expect(hasSalience).toBe(false);
  expect(hasConscious).toBe(false);
});

