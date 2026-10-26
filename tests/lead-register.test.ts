import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { buildFuente, construirNotas, CANALES_SITIO } = require("../netlify/functions/lead-register.js").__test;

describe("lista blanca de fuente", () => {
  it("acepta los canales del rediseño además de los existentes", () => {
    for (const canal of ["sitio-contacto", "sitio-home", "lead-magnet", "sitio-flotante", "agente", "evaluacion"]) {
      expect(CANALES_SITIO).toContain(canal);
      expect(buildFuente({ canal })).toEqual({ canal });
    }
  });

  it("descarta canales, claves y lead magnets desconocidos (el CRM responde 400 ante claves extra)", () => {
    expect(buildFuente({ canal: "otro" })).toBeUndefined();
    expect(buildFuente({ canal: "agente", hack: "x", utmSource: "meta" })).toEqual({ canal: "agente", utmSource: "meta" });
    expect(buildFuente({ canal: "lead-magnet", leadMagnet: "inventado" })).toEqual({ canal: "lead-magnet" });
    expect(buildFuente({ canal: "lead-magnet", leadMagnet: "checklist-cierre-fiscal" })).toEqual({ canal: "lead-magnet", leadMagnet: "checklist-cierre-fiscal" });
  });

  it("recorta valores a 200 caracteres y omite vacíos", () => {
    expect(buildFuente({ utmSource: "a".repeat(300), utmMedium: "  " }).utmSource).toHaveLength(200);
    expect(buildFuente({ utmMedium: "  " })).toBeUndefined();
  });
});

describe("notas del contacto", () => {
  it("omite líneas vacías (formularios cortos no traen sector ni nivel)", () => {
    expect(construirNotas({ industry: "", nivel_de_madurez: "" }, undefined)).toBe("");
    expect(construirNotas({ industry: "Banca", nivel_de_madurez: "" }, undefined)).toBe("Sector: Banca");
  });

  it("anota lo que descargó el visitante", () => {
    expect(construirNotas({}, { leadMagnet: "checklist-cierre-fiscal" })).toBe("Descargó: Checklist de cierre fiscal digital");
  });

  it("anota nivel, promedio y puntaje por dimensión de la evaluación", () => {
    const n = construirNotas({ evaluacion: { respuestas: [3, 3, 2, 3, 2, 3] } }, undefined);
    expect(n).toContain("Evaluación de madurez: Nivel 3 (promedio 2.7)");
    expect(n).toContain("Procesos 3, Sistemas 3, Datos 2, Experiencia del cliente 3, IA y automatización 2, Equipo y cultura 3");
  });

  it("ignora evaluaciones mal formadas sin romper el alta", () => {
    expect(construirNotas({ evaluacion: { respuestas: [9, 1, 1, 1, 1, 1] } }, undefined)).toBe("");
    expect(construirNotas({ evaluacion: "x" }, undefined)).toBe("");
  });

  it("el interés del asistente va como texto y las notas nunca pasan de 1000 caracteres", () => {
    expect(construirNotas({ interes: "CRM y automatización" }, undefined)).toBe("Interés: CRM y automatización");
    expect(construirNotas({ industry: "x".repeat(2000) }, undefined).length).toBe(1000);
  });
});
