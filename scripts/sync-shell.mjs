#!/usr/bin/env node
// Copia shell/top.html y shell/bottom.html entre los marcadores de cada página pública.
// Uso: node scripts/sync-shell.mjs        (reescribe las páginas)
//      node scripts/sync-shell.mjs --check (sale con 1 si alguna difiere; no escribe)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, applyShell, shellPages } from './shell-lib.mjs';

const check = process.argv.includes('--check');
let drift = 0;
for (const rel of shellPages()) {
  const file = join(ROOT, rel);
  const before = readFileSync(file, 'utf8');
  const after = applyShell(before);
  if (before !== after) {
    drift++;
    if (!check) writeFileSync(file, after);
    console.log(`${check ? 'difiere' : 'actualizada'}: ${rel}`);
  }
}
if (check && drift) process.exit(1);
console.log(drift ? `${drift} página(s)` : 'shell al día');
