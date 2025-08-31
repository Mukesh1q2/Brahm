import { test, expect } from "@playwright/test";

// Simulate a stream of agent events for two runs, verify panel reacts live

test("streamed agent events update panel and switching runs reflects correct data", async ({ page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 1280, height: 900 });

  await expect(page.getByTestId("right-panel")).toBeVisible();

  // Push run r1 start
  await page.evaluate(() => {
    const push = (window as any).__agentEventPush as Function;
    push({ type: 'run:start', runId: 'r1', agent: 'planner', timestamp: Date.now() });
  });

  // Push trace then patch for r1
  await page.evaluate(() => {
    const push = (window as any).__agentEventPush as Function;
    push({ type: 'trace', runId: 'r1', summary: 'plan step 1', json: { step: 1 } });
  });
  await expect(page.getByTestId('reasoning-summary')).toContainText('plan step 1');

  await page.evaluate(() => {
    const push = (window as any).__agentEventPush as Function;
    push({ type: 'patch', runId: 'r1', original: 'old', modified: 'new', language: 'ts' });
  });
  await page.getByTestId('right-panel-tab-diff').click();
  await expect(page.getByTestId('code-diff-viewer')).toBeVisible();

  // Start r2 and push events, ensure latest defaults to r2
  await page.evaluate(() => {
    const push = (window as any).__agentEventPush as Function;
    push({ type: 'run:start', runId: 'r2', agent: 'executor', timestamp: Date.now() });
    push({ type: 'trace', runId: 'r2', summary: 'exec step A', json: { a: true } });
  });
  await page.getByTestId('right-panel-tab-summary').click();
  await expect(page.getByTestId('reasoning-summary')).toContainText('exec step A');

  // Switch to r1, verify previous summary
  await page.getByTestId('run-selector').selectOption('r1');
  await expect(page.getByTestId('reasoning-summary')).toContainText('plan step 1');

  // Push another trace for r1 and ensure panel picks latest trace for r1
  await page.evaluate(() => {
    const push = (window as any).__agentEventPush as Function;
    push({ type: 'trace', runId: 'r1', summary: 'plan step 2', json: { step: 2 } });
  });
  await expect(page.getByTestId('reasoning-summary')).toContainText('plan step 2');
});

