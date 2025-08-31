import { test, expect } from '@playwright/test';

// Basic RAG flow: run and expect steps and answer to render
test('RAG page runs query and shows steps and answer', async ({ page }) => {
  await page.goto('/console/rag');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await expect(page.getByText(/Stubbed multi-hop answer/i)).toBeVisible();
});

