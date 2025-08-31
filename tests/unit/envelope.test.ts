import "@testing-library/jest-dom";
import { createEnvelopeParser } from "../../app/_lib/envelope";
import type { MetadataEnvelope } from "../../src/types/Envelope";

describe("Envelope parser", () => {
  test("parses standalone JSON line", () => {
    const seen: MetadataEnvelope[] = [];
    const p = createEnvelopeParser((m) => seen.push(m));
    p.push('{"type":"metadata","tab":"diff","diff":{"modified":"x"}}\n');
    expect(seen.length).toBe(1);
    expect(seen[0].tab).toBe("diff");
  });

  test("ignores non-JSON lines and partial chunks", () => {
    const seen: MetadataEnvelope[] = [];
    const p = createEnvelopeParser((m) => seen.push(m));
    p.push("hello ");
    p.push("world\n");
    p.push('{"type":"metadata","tab":"summary"');
    expect(seen.length).toBe(0);
    p.push('}\n');
    expect(seen.length).toBe(1);
    expect(seen[0].tab).toBe("summary");
  });

  test("tolerates invalid JSON without throwing", () => {
    const seen: MetadataEnvelope[] = [];
    const p = createEnvelopeParser((m) => seen.push(m));
    expect(() => p.push("{not-json}\n")).not.toThrow();
    expect(seen.length).toBe(0);
  });
});

