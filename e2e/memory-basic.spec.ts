import { test, expect } from '@playwright/test';

// helper to select by test id
const byTestId = (page: any, id: string) => page.getByTestId(id);

test.describe('Memory Tab Basic Flow', () => {
  test('open, filter, open drawer, and reload with persisted filters', async ({ page }) => {
    await page.goto('/agents/dev');

    await byTestId(page, 'right-panel-tab-memory').click();

    await byTestId(page, 'memory-q-input').fill('trace');
    await byTestId(page, 'memory-phi-min').fill('4');
    await byTestId(page, 'memory-apply').click();

    // optional: if episodes exist, open drawer
    const ep = byTestId(page, 'memory-episode');
    if (await ep.count()) {
      await ep.first().click();
      await expect(byTestId(page, 'memory-drawer')).toBeVisible();
    }

    await expect(page).toHaveURL(/mem_q=trace/);
    await expect(page).toHaveURL(/mem_phi_min=4/);

    // reload preserves filters
    await page.reload();
    await expect(page).toHaveURL(/mem_q=trace/);
    await expect(page).toHaveURL(/mem_phi_min=4/);
  });
});

