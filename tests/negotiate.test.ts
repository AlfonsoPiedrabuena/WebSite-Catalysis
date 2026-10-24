import { describe, expect, it } from "vitest";
import { prefersMarkdown } from "../netlify/edge-lib/negotiate.ts";

describe("prefersMarkdown", () => {
  it.each([
    ["text/markdown", true],
    ["text/html", false],
    ["*/*", false],
    ["", false],
    [null, false],
    ["text/html;q=0.9, text/markdown;q=1", true],
    ["text/html, text/markdown;q=0.5", false],
    ["text/markdown;q=0", false],
    ["text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", false],
    ["text/markdown, text/html", false], // empate → HTML
  ])("%s → %s", (accept, expected) => expect(prefersMarkdown(accept)).toBe(expected));
});
