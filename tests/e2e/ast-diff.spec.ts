import { test, expect } from '@playwright/test';

test('AST diff page computes added/removed/unchanged', async ({ page }) => {
  await page.goto('/console/ast-diff');
  await page.getByRole('button', { name: 'Compute AST diff' }).click();
  // Expect known entries from results (not from textareas)
  const addedSection = page.locator('div').filter({ has: page.getByText('Added') });
  const addedList = addedSection.locator('ul');
  await expect(addedList.locator('li', { hasText: /bar/i }).first()).toBeVisible();
});

