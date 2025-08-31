import { test, expect } from '@playwright/test';

// E2E: Verify the config badge updates when toggling phi threshold and seed

test('Config badge updates when phi and seed change', async ({ page }) => {
  await page.goto('/console');

  const rightPanel = page.getByTestId('right-panel');
  await expect(rightPanel).toBeVisible();

  // Default badge values on initial load
  await expect(page.getByTestId('sse-badge-steps')).toHaveText('steps:6');
  await expect(page.getByTestId('sse-badge-phi')).toHaveText('phi≥3');
  await expect(page.getByTestId('sse-badge-ethics')).toHaveText('E:on');
  await expect(page.getByTestId('sse-badge-tools')).toHaveText('T:on');
  await expect(page.getByTestId('sse-badge-salience')).toHaveText('S:on');

  // Change phi threshold and expect badge to update
  await page.getByTestId('sse-phi').fill('4.5');
  await expect(page.getByTestId('sse-badge-phi')).toHaveText('phi≥4.5');

  await page.getByTestId('sse-phi').fill('6.1');
  await expect(page.getByTestId('sse-badge-phi')).toHaveText('phi≥6.1');

  // Change seed and expect badge to update
  await page.getByTestId('sse-seed').fill('alpha');
  await expect(page.getByTestId('sse-badge-seed')).toHaveText('seed:alpha');

  await page.getByTestId('sse-seed').fill('beta');
  await expect(page.getByTestId('sse-badge-seed')).toHaveText('seed:beta');

  // Change steps and expect badge to update
  await page.getByTestId('sse-steps').fill('9');
  await expect(page.getByTestId('sse-badge-steps')).toHaveText('steps:9');
});

