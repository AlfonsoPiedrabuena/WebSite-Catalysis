import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import {
  calcularResultado, formatearPromedio, nivelDePromedio, promedio, respuestasValidas,
} from "../js/lib/evaluacion.mjs";
import { PREGUNTAS, RESULTADOS } from "../content/evaluacion.mjs";
import { NIVELES } from "../content/niveles.mjs";

const require = createRequire(import.meta.url);
const lead = require("../netlify/functions/lead-register.js").__test;

describe("nivelDePromedio (límites del redondeo)", () => {
  it.each([
    [1, 1], [1.49, 1], [1.5, 2], [2.49, 2], [2.5, 3], [3.5, 4], [4.49, 4], [4.5, 5], [5, 5],
  ])("promedio %s → nivel %s", (prom, nivel) => {
    expect(nivelDePromedio(prom)).toBe(nivel);
  });

  it("acota a 1-5 aunque el promedio se salga de rango", () => {
    expect(nivelDePromedio(0)).toBe(1);
    expect(nivelDePromedio(7)).toBe(5);
  });
});

describe("calcularResultado", () => {
  it("todas en 1 → nivel 1; todas en 5 → nivel 5", () => {
    expect(calcularResultado([1, 1, 1, 1, 1, 1])).toEqual({ promedio: 1, nivel: 1 });
    expect(calcularResultado([5, 5, 5, 5, 5, 5])).toEqual({ promedio: 5, nivel: 5 });
  });

  it("promedios alcanzables con seis enteros en los límites .5", () => {
    expect(calcularResultado([1, 1, 1, 2, 2, 2])).toEqual({ promedio: 1.5, nivel: 2 });
    expect(calcularResultado([2, 2, 2, 3, 3, 3])).toEqual({ promedio: 2.5, nivel: 3 });
    expect(calcularResultado([4, 4, 4, 5, 5, 5])).toEqual({ promedio: 4.5, nivel: 5 });
  });

  it("caso del prototipo (3,3,2,3,2,3) → nivel 3, promedio 2.7", () => {
    const r = calcularResultado([3, 3, 2, 3, 2, 3]);
    expect(r.nivel).toBe(3);
    expect(formatearPromedio(r.promedio)).toBe("2.7");
  });

  it("rechaza respuestas incompletas o fuera de rango", () => {
    expect(respuestasValidas([1, 2, 3])).toBe(false);
    expect(respuestasValidas([0, 1, 1, 1, 1, 1])).toBe(false);
    expect(respuestasValidas([1, 1, 1, 1, 1, 6])).toBe(false);
    expect(respuestasValidas([1, 1, 1, 1, 1, 1.5])).toBe(false);
    expect(() => promedio([1, 1, 1])).toThrow(RangeError);
  });
});

describe("banco de preguntas y resultados", () => {
  it("6 preguntas, cada una con 5 opciones (una por nivel)", () => {
    expect(PREGUNTAS).toHaveLength(6);
    for (const p of PREGUNTAS) expect(p.opciones).toHaveLength(5);
  });

  it("5 niveles de resultado, numerados 1 a 5, con retos", () => {
    expect(RESULTADOS.map((r) => r.n)).toEqual([1, 2, 3, 4, 5]);
    for (const r of RESULTADOS) expect(r.retos.length).toBeGreaterThan(0);
  });

  it("los nombres de nivel coinciden con el marco de madurez", () => {
    expect(RESULTADOS.map((r) => r.nombre)).toEqual(NIVELES.map((n) => n.nombre));
  });

  it("las dimensiones del banco coinciden con las que usa lead-register para las notas", () => {
    expect(PREGUNTAS.map((p) => p.dimension)).toEqual(lead.DIMENSIONES);
  });

  it("lead-register recalcula el mismo nivel que la página", () => {
    for (const r of [[1, 1, 1, 2, 2, 2], [2, 2, 2, 3, 3, 3], [4, 4, 4, 5, 5, 5], [3, 3, 2, 3, 2, 3]]) {
      const { nivel, promedio: prom } = calcularResultado(r);
      const [linea] = lead.lineasEvaluacion({ respuestas: r });
      expect(linea).toBe(`Evaluación de madurez: Nivel ${nivel} (promedio ${formatearPromedio(prom)})`);
    }
  });
});
