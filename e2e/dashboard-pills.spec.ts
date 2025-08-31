import { test, expect } from '@playwright/test'

// Simple smoke to ensure dashboard loads and live pills render
// Note: This doesn't assert on live values changing to avoid flakiness

test.describe('Consciousness Dashboard', () => {
  test('renders header and live status pills', async ({ page }) => {
    await page.goto('/console/consciousness')
    await expect(page.getByRole('heading', { name: 'Consciousness Dashboard' })).toBeVisible()
    await expect(page.locator('text=φ:')).toBeVisible()
    await expect(page.locator('text=valence:')).toBeVisible()
    await expect(page.locator('text=coherence:')).toBeVisible()
  })
})

