import { test, expect } from '@playwright/test';

test.describe('Education export controls', () => {
  test('Superposition export after measure', async ({ page }) => {
    await page.goto('/education/superposition');
    await expect(page.getByRole('heading', { name: /Education • Superposition/i })).toBeVisible();
    // Measure once
    await page.getByRole('button', { name: /^Measure$/i }).click();
    // Export download
    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /^Export$/i }).click()
    ]);
    const name = await download.suggestedFilename();
    expect(name).toMatch(/superposition-history-/);
  });

  test('Tunneling export after snapshot', async ({ page }) => {
    await page.goto('/education/tunneling');
    await expect(page.getByRole('heading', { name: /Education • Tunneling/i })).toBeVisible();
    await page.getByRole('button', { name: /^Record snapshot$/i }).click();
    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /^Export history$/i }).click()
    ]);
    const name = await download.suggestedFilename();
    expect(name).toMatch(/tunneling-history-/);
  });
});

