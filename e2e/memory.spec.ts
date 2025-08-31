import { test, expect } from '@playwright/test';

// Basic E2E for Memory tab interactions
// Uses Playwright baseURL from config

test.describe('Right panel Memory tab', () => {
  test('filters, drawer, and URL persistence', async ({ page }) => {
    await page.goto('/agents/dev');

    // Open Memory tab
    await page.getByTestId('right-panel-tab-memory').click();

    // Apply some filters
    await page.getByTestId('memory-q-input').fill('hello');
    await page.getByTestId('memory-phi-min').fill('3');
    await page.getByTestId('memory-mins').fill('5');
    await page.getByTestId('memory-apply').click();

    // Episodes list should populate; click first one if exists
    const episodes = page.getByTestId('memory-episode');
    const hasEpisodes = await episodes.count();
    if (hasEpisodes > 0) {
      await episodes.first().click();
      await expect(page.getByTestId('memory-drawer')).toBeVisible();
    }

    // URL contains persisted filters
    await expect(page).toHaveURL(/mem_q=hello/);
    await expect(page).toHaveURL(/mem_phi_min=3/);
    await expect(page).toHaveURL(/mem_mins=5/);
  });
});

