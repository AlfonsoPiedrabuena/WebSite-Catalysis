#!/usr/bin/env node
// Regenera los bloques `gen:*` de las páginas y los .md de contenido desde content/*.js.
// Uso: node scripts/build-content.mjs [--check]
import { writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './shell-lib.mjs';
import { applyBlocks, MD_FILES } from './content-lib.mjs';

const check = process.argv.includes('--check');
let drift = 0;
const write = (rel, next) => {
  const file = join(ROOT, rel);
  let prev = '';
  try { prev = readFileSync(file, 'utf8'); } catch { /* archivo nuevo */ }
  if (prev !== next) {
    drift++;
    console.log(`${check ? 'difiere' : 'actualizado'}: ${rel}`);
    if (!check) writeFileSync(file, next);
  }
};
for (const f of readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
  const html = readFileSync(join(ROOT, f), 'utf8');
  if (html.includes('<!-- gen:')) write(f, applyBlocks(html));
}
for (const [rel, render] of Object.entries(MD_FILES)) write(rel, render());
if (check && drift) process.exit(1);
console.log(drift ? `${drift} archivo(s)` : 'contenido al día');
