import { test, expect } from '@playwright/test';

test.describe('Quantum Repeaters concept', () => {
  test('Page renders and updates metrics', async ({ page }) => {
    await page.goto('/education/repeaters?hops=5');
    await expect(page.getByRole('heading', { name: /Quantum Repeaters/i })).toBeVisible();
    const fidelityBar = page.getByLabel('fidelity');
    await expect(fidelityBar).toBeVisible();
    // Change link fidelity to push end-to-end fidelity up
    const linkSlider = page.getByLabel(/link F/i);
    await linkSlider.focus();
    await page.keyboard.press('End');
    // Snapshot should be available
    await page.getByRole('button', { name: /Record snapshot/i }).click();
  });
});

