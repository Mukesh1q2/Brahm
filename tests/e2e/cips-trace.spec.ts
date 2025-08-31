import { test, expect } from '@playwright/test';

// E2E: With CIPS enabled, expect CIPS trace summaries to appear

test('CIPS summaries appear when CIPS is enabled', async ({ page }) => {
  await page.goto('/console');

  // Enable CIPS and run a short stream
  const cips = page.getByTestId('sse-cips');
  if (!(await cips.isChecked())) await cips.click();
  await page.getByTestId('sse-steps').fill('2');
  await page.getByRole('button', { name: 'Stream Run' }).click();

  // Wait and open Summary
  await page.waitForTimeout(1200);
  await page.getByTestId('right-panel-tab-summary').click();

  // The agent event bus stores CIPS events as `trace` entries with summary text.
  const waitSummary = async (pattern: RegExp) => {
    await page.waitForFunction((re) => {
      const fn = (window as any).agentEvents;
      if (!fn) return false;
      const evs = fn();
      return Array.isArray(evs) && evs.some((e: any) => e?.type === 'trace' && new RegExp(re).test(String(e?.summary||'')));
    }, pattern, { timeout: 15000 });
  };
  await waitSummary(/Coalitions:/);
  await waitSummary(/Winner:/);
  await waitSummary(/Qualia/);
  await waitSummary(/PredErr=/);
  await waitSummary(/SelfModel/);
  await waitSummary(/Evolve\+/);
});

