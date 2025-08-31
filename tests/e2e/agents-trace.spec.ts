import { test, expect } from '@playwright/test';

// E2E: Agent SSE lifecycle shows up in Trace panel via Stream Run

test('agent SSE lifecycle renders trace', async ({ page }) => {
  await page.goto('/console');

  // Right panel should exist
  const traceTab = page.getByTestId('right-panel-tab-trace');
  await expect(traceTab).toBeVisible();

  // Click Stream Run to start SSE
  await page.getByRole('button', { name: 'Stream Run' }).click();

  // Switch to Trace tab then JSON view inside the panel
  await traceTab.click();
  const jsonBtn = page.getByTestId('reasoning-tab-json');
  await jsonBtn.click();

  // Wait for ReasoningTracePanel JSON to appear
  await page.waitForSelector('[data-testid="reasoning-json"]', { timeout: 15000 });
  const jsonText = await page.locator('[data-testid="reasoning-json"]').textContent();
  expect(jsonText).toBeTruthy();
});

