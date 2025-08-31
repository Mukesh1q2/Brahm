import { test, expect } from '@playwright/test';

test.describe('Education shareable links', () => {
  test('Superposition with theta param', async ({ page }) => {
    await page.goto('/education/superposition?theta=0.9');
    await expect(page.getByRole('heading', { name: /Education • Superposition/i })).toBeVisible();
    await expect(page.getByText(/a0 = cos/)).toBeVisible();
  });

  test('Tunneling with barrier and energy', async ({ page }) => {
    await page.goto('/education/tunneling?barrier=8.5&energy=7.1');
    await expect(page.getByRole('heading', { name: /Education • Tunneling/i })).toBeVisible();
    await expect(page.getByText(/Record snapshot/)).toBeVisible();
  });
});

