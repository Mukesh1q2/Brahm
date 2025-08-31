import { test, expect } from '@playwright/test';

// Smoke e2e: FUT flag layout, send chat, stub /chat with reasoning + diff, verify tabs and Monaco diff render
// We mock the backend using route interception

test.describe('Futuristic chat right panel with diff', () => {
  test('shows tabs, sends chat, displays diff when provided', async ({ page, context }) => {
    // Intercept metrics
    await page.route('**/metrics', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          karma: { current_score: 42 },
          dharma_alignment: { ahimsa: 90, satya: 88, karuna: 85, overall: 88 }
        })
      });
    });

    // Intercept chat with a diff payload
    await page.route('**/chat', async route => {
      const json = await route.request().postDataJSON();
      expect(json.message).toBeTruthy();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'Here is the updated code with improvements.',
          reasoning_trace: 'Step 1: analyze\nStep 2: modify',
          karma_earned: 3,
          // Support either flat or nested fields; here we return both to maximize compatibility
          diff_original: 'console.log("old")',
          diff_modified: 'console.log("new")',
          diff_language: 'javascript',
          code_diff: {
            original: 'console.log("old")',
            modified: 'console.log("new")',
            language: 'javascript',
          },
        })
      });
    });

    await page.goto('/');

    // FUT layout: tabs present on right panel (lg sizes). Ensure viewport is large.
    await page.setViewportSize({ width: 1280, height: 900 });

    await expect(page.getByTestId('right-panel-tab-summary')).toBeVisible();
    await expect(page.getByTestId('right-panel-tab-diff')).toBeVisible();

    // Send a chat message
    const input = page.getByPlaceholder('Ask Brahm anything...');
    await input.fill('Show me the changes');
    await input.press('Enter');

    // Click View Diff on the newly created assistant message
    // Wait for button to appear and click it
    const viewDiff = page.getByTestId('view-diff-btn').first();
    await viewDiff.waitFor({ state: 'visible' });
    await viewDiff.click();

    // Ensure diff tab content renders
    await expect(page.getByTestId('code-diff-viewer')).toBeVisible();
  });
});

