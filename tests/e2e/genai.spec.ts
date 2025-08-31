import { test, expect } from '@playwright/test';

test('GenAI page generates image and audio', async ({ page }) => {
  await page.goto('/console/genai');
  // Image
  await page.getByRole('button', { name: 'Generate' }).nth(0).click();
  await expect(page.locator('img[src^="data:image/png;base64"]')).toBeVisible();
  // Music
  await page.getByRole('button', { name: 'Generate' }).nth(1).click();
  await expect(page.locator('audio').first()).toBeVisible();
});

