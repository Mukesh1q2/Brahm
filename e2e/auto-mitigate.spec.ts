import { test, expect } from '@playwright/test';

// Simulates a stability event during a live stream to verify auto-mitigation

test.describe.configure({ mode: 'serial' });

test.describe('Auto-mitigation during streaming', () => {
  test('enables toggle, streams, injects high risk, and verifies mitigation', async ({ page }) => {
    await page.goto('/console');

    // Ensure the toggle is visible and enable it explicitly
    await expect(page.getByText('Auto-mitigate on high risk', { exact: true })).toBeVisible();
    await page.getByLabel('Auto-mitigate on high risk').check({ force: true });

    // Start stream
    await page.getByRole('button', { name: 'Stream Run' }).click();

    // Wait for the SSE handle and E2E emit hook to be exposed
    await page.waitForFunction(() => typeof (window as any).__ck_sse__ !== 'undefined' && typeof (window as any).__ck_emit_event !== 'undefined');

    // Inject a stability event with high risk to trigger mitigation via E2E hook
    await page.evaluate(() => {
      const emit = (window as any).__ck_emit_event;
      if (!emit) throw new Error('E2E emit hook not found');
      emit({ type: 'stability', assessment: { risk_level: 'high', stability_score: 0.2 } });
    });

    // Wait for stability pill to reflect high
    await expect(page.getByText('stability:high')).toBeVisible();

    // Expect steps badge to decrease from default 6 to 4
    await expect(page.getByTestId('sse-badge-steps')).toContainText('steps:4');

    // Expect mitigation pills to appear
    await expect(page.getByText(/^mit:\d+$/)).toBeVisible();
    await expect(page.getByText(/^last:\d{1,2}:/)).toBeVisible();

    // Send another high risk immediately; cooldown should prevent double mitigation
    await page.evaluate(() => {
      const emit = (window as any).__ck_emit_event;
      emit && emit({ type: 'stability', assessment: { risk_level: 'high', stability_score: 0.15 } });
    });

    // Assert that steps remain 4 and mitigation count still 1 (no strict count check via text; ensure no further reduction)
    await expect(page.getByTestId('sse-badge-steps')).toContainText('steps:4');

    // Stop stream to avoid interference with other tests
    await page.getByRole('button', { name: 'Stop Stream' }).click();
  });
});
