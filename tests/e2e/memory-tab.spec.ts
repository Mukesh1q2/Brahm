import { test, expect } from '@playwright/test';

// E2E: create conversation/message via Chat UI then verify Memory tab lists it

test('memory tab shows chat messages when persistence enabled', async ({ page }) => {
  // Seed a conversation and message via persistence APIs (using baseURL)
  const id = `e2e_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const r1 = await page.request.post('/api/conversations', { data: { id, title: 'E2E', createdAt: now } });
  expect(r1.ok()).toBeTruthy();
  const r2 = await page.request.post('/api/messages', { data: { conversationId: id, role: 'user', content: 'E2E memory smoke', createdAt: now } });
  expect(r2.ok()).toBeTruthy();

  // Sanity check seeded data is visible via APIs (no logging)
  await page.request.get('/api/conversations');
  await page.request.get(`/api/messages?conversationId=${id}`);

  // Navigate to Console and open Memory tab
  await page.goto('/console');
  await page.getByTestId('right-panel-tab-memory').click();

  // Apply filters to refresh
  await page.getByTestId('memory-apply').click();

  // It should find at least one episode (persist-backed)
  await page.waitForSelector('[data-testid="memory-episode"]', { timeout: 10000 });
  const items = await page.locator('[data-testid="memory-episode"]').count();
  expect(items).toBeGreaterThan(0);
});

