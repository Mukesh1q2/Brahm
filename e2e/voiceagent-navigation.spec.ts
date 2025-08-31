import { test, expect } from '@playwright/test';

test.describe('VoiceAgent command navigation (E2E hook)', () => {
  test('open education and start superposition', async ({ page }) => {
    await page.goto('/quantum');
    await expect(page.getByText(/Quantum-Conscious/)).toBeVisible();
    // Inject command via E2E hook exposed by component
    await page.evaluate(() => {
      // @ts-ignore
      (window as any).__voice_cmd__ && (window as any).__voice_cmd__('open education');
    });
    await expect(page).toHaveURL(/.*\/education$/);
    // Start superposition via voice
    await page.evaluate(() => {
      // @ts-ignore
      (window as any).__voice_cmd__ && (window as any).__voice_cmd__('start superposition');
    });
    await expect(page).toHaveURL(/.*\/education\/superposition$/);
    await expect(page.getByRole('heading', { name: /Education • Superposition/i })).toBeVisible();
  });
});

