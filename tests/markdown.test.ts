import { describe, expect, it } from "vitest";
import { serializePost, yamlString } from "../netlify/edge-lib/markdown.ts";
import { post } from "./fixtures.ts";

describe("serializePost", () => {
  it("incluye frontmatter completo", () => {
    const md = serializePost(post());
    const fm = md.split("---")[1];
    for (const k of ["title:", "description:", "date:", "updated:", "author:", "tags:", "lang:", "canonical:"]) {
      expect(fm).toContain(k);
    }
    expect(md).toContain('canonical: "https://catalysis.com.mx/blog-post.html?id=como_automatizar_procesos_con_bi_crm"');
    expect(md).toContain('lang: "es-MX"');
  });

  it("escapa caracteres especiales en YAML", () => {
    expect(yamlString('Dice "hola": \\ ok\nlínea')).toBe('"Dice \\"hola\\": \\\\ ok\\nlínea"');
    const md = serializePost(post({ titulo: 'Título: "con" comillas' }));
    expect(md).toContain('title: "Título: \\"con\\" comillas"');
  });

  it("convierte enlaces e imágenes a URLs absolutas", () => {
    const md = serializePost(post());
    expect(md).toContain("[servicios](https://catalysis.com.mx/servicios.html)");
    expect(md).toContain("![a](https://catalysis.com.mx/images/a.png)");
    expect(md).not.toMatch(/\]\((?!https?:|#|mailto:)/);
  });

  it("funciona sin imagen y sin tags", () => {
    const md = serializePost(post({ imagen: "", tags: [] }));
    expect(md).toContain("tags: []");
    expect(md).not.toContain("cover.png");
  });

  it("no expone campos internos", () => {
    const md = serializePost({ ...post(), vistas: 99, id: "abc123", notas: "secreto" } as never);
    expect(md).not.toMatch(/vistas|abc123|secreto|publicado/);
  });
});
