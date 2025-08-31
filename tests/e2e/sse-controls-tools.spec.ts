import { test, expect } from '@playwright/test';

// E2E: UI SSE controls enable tools -> expect at least one tool event in stream

test('UI SSE controls enable tools emits tool event', async ({ page }) => {
  await page.goto('/console');

  // Ensure tools enabled, ethics on/off not important, set low targetPhi
  const tools = page.getByTestId('sse-tools');
  if (!(await tools.isChecked())) await tools.click();
  await page.getByTestId('sse-phi').fill('0.1');
  await page.getByTestId('sse-steps').fill('6');
  // Favor gwt/causal to increase likelihood of conscious access + action
  await page.getByTestId('sse-w-gwt').fill('0.7');
  await page.getByTestId('sse-w-causal').fill('0.25');
  await page.getByTestId('sse-w-pp').fill('0.05');

  await page.getByRole('button', { name: 'Stream Run' }).click();

  // Wait briefly for events and open Summary (shows latest trace summary)
  await page.waitForTimeout(1200);
  await page.getByTestId('right-panel-tab-summary').click();

  // Wait up to 10s for a Tool: trace to be recorded via window hook
  await page.waitForFunction(() => {
    const fn = (window as any).agentEvents;
    if (!fn) return false;
    const evs = fn();
    return Array.isArray(evs) && evs.some((e: any) => e?.type === 'trace' && String(e?.summary||'').includes('Tool:'));
  }, { timeout: 10000 });

  // Optionally reflect in latest summaries (best-effort)
});

