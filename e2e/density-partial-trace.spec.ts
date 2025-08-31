import { test, expect } from '@playwright/test';

test.describe('Density matrices – partial trace', () => {
  test('Bell Φ+ with p=0 yields maximally mixed reduced state', async ({ page }) => {
    await page.goto('/education/density');
    await expect(page.getByRole('heading', { name: /Density Matrices/i })).toBeVisible();

    // Switch to 2-qubit mode
    await page.getByLabel(/mode/i).selectOption('2q');
    await page.getByLabel(/Bell/i).selectOption('phi+');

    // Set p to 0 via slider (fallback: keyboard)
    const slider = page.getByLabel(/depolarize p/i);
    await slider.focus();
    // Some UIs need multiple ArrowLeft presses; we also set via script if available
    await page.keyboard.press('Home');

    // Expect reduced density to show ~0.500 on diagonal
    const reduced = page.getByText(/Reduced .*tr.*=/i).locator('..').locator('pre');
    const txt = await reduced.textContent();
    expect(txt || '').toMatch(/0\.50/);
  });
});

