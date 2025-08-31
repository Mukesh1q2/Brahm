import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatComposer from "@/app/_components/chatgpt/ChatComposer";
import { ModelProvider } from "@/app/_components/ModelContext";

// Mock the chat API to return a readable-like stream with metadata envelope
const enc = new TextEncoder();
const meta = {
  type: "metadata",
  ethics: { decision: "revise", revision: { text: "Revised safe input" } },
  workspace: {
    deliberation_trace: [{ name: "concise", output: "Go brief" }],
    votes: { concise: 0.6, skeptic: 0.4 },
    spotlight: "concise",
    curiosity: 0.42,
  },
  tab: "council",
};

function makeStream() {
  let i = 0;
  return {
    getReader() {
      return {
        async read() {
          if (i === 0) { i++; return { done: false, value: enc.encode(JSON.stringify(meta) + "\n") }; }
          if (i === 1) { i++; return { done: false, value: enc.encode("ok") }; }
          return { done: true, value: undefined as any };
        },
      };
    },
  } as any;
}

jest.mock("@/app/_lib/api", () => ({
  sendChat: jest.fn(async () => ({
    stream: makeStream(),
    trace: "t1",
    status: 200,
    startedAt: Date.now(),
    requestModel: "auto",
    responseModel: "mind-orchestrator",
  })),
}));

const { sendChat } = jest.requireMock("@/app/_lib/api");

describe("ChatComposer integration (auto-apply revise + council)", () => {
  beforeEach(() => {
    localStorage.clear();
    // Enable auto-apply for revise
    localStorage.setItem("ethics_auto_apply", "true");
  });

  test("auto-applies revision and switches panel tab to council", async () => {
    render(
      <ModelProvider>
        <ChatComposer />
      </ModelProvider>
    );

    const ta = screen.getByPlaceholderText("Message Brahm…");
    fireEvent.change(ta, { target: { value: "unsafe content" } });
    // Submit via Ctrl+Enter
    fireEvent.keyDown(ta, { key: "Enter", ctrlKey: true });

    await waitFor(() => expect(sendChat).toHaveBeenCalledTimes(1));

    // Auto-apply should trigger a second send with revised content
    await waitFor(() => expect(sendChat).toHaveBeenCalledTimes(2));

    // RightPanel tab should switch to council (persisted in localStorage)
    expect(localStorage.getItem("brahm:rightPanel:tab")).toBe("council");

    // Workspace timeline record appended
    const raw = localStorage.getItem("workspace_timeline");
    expect(raw).toBeTruthy();
    const arr = raw ? JSON.parse(raw) : [];
    expect(Array.isArray(arr)).toBe(true);
    expect(arr[arr.length - 1]?.spotlight).toBe("concise");
    expect(typeof arr[arr.length - 1]?.curiosity).toBe("number");
  });
});

