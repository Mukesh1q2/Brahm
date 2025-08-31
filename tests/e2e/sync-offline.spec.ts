import { test, expect } from '@playwright/test';

// E2E: offline create → online flush
// Uses NEXT_PUBLIC_PERSIST_REMOTE=true (set in Playwright config) with dev in-memory endpoints

test('offline message enqueued then flushed online', async ({ page, context }) => {
  await page.goto('/chat');

  // Ensure orchestrator started (exposes window.__sync__)
  await page.waitForFunction(() => !!(window as any).__sync__);

  // Go offline
  await context.setOffline(true);

  // Send a message to enqueue
  const textarea = page.locator('textarea[placeholder="Message Brahm…"]');
  await textarea.fill('offline hello');
  await page.keyboard.down(process.platform === 'darwin' ? 'Meta' : 'Control');
  await page.keyboard.press('Enter');
  await page.keyboard.up(process.platform === 'darwin' ? 'Meta' : 'Control');

  // Queue should have items
  const sizeAfter = await page.evaluate(() => {
    try { const raw = localStorage.getItem('brahm:sync:queue:v1'); if (!raw) return 0; return (JSON.parse(raw) || []).length; } catch { return 0; }
  });
  expect(sizeAfter).toBeGreaterThan(0);

  // Go online and wait for flush tick (5s + buffer)
  await context.setOffline(false);
  await page.waitForTimeout(6500);

  const sizeFinal = await page.evaluate(() => {
    try { const raw = localStorage.getItem('brahm:sync:queue:v1'); if (!raw) return 0; return (JSON.parse(raw) || []).length; } catch { return 0; }
  });
  expect(sizeFinal).toBe(0);
});
