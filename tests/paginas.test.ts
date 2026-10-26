import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT, shellPages, readFragment } from "../scripts/shell-lib.mjs";
import { KEY_PAGES, SITEMAP_PAGES } from "../netlify/edge-lib/site.ts";
import { injectPost } from "../netlify/edge-lib/html.ts";
import { post } from "./fixtures.ts";

const leer = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

// Rutas servidas por edge functions o por Netlify, sin archivo en el repo
const DINAMICAS = [/^\/blog\//, /^\/\.netlify\//, /^\/llms\.txt$/, /^\/sitemap\.xml$/, /^\/robots\.txt$/];

function archivoDe(href: string): string | null {
  const ruta = href.split("#")[0].split("?")[0];
  if (ruta === "" || DINAMICAS.some((re) => re.test(ruta))) return null;
  return ruta === "/" ? "index.html" : ruta.slice(1);
}

describe("enlaces internos", () => {
  const fuentes = [...shellPages(), "shell/top.html", "shell/bottom.html"];
  it.each(fuentes)("%s: todo enlace interno absoluto apunta a un archivo que existe", (rel) => {
    const html = rel.startsWith("shell/") ? readFragment(rel.replace("shell/", "")) : leer(rel);
    const hrefs = [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]);
    const faltan = hrefs.filter((h) => { const f = archivoDe(h); return f && !existsSync(join(ROOT, f)); });
    expect(faltan).toEqual([]);
  });

  it("las anclas internas del shell apuntan a ids que existen en la página destino", () => {
    const destinos: Record<string, string> = { "/servicios.html": leer("servicios.html"), "/": leer("index.html"), "/blog.html": leer("blog.html") };
    const anclas = [...readFragment("top.html").matchAll(/href="(\/[^"#]*)#([^"]+)"/g), ...readFragment("bottom.html").matchAll(/href="(\/[^"#]*)#([^"]+)"/g)];
    for (const [, ruta, id] of anclas) expect(destinos[ruta], `${ruta}#${id}`).toContain(`id="${id}"`);
  });
});

describe("SEO y agentes", () => {
  const publicas = shellPages().filter((p) => p !== "blog-post.html" && p !== "404.html").map((p) => "/" + p.replace(/^index\.html$/, ""));

  it("las páginas nuevas están en el sitemap y en llms.txt", () => {
    for (const ruta of ["/marco-madurez.html", "/evaluacion.html", "/recursos/checklist-cierre-fiscal.html"]) {
      expect(SITEMAP_PAGES).toContain(ruta);
      expect(KEY_PAGES.map((k) => k.path)).toContain(ruta);
    }
  });

  it("toda página pública indexable está en el sitemap", () => {
    for (const ruta of publicas) expect(SITEMAP_PAGES, ruta).toContain(ruta === "/" ? "/" : ruta);
  });

  it("las versiones markdown de KEY_PAGES existen en el repo", () => {
    for (const p of KEY_PAGES.filter((k) => k.path.endsWith(".md"))) expect(existsSync(join(ROOT, p.path.slice(1))), p.path).toBe(true);
  });

  it("robots.txt no bloquea las páginas nuevas", () => {
    const robots = leer("robots.txt");
    for (const ruta of ["/marco-madurez", "/evaluacion", "/recursos", "/servicios"]) expect(robots).not.toContain(`Disallow: ${ruta}`);
  });
});

describe("blog-post.html sigue siendo compatible con blog-og.ts", () => {
  const html = leer("blog-post.html");
  const p = post({ titulo: "Mi artículo", contenido: "<p>Cuerpo del artículo</p>" });
  const out = injectPost(html, p);

  it("inyecta el cuerpo en #post-body (el id va primero en el div)", () => {
    expect(out).toContain('<div id="post-body" class="prose"><p>Cuerpo del artículo</p></div>');
  });

  it("conserva id=\"post-title\" y agrega Open Graph, canonical y JSON-LD al <head>", () => {
    expect(out).toMatch(/<title id="post-title">Mi artículo - Catalysis<\/title>/);
    expect(out).toContain('property="og:title"');
    expect(out).toContain('rel="canonical"');
    expect(out).toContain("application/ld+json");
  });

  it("los elementos que llena js/blog-post.js existen", () => {
    for (const id of ["loading-post", "post-not-found", "post-content", "post-category", "post-heading", "post-meta", "post-image", "post-tags", "tags-list", "cierre-eval", "cierre-recurso"]) {
      expect(html, id).toContain(`id="${id}"`);
    }
  });
});
