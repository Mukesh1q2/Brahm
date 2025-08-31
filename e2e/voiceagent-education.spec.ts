import { test, expect } from '@playwright/test';

test.describe('VoiceAgent commands for Education demos', () => {
  test('start bloch sphere and start bb84', async ({ page }) => {
    // Go to the Education hub then trigger voice commands via E2E hook
    await page.goto('/education');
    await expect(page.getByRole('heading', { name: /Education/i })).toBeVisible();

    await page.evaluate(() => {
      // @ts-ignore
      (window as any).__voice_cmd__ && (window as any).__voice_cmd__('start bloch sphere');
    });
    await expect(page).toHaveURL(/.*\/education\/bloch$/);
    await expect(page.getByRole('heading', { name: /Bloch Sphere/i })).toBeVisible();

    await page.evaluate(() => {
      // @ts-ignore
      (window as any).__voice_cmd__ && (window as any).__voice_cmd__('start bb84');
    });
    await expect(page).toHaveURL(/.*\/education\/bb84$/);
    await expect(page.getByRole('heading', { name: /BB84/i })).toBeVisible();
  });
  test('run qft navigates to QFT then loads Playground', async ({ page }) => {
    await page.goto('/education');
    await expect(page.getByRole('heading', { name: /Education/i })).toBeVisible();
    // First utterance: navigate to QFT page
    await page.evaluate(() => {
      // @ts-ignore
      (window as any).__voice_cmd__ && (window as any).__voice_cmd__('run qft');
    });
    await expect(page).toHaveURL(/.*\/education\/qft$/);
    await expect(page.getByRole('heading', { name: /Quantum Fourier Transform/i })).toBeVisible();
    // Second utterance: with QFT loaded, trigger Playground load via event
    await page.evaluate(() => {
      // @ts-ignore
      (window as any).__voice_cmd__ && (window as any).__voice_cmd__('run qft');
    });
    await expect(page).toHaveURL(/.*\/education\/circuits.*/);
    await expect(page.getByRole('heading', { name: /Circuit Playground/i })).toBeVisible();
  });
});
