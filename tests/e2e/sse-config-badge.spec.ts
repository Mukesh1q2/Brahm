import { test, expect } from '@playwright/test';

// E2E: Verify the config badge displays the weights summary from the SSE controls

test('Config badge shows selected phi weights', async ({ page }) => {
  await page.goto('/console');

  // Set weights
  await page.getByTestId('sse-w-gwt').fill('0.70');
  await page.getByTestId('sse-w-causal').fill('0.25');
  await page.getByTestId('sse-w-pp').fill('0.05');

  // Ensure the badge area is visible (it sits under options in Right Panel)
  const rightPanel = page.getByTestId('right-panel');
  await expect(rightPanel).toBeVisible();

  // The badge displays a compact string: w(0.70,0.25,0.05)
  await expect(page.getByTestId('sse-badge-weights')).toHaveText('w(0.70,0.25,0.05)');
});

