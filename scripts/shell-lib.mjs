// Shell compartido (sidebar, barra móvil y pie) de las páginas públicas rediseñadas.
// Fuente única: shell/top.html y shell/bottom.html. scripts/sync-shell.mjs los copia entre los
// marcadores de cada página; tests/shell.test.ts falla si algún bloque se desvía.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TOP_RE = /<!-- shell:start page=([a-z-]*) -->\n([\s\S]*?)<!-- shell:end -->/;
const BOTTOM_RE = /<!-- shell-end:start -->\n([\s\S]*?)<!-- shell-end:end -->/;

export const readFragment = (name) => readFileSync(join(ROOT, 'shell', name), 'utf8');

/** Marca el enlace activo (aria-current) según la clave de página; '' = ninguno. */
export function renderTop(page) {
  const top = readFragment('top.html');
  if (!page) return top;
  return top.replaceAll(`data-nav="${page}"`, `data-nav="${page}" aria-current="page"`);
}
export const renderBottom = () => readFragment('bottom.html');

export const stripCurrent = (html) => html.replaceAll(' aria-current="page"', '');

/** Páginas públicas con shell: todos los .html de la raíz y de recursos/ que traen el marcador. */
export function shellPages() {
  const dirs = ['', 'recursos'];
  const out = [];
  for (const dir of dirs) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      if (!f.endsWith('.html')) continue;
      const rel = join(dir, f);
      if (readFileSync(join(ROOT, rel), 'utf8').includes('<!-- shell:start')) out.push(rel);
    }
  }
  return out.sort();
}

export function extractShell(html) {
  const top = html.match(TOP_RE);
  const bottom = html.match(BOTTOM_RE);
  return { page: top ? top[1] : null, top: top ? top[2] : null, bottom: bottom ? bottom[1] : null };
}

export function applyShell(html) {
  const { page } = extractShell(html);
  if (page === null) throw new Error('falta <!-- shell:start page=... -->');
  return html
    .replace(TOP_RE, () => `<!-- shell:start page=${page} -->\n${renderTop(page)}<!-- shell:end -->`)
    .replace(BOTTOM_RE, () => `<!-- shell-end:start -->\n${renderBottom()}<!-- shell-end:end -->`);
}
