import "@testing-library/jest-dom";
import { SyncClient } from "../../app/_lib/syncClient";

describe("SyncClient basic enabled/disabled behavior", () => {
  test("disabled client no-ops on upserts and lists", async () => {
    const c = new SyncClient({ enabled: false });
    await expect(c.upsertConversation({ id: "x", title: "t", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })).resolves.toBeUndefined();
    await expect(c.upsertMessage({ id: "m", conversationId: "x", role: "user", content: "hi", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })).resolves.toBeUndefined();
    await expect(c.listConversations(0)).resolves.toEqual([]);
    await expect(c.listMessages("x", 0)).resolves.toEqual([]);
  });
});

