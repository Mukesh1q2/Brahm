import { test, expect } from "@playwright/test";

test("reasoning panel renders summary + json and toggles", async ({ page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 1280, height: 900 });

  const panel = page.getByTestId("right-panel");
  await expect(panel).toBeVisible();

  // Summary visible by default (mock wired in shell)
  await expect(page.getByTestId("reasoning-summary")).toBeVisible();

  // Switch to JSON view within Reasoning panel
  await page.getByTestId("reasoning-tab-json").click();
  await expect(page.getByTestId("reasoning-json")).toBeVisible();

  // Switch to top-level JSON tab
  await page.getByTestId("right-panel-tab-json").click();
  await expect(page.getByTestId("json-raw")).toBeVisible();
});

test("tab selection persists across reload", async ({ page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.getByTestId("right-panel-tab-diff").click();
  await expect(page.getByTestId("right-panel-tab-diff")).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.getByTestId("right-panel-tab-diff")).toHaveAttribute("aria-pressed", "true");
});

test("code diff viewer shows when diff data exists", async ({ page }) => {
  await page.goto("/");
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.getByTestId("right-panel-tab-diff").click();
  await expect(page.getByTestId("code-diff-viewer")).toBeVisible();
});

