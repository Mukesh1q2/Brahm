import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageBubble from "@/app/_components/chatgpt/MessageBubble";

function makeMsg(overrides: any = {}) {
  return {
    id: "m1",
    role: "assistant",
    content: "Original content",
    createdAt: Date.now(),
    meta: {
      ethics: {
        decision: "revise",
        reasons: ["sensitive content detected"],
        principles: ["ahimsa"],
        revision: { text: "Clean revised content" },
      },
    },
    ...overrides,
  } as any;
}

describe("MessageBubble ethics revise UI", () => {
  beforeEach(() => localStorage.clear());

  test("shows Ethics: revise chip and reveals revision with toggle", () => {
    render(<MessageBubble msg={makeMsg()} />);

    expect(screen.getByText("Ethics: revise")).toBeInTheDocument();

    fireEvent.click(screen.getByText(/View reasoning/i));
    expect(screen.getByText(/Revision:/i)).toBeInTheDocument();
    expect(screen.getByText("Clean revised content")).toBeInTheDocument();
  });

  test("Apply revision dispatches chat:apply-revision with text", () => {
    render(<MessageBubble msg={makeMsg()} />);
    fireEvent.click(screen.getByText(/View reasoning/i));

    let received: any = null;
    const onApply = (e: any) => { received = e?.detail; };
    window.addEventListener('chat:apply-revision', onApply as any);
    try {
      fireEvent.click(screen.getByText(/Apply revision/i));
      expect(received).toEqual({ text: "Clean revised content" });
    } finally {
      window.removeEventListener('chat:apply-revision', onApply as any);
    }
  });

  test("Auto-apply checkbox toggles localStorage flag", () => {
    render(<MessageBubble msg={makeMsg()} />);
    fireEvent.click(screen.getByText(/View reasoning/i));

    const checkbox = screen.getByRole('checkbox');
    expect(localStorage.getItem('ethics_auto_apply')).toBeNull();

    fireEvent.click(checkbox);
    expect(localStorage.getItem('ethics_auto_apply')).toBe('true');

    fireEvent.click(checkbox);
    expect(localStorage.getItem('ethics_auto_apply')).toBe('false');
  });
});

