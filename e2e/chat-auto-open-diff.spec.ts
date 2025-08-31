import { test, expect } from "@playwright/test";

// E2E: chat stream includes metadata diff envelope -> auto-switches to Diff tab
// Relies on app/api/chat/route.ts mocked streaming endpoint and NEXT_PUBLIC_CHAT_METADATA_AUTOOPEN=true

test.describe("PR-5 auto-open drawer on metadata", () => {
  test("auto-switches to Diff when diff envelope is streamed", async ({ page }) => {
    await page.goto("/chat");
    await page.setViewportSize({ width: 1280, height: 900 });

    const enabledText = page.getByText("ChatGPT-style UI is disabled.");
    if (await enabledText.isVisible().catch(() => false)) {
      test.skip(true, "Chat UI not enabled in this run");
    }

    // Send a message to trigger stream
    const textarea = page.getByPlaceholder("Message Brahm…");
    await textarea.fill("demo");
    await textarea.press("Meta+Enter");

    // Wait for Diff tab to be auto-selected and content to render
    await page.getByTestId("right-panel-tab-diff").waitFor({ state: "visible" });
    // The code-diff-viewer should appear after the diff envelope
    await expect(page.getByTestId("code-diff-viewer")).toBeVisible({ timeout: 15000 });
  });
});

