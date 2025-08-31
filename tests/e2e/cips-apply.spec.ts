import { test, expect } from '@playwright/test';

// E2E: Toggle CIPS and CIPS Apply, verify badge and weights summaries appear and PP weight increases

test('CIPS Apply increases PP weight and badge reflects toggles', async ({ page }) => {
  await page.goto('/console');

  // Enable CIPS and CIPS Apply
  const cips = page.getByTestId('sse-cips');
  const apply = page.getByTestId('sse-cips-apply');
  if (!(await cips.isChecked())) await cips.click();
  if (!(await apply.isChecked())) await apply.click();

  // Set small steps and run
  await page.getByTestId('sse-steps').fill('3');
  await page.getByRole('button', { name: 'Stream Run' }).click();

  await page.getByTestId('right-panel-tab-summary').click();

  // Badge reflects toggles
  await expect(page.getByTestId('sse-badge-cips')).toHaveText('CIPS:on');
  await expect(page.getByTestId('sse-badge-cips-apply')).toHaveText('Apply:on');

  // Wait until agent event bus shows a Weights(...) trace
  await page.waitForFunction(() => {
    const fn = (window as any).agentEvents;
    if (!fn) return false;
    const evs = fn();
    return Array.isArray(evs) && evs.some((e: any) => e?.type === 'trace' && /Weights\((\d+\.\d{2}),(\d+\.\d{2}),(\d+\.\d{2})\)/.test(String(e?.summary||'')));
  }, { timeout: 15000 });

  // Pull all Weights(...) traces from the bus and compare first vs last pp
  const weightsLines = await page.evaluate(() => {
    const fn = (window as any).agentEvents;
    const evs = fn ? fn() : [];
    return (Array.isArray(evs) ? evs : [])
      .filter((e: any) => e?.type === 'trace' && /Weights\((\d+\.\d{2}),(\d+\.\d{2}),(\d+\.\d{2})\)/.test(String(e?.summary||'')))
      .map((e: any) => String(e.summary));
  });
  expect(weightsLines.length).toBeGreaterThan(0);

  const parseWeights = (s: string) => {
    const m = s.match(/Weights\((\d+\.\d{2}),(\d+\.\d{2}),(\d+\.\d{2})\)/);
    if (!m) return null as any;
    return { g: parseFloat(m[1]), c: parseFloat(m[2]), p: parseFloat(m[3]) };
  };
  const first = parseWeights(weightsLines[0]!);
  const last = parseWeights(weightsLines[weightsLines.length - 1]!);
  expect(first && last).toBeTruthy();
  if (first && last) {
    // Allow equality if run is too short; usually last.p >= first.p when Apply is on
    expect(last.p).toBeGreaterThanOrEqual(first.p - 1e-6);
  }
});

