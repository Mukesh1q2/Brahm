import "@testing-library/jest-dom";
import { createEnvelopeParser } from "@/app/_lib/envelope";

test("createEnvelopeParser calls onMetadata for metadata lines", () => {
  const metas: any[] = [];
  const parser = createEnvelopeParser((m: any) => metas.push(m));
  parser.push("Hello world\n");
  parser.push('{"type":"metadata","reasoning":"ok"}\n');
  parser.push("More text\n");
  parser.push('{"type":"metadata","tab":"council","workspace":{"spotlight":"concise"}}\n');
  expect(metas.length).toBe(2);
  expect(metas[0]).toHaveProperty("type", "metadata");
  expect(metas[1]).toHaveProperty("workspace.spotlight", "concise");
});

