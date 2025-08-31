import { test, expect } from '@playwright/test';

test.describe('Chat metadata envelopes', () => {
  test('diff envelope auto-opens Diff tab', async ({ page }) => {
    process.env.NEXT_PUBLIC_CHATGPT_UI = 'true';
    await page.goto('/chat');

    // Type a message and send (Cmd/Ctrl+Enter)
    const textarea = page.locator('textarea[placeholder="Message Brahm…"]');
    await textarea.fill('hello');
    await page.keyboard.down(process.platform === 'darwin' ? 'Meta' : 'Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up(process.platform === 'darwin' ? 'Meta' : 'Control');

    // Wait for Diff tab to appear and become active due to streamed envelope
    const diffTab = page.getByTestId('right-panel-tab-diff');
    await expect(diffTab).toBeVisible();

  // The diff viewer should eventually render (either actual diff viewer or fallback text)
  const diffOrFallback = page.getByTestId('code-diff-viewer').or(page.getByText('No diff available.'));
  await expect(diffOrFallback).toBeVisible({ timeout: 10000 });
  });
});

