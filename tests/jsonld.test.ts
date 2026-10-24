import { describe, expect, it } from "vitest";
import { injectPost } from "../netlify/edge-lib/html.ts";
import { buildBlogPosting, jsonLdScript } from "../netlify/edge-lib/jsonld.ts";
import { post } from "./fixtures.ts";

describe("JSON-LD", () => {
  it("incluye campos requeridos con fechas ISO 8601", () => {
    const j = buildBlogPosting(post()) as Record<string, any>;
    for (const k of ["headline", "description", "datePublished", "dateModified", "author", "image", "mainEntityOfPage", "inLanguage"]) {
      expect(j[k]).toBeTruthy();
    }
    expect(new Date(j.datePublished).toISOString()).toBe("2026-10-01T15:00:00.000Z");
    expect(j["@type"]).toBe("BlogPosting");
  });

  it("no puede cerrar el <script> con contenido hostil", () => {
    const s = jsonLdScript({ headline: "</script><script>alert(1)</script>" });
    expect(s.match(/<\/script>/g)).toHaveLength(1);
  });
});

describe("injectPost", () => {
  const html = '<html><head><title id="post-title">Blog</title></head><body><div id="post-body" style="x">\n<!-- c -->\n</div></body></html>';
  it("inyecta canonical, alternate markdown, JSON-LD y cuerpo; elimina <script>", () => {
    const out = injectPost(html, post({ contenido: "<p>Hola</p><script>alert(1)</script>" }));
    expect(out).toContain('<link rel="canonical"');
    expect(out).toContain('<link rel="alternate" type="text/markdown" href="https://catalysis.com.mx/blog/como_automatizar_procesos_con_bi_crm.md">');
    expect(out).toContain("application/ld+json");
    expect(out).toContain('<div id="post-body" style="x"><p>Hola</p></div>');
    expect(out).toContain('<title id="post-title">');
  });
});
