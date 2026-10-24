import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Las Edge Functions importan "turndown" vía import map de Deno; en Node se resuelve desde tests/node_modules.
export default defineConfig({
  resolve: { alias: { turndown: fileURLToPath(new URL("./node_modules/turndown", import.meta.url)) } },
  test: { include: ["*.test.ts"] },
});
