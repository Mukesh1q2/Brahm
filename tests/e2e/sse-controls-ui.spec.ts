import { test, expect } from '@playwright/test';

// E2E: Use UI controls to set high targetPhi and ensure no conscious_access

test('UI SSE controls suppress conscious_access when targetPhi is high', async ({ page }) => {
  await page.goto('/console');

  // Set target phi high and steps small
  await page.getByTestId('sse-phi').fill('9.9');
  await page.getByTestId('sse-steps').fill('3');
  // Disable tools and ethics (not necessary but consistent)
  const ethics = page.getByTestId('sse-ethics');
  const tools = page.getByTestId('sse-tools');
  if (await ethics.isChecked()) await ethics.click();
  if (await tools.isChecked()) await tools.click();

  // Start stream
  await page.getByRole('button', { name: 'Stream Run' }).click();

  // Collect events via the UI adapter (Trace bus is updated) — we can check Reasoning JSON presence absence
  await page.waitForTimeout(1500);
  // Switch to Trace tab and read summaries
  await page.getByTestId('right-panel-tab-trace').click();
  // Give a moment for any final events
  await page.waitForTimeout(500);
  const summaries = await page.locator('[data-testid="trace-summary"]').allTextContents();
  expect(summaries.join(' ')).not.toContain('Experience');
});

