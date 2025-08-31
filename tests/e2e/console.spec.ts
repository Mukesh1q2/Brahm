import { test, expect } from "@playwright/test";
import { listenForTelemetry } from "../utils/telemetryListener";

test("Console headers + telemetry", async ({ page }) => {
  const telemetryEvents = await listenForTelemetry(page);

  await page.route(/\/audit\/query(\?|$)/, async (route) => {
    const req = route.request();
    const headers = req.headers();

    expect(headers["x-model"]).toBeDefined();
    expect(headers["x-request-id"]).toBeDefined();
    expect(headers["x-client-app"]).toBe("console");

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: 1, entries: [{
        id: 1,
        timestamp: new Date().toISOString(),
        user: "demo",
        stage: "execute",
        allowed: true,
        command: "echo test",
        reason: "ok",
        analysis: { latency_ms: 42, cost_usd: 0.0001, model: headers["x-model"] || "auto" },
        sandbox: {},
      }]}),
      headers: {
        "x-llm-model": headers["x-model"] || "auto",
        "x-llm-cost-usd": "0.0001",
        "x-server-latency-ms": "10",
      },
    });
  });

  await page.goto("/console");
  await page.waitForSelector("table");

  expect(telemetryEvents.length).toBeGreaterThan(0);
  const first = telemetryEvents[0];
  expect(first).toMatchObject({
    ok: expect.any(Boolean),
    status: expect.any(Number),
    clientLatencyMs: expect.any(Number),
  });
  expect(first.requestModel || first.responseModel).toBeDefined();
  expect(typeof first.costUsd === "number" || first.costUsd === null).toBeTruthy();
});

