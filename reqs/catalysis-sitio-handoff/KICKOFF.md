# Mensaje de arranque para Claude Code

Este paquete se trabaja **dentro del repo existente `WebSite-Catalysis`** (el que sirve catalysis.com.mx), no en un repo nuevo.

## Antes de pegarlo (tú, Poncho)

1. En tu copia local de `WebSite-Catalysis`, crea una rama desde `sandbox` (por ejemplo `rediseno-spec`). Confirma que `sandbox` esté al día: tenía cambios de docs que no estaban en `main` al 2026-10-26.
2. Descomprime este zip en la raíz del repo: quedan `reqs/rediseno-sitio-catalysis.md`, `design/` y este archivo (puedes borrarlo después).
3. Abre Claude Code en esa carpeta y pega el mensaje de abajo.
4. Ten a la mano: el logo en SVG o PNG transparente, la validación de las 6 preguntas de la evaluación y, si lo decides, qué hacer con las cifras de "Nosotros".

---

## Mensaje para pegar

Vamos a rediseñar catalysis.com.mx sobre el stack actual (HTML/CSS/JS vanilla, Netlify, Firebase). Lee en este orden:

1. `CLAUDE.md` del repo.
2. `reqs/rediseno-sitio-catalysis.md` (spec v4, aprobado; diseño completo de la ronda 2). Las secciones 2 y 3 ya contienen los hallazgos verificados del código: no los redescubras, solo contrástalos.
3. `design/README.md`, `design/CAMBIOS-RONDA-2.md` y, según lo necesites, los archivos de `design/`.
4. Los specs relacionados: en `reqs/`, `medicion-leads-ga4-utm.md` y `lead-magnet-checklist-cierre-fiscal.md`; en `docs/`, `crm-fuente-contrato.md`, `crm-leads.md` y `agent-friendly.md`.

Estamos en la **Fase 0: verificación**. No escribas código de la aplicación todavía. Entrega `docs/plan-rediseno.md` con:

- Confirmación (con evidencia de archivo y línea) de que los hallazgos de la sección 3 siguen siendo ciertos, y cualquier discrepancia.
- Qué partes de `medicion-leads-ga4-utm.md` y `lead-magnet-checklist-cierre-fiscal.md` ya están implementadas y cuáles no. Estos son prerrequisitos (P1 y P2) y el checklist tiene fecha límite el 24 de noviembre.
- Qué `canal` y `leadMagnet` acepta hoy el CRM (repo `catalysis-crm`) y si ya deduplica por correo. Los canales `sitio-flotante`, `agente` y `evaluacion` hay que agregarlos primero ahí.
- Un plan por fase con rutas de archivos a crear o modificar, riesgos y el orden de PRs.
- Preguntas abiertas para mí.

Reglas:
- No modifiques `css/style.css` ni las páginas admin, `clients/` ni `eventsync`.
- Respeta el flujo de ramas del spec (sección 14): rama de trabajo → `sandbox` → `main` → `production`. Ningún commit directo a `main` ni a `production`. Netlify tiene créditos limitados: no hagas despliegues de cambios solo de documentación.
- Crea los dos subagentes de la sección 14 (`docs-maintainer` y `test-runner`, ambos en Claude Haiku 4.5) como parte de la Fase 1, no ahora.
- No leas ni imprimas secretos; no escribas el valor literal de ninguna variable de entorno en archivos versionados.

Al terminar, resume en pocas líneas los hallazgos que cambian el spec y **espera mi aprobación** antes de empezar P1.
