# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Project Overview

Catalysis es un sitio web de consultoría en transformación digital. Stack híbrido: HTML estático + Firebase (blog y panel admin) + Netlify Functions (formularios → HubSpot CRM) + Cloudflare Turnstile (anti-bot) + Google Analytics (GA4, medición de tráfico).

## Estructura Real

La raíz de este repositorio **es** el sitio de producción servido por Netlify (no hay subcarpeta `WebSite/` dentro del repo — todas las rutas de este documento son relativas a la raíz del repo).

```
./                                  # 🎯 raíz del repo = raíz del sitio
├── index.html                     # Homepage con formulario quick-contact
├── servicios.html                 # Catálogo de servicios
├── contacto.html                  # Formulario completo
├── blog.html                      # Listado de posts (Firestore)
├── blog-post.html                 # Vista individual ?id=POST_ID
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
│   ├── blog.js                    # Lista posts publicados
│   ├── blog-post.js               # Render post + incrementa vistas
│   └── contact.js                 # Submit → Netlify Function (HubSpot)
├── netlify/functions/
│   └── hubspot-register.js        # POST → verifica Turnstile → crea Contact + Company en HubSpot
│                                   #        + alta best-effort en Catalysis CRM (leads externos)
├── netlify.toml                   # publish=".", functions="netlify/functions"
├── firebase.json                  # Reglas de Firestore (no se usa para hosting)
├── .firebaserc                    # Proyecto Firebase target ("catalysis-blog")
├── firestore.rules
├── firestore.indexes.json
├── .env.example                   # HUBSPOT_PRIVATE_APP_TOKEN, TURNSTILE_SECRET_KEY
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
│  Form de    ──POST─▶  Netlify Function (hubspot-register)       │
│  contacto              │                                         │
│                        ├─▶ Cloudflare Turnstile (verify token)  │
│                        ├─▶ HubSpot CRM v3 (Contact + Company)   │
│                        └─▶ Catalysis CRM (POST /api/external/   │
│                             v1/leads, best-effort)               │
└─────────────────────────────────────────────────────────────────┘
```

**Decisión clave:** los contactos del formulario público **ya no se escriben directo a Firestore** desde el navegador — pasan por la Netlify Function para validar Turnstile del lado servidor y persistirlos en HubSpot. La colección `contactos` en Firestore queda como respaldo/legado del panel admin.

**Alta en Catalysis CRM:** además de HubSpot, `hubspot-register.js` da de alta el mismo lead
(empresa + contacto) en Catalysis CRM (`crm.catalysis.com.mx`, repo `catalysis-crm`), vía su
endpoint machine-to-machine `app/api/external/v1/leads` (auth por header `X-Api-Key`, scope
`leads:create` — el mismo mecanismo que usa la integración de WhatsApp Flows). Es **best-effort**:
si falla o faltan las env vars, se loguea con `console.error` pero la respuesta al navegador y el
alta en HubSpot (fuente primaria de este formulario) no se ven afectadas. Sector y nivel de madurez
no tienen campo propio en el CRM — se concatenan como texto libre en `contacto.notas`. Consentimiento
de WhatsApp y aceptación de política de privacidad sí son campos propios del `Contact`
(`aceptaWhatsapp`, `aceptaPrivacidad`) — la fecha de aceptación de privacidad la calcula el propio
CRM al recibir el lead, no viaja desde el sitio.

## Variables de Entorno

Configurar en **Netlify → Site settings → Environment variables**:

| Variable | Origen | Uso |
|---|---|---|
| `HUBSPOT_PRIVATE_APP_TOKEN` | HubSpot Private App | Auth a HubSpot CRM API v3 |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile | Verificación server-side del token |
| `CRM_LEADS_ENDPOINT` | dominio del CRM interno + `/api/external/v1/leads` (ver `.env.example`) | Destino del alta en Catalysis CRM |
| `CRM_API_KEY` | `scripts/create-api-key.mjs` en el repo `catalysis-crm` (scope `leads:create`) | Auth machine-to-machine contra Catalysis CRM |

Ver `.env.example` para los scopes requeridos en HubSpot.

## Stack Tecnológico

- **Frontend:** HTML5, CSS3 (custom properties), Vanilla JS (ES6+). Sin frameworks.
- **Backend serverless:** Netlify Functions (Node, esbuild).
- **Datos:** Firebase Firestore (blog + contactos legacy), HubSpot CRM (contactos nuevos).
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
| `contacto.html` | ✅ | ✅ | Netlify Function + Turnstile + HubSpot |
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
- `netlify/functions/hubspot-register.js` — flujo de validación + creación en HubSpot. Cambios aquí afectan la integración CRM.
- `js/contact.js` — orquesta Turnstile + submit; el orden de inicialización del widget importa.
- `firestore.rules` — un cambio incorrecto puede exponer la colección `contactos`.

## Gestión de Contenido

**Crear post de blog:** Firebase Console → Firestore → colección `blog_posts` → agregar documento con los campos listados arriba (`publicado: true` para que aparezca). El campo `contenido` acepta HTML completo.

**Ver contactos nuevos:** HubSpot CRM → Contacts (filtro por fecha de creación). Los contactos legacy en Firestore se ven desde `admin-contactos.html`.

## Convenciones de Código

- Vanilla JS, sin transpilación. ES6+ asumido (navegadores modernos).
- CSS Custom Properties: `--primary`, `--secondary`, `--text`, `--light-bg`, `--border` (definidas en `style.css`).
- Mobile-first; probar en móvil/tablet/desktop antes de mergear.
- Si una página nueva usa Firebase, importar SDKs **antes** de los scripts propios.
- Si una página nueva tiene formulario que toca CRM, reutilizar `contact.js` y la Netlify Function existente — no crear endpoints nuevos por defecto.

## Troubleshooting

- **Posts no cargan:** consola del navegador → revisar credenciales de `firebase-config.js`, reglas de Firestore, y `publicado: true`.
- **Formulario falla:** revisar Network tab → status del POST a `/.netlify/functions/hubspot-register`. 403 = Turnstile rechazó. 500 = falta env var en Netlify.
- **CORS en local:** no abrir HTML con `file://`; usar `netlify dev` o servidor HTTP.
- **2FA admin no funciona:** abrir `verificar-configuracion.html` para diagnóstico paso a paso.

## Referencias

- Setup detallado de Firebase: `README.md`
- Variables de entorno y scopes de HubSpot: `.env.example`
- Reglas de seguridad: `firestore.rules`
- Documentos históricos (privacidad, framework): fuera de este repo, en `../archive/` (carpeta hermana de `WebSite/`, no versionada aquí)

---
**Versión:** 3.2 (Corrección de estructura: la raíz del repo es el sitio, sin subcarpeta `WebSite/`)
**Última actualización:** 2026-08-06
