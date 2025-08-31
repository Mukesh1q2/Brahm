import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import RightContextPanel from "@/components/shell/RightContextPanel";

describe("RightContextPanel toggles", () => {
  test("default badges reflect initial toggle state", () => {
    render(<RightContextPanel />);

    expect(screen.getByTestId("sse-badge-ethics")).toHaveTextContent("E:on");
    expect(screen.getByTestId("sse-badge-tools")).toHaveTextContent("T:on");
    expect(screen.getByTestId("sse-badge-salience")).toHaveTextContent("S:on");
    expect(screen.getByTestId("sse-badge-cips")).toHaveTextContent("CIPS:off");
    expect(screen.getByTestId("sse-badge-cips-apply")).toHaveTextContent("Apply:off");
  });

  test("toggling checkboxes updates badges", () => {
    render(<RightContextPanel />);

    const ethics = screen.getByTestId("sse-ethics") as HTMLInputElement;
    const tools = screen.getByTestId("sse-tools") as HTMLInputElement;
    const salience = screen.getByTestId("sse-salience") as HTMLInputElement;
    const cips = screen.getByTestId("sse-cips") as HTMLInputElement;
    const apply = screen.getByTestId("sse-cips-apply") as HTMLInputElement;

    // Turn off the initially-on toggles
    fireEvent.click(ethics);
    fireEvent.click(tools);
    fireEvent.click(salience);

    expect(screen.getByTestId("sse-badge-ethics")).toHaveTextContent("E:off");
    expect(screen.getByTestId("sse-badge-tools")).toHaveTextContent("T:off");
    expect(screen.getByTestId("sse-badge-salience")).toHaveTextContent("S:off");

    // Turn on the initially-off toggles
    fireEvent.click(cips);
    fireEvent.click(apply);

    expect(screen.getByTestId("sse-badge-cips")).toHaveTextContent("CIPS:on");
    expect(screen.getByTestId("sse-badge-cips-apply")).toHaveTextContent("Apply:on");

    // Toggle back to original
    fireEvent.click(ethics);
    fireEvent.click(tools);
    fireEvent.click(salience);
    fireEvent.click(cips);
    fireEvent.click(apply);

    expect(screen.getByTestId("sse-badge-ethics")).toHaveTextContent("E:on");
    expect(screen.getByTestId("sse-badge-tools")).toHaveTextContent("T:on");
    expect(screen.getByTestId("sse-badge-salience")).toHaveTextContent("S:on");
    expect(screen.getByTestId("sse-badge-cips")).toHaveTextContent("CIPS:off");
    expect(screen.getByTestId("sse-badge-cips-apply")).toHaveTextContent("Apply:off");
  });
});
