import { test, expect } from '@playwright/test';

// Exercise basic ingestion UI flows
test('Ingestion page runs crawler, RSS, arXiv, doc pipeline, embeddings, KG and provenance', async ({ page }) => {
  await page.goto('/console/ingestion');

  // Crawl (optional)
  await page.getByRole('button', { name: 'Fetch' }).first().click();
  // Proceed to RSS

  // RSS
  const fetchButtons = page.getByRole('button', { name: 'Fetch' });
  await fetchButtons.nth(1).click();
  await expect(page.getByText(/Item\s+1/i)).toBeVisible();

  // ArXiv
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText(/Paper\s+1/i)).toBeVisible();

  // Doc pipeline
  await page.getByRole('button', { name: 'Extract' }).click();
  await expect(page.getByText('Tokens:')).toBeVisible();

  // Embeddings
  await page.getByRole('button', { name: 'Embed' }).click();
  await expect(page.getByText('vectors=')).toBeVisible();

  // KG schema
  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.locator('pre')).toBeVisible();

  // Provenance
  await page.getByRole('button', { name: 'Log' }).click();
  await expect(page.getByText('events')).toBeVisible();
});

