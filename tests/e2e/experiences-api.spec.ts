import { test, expect } from '@playwright/test';

// E2E: verify kernel experiences persistence API and UI list

test('Experiences API returns recent episodes after SSE run', async ({ page }) => {
  // Start a short SSE run with permissive targetPhi to generate experiences
  await page.goto('/console');
  await page.evaluate(() => {
    // @ts-ignore
    window.__events = [];
    const url = '/api/agents/stream?goal=E2E+Persist&steps=3&targetPhi=0.1&seed=42';
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

  await page.waitForFunction(() => {
    // @ts-ignore
    return (window as any).__events?.some((e: any) => e.type === 'run:end');
  }, { timeout: 15000 });

  // Query experiences API
  const res = await page.request.get('/api/agents/memory?limit=10');
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(Array.isArray(json.episodes)).toBe(true);
  // At least one episode should exist
  expect(json.episodes.length).toBeGreaterThan(0);
});

