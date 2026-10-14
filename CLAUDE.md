# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Project Overview

Catalysis es un sitio web de consultoría en transformación digital. Stack híbrido: HTML estático + Firebase (blog y panel admin) + Netlify Functions (formularios → Catalysis CRM) + Cloudflare Turnstile (anti-bot) + Google Analytics (GA4, medición de tráfico).

## Estructura Real

La raíz de este repositorio **es** el sitio de producción servido por Netlify (no hay subcarpeta `WebSite/` dentro del repo — todas las rutas de este documento son relativas a la raíz del repo).

```
./                                  # 🎯 raíz del repo = raíz del sitio
├── index.html                     # Homepage con formulario quick-contact
├── servicios.html                 # Catálogo de servicios
├── contacto.html                  # Formulario completo
├── blog.html                      # Listado de posts (Firestore)
├── blog-post.html                 # Vista individual ?id=<slug> (o ID de Firestore, legado)
├── aviso-privacidad.html          # Aviso legal
├── admin-login.html               # Login admin (Firebase Auth)
├── admin-setup-2fa.html           # Configuración 2FA
├── admin-contactos.html           # Panel: ver contactos en Firestore
├── verificar-configuracion.html   # Diagnóstico Firebase Auth/2FA
├── eventsync-sv-onepager.html     # One-pager de propuesta (estática)
├── clients/                       # Cotizaciones/propuestas para clientes puntuales (noindex, sin GA4)
│   ├── ctl-2025-041.html
│   └── canal_agente_comparativo_v2.html
├── css/style.css
├── js/
│   ├── main.js                    # Navbar, smooth scroll, año footer
│   ├── firebase-config.js         # Init Firebase (window.firestoreDb)
│   ├── blog-utils.js              # slugify()/getPostSlug() — slug de la URL a partir del título
│   ├── blog.js                    # Lista posts publicados (tarjetas enlazan por slug)
│   ├── blog-post.js               # Resuelve post (ID legado → slug → título), render + vistas
│   ├── attribution.js             # UTM/referrer/artículo de origen en localStorage → window.getFuente(canal)
│   └── contact.js                 # Submit → Netlify Function (lead-register)
├── netlify/functions/
│   └── lead-register.js           # POST → verifica Turnstile → alta (empresa + contacto + fuente) en Catalysis CRM
├── netlify/edge-functions/
│   └── blog-og.ts                 # Inyecta Open Graph tags en blog-post.html SOLO para crawlers (UA);
│                                   #  humanos reciben el HTML sin modificar. Ver reqs/og-tags-blog-post.md
├── netlify.toml                   # publish=".", functions="netlify/functions"
├── firebase.json                  # Reglas de Firestore (no se usa para hosting)
├── .firebaserc                    # Proyecto Firebase target ("catalysis-blog")
├── firestore.rules
├── firestore.indexes.json
├── .env.example                   # TURNSTILE_SECRET_KEY, CRM_LEADS_ENDPOINT, CRM_API_KEY
├── README.md                      # Setup detallado de Firebase
└── CLAUDE.md
```

## Arquitectura Híbrida

```
┌─ Frontend estático (HTML/CSS/Vanilla JS, hosteado en Netlify) ─┐
│                                                                 │
│  Blog       ──lee──▶  Firestore (blog_posts, lectura pública)   │
│  Admin      ──auth─▶  Firebase Auth + 2FA                       │
│  Admin      ──lee──▶  Firestore (contactos, requiere auth)      │
│                                                                 │
│  Form de    ──POST─▶  Netlify Function (lead-register)         │
│  contacto              │                                         │
│                        ├─▶ Cloudflare Turnstile (verify token)  │
│                        └─▶ Catalysis CRM (POST /api/external/   │
│                             v1/leads, destino principal)         │
└─────────────────────────────────────────────────────────────────┘
```

**Decisión clave:** los contactos del formulario público **no se escriben directo a Firestore** desde el navegador — pasan por la Netlify Function, que valida Turnstile del lado servidor y los da de alta en **Catalysis CRM**, el único destino (no hay otro CRM en la infraestructura). La colección `contactos` en Firestore queda como respaldo/legado del panel admin.

**Alta en Catalysis CRM:** `lead-register.js` crea empresa + contacto en `crm.catalysis.com.mx`
(repo `catalysis-crm`) vía su endpoint machine-to-machine `app/api/external/v1/leads` (auth por header
`X-Api-Key`, scope `leads:create`). Es el destino principal: si el CRM falla tras los reintentos
(2, a 500 ms y 1.5 s, ante `429`/`5xx`/red, con la misma `Idempotency-Key`) la función responde `502` y el
visitante ve un error — nunca un éxito falso. `4xx` no se reintenta; `401/403` se loguea como alerta.
Un `200` con `duplicated: true` (correo ya existente) es éxito para el visitante. La `Idempotency-Key`
la genera el navegador por envío (`contact.js`). Sector y nivel de madurez van como texto libre en
`contacto.notas`; consentimiento de WhatsApp y privacidad son campos propios (`aceptaWhatsapp`,
`aceptaPrivacidad`).

**Atribución (`fuente`):** `js/attribution.js` guarda `{first, last, blog_slug}` en `localStorage` y
`window.getFuente(canal)` arma `contacto.fuente`; la función filtra con lista blanca (el CRM responde
`400` ante cualquier clave desconocida). Contrato completo: `reqs/crm-fuente-contrato.md`. **Orden de
despliegue: primero el CRM, después el sitio.**

## Variables de Entorno

Configurar en **Netlify → Site settings → Environment variables**:

| Variable | Origen | Uso |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile | Verificación server-side del token |
| `CRM_LEADS_ENDPOINT` | dominio del CRM interno + `/api/external/v1/leads` (ver `.env.example`) | Destino del alta en Catalysis CRM |
| `CRM_API_KEY` | `scripts/create-api-key.mjs` en el repo `catalysis-crm` (scope `leads:create`) | Auth machine-to-machine contra Catalysis CRM |


## Stack Tecnológico

- **Frontend:** HTML5, CSS3 (custom properties), Vanilla JS (ES6+). Sin frameworks.
- **Backend serverless:** Netlify Functions (Node, esbuild).
- **Datos:** Firebase Firestore (blog + contactos legacy), Catalysis CRM (contactos nuevos).
- **Auth:** Firebase Authentication con 2FA para panel admin.
- **Anti-bot:** Cloudflare Turnstile (cliente + verificación server-side).
- **Analítica:** Google Analytics 4 (`gtag.js`), ID de medición `G-19DQMK1HYD`. Snippet inline en el `<head>` de cada página pública (no hay archivo compartido — al agregar una página pública nueva, copiar el snippet de `index.html`).
- **Hosting:** Netlify (`netlify.toml` con `publish = "."`).

## Colecciones Firestore

**`blog_posts`** — lectura pública, escritura solo autenticada
```
titulo, slug, resumen, contenido (HTML), autor, imagen_portada,
categoria, tags[], publicado (bool), fecha_publicacion, fecha_creacion,
vistas (auto-increment)
```

**Slug / URLs del blog:** la URL pública es `blog-post.html?id=<slug>` (ej.
`como_automatizar_procesos_con_business_intelligence_crm`: minúsculas, sin
acentos, todo lo no alfanumérico → `_`; el `+` se descarta porque en un query
string se leería como espacio). `blog-post.js` resuelve en este orden: ID de
documento (enlaces legados) → campo `slug` → slug derivado del `titulo` (solo
dentro de los 50 posts más recientes). `slugify()` vive en `js/blog-utils.js` y
**debe mantenerse idéntica** a `slugifyTitle()` de `lib/blogSlug.ts` en
`catalysis-crm` y a `slugify()` de `netlify/edge-functions/blog-og.ts`. El campo
`slug` lo guardan `crear_post_blog`/`actualizar_post_blog` (MCP del CRM) y no
cambia al editar el título; los posts cargados a mano en la consola de Firebase
no lo tienen hasta que se editan una vez con `actualizar_post_blog`.

**Open Graph para redes sociales:** los crawlers no ejecutan JS, así que
`netlify/edge-functions/blog-og.ts` intercepta `/blog-post.html` y, solo si el
User-Agent es de un crawler, inyecta `og:*`, `twitter:card` y `canonical` en el
`<head>` (post resuelto vía API REST pública de Firestore; fallback de imagen:
`images/catalysis_logo.png`). Humanos reciben el HTML sin cambios y cualquier
fallo sirve el HTML original. Probar con
`curl -A "facebookexternalhit/1.1" "https://catalysis.com.mx/blog-post.html?id=<slug>"`.
Spec: `reqs/og-tags-blog-post.md`. Si Facebook ya cacheó un link, usar "Scrape
Again" en el Sharing Debugger.

**`contactos`** — solo lectura/edición autenticada; `create` público (legacy)
```
nombre, email, empresa, telefono, mensaje, fecha_creacion, atendido (bool)
```

Reglas completas en `firestore.rules`.

## Desarrollo Local

```bash
# Opción recomendada (Netlify CLI ejecuta funciones localmente)
npm install -g netlify-cli
netlify dev          # http://localhost:8888

# Alternativa solo-frontend (sin Netlify Functions)
python3 -m http.server 8000
```

Para que el formulario de contacto funcione localmente: usar `netlify dev` y cargar las variables en `.env` (no commitear).

## Deployment

**Netlify** (sitio `catalysis-site` → `catalysis.com.mx`) es el destino de producción.

**La rama de deploy es `production`, NO `main`.** `git push origin main` sube a
GitHub pero no dispara ningún build — hay que además llevar `production` al
día (`git push origin main:production` si `production` está estrictamente
detrás, o mergear si no). Se confirmó esto el 2026-08-18: hubo 4 commits en
`main` (incl. la integración con Catalysis CRM) sin desplegar durante días
porque el push solo llegó a `main`. Verificar con `netlify api
listSiteDeploys --data '{"site_id":"<id>"}'` cuál fue el último commit
realmente publicado, no asumir por el estado de `main`.

```bash
netlify deploy --prod
```

O por integración Git (push a `production`). Configuración mínima ya está en `netlify.toml`. **No** usar `firebase deploy` para hosting — el `firebase.json` está solo para desplegar reglas de Firestore.

**Secret scanner de Netlify:** si un archivo del repo (docs, `.env.example`,
etc.) contiene el **valor literal** de una env var configurada en el sitio —
aunque esa variable no sea sensible, como una URL pública — el build falla
con `Build script returned non-zero exit code: 2` (ver
`deploy_validations_report.secret_scan_result` en el deploy vía la API de
Netlify). Pasó con `CRM_LEADS_ENDPOINT`. Evitar escribir el valor exacto de
cualquier env var del sitio en archivos versionados; usar placeholders o
describirlo sin el string completo.

## Páginas

| Página | Pública | GA4 | Depende de |
|---|---|---|---|
| `index.html`, `servicios.html`, `aviso-privacidad.html` | ✅ | ✅ | — |
| `contacto.html` | ✅ | ✅ | Netlify Function + Turnstile + Catalysis CRM |
| `blog.html`, `blog-post.html` | ✅ | ✅ | Firestore (lectura) |
| `eventsync-sv-onepager.html` | ✅ | ✅ | — (one-pager estático de propuesta) |
| `admin-login.html`, `admin-setup-2fa.html` | 🔒 | — | Firebase Auth + 2FA |
| `admin-contactos.html` | 🔒 | — | Firebase Auth + Firestore `contactos` |
| `verificar-configuracion.html` | 🔧 | — | Diagnóstico — útil al onboarding |
| `clients/*.html` (cotizaciones/propuestas por cliente) | 🔗 | — | Nada — estáticas, `noindex,nofollow` |

Las páginas admin/diagnóstico quedan fuera de Google Analytics a propósito, para no mezclar el uso interno del equipo con las métricas de tráfico de visitantes. Las páginas de `clients/` tampoco llevan GA4 a propósito (decisión 2026-08-06): son propuestas para un cliente puntual, no tráfico del sitio que se quiera medir — a diferencia de `eventsync-sv-onepager.html`, que sí es pública/indexable.

## Servicios y Metodología (contenido)

**9 servicios:** Evaluación y Estrategia Digital · Optimización de Procesos · Cloud · Data & Analytics · Experiencia del Cliente Digital · IA Generativa · Agentes de IA Autónomos · Analítica Predictiva · Computer Vision & NLP.

**Metodología (5 pasos):** Diagnóstico → Estrategia → Quick Wins → Transformación → Evolución.

## Archivos sensibles — leer antes de modificar

- `js/firebase-config.js` — credenciales públicas de Firebase (no son secretas, pero reemplazarlas rompe todo).
- `netlify/functions/lead-register.js` — validación + alta en Catalysis CRM (reintentos, idempotencia, lista blanca de `fuente`).
- `js/attribution.js` — captura de UTM/artículo; debe cargarse antes de `contact.js`.
- `js/contact.js` — orquesta Turnstile + submit; el orden de inicialización del widget importa.
- `firestore.rules` — un cambio incorrecto puede exponer la colección `contactos`.

## Gestión de Contenido

**Crear post de blog:** preferir el tool MCP `crear_post_blog` del CRM (sanitiza el HTML y guarda `slug` único automáticamente). Alternativa manual: Firebase Console → Firestore → colección `blog_posts` → agregar documento con los campos listados arriba (`publicado: true` para que aparezca; el campo `contenido` acepta HTML completo). Un post manual no tiene `slug` hasta editarlo una vez con `actualizar_post_blog`.

**Ver contactos nuevos:** Catalysis CRM (`crm.catalysis.com.mx`). Los contactos legacy en Firestore se ven desde `admin-contactos.html`.

## Convenciones de Código

- Vanilla JS, sin transpilación. ES6+ asumido (navegadores modernos).
- CSS Custom Properties: `--primary`, `--secondary`, `--text`, `--light-bg`, `--border` (definidas en `style.css`).
- Mobile-first; probar en móvil/tablet/desktop antes de mergear.
- Si una página nueva usa Firebase, importar SDKs **antes** de los scripts propios.
- Si una página nueva tiene formulario que toca CRM, reutilizar `contact.js` y la Netlify Function existente — no crear endpoints nuevos por defecto.

## Troubleshooting

- **Posts no cargan:** consola del navegador → revisar credenciales de `firebase-config.js`, reglas de Firestore, y `publicado: true`.
- **Formulario falla:** revisar Network tab → status del POST a `/.netlify/functions/lead-register`. 403 = Turnstile rechazó. 500 = falta env var en Netlify. 502 = el CRM no aceptó el lead (ver logs `[crm-lead]` en Netlify).
- **CORS en local:** no abrir HTML con `file://`; usar `netlify dev` o servidor HTTP.
- **2FA admin no funciona:** abrir `verificar-configuracion.html` para diagnóstico paso a paso.

## Referencias

- Setup detallado de Firebase: `README.md`
- Variables de entorno: `.env.example`
- Reglas de seguridad: `firestore.rules`
- Documentos históricos (privacidad, framework): fuera de este repo, en `../archive/` (carpeta hermana de `WebSite/`, no versionada aquí)

---
**Versión:** 3.3 (HubSpot eliminado; Catalysis CRM como único destino de leads; atribución `fuente`)
**Última actualización:** 2026-10-13
