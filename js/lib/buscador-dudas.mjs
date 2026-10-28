/* ====================================
   BUSCADOR DE DUDAS DEL ASISTENTE (sin IA, sin DOM)
   Coincidencia de palabras sobre el contenido del sitio: los servicios, la metodología y los
   niveles salen de content/*.mjs (fuente única), no se duplican textos aquí. Si nada coincide
   lo dice: nunca inventa una respuesta.
   ==================================== */
import { SERVICIOS, METODOLOGIA } from '../../content/servicios.mjs';
import { NIVELES } from '../../content/niveles.mjs';
import { RECURSOS } from '../../content/recursos.mjs';

const VACIAS = new Set((
  'a al algo algun alguna como con cual cuales cuando cuanto cuanta cuantos de del desde donde el ella ellos en entre ' +
  'era eres es esa ese eso esta este esto estoy fue ha hacen hace hacer han hay la las le les lo los me mi mis mas muy ' +
  'necesito no nos nuestro o para pero por porque puedo puede pueden que quiero quien se ser si sin sobre son su sus ' +
  'tambien tengo tiene tienen todo un una unas uno unos usar usan y ya yo hola buenas gracias informacion info ' +
  'saber conocer duda dudas pregunta quisiera quiero ofrecen ofrece cuesta cuestan precio costo costos'
).split(' '));

/** minúsculas, sin acentos, solo letras y números. */
export function normalizar(texto) {
  return String(texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Raíz aproximada: "automatización", "automatizar" y "automatizamos" comparten los 5 primeros caracteres. */
function raiz(t) {
  return t.length > 5 ? t.slice(0, 5) : t.replace(/(es|s)$/, '');
}

/** Palabras que el visitante usa y el contenido no (se añaden a la consulta). */
const SINONIMOS = { nube: 'cloud', nubes: 'cloud', ia: 'inteligencia artificial', bi: 'analytics datos', erp: 'sistemas', web: 'sitio' };

export function palabras(texto) {
  const base = normalizar(texto).split(' ');
  const extra = base.flatMap((t) => (SINONIMOS[t] ? normalizar(SINONIMOS[t]).split(' ') : []));
  return base.concat(extra).filter((t) => t.length >= 2 && !VACIAS.has(t)).map(raiz);
}

const conjunto = (texto) => new Set(palabras(texto));

function documento({ id, tipo, titulo, texto, href, claves = '', etiqueta }) {
  return { id, tipo, titulo, texto, href, etiqueta: etiqueta || titulo, _t: conjunto(titulo), _c: conjunto(claves), _x: conjunto(texto) };
}

const checklist = RECURSOS['checklist-cierre-fiscal'];

function construirIndice() {
  const docs = [];
  for (const s of SERVICIOS) {
    docs.push(documento({
      id: `servicio-${s.n}`, tipo: 'servicio', titulo: s.titulo,
      texto: `${s.resumen} Incluye: ${s.puntos.join(', ')}.`,
      href: `/servicios.html#servicio-${s.n}`,
      claves: s.puntos.join(' '),
    }));
  }
  for (const m of METODOLOGIA) {
    docs.push(documento({
      id: `metodologia-${m.n}`, tipo: 'metodologia', titulo: `Metodología, paso ${m.n}: ${m.titulo}`,
      texto: m.texto, href: '/index.html#metodologia', claves: `metodologia metodo pasos proceso trabajo ${m.titulo}`,
      etiqueta: 'Ver la metodología',
    }));
  }
  for (const n of NIVELES) {
    docs.push(documento({
      id: `nivel-${n.n}`, tipo: 'nivel', titulo: `Nivel ${n.n} de madurez digital: ${n.nombre}`,
      texto: n.estado, href: `/marco-madurez.html#nivel-${n.n}`,
      claves: `nivel niveles ${n.nombre} ${(n.caracteristicas || []).join(' ')}`,
      etiqueta: `Ver el nivel ${n.n}`,
    }));
  }
  docs.push(documento({
    id: 'marco', tipo: 'pagina', titulo: 'Marco de madurez digital',
    texto: 'Los cinco niveles de madurez digital, de procesos manuales a una organización que innova con datos e IA.',
    href: '/marco-madurez.html', claves: 'marco niveles madurez modelo cinco',
  }));
  docs.push(documento({
    id: 'evaluacion', tipo: 'pagina', titulo: 'Evaluación de madurez digital',
    texto: 'Un cuestionario corto que ubica a tu empresa en uno de los cinco niveles de madurez digital.',
    href: '/evaluacion.html', claves: 'evaluacion evaluar diagnostico nivel cuestionario test madurez',
  }));
  docs.push(documento({
    id: 'checklist', tipo: 'recurso', titulo: checklist.titulo, texto: checklist.texto, href: checklist.href,
    claves: 'checklist cierre fiscal sat facturacion factura facturas comprobantes cfdi pymes descarga gratis recurso',
    etiqueta: 'Ver el checklist',
  }));
  docs.push(documento({
    id: 'privacidad', tipo: 'pagina', titulo: 'Aviso de privacidad',
    texto: 'Qué datos recopilamos, para qué los usamos, cuánto tiempo los conservamos y cómo ejercer tus derechos ARCO.',
    href: '/aviso-privacidad.html', claves: 'privacidad datos personales arco proteccion confidencial conservan guardan',
  }));
  return docs;
}

let INDICE = null;

/**
 * Busca `consulta` en el contenido del sitio. Devuelve hasta `max` resultados
 * [{ id, tipo, titulo, texto, href, etiqueta, puntos }] de mayor a menor coincidencia.
 * Puntos por palabra: título 3, claves 3, texto 1. Se exige al menos `minimo` puntos.
 */
export function buscarDuda(consulta, { max = 3, minimo = 3 } = {}) {
  const q = [...conjunto(consulta)];
  if (q.length === 0) return [];
  INDICE = INDICE || construirIndice();
  return INDICE
    .map((d) => ({ d, puntos: q.reduce((p, t) => p + (d._t.has(t) ? 3 : 0) + (d._c.has(t) ? 3 : 0) + (d._x.has(t) ? 1 : 0), 0) }))
    .filter((r) => r.puntos >= minimo)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, max)
    .map(({ d, puntos }) => ({ id: d.id, tipo: d.tipo, titulo: d.titulo, texto: d.texto, href: d.href, etiqueta: d.etiqueta, puntos }));
}
