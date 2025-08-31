import { test, expect } from '@playwright/test';

test.describe('Circuit Playground QFT apply', () => {
  test('Prepare |x⟩ then Apply QFT yields uniform probs (n=2)', async ({ page }) => {
    await page.goto('/education/circuits');
    await expect(page.getByRole('heading', { name: /Education .* Circuit Playground/i })).toBeVisible();

    // Select 2 qubits
    await page.getByLabel(/qubits/i).selectOption('2');

    // Prepare basis |x⟩ with x=1
    const basisInput = page.getByLabel(/basis.*\|x\u27e9/i); // match label text 'basis |x⟩'
    // Fallback if special char doesn’t render in a11y name
    const inputHandle = await basisInput.elementHandle() || await page.getByLabel(/basis/i).elementHandle();
    if (inputHandle) {
      await (await inputHandle.asElement())!.fill('1');
    } else {
      // fallback: target the numeric input by type near the label
      await page.locator('label:has-text("basis") input[type=number]').fill('1');
    }
    await page.getByRole('button', { name: /Prepare \|x/i }).click();

    // Apply QFT
    await page.getByRole('button', { name: /^Apply QFT$/i }).click();

    // Read probabilities from bars (titles like "|00⟩ 25.0%")
    const panel = page.locator('div.rounded.border', { hasText: 'Probabilities' });
    const bars = panel.locator('div[title$="%"]');
    await expect(bars).toHaveCount(4);
    const titles = await bars.allTextContents();
    // Extract percentages from titles
    const percents = titles.map(t => {
      const m = t.match(/(\d+\.?\d*)%/);
      return m ? parseFloat(m[1]) : 0;
    });
    // All around 25% within tolerance
    for (const p of percents) {
      expect(p).toBeGreaterThan(24);
      expect(p).toBeLessThan(26);
    }
  });
});

