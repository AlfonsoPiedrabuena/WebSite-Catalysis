import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT, extractShell, readFragment, shellPages, stripCurrent } from "../scripts/shell-lib.mjs";

const PAGINAS_ESPERADAS = [
  "404.html", "aviso-privacidad.html", "blog-post.html", "blog.html", "contacto.html", "evaluacion.html",
  "index.html", "marco-madurez.html", "recursos/checklist-cierre-fiscal.html", "servicios.html",
];
const leer = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("deriva del shell (sidebar, barra móvil y pie)", () => {
  it("todas las páginas públicas rediseñadas usan el shell", () => {
    expect(shellPages()).toEqual(PAGINAS_ESPERADAS);
  });

  it.each(PAGINAS_ESPERADAS)("%s: los bloques del shell son idénticos a shell/*.html", (rel) => {
    const { top, bottom } = extractShell(leer(rel));
    expect(stripCurrent(top!)).toBe(stripCurrent(readFragment("top.html")));
    expect(bottom).toBe(readFragment("bottom.html"));
  });

  it.each(PAGINAS_ESPERADAS)("%s: marca como máximo una página activa por menú", (rel) => {
    const { page, top } = extractShell(leer(rel));
    const activos = (top!.match(/aria-current="page"/g) || []).length;
    // sidebar + menú móvil: cada enlace activo aparece dos veces
    expect(activos).toBe(page ? 2 : 0);
  });
});

describe("requisitos comunes de cada página", () => {
  it.each(PAGINAS_ESPERADAS)("%s: GA4, hoja de estilos nueva y contenido principal", (rel) => {
    const html = leer(rel);
    expect(html).toContain("G-19DQMK1HYD");
    expect(html).toContain('href="/css/tokens.css"');
    expect(html).toContain('href="/css/site.css"');
    expect(html).not.toContain("css/style.css");
    expect(html).toContain('<main id="contenido"');
    expect(html).toMatch(/<title[^>]*>[^<]+<\/title>/);
    expect(html).toContain('lang="es"');
  });

  it.each(PAGINAS_ESPERADAS.filter((p) => p !== "blog-post.html" && p !== "404.html"))("%s: canonical y Open Graph propios", (rel) => {
    const html = leer(rel);
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/catalysis\.com\.mx\//);
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="description"');
  });

  it("las páginas que envían leads cargan attribution.js antes que sus scripts (lo hace el shell)", () => {
    const bottom = readFragment("bottom.html");
    expect(bottom.indexOf("/js/attribution.js")).toBeGreaterThan(-1);
    expect(bottom.indexOf("/js/attribution.js")).toBeLessThan(bottom.indexOf("/js/shell.js"));
  });

  it("no queda ningún botón muerto (href=\"#\") en las páginas", () => {
    for (const rel of PAGINAS_ESPERADAS) expect(leer(rel), rel).not.toMatch(/href="#"/);
  });
});
