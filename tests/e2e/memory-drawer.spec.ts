import { test, expect } from '@playwright/test';

// E2E: Memory drawer opens and shows JSON details for an episode

test('memory drawer opens with episode JSON', async ({ page }) => {
  // Seed via API
  const id = `e2e_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  await page.request.post('/api/conversations', { data: { id, title: 'E2E Drawer', createdAt: now } });
  await page.request.post('/api/messages', { data: { conversationId: id, role: 'assistant', content: 'drawer test content', createdAt: now } });

  await page.goto('/console');
  await page.getByTestId('right-panel-tab-memory').click();
  await page.getByTestId('memory-apply').click();

  // Click the first episode
  const firstEpisode = page.locator('[data-testid=\"memory-episode\"]').first();
  await expect(firstEpisode).toBeVisible();
  await firstEpisode.click();

  // Drawer should appear with JSON (drawer is rendered even if initially hidden; wait for visible content)
  const drawer = page.getByTestId('memory-drawer');
  await page.waitForSelector('div[data-testid=\"memory-drawer\"] pre', { timeout: 10000 });
  const drawerText = await drawer.textContent();
  expect(drawerText).toContain('\"experience\"');
});

