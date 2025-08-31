import { test, expect } from '@playwright/test';

test.describe('New education demos', () => {
  test('Superdense Coding page renders', async ({ page }) => {
    await page.goto('/education/superdense');
    await expect(page.getByRole('heading', { name: /Superdense Coding/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Send/i })).toBeVisible();
  });

  test('Adiabatic QC page renders', async ({ page }) => {
    await page.goto('/education/adiabatic');
    await expect(page.getByRole('heading', { name: /Adiabatic QC/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Record snapshot/i })).toBeVisible();
  });

  test('Density Matrices page renders', async ({ page }) => {
    await page.goto('/education/density');
    await expect(page.getByRole('heading', { name: /Density Matrices/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Record snapshot/i })).toBeVisible();
  });
});

