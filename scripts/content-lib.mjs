// Renderiza a HTML y markdown los contenidos de content/*.js (única fuente de servicios,
// metodología y marco de madurez). scripts/build-content.mjs los escribe entre marcadores
// `<!-- gen:NOMBRE:start -->` / `<!-- gen:NOMBRE:end -->`; tests/content.test.ts verifica que
// las páginas committeadas estén al día.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './shell-lib.mjs';
import { NIVELES } from '../content/niveles.mjs';
import { SERVICIOS, METODOLOGIA } from '../content/servicios.mjs';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad2 = (n) => String(n).padStart(2, '0');

export const DEFAULT_NIVEL = 3;

export function serviciosCards() {
  return SERVICIOS.map((s) => `            <article class="svc" id="servicio-${s.n}">
                <div class="num">${pad2(s.n)}</div>
                <h2 class="h3">${esc(s.titulo)}</h2>
                <p>${esc(s.resumen)}</p>
                <ul class="dots">
${s.puntos.map((p) => `                    <li>${esc(p)}</li>`).join('\n')}
                </ul>
            </article>`).join('\n');
}

export function serviciosChips() {
  return SERVICIOS.map((s) =>
    `            <a href="#servicio-${s.n}" class="chip-link"><span class="num">${pad2(s.n)}</span><span>${esc(s.titulo)}</span></a>`).join('\n');
}

export function serviciosHome() {
  return SERVICIOS.map((s) => `                <a href="/servicios.html#servicio-${s.n}" class="svc-card">
                    <div class="num">${pad2(s.n)}</div>
                    <h3 class="h3">${esc(s.titulo)}</h3>
                    <p>${esc(s.resumen)}</p>
                </a>`).join('\n');
}

export function metodologiaSteps() {
  return METODOLOGIA.map((p) => `                <div class="step">
                    <div class="step__n">PASO ${pad2(p.n)}</div>
                    <h3 class="h3">${esc(p.titulo)}</h3>
                    <p>${esc(p.texto)}</p>
                </div>`).join('\n');
}

export function nivelesTabs() {
  return NIVELES.map((n) =>
    `            <button type="button" class="tab" data-nivel="${n.n}" aria-pressed="${n.n === DEFAULT_NIVEL}" aria-controls="nivel-${n.n}"><span class="tab__n">Nivel ${n.n}</span><span class="tab__name">${esc(n.nombre)}</span></button>`).join('\n');
}

export function nivelesPanels() {
  const list = (items) => items.map((t) => `                        <li>${esc(t)}</li>`).join('\n');
  return NIVELES.map((n) => `        <article class="lvl${n.n === DEFAULT_NIVEL ? ' is-active' : ''}" id="nivel-${n.n}" data-nivel="${n.n}" aria-labelledby="nivel-${n.n}-t">
            <div>
                <div class="lvl__kicker">Nivel ${n.n} · ${esc(n.nombre)}</div>
                <h2 class="lvl__title" id="nivel-${n.n}-t">${esc(n.estado)}</h2>
            </div>
            <div class="lvl__cols">
                <div class="lvl__block">
                    <h3>Características</h3>
                    <ul class="lvl__list">
${list(n.caracteristicas)}
                    </ul>
                </div>
                <div class="lvl__block">
                    <h3>Indicadores</h3>
                    <ul class="lvl__list">
${list(n.indicadores)}
                    </ul>
                </div>
            </div>
            <div class="lvl__retos">
                <h3>Retos principales</h3>
                <div class="retos">
${n.retos.map((r) => `                    <div class="reto"><strong>${esc(r.titulo)}</strong><p>${esc(r.texto)}</p></div>`).join('\n')}
                </div>
            </div>
            <div class="lvl__block">
                <h3>Ejemplos de empresa</h3>
                <ul class="ejemplos">
${n.ejemplos.map((e) => `                    <li>${esc(e)}</li>`).join('\n')}
                </ul>
            </div>
        </article>`).join('\n');
}

export const BLOCKS = {
  'servicios-chips': serviciosChips,
  'servicios-cards': serviciosCards,
  'servicios-home': serviciosHome,
  'metodologia': metodologiaSteps,
  'niveles-tabs': nivelesTabs,
  'niveles-panels': nivelesPanels,
};

const blockRe = (name) =>
  new RegExp(`(<!-- gen:${name}:start -->)[\\s\\S]*?(<!-- gen:${name}:end -->)`);

export function applyBlocks(html) {
  let out = html;
  for (const [name, render] of Object.entries(BLOCKS)) {
    if (!blockRe(name).test(out)) continue;
    out = out.replace(blockRe(name), (_m, a, b) => `${a}\n${render()}\n${b}`);
  }
  return out;
}

// ---------- Markdown para agentes (se sirven como /servicios.md y /marco-madurez.md) ----------
const SITE = 'https://catalysis.com.mx';

export function serviciosMd() {
  return `# Servicios de Catalysis

Fuente: ${SITE}/servicios.html

Catalysis ofrece servicios end-to-end, desde la estrategia hasta la implementación de tecnologías de inteligencia artificial.

${SERVICIOS.map((s) => `## ${s.n}. ${s.titulo}\n\n${s.resumen}\n\n${s.puntos.map((p) => `- ${p}`).join('\n')}`).join('\n\n')}

## Metodología

${METODOLOGIA.map((p) => `${p.n}. **${p.titulo}**: ${p.texto}`).join('\n')}
`;
}

export function marcoMadurezMd() {
  return `# Marco de Madurez Digital de Catalysis

Fuente: ${SITE}/marco-madurez.html. Evaluación interactiva: ${SITE}/evaluacion.html

Modelo de referencia con cinco niveles progresivos, desde procesos completamente manuales hasta un ecosistema digital integrado e inteligente.

${NIVELES.map((n) => `## Nivel ${n.n}: ${n.nombre}

${n.estado}

### Características
${n.caracteristicas.map((t) => `- ${t}`).join('\n')}

### Indicadores
${n.indicadores.map((t) => `- ${t}`).join('\n')}

### Retos principales
${n.retos.map((r) => `- **${r.titulo}**: ${r.texto}`).join('\n')}

### Ejemplos de empresa
${n.ejemplos.map((t) => `- ${t}`).join('\n')}`).join('\n\n')}
`;
}

export const MD_FILES = { 'servicios.md': serviciosMd, 'marco-madurez.md': marcoMadurezMd };
export const readPage = (rel) => readFileSync(join(ROOT, rel), 'utf8');
