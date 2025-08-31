import { test, expect } from '@playwright/test';

test.describe('QFT education demo', () => {
  test('QFT page loads and opens Circuit Playground', async ({ page }) => {
    await page.goto('/education/qft');
    await expect(page.getByRole('heading', { name: /Education .* Quantum Fourier Transform/i })).toBeVisible();
    // Default n=3; button text reflects QFT3
    await page.getByRole('button', { name: /Load in Playground \(QFT3\)/i }).click();
    await expect(page).toHaveURL(/.*\/education\/circuits.*/);
    await expect(page.getByRole('heading', { name: /Circuit Playground/i })).toBeVisible();
  });
});

