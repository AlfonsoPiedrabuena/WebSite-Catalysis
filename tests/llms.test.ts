import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "../netlify/edge-lib/llms.ts";
import { post } from "./fixtures.ts";

describe("buildLlmsTxt", () => {
  it("estructura del estándar y formato de línea", () => {
    const out = buildLlmsTxt([post({ titulo: "A [x]", slug: "a", resumen: "Desc\ncorta" })]);
    const lines = out.split("\n");
    expect(lines[0]).toBe("# Catalysis");
    expect(lines[2]).toMatch(/^> .+/);
    expect(out).toContain("## Páginas clave");
    expect(out).toContain("## Blog");
    expect(out).toContain("- [A x](https://catalysis.com.mx/blog/a.md): Desc corta");
  });

  it("respeta el orden recibido y limita a 50 con enlace al índice", () => {
    const posts = Array.from({ length: 60 }, (_, i) => post({ titulo: `P${i}`, slug: `p${i}` }));
    const out = buildLlmsTxt(posts);
    expect(out.match(/\/blog\/p\d+\.md/g)).toHaveLength(50);
    expect(out.indexOf("p0.md")).toBeLessThan(out.indexOf("p1.md"));
    expect(out).toContain("https://catalysis.com.mx/blog.html");
  });

  it("sin más de 50 posts no agrega el enlace al índice extra", () => {
    expect(buildLlmsTxt([post()])).not.toContain("índice del blog");
  });
});
