import { test, expect } from '@playwright/test';

test.describe('Annealing landscape', () => {
  test('Page renders and steps energy', async ({ page }) => {
    await page.goto('/education/annealing?n=3&J=1&h=0&T=1.5');
    await expect(page.getByRole('heading', { name: /Annealing Landscape/i })).toBeVisible();
    // Click Step a few times and ensure Energy widget is present
    await expect(page.getByLabel('energy')).toBeVisible();
    await page.getByRole('button', { name: /^Step$/i }).click();
  });
});

