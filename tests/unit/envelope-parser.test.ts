import "@testing-library/jest-dom";
import { createEnvelopeParser, type MetadataEnvelope } from "../../app/_lib/envelope";

describe("createEnvelopeParser", () => {
  test("filters only metadata envelopes and ignores invalid lines", () => {
    const seen: MetadataEnvelope[] = [];
    const p = createEnvelopeParser((m) => seen.push(m));

    p.push("hello world\n");
    p.push(JSON.stringify({ type: "not-metadata", foo: 1 }) + "\n");
    p.push(JSON.stringify({ type: "metadata", reasoning: "r1" }) + "\n");
    p.push("{not json}\n");
    p.push(
      JSON.stringify({
        type: "metadata",
        diff: { original: "o", modified: "m", language: "ts" },
        tab: "diff",
      }) + "\n"
    );

    expect(seen.length).toBe(2);
    expect(seen[0]).toMatchObject({ type: "metadata", reasoning: "r1" });
    expect(seen[1]).toMatchObject({ type: "metadata", diff: { original: "o", modified: "m", language: "ts" }, tab: "diff" });
  });

  test("handles partial chunks across newline boundaries", () => {
    const seen: MetadataEnvelope[] = [];
    const p = createEnvelopeParser((m) => seen.push(m));

    const env = JSON.stringify({ type: "metadata", reasoning: "partial" });
    const half = Math.floor(env.length / 2);

    p.push(env.slice(0, half));
    // still no newline, so nothing yet
    expect(seen.length).toBe(0);
    p.push(env.slice(half) + "\n");
    expect(seen.length).toBe(1);
    expect(seen[0]).toMatchObject({ reasoning: "partial" });

    // multiple envelopes in one push
    const env2 = JSON.stringify({ type: "metadata", diff: { modified: "x" } });
    const env3 = JSON.stringify({ type: "metadata", reasoning: { step: 1 } });
    p.push(env2 + "\n" + env3 + "\n");
    expect(seen.length).toBe(3);
  });
});

