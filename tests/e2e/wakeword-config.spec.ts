import { test, expect } from '@playwright/test';

test.describe('Wakeword config', () => {
  test('GET /api/wakeword/config returns enabled with model/keyword paths', async ({ page }) => {
    await page.goto('/');
    const res = await page.request.get('/api/wakeword/config');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.enabled).toBeTruthy();
    expect(typeof json.modelPath).toBe('string');
    expect(typeof json.keywordPath).toBe('string');
    expect(json.modelPath).toMatch(/\/porcupine\/porcupine_model\.pv$/);
    expect(json.keywordPath).toMatch(/\/porcupine\/hey-brahm\.ppn$/);
  });
});

