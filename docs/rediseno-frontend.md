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

## Asistente automático (etapa 1, sin IA)

Motor de guion fijo en `js/lib/asistente.mjs` (`reducir(estado, evento)`). La interfaz (`js/flotantes.js`) solo lee `{ mensajes, paso, registro, consentimientos, clave }`, `chips()` y `enlaces()`, así que otro motor (la IA de la etapa 2) puede reemplazar el módulo sin tocarla.

**Flujos** (menú = paso `bienvenida`): dejar mis datos (registro → `lead-register`, canal `agente`; solo guarda tras "Confirmar y guardar" con el aviso aceptado, WhatsApp separado y opcional), agendar (abre Calendly con UTM; elegir horario dentro del chat con la API de Calendly es etapa 2), dudas, checklist y hablar con una persona (WhatsApp `wa.me/525539337086`). Agendar, checklist y persona solo ofrecen un enlace (paso `enlace`). Durante el registro el texto libre es un campo; en el menú y en `dudas` es una búsqueda.

**Dudas**: `js/lib/buscador-dudas.mjs` busca por palabras (sin acentos, raíz de 5 letras, sinónimos como nube→cloud) en servicios, metodología, niveles, marco, evaluación, checklist y aviso. Sin coincidencia lo dice y ofrece menú, formulario, calendario o WhatsApp; nunca inventa. Los textos salen de `content/*.mjs` (no duplicar).

**Historial** (para entrenar la etapa 2): `js/lib/chat-log.mjs` arma el envío y la Function `netlify/functions/chat-log.js` lo escribe en Firestore `asistente_conversaciones` (id = clave `CAT-XXXX-XXXX`, visible para el visitante). Sin dependencias: JWT de la cuenta de servicio con `node:crypto` y API REST de Firestore; el navegador no escribe en Firestore. No guarda nombre, correo, empresa ni teléfono (los mensajes del registro, marcados `privado` por el motor, van como `[dato de registro]`); correos y teléfonos del texto libre se enmascaran en el cliente y otra vez en la Function (`enmascarar` idéntica, la prueba lo verifica). El primer envío de cada conversación lleva token de Turnstile (widget propio `tsLog`, porque el del registro es de un solo uso); la respuesta trae un `sello` (HMAC de la clave) para los siguientes. Se envía al llegar a un enlace o al registro, al cerrar o reiniciar y al ocultar la página, solo si cambió. Se conserva 5 meses: política TTL de Firestore sobre `expira` (activa). Sin botón para no guardar: oposición y eliminación por correo con la clave (aviso de privacidad, secciones 2, 3, 10 y 13).

**Operación**: variables `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` en Netlify. **No** crear `FIREBASE_PROJECT_ID` (su valor está en archivos versionados y el escáner de secretos rompe el build; el id va fijo en `chat-log.js`). **No** desplegar `firestore.rules` de este repo: las reglas vivas del proyecto son las del repo `catalysis-crm` y desplegar este archivo las borraría; la colección no necesita regla (denegada por omisión al cliente).

**Medición**: `asistente_flujo`, `asistente_resultado` y `asistente_sin_respuesta` (sin texto del visitante); clics en ligas como `cta_click` con `data-cta` `chat_*`. Ver `docs/medicion-leads.md`.

## Pendientes conocidos

Ver `docs/decisions.md` (sección "Abiertos"). Sin navegador disponible durante el desarrollo: la revisión visual (desktop, tablet, móvil, teclado en móvil) y Lighthouse están por hacerse sobre el preview de `sandbox`.
