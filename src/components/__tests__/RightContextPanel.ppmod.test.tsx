import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import RightContextPanel from "@/components/shell/RightContextPanel";

describe("RightContextPanel PP modulation badge", () => {
  const OriginalES = (global as any).EventSource;

  class MockEventSource {
    url: string;
    listeners: Record<string, Array<(ev: { data: string }) => void>> = {};
    constructor(url: string) {
      this.url = url;
    }
    addEventListener(type: string, cb: (ev: { data: string }) => void) {
      this.listeners[type] = this.listeners[type] || [];
      this.listeners[type].push(cb);
    }
    emit(type: string, payload: any) {
      const ev = { data: JSON.stringify(payload) } as any;
      (this.listeners[type] || []).forEach((cb) => cb(ev));
    }
    close() {}
  }

  beforeEach(() => {
    (global as any).EventSource = MockEventSource as any;
  });

  afterEach(() => {
    (global as any).EventSource = OriginalES;
  });

  test("updates badges when CIPS prediction and weights events arrive", async () => {
    render(<RightContextPanel />);

    // Start stream (creates EventSource and stores it on window.__ck_sse__)
    fireEvent.click(screen.getByText("Stream Run"));

    const sse: any = (window as any).__ck_sse__;
    expect(sse).toBeTruthy();

    // Emit prediction error event with act to silence warnings
    await act(async () => {
      sse.emit("ev", { type: "cips:prediction", error: 0.321, predicted: { value: 0.1 } });
    });
    const errBadge = await screen.findByTestId("sse-badge-ppmod");
    expect(errBadge).toHaveTextContent("Err:0.321");

    // Emit a second prediction error to confirm dynamic update
    await act(async () => {
      sse.emit("ev", { type: "cips:prediction", error: 0.876, predicted: { value: 0.9 } });
    });
    await waitFor(() => expect(screen.getByTestId("sse-badge-ppmod")).toHaveTextContent("Err:0.876"));

    // Emit weights event with act to silence warnings
    await act(async () => {
      sse.emit("ev", { type: "cips:weights", weights: { gwt: 0.2, causal: 0.3, pp: 0.5 } });
    });
    const wBadge = await screen.findByTestId("sse-badge-weights");
    await waitFor(() => expect(wBadge).toHaveTextContent("w(0.20,0.30,0.50)"));

    // Emit a CIPS Apply toggle scenario: send another weights to mimic evolution applying
    await act(async () => {
      sse.emit("ev", { type: "cips:weights", weights: { gwt: 0.15, causal: 0.25, pp: 0.60 } });
    });
    await waitFor(() => expect(screen.getByTestId("sse-badge-weights")).toHaveTextContent("w(0.15,0.25,0.60)"));
  });
});
