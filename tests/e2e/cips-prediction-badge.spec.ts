import { test, expect } from '@playwright/test';

// E2E: Verify prediction error badge (sse-badge-ppmod) updates and matches a PredErr= trace line

test('CIPS prediction error badge reflects PredErr trace', async ({ page }) => {
  await page.goto('/console');

  // Enable CIPS, steps small, run
  const cips = page.getByTestId('sse-cips');
  if (!(await cips.isChecked())) await cips.click();
  await page.getByTestId('sse-steps').fill('3');
  await page.getByRole('button', { name: 'Stream Run' }).click();

  await page.waitForTimeout(1500);
  await page.getByTestId('right-panel-tab-summary').click();

  // Badge should show an error value, not '-'
  const badgeText = await page.getByTestId('sse-badge-ppmod').innerText();
  expect(badgeText).toMatch(/^Err:/);
  const m = badgeText.match(/Err:(-?|\d+\.\d{3})/);
  expect(m).not.toBeNull();
  const errStr = m?.[1] ?? '';
  expect(errStr).not.toBe('-');

  // Wait until the agent event bus includes a matching PredErr trace
  await page.waitForFunction((val) => {
    const fn = (window as any).agentEvents;
    if (!fn) return false;
    const evs = fn();
    return Array.isArray(evs) && evs.some((e: any) => e?.type === 'trace' && String(e?.summary||'').includes(`PredErr=${val}`));
  }, errStr, { timeout: 15000 });
});

