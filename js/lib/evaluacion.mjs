/* ====================================
   EVALUACIÓN DE MADUREZ: CÁLCULO (función pura, sin DOM)
   Cada respuesta es el nivel (1-5) de la opción elegida en su dimensión. El nivel
   final es el promedio de las seis, redondeado, acotado a 1-5. Lo usan la página
   evaluacion.html y vitest (tests/evaluacion.test.ts).
   ==================================== */

export const NUM_PREGUNTAS = 6;
export const NIVEL_MIN = 1;
export const NIVEL_MAX = 5;

/** ¿Seis enteros entre 1 y 5? */
export function respuestasValidas(respuestas) {
  return Array.isArray(respuestas)
    && respuestas.length === NUM_PREGUNTAS
    && respuestas.every((r) => Number.isInteger(r) && r >= NIVEL_MIN && r <= NIVEL_MAX);
}

/** Promedio de las respuestas (sin redondear). */
export function promedio(respuestas) {
  if (!respuestasValidas(respuestas)) throw new RangeError('Se requieren 6 respuestas enteras entre 1 y 5');
  return respuestas.reduce((a, b) => a + b, 0) / NUM_PREGUNTAS;
}

/** Redondeo de un promedio a nivel: .5 sube, acotado a 1-5. */
export function nivelDePromedio(prom) {
  return Math.min(NIVEL_MAX, Math.max(NIVEL_MIN, Math.round(prom)));
}

/** { promedio, nivel } a partir de las seis respuestas. */
export function calcularResultado(respuestas) {
  const prom = promedio(respuestas);
  return { promedio: prom, nivel: nivelDePromedio(prom) };
}

/** Promedio con un decimal, como se muestra en pantalla ("2.5"). */
export const formatearPromedio = (prom) => prom.toFixed(1);
