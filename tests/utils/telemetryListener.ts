import type { Page } from "@playwright/test";

export async function listenForTelemetry(page: Page) {
  const events: any[] = [];
  await page.exposeFunction("captureTelemetry", (e: any) => events.push(e));
  await page.addInitScript(() => {
    window.addEventListener("telemetry:request", (e: any) => {
      // @ts-ignore
      window.captureTelemetry?.(e.detail);
    });
  });
  return events;
}

