import { test, expect } from "@playwright/test";

// Validate the run selector switches panel content between different runs
// Requires NEXT_PUBLIC_E2E_HOOKS=true to expose window.__agentEventPush

test("right panel run selector switches between runs", async ({ page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 1280, height: 900 });

  // Ensure panel is present
await expect(page.getByTestId("right-panel")).toBeVisible();

  // Push two runs with different trace/diffs
  await page.evaluate(() => {
    const push = (window as any).__agentEventPush as Function;
    push({ type: 'run:start', runId: 'r1', agent: 'planner', timestamp: Date.now() - 1000 });
    push({ type: 'trace', runId: 'r1', summary: 'plan step', json: { step: 1 } });
    push({ type: 'patch', runId: 'r1', original: 'x', modified: 'y', language: 'ts' });

    push({ type: 'run:start', runId: 'r2', agent: 'executor', timestamp: Date.now() });
    push({ type: 'trace', runId: 'r2', summary: 'exec step', json: { step: 2 } });
    push({ type: 'patch', runId: 'r2', original: 'a', modified: 'b', language: 'js' });
  });

  // Default is latest -> r2
  await expect(page.getByTestId('reasoning-summary')).toContainText('exec step');

  // View diff
  await page.getByTestId('right-panel-tab-diff').click();
  await expect(page.getByTestId('code-diff-viewer')).toBeVisible();

  // Switch to r1 via selector
  await page.getByTestId('run-selector').selectOption('r1');
  await page.getByTestId('right-panel-tab-summary').click();
  await expect(page.getByTestId('reasoning-summary')).toContainText('plan step');
});

