import { test, expect } from '@playwright/test';

// E2E: Verify toggling ethics/tools/salience updates the config badge flags

test('Config badge toggles reflect ethics/tools/salience on/off', async ({ page }) => {
  await page.goto('/console');

  const rightPanel = page.getByTestId('right-panel');
  await expect(rightPanel).toBeVisible();

  const ethics = page.getByTestId('sse-ethics');
  const tools = page.getByTestId('sse-tools');
  const salience = page.getByTestId('sse-salience');

  // Turn all OFF
  if (await ethics.isChecked()) await ethics.click();
  if (await tools.isChecked()) await tools.click();
  if (await salience.isChecked()) await salience.click();

  await expect(page.getByTestId('sse-badge-ethics')).toHaveText('E:off');
  await expect(page.getByTestId('sse-badge-tools')).toHaveText('T:off');
  await expect(page.getByTestId('sse-badge-salience')).toHaveText('S:off');

  // Turn ON each and assert badge reflects change
  await ethics.click();
  await expect(page.getByTestId('sse-badge-ethics')).toHaveText('E:on');

  await tools.click();
  await expect(page.getByTestId('sse-badge-tools')).toHaveText('T:on');

  await salience.click();
  await expect(page.getByTestId('sse-badge-salience')).toHaveText('S:on');
});

