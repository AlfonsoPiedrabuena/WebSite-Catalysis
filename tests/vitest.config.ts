import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Las Edge Functions importan "turndown" vía import map de Deno; en Node se resuelve desde tests/node_modules.
// Los scripts del sitio importan con rutas absolutas del sitio ("/js/lib/...", "/content/..."): se resuelven a la raíz del repo.
const raiz = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: "turndown", replacement: fileURLToPath(new URL("./node_modules/turndown", import.meta.url)) },
      { find: /^\/(js|content)\//, replacement: `${raiz("")}$1/` },
    ],
  },
  test: { include: ["*.test.ts"] },
});
