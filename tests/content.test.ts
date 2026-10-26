import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "../scripts/shell-lib.mjs";
import { applyBlocks, MD_FILES, nivelesPanels } from "../scripts/content-lib.mjs";
import { NIVELES } from "../content/niveles.mjs";
import { SERVICIOS } from "../content/servicios.mjs";

const leer = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("contenido generado al día (node scripts/build-content.mjs)", () => {
  const conBloques = readdirSync(ROOT).filter((f) => f.endsWith(".html") && leer(f).includes("<!-- gen:"));

  it("hay páginas con bloques generados", () => {
    expect(conBloques).toEqual(["index.html", "marco-madurez.html", "servicios.html"]);
  });

  it.each(conBloques)("%s coincide con content/*.mjs", (f) => {
    expect(applyBlocks(leer(f))).toBe(leer(f));
  });

  it.each(Object.keys(MD_FILES))("%s coincide con content/*.mjs", (f) => {
    expect(leer(f)).toBe((MD_FILES as Record<string, () => string>)[f]());
  });
});

describe("el contenido va completo en el HTML (lo leen buscadores y agentes)", () => {
  it("marco-madurez.html trae los 5 niveles con todas sus listas", () => {
    const html = leer("marco-madurez.html");
    for (const n of NIVELES) {
      expect(html).toContain(`id="nivel-${n.n}"`);
      for (const t of [...n.caracteristicas, ...n.indicadores, ...n.ejemplos]) expect(html).toContain(t.replace(/&/g, "&amp;"));
      for (const r of n.retos) expect(html).toContain(r.titulo);
    }
  });

  it("solo un nivel arranca activo", () => {
    expect((nivelesPanels().match(/class="lvl is-active"/g) || []).length).toBe(1);
  });

  it("servicios.html conserva las anclas #servicio-1 a #servicio-9", () => {
    const html = leer("servicios.html");
    expect(SERVICIOS).toHaveLength(9);
    for (let i = 1; i <= 9; i++) expect(html).toContain(`id="servicio-${i}"`);
  });

  it("index.html conserva #servicios, #metodologia y #marco-madurez", () => {
    const html = leer("index.html");
    for (const id of ["servicios", "metodologia", "marco-madurez"]) expect(html).toContain(`id="${id}"`);
  });
});
