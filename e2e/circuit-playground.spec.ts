import { test, expect } from '@playwright/test';

test.describe('Circuit Playground', () => {
  test('QFT2 preset produces equal amplitudes', async ({ page }) => {
    await page.goto('/education/circuits');
    await expect(page.getByRole('heading', { name: /Circuit Playground/i })).toBeVisible();
    await page.getByRole('button', { name: /Load QFT2$/i }).click();
    await page.getByRole('button', { name: /^Run$/i }).click();
    const pre = page.locator('text=State vector').locator('xpath=following-sibling::pre[1]');
    const text = await pre.innerText();
    expect(text).toMatch(/\|00.*0\.500/);
    expect(text).toMatch(/\|01.*0\.500/);
    expect(text).toMatch(/\|10.*0\.500/);
    expect(text).toMatch(/\|11.*0\.500/);
  });

  test('QFT2+SWAP preset runs', async ({ page }) => {
    await page.goto('/education/circuits');
    await page.getByRole('button', { name: /Load QFT2\+SWAP/i }).click();
    await page.getByRole('button', { name: /^Run$/i }).click();
    await expect(page.getByText(/State vector/)).toBeVisible();
  });

  test('Bell preset creates |00> and |11> amplitudes', async ({ page }) => {
    await page.goto('/education/circuits');
    await page.getByRole('button', { name: /Load Bell/i }).click();
    await page.getByRole('button', { name: /^Run$/i }).click();
    const pre = page.locator('text=State vector').locator('xpath=following-sibling::pre[1]');
    const text = await pre.innerText();
    expect(text).toMatch(/\|00.*0\.707/);
    expect(text).toMatch(/\|11.*0\.707/);
  });
});
