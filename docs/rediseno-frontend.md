# Rediseño del sitio: arquitectura del frontend

Cuándo leerlo: antes de tocar el shell (sidebar/pie), `css/site.css`, una página pública, los flotantes, la evaluación o los contenidos de servicios y marco de madurez. Spec y decisiones: `reqs/rediseno-sitio-catalysis.md` y `docs/decisions.md`. Referencia visual (solo lectura, no se despliega): `design/`.

## Piezas

| Pieza | Dónde | Notas |
|---|---|---|
| Tokens y estilos | `css/tokens.css` (variables y tipografías), `css/site.css` (shell, componentes, páginas) | `css/style.css` **no se toca**: lo siguen usando admin, `clients/` y `eventsync`. El acento se cambia en `--accent`. |
| Tipografías | `fonts/*.woff2` (Sora, Inter, IBM Plex Mono, solo subconjunto latin) | Alojadas en el repo; `font-display: swap`; precarga de Sora e Inter en cada página. |
| Shell | `shell/top.html` (sidebar + barra móvil) y `shell/bottom.html` (pie + scripts comunes) | Se copian entre los marcadores `<!-- shell:start page=X -->…<!-- shell:end -->` y `<!-- shell-end:start -->…<!-- shell-end:end -->` de cada página. `page=` marca el enlace activo (`inicio`, `servicios`, `madurez`, `evaluacion`, `blog`, `recursos`, `contacto`; vacío = ninguno). |
| Contenido único | `content/niveles.mjs`, `content/servicios.mjs`, `content/evaluacion.mjs`, `content/recursos.mjs` | Servicios, metodología y marco de madurez se **generan** en el HTML (y en `servicios.md` / `marco-madurez.md`) entre marcadores `<!-- gen:NOMBRE:start/end -->`. |
| Lógica sin DOM | `js/lib/evaluacion.mjs` (cálculo), `js/lib/lead-form.mjs` (validación, payload, envío), `js/lib/asistente.mjs` (guion del bot), `js/lib/turnstile.mjs` | Las usan las páginas y vitest. |
| Datos | `js/data/sectores.mjs` | Lista única de 148 sectores (contacto, flotante, evaluación). `industry` viaja como **etiqueta legible**; el código heredado de HubSpot queda en `codigo`. |
| Páginas | `index`, `servicios`, `marco-madurez`, `evaluacion`, `blog`, `blog-post`, `contacto`, `aviso-privacidad`, `recursos/checklist-cierre-fiscal`, `404` | Cada una con GA4 inline, título, descripción, `canonical` y OG propios. |
| Scripts de página | `js/{home-blog,madurez,evaluacion,blog,blog-post,contact,lead-magnet}.js` (módulos) | Rutas absolutas (`/js/...`): se sirven desde la raíz. |
| Comunes | `js/shell.js` (menú móvil, atajos, carga diferida), `js/flotantes.js` (formulario corto + asistente), `js/buscador.js` (Ctrl/Cmd+K), `js/analytics.js` (`cta_click`, `window.catTrack`) | Flotantes y buscador se importan bajo demanda; los flotantes arrancan tras la carga + reposo. |

## Flujo de trabajo

```bash
node scripts/sync-shell.mjs      # tras editar shell/*.html: lo copia a todas las páginas
node scripts/build-content.mjs   # tras editar content/*.mjs: regenera HTML y .md
cd tests && npm install && npm test
python3 -m http.server 8000      # revisión rápida (las edge functions y lead-register requieren `netlify dev`)
```

`tests/shell.test.ts` falla si algún bloque del shell se desvía; `tests/content.test.ts`, si el contenido generado no está al día; `tests/paginas.test.ts`, si un enlace interno apunta a un archivo inexistente, una página nueva no está en sitemap/`llms.txt` o `blog-post.html` deja de ser compatible con `blog-og.ts`. `tests/dom.test.ts` ejecuta los scripts reales contra el HTML real con jsdom (fetch y Turnstile simulados).

## Páginas nuevas: checklist

1. Copiar una página existente (GA4, hojas de estilo, marcadores del shell, `<main id="contenido">`).
2. `node scripts/sync-shell.mjs`; agregar la ruta a `PAGINAS_ESPERADAS` en `tests/shell.test.ts`.
3. Registrarla en `netlify/edge-lib/site.ts` (`KEY_PAGES` para `llms.txt`, `SITEMAP_PAGES`) y, si es contenido estable, ofrecer su `.md` (ver `scripts/content-lib.mjs`).
4. CTA con `data-cta` y `data-cta-location`; formularios con `catTrack.lead({ lead_source })` solo tras respuesta correcta y sin datos personales.

## Formularios y leads

Todos los formularios (Contacto, flotante, asistente, evaluación, lead magnet) comparten `js/lib/lead-form.mjs` y envían al mismo `lead-register`, con Turnstile, `Idempotency-Key` y atribución (`js/attribution.js` → `window.getFuente`). Canal por origen: `sitio-contacto`, `sitio-flotante`, `agente`, `evaluacion`, `lead-magnet` (+ `sitio-home`, histórico). **Los canales nuevos deben existir en la lista blanca del CRM antes de desplegar el sitio** (si no, el CRM responde 400 y el lead se pierde). El formulario flotante y el asistente mandan el nombre completo en `firstname` (no se separa el apellido).

## Asistente automático

Guion fijo sin IA (`js/lib/asistente.mjs`: `reducir(estado, evento)`). La interfaz solo lee `{ mensajes, paso, registro, consentimientos }` y `chips()`, así que otro motor puede reemplazar el módulo sin tocar `js/flotantes.js`. Solo guarda tras "Confirmar y guardar", con el aviso de privacidad aceptado (WhatsApp separado, opcional, sin marcar). No guarda el historial.

## Pendientes conocidos

Ver `docs/decisions.md` (sección "Abiertos"). Sin navegador disponible durante el desarrollo: la revisión visual (desktop, tablet, móvil, teclado en móvil) y Lighthouse están por hacerse sobre el preview de `sandbox`.
