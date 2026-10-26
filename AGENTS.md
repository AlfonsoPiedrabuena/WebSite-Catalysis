# AGENTS.md

Guía corta para agentes de código. La guía completa y autoritativa es `CLAUDE.md`.

- El repo **es** el sitio publicado (Netlify publica la raíz; despliega desde `production`).
- Antes de tocar páginas, estilos o formularios lee `docs/rediseno-frontend.md`.
- Pruebas: `cd tests && npm install && npm test`. Tras editar `shell/*.html` corre `node scripts/sync-shell.mjs`; tras editar `content/*.mjs`, `node scripts/build-content.mjs`.
- No modifiques `css/style.css`, las páginas admin, `clients/` ni `design/`.
- Nunca escribas secretos ni el valor literal de variables de entorno en archivos versionados.
- Ramas: trabajo → `sandbox` → `main` → `production`; sin commits directos a `main` ni a `production`.
