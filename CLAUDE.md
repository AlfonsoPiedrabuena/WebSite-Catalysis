# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Project Overview

Catalysis es un sitio web de consultoría en transformación digital. Stack híbrido: HTML estático + Firebase (blog y panel admin) + Netlify Functions (formularios → Catalysis CRM) + Cloudflare Turnstile (anti-bot) + Google Analytics (GA4, medición de tráfico).

## Estructura Real

La raíz de este repositorio **es** el sitio de producción servido por Netlify (no hay subcarpeta `WebSite/` dentro del repo — todas las rutas de este documento son relativas a la raíz del repo).

```
./                                  # 🎯 raíz del repo = raíz del sitio
├── index.html, servicios.html, marco-madurez.html, evaluacion.html,
│   blog.html, blog-post.html (?id=<slug>), contacto.html, aviso-privacidad.html, 404.html
├── recursos/checklist-cierre-fiscal.html   # lead magnet (landing + PDF en downloads/)
├── admin-*.html, verificar-configuracion.html   # panel admin / diagnóstico (Firebase Auth + 2FA)
├── eventsync-sv-onepager.html     # One-pager de propuesta (estática, usa css/style.css)
├── clients/                       # Cotizaciones por cliente (noindex, sin GA4, usan css/style.css)
├── css/tokens.css, css/site.css   # Diseño actual (tokens + shell + componentes)
├── css/style.css                  # Solo admin, clients/ y eventsync: NO tocar
├── fonts/                         # Sora, Inter e IBM Plex Mono (WOFF2)
├── shell/top.html, bottom.html    # Sidebar, barra móvil y pie: fuente única (se copian a cada página)
├── content/*.mjs                  # Servicios, metodología, marco de madurez, evaluación, recursos
├── js/
│   ├── shell.js, flotantes.js, buscador.js, analytics.js   # comunes
│   ├── home-blog.js, madurez.js, evaluacion.js, blog.js, blog-post.js, contact.js, lead-magnet.js   # por página
│   ├── lib/                       # lógica sin DOM (lead-form, evaluacion, asistente, turnstile, blog-data)
│   ├── data/sectores.mjs          # lista única de sectores
│   ├── attribution.js             # UTM/referrer/artículo de origen → window.getFuente(canal)
│   ├── blog-utils.js              # slugify()/getPostSlug()
│   └── firebase-config.js         # Init Firebase (window.firestoreDb)
├── scripts/                       # sync-shell.mjs, build-content.mjs (herramientas de desarrollo)
├── netlify/functions/lead-register.js   # POST → Turnstile → alta (empresa + contacto + fuente) en Catalysis CRM
├── netlify/functions/chat-log.js        # POST → historial del asistente → Firestore `asistente_conversaciones` (sin dependencias)
├── netlify/edge-functions/        # blog-og, blog-md, llms-txt, sitemap, blog-feed
├── netlify/edge-lib/              # Lógica compartida de las edge functions (vitest en tests/)
├── tests/                         # vitest: `cd tests && npm install && npm test`
├── design/                        # Prototipo aprobado (solo lectura; responde 404 en producción)
├── docs/, reqs/                   # Referencia técnica / specs pendientes
├── robots.txt                     # Política de bots (única fuente)
├── netlify.toml                   # publish=".", ignore de docs, headers y redirects
├── firebase.json, .firebaserc, firestore.rules, firestore.indexes.json   # solo reglas de Firestore
├── .claude/agents/                # docs-maintainer, test-runner
└── .env.example, README.md, CLAUDE.md
```

## Arquitectura Híbrida

Frontend estático en Netlify. **Blog** ← Firestore `blog_posts` (lectura pública). **Admin** → Firebase Auth + 2FA → Firestore `contactos`. **Formularios** (Contacto, flotante, asistente, evaluación, lead magnet) → Netlify Function `lead-register` → verifica Turnstile → alta en **Catalysis CRM** (`POST /api/external/v1/leads`).

**Decisión clave:** los contactos **no se escriben directo a Firestore** desde el navegador: la Function valida Turnstile del lado servidor y los da de alta en Catalysis CRM, el único destino. `contactos` en Firestore queda como respaldo/legado del panel admin.

**Alta en Catalysis CRM:** si el CRM falla tras 2 reintentos responde `502` (nunca un éxito falso); `200` con `duplicated: true` cuenta como éxito. `js/attribution.js` arma `contacto.fuente` con lista blanca (el CRM responde `400` ante claves desconocidas). **Orden de despliegue: primero el CRM, después el sitio.** Detalle: `docs/crm-leads.md` y `docs/crm-fuente-contrato.md`.

## Variables de Entorno

Configurar en **Netlify → Site settings → Environment variables**:

| Variable | Origen | Uso |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile | Verificación server-side del token |
| `CRM_LEADS_ENDPOINT` | dominio del CRM interno + `/api/external/v1/leads` (ver `.env.example`) | Destino del alta en Catalysis CRM |
| `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Cuenta de servicio de Firebase (`.env.example`) | Function `chat-log`: historial del asistente en Firestore |
| `CRM_API_KEY` | `scripts/create-api-key.mjs` en el repo `catalysis-crm` (scope `leads:create`) | Auth machine-to-machine contra Catalysis CRM |


## Stack Tecnológico

HTML5 + CSS3 (custom properties) + JS vanilla (sin frameworks) · Netlify (hosting, Functions con esbuild, Edge Functions) · Firebase Firestore y Auth con 2FA · Cloudflare Turnstile · Google Analytics 4 (`G-19DQMK1HYD`, snippet inline en el `<head>` de cada página pública: copiarlo de `index.html` al crear una página).

## Colecciones Firestore

**`blog_posts`** — lectura pública, escritura solo autenticada
```
titulo, slug, resumen, contenido (HTML), autor, imagen_portada,
categoria, tags[], publicado (bool), fecha_publicacion, fecha_creacion,
vistas (auto-increment)
```

**Slug / URLs del blog:** la URL pública es `blog-post.html?id=<slug>`. `slugify()` de `js/blog-utils.js`
**debe mantenerse idéntica** a `slugifyTitle()` de `lib/blogSlug.ts` en `catalysis-crm` y a `slugify()` de
`netlify/edge-functions/blog-og.ts`. Los posts manuales no tienen campo `slug` hasta editarlos una vez con
`actualizar_post_blog`. Orden de resolución, Open Graph (`blog-og.ts`) y cómo probarlo: `docs/blog-slugs-og.md`.

**Versión markdown para agentes:** `/blog/<slug>.md` y `Accept: text/markdown` sobre la URL
actual devuelven el post en markdown (HTML→MD al vuelo desde Firestore, caché CDN 5 min; un post
nuevo aparece solo en `.md`, `/llms.txt`, sitemap y RSS sin deploy). Las URLs canónicas siguen
siendo `blog-post.html?id=<slug>`. **Al agregar un tipo de contenido nuevo, exponer su versión
markdown y registrarlo en `llms.txt`.** Detalle y política de bots: `docs/agent-friendly.md`.
Pruebas: `cd tests && npm install && npm test`.

**`asistente_conversaciones`** — solo la escribe la Function `chat-log` con cuenta de servicio (no pasa por reglas); sin regla propia, el cliente la tiene denegada por omisión. Id = clave de conversación (`CAT-XXXX-XXXX`). Sin nombre, correo ni teléfono. Se borra a los 5 meses con la política TTL de Firestore sobre `expira` (**activarla en la consola**). Spec: `reqs/asistente-conversacional.md`.

**`contactos`** — solo lectura/edición autenticada; `create` público (legacy)
```
nombre, email, empresa, telefono, mensaje, fecha_creacion, atendido (bool)
```

Reglas completas en `firestore.rules`.

## Desarrollo Local

```bash
# Funciones y edge functions locales
npm install -g netlify-cli
netlify dev          # http://localhost:8888 (cargar variables en `.env`, no commitear)

# Solo frontend (sin Netlify Functions ni edge functions)
python3 -m http.server 8000

node scripts/sync-shell.mjs      # tras editar shell/*.html
node scripts/build-content.mjs   # tras editar content/*.mjs
cd tests && npm test             # shell, contenido, enlaces, lógica y scripts con jsdom
```

Arquitectura del frontend, checklist de páginas nuevas y flujo de leads: `docs/rediseno-frontend.md`.

## Deployment

**Netlify** (sitio `catalysis-site` → `catalysis.com.mx`) despliega desde la rama **`production`, NO `main`** (`git push origin main` no dispara build). Verificar el último deploy realmente publicado, no asumirlo. `netlify.toml` omite el build si solo cambió documentación, specs, diseño, pruebas o herramientas. **No** usar `firebase deploy` para hosting (solo reglas de Firestore). El secret scanner rompe el build si un archivo versionado contiene el valor literal de una env var del sitio. Detalle y comandos: `docs/deploy.md`.

## Páginas

| Página | Pública | GA4 | Depende de |
|---|---|---|---|
| `index`, `servicios`, `marco-madurez`, `aviso-privacidad`, `404` | ✅ | ✅ | — (la home lee el blog de Firestore) |
| `evaluacion.html`, `contacto.html`, `recursos/checklist-cierre-fiscal.html` | ✅ | ✅ | Netlify Function + Turnstile + Catalysis CRM |
| `blog.html`, `blog-post.html` | ✅ | ✅ | Firestore (lectura) |
| `eventsync-sv-onepager.html` | ✅ | ✅ | — (one-pager estático de propuesta) |
| `admin-login.html`, `admin-setup-2fa.html` | 🔒 | — | Firebase Auth + 2FA |
| `admin-contactos.html` | 🔒 | — | Firebase Auth + Firestore `contactos` |
| `verificar-configuracion.html` | 🔧 | — | Diagnóstico — útil al onboarding |
| `clients/*.html` (cotizaciones/propuestas por cliente) | 🔗 | — | Nada — estáticas, `noindex,nofollow` |

Las páginas admin/diagnóstico quedan fuera de Google Analytics a propósito, para no mezclar el uso interno del equipo con las métricas de tráfico de visitantes. Las páginas de `clients/` tampoco llevan GA4 a propósito (decisión 2026-08-06): son propuestas para un cliente puntual. Eventos y UTM: `docs/medicion-leads.md`.

## Servicios y Metodología (contenido)

Se editan en `content/servicios.mjs` y `content/niveles.mjs` y se regeneran con `node scripts/build-content.mjs` (HTML + `servicios.md` / `marco-madurez.md`). **9 servicios**, **metodología de 5 pasos** (Diagnóstico → Estrategia → Quick Wins → Transformación → Evolución) y **marco de madurez de 5 niveles**.

## Archivos sensibles — leer antes de modificar

- `js/firebase-config.js` — credenciales públicas de Firebase (no son secretas, pero reemplazarlas rompe todo).
- `netlify/functions/lead-register.js` — validación + alta en Catalysis CRM (reintentos, idempotencia, lista blanca de `fuente` y de canales).
- `js/attribution.js` — captura de UTM/artículo; se carga antes de los scripts de página (lo hace `shell/bottom.html`).
- `js/lib/lead-form.mjs` y `js/lib/turnstile.mjs` — validación/envío compartidos por todos los formularios.
- `blog-post.html` — `blog-og.ts` busca `<title id="post-title">` y `<div id="post-body" …>` (el `id` va primero); `tests/paginas.test.ts` lo verifica.
- `shell/*.html` — no editar el bloque dentro de una página: editar aquí y correr `sync-shell`.
- `firestore.rules` — un cambio incorrecto puede exponer la colección `contactos`.

## Gestión de Contenido

**Crear post de blog:** preferir el tool MCP `crear_post_blog` del CRM (sanitiza el HTML y guarda `slug` único automáticamente). Alternativa manual: Firebase Console → Firestore → colección `blog_posts` → agregar documento con los campos listados arriba (`publicado: true` para que aparezca; el campo `contenido` acepta HTML completo). Un post manual no tiene `slug` hasta editarlo una vez con `actualizar_post_blog`.

**Ver contactos nuevos:** Catalysis CRM (`crm.catalysis.com.mx`). Los contactos legacy en Firestore se ven desde `admin-contactos.html`.

## Convenciones de Código

- Vanilla JS, sin transpilación. ES6+ asumido (navegadores modernos). Módulos ES con rutas absolutas (`/js/...`).
- Estilos: variables de `css/tokens.css`; no valores sueltos. `css/style.css` solo lo usan admin, clients y eventsync.
- Mobile-first; puntos de quiebre 900 y 640 px. Accesibilidad AA: foco visible, `button` reales, `prefers-reduced-motion`.
- Páginas nuevas: ver el checklist de `docs/rediseno-frontend.md` (shell, GA4 inline, sitemap/`llms.txt`, `data-cta`).
- Formularios que tocan el CRM: reutilizar `js/lib/lead-form.mjs` y `lead-register`; no crear endpoints nuevos. **Canal nuevo = primero al CRM, después al sitio.**
- Si una página usa Firebase, cargar los SDKs **antes** de los scripts propios (o usar `obtenerDb()` de `js/lib/blog-data.mjs`).
- No escribir el valor literal de variables de entorno en archivos versionados (secret scanner de Netlify).

## Troubleshooting

- **Posts no cargan:** consola del navegador → revisar credenciales de `firebase-config.js`, reglas de Firestore, y `publicado: true`.
- **Formulario falla:** revisar Network tab → status del POST a `/.netlify/functions/lead-register`. 403 = Turnstile rechazó. 500 = falta env var en Netlify. 502 = el CRM no aceptó el lead (ver logs `[crm-lead]` en Netlify).
- **CORS en local:** no abrir HTML con `file://`; usar `netlify dev` o servidor HTTP.
- **2FA admin no funciona:** abrir `verificar-configuracion.html` para diagnóstico paso a paso.

## Organización de documentación

- `reqs/` = specs pendientes. Al implementar una: lo permanente (decisiones, contratos) pasa a `docs/` o a la sección correspondiente de este archivo, y la spec **se borra** (git conserva el historial).
- `docs/` = referencia técnica consultable, no cargada por defecto. CLAUDE.md solo la enlaza. Decisiones: `docs/decisions.md`.
- Este archivo: resumen + punteros, no detalle.
- Subagentes (`.claude/agents/`, Haiku 4.5): `docs-maintainer` (tras cada merge) y `test-runner` (en cada push a `sandbox`).

## Ramas

Trabajo en ramas por bloque desde `sandbox` → PR → `main` → `production` (Netlify despliega desde `production`). Sin commits directos a `main` ni a `production`. Agrupar cambios en un solo merge a `production` (créditos de build limitados).

## Referencias

- Setup detallado de Firebase: `README.md`; variables de entorno: `.env.example`; reglas: `firestore.rules`.
- Contexto bajo demanda (leer solo si la tarea lo toca): `docs/rediseno-frontend.md` (shell, contenido, pruebas, flotantes), `docs/medicion-leads.md` (GA4/UTM), `docs/decisions.md` (decisiones y pendientes), `docs/agent-friendly.md` (blog `.md`, llms.txt, caché, bots), `docs/blog-slugs-og.md` (slugs y Open Graph), `docs/crm-leads.md` y `docs/crm-fuente-contrato.md` (alta en CRM, `fuente`/dedupe).
- Trabajo pendiente: `reqs/` — `rediseno-sitio-catalysis.md` (spec del rediseño), `medicion-leads-ga4-utm.md` y `lead-magnet-checklist-cierre-fiscal.md` (implementados en código, pendientes de verificar en preview). El contador público de vistas del blog se eliminó (2026-10-27): el tráfico por artículo se mide en GA4.
- Documentos históricos (privacidad, framework): fuera de este repo, en `../archive/`.

---
**Versión:** 4.0 (rediseño: shell, tokens, contenido único, flotantes y asistente)
**Última actualización:** 2026-10-26
