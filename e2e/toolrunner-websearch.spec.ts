import { test, expect } from '@playwright/test';

test.describe('ToolRunner web_search', () => {
  test('renders results and allows save button', async ({ page }) => {
    // Enable ToolRunner via E2E param override
    await page.goto('/console?toolrunner=1');
    // Open Kernel tab
    await page.getByTestId('right-panel-tab-kernel').click();
    // Select web_search tool
    await page.locator('select').first().selectOption('web_search');
    // Use example args
    await page.getByRole('button', { name: /Use/i }).click();
    // Run
    await page.getByRole('button', { name: /^Run$/i }).click();
    // Expect results list to appear
    await expect(page.getByText('Results')).toBeVisible();
    // Save to Semantic button should be present
    await expect(page.getByRole('button', { name: /Save to Semantic/i })).toBeVisible();
  });
});

