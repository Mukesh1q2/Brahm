import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import CodeDiffViewer from "@/components/panels/CodeDiffViewer";

jest.mock("@monaco-editor/react", () => ({
  DiffEditor: (props: any) => <div data-testid="monaco-diff" {...props} />,
}));

test("wires original/modified to DiffEditor", async () => {
  const original = "const a = 1";
  const modified = "const a = 2";
  render(<CodeDiffViewer original={original} modified={modified} language="typescript" />);
  const el = await screen.findByTestId("monaco-diff");
  expect(el).toBeInTheDocument();
});

