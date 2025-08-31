import { test, expect } from '@playwright/test';

test.describe('Edition badge + chat header', () => {
  test('switches to advanced and sends header on /api/chat', async ({ page, context, baseURL }) => {
    const url = new URL(baseURL || 'http://localhost:3020');

    // Go to chat (badge is present globally)
    await page.goto('/chat');

    // Toggle edition via badge (bottom-right). Default is basic -> click to advanced.
    const badge = page.locator('button:has-text("Edition:")');
    await expect(badge).toBeVisible();
    await badge.click();

    // Optional: ensure html class reflects edition toggle before sending chat
    await expect.poll(async () => {
      return await page.evaluate(() => document.documentElement.classList.contains('edition-advanced'));
    }).toBe(true);

    // Compose and send a short message; capture the /api/chat request
    await page.getByLabel('Chat message input').fill('hello world');
    const [req] = await Promise.all([
      page.waitForRequest('**/api/chat'),
      page.click('button[type="submit"]'),
    ]);

    // Assert the client header includes the selected edition
    expect(req.headers()['x-brahm-edition']).toBe('advanced');
  });
});
