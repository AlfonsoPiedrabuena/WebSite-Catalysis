# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Project Overview

Catalysis es un sitio web de consultoría en transformación digital. Stack híbrido: HTML estático + Firebase (blog y panel admin) + Netlify Functions (formularios → HubSpot CRM) + Cloudflare Turnstile (anti-bot).

## Estructura Real

```
/
├── WebSite/                       # 🎯 Sitio de producción (servido por Netlify)
│   ├── index.html                 # Homepage con formulario quick-contact
│   ├── servicios.html             # Catálogo de servicios
│   ├── contacto.html              # Formulario completo
│   ├── blog.html                  # Listado de posts (Firestore)
│   ├── blog-post.html             # Vista individual ?id=POST_ID
│   ├── aviso-privacidad.html      # Aviso legal
│   ├── admin-login.html           # Login admin (Firebase Auth)
│   ├── admin-setup-2fa.html       # Configuración 2FA
│   ├── admin-contactos.html       # Panel: ver contactos en Firestore
│   ├── verificar-configuracion.html  # Diagnóstico Firebase Auth/2FA
│   ├── eventsync-sv-onepager.html    # One-pager de propuesta (estática)
│   ├── css/style.css
│   ├── js/
│   │   ├── main.js                # Navbar, smooth scroll, año footer
│   │   ├── firebase-config.js     # Init Firebase (window.firestoreDb)
│   │   ├── blog.js                # Lista posts publicados
│   │   ├── blog-post.js           # Render post + incrementa vistas
│   │   └── contact.js             # Submit → Netlify Function (HubSpot)
│   ├── netlify/functions/
│   │   └── hubspot-register.js    # POST → verifica Turnstile → crea Contact + Company en HubSpot
│   ├── netlify.toml               # publish=".", functions="netlify/functions"
│   ├── firebase.json              # Hosting opcional + reglas Firestore
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   ├── .env.example               # HUBSPOT_PRIVATE_APP_TOKEN, TURNSTILE_SECRET_KEY
│   └── README.md                  # Setup detallado de Firebase
├── archive/                       # Docs históricos de referencia
│   ├── aviso-privacidad-instruction.md
│   └── digital-transformation-framework.md
├── reqs/                          # Placeholder (vacío)
├── POSTS_PARA_FIREBASE.txt        # Posts pre-redactados para cargar en Firestore
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
│                        └─▶ HubSpot CRM v3 (Contact + Company)   │
└─────────────────────────────────────────────────────────────────┘
```

**Decisión clave:** los contactos del formulario público **ya no se escriben directo a Firestore** desde el navegador — pasan por la Netlify Function para validar Turnstile del lado servidor y persistirlos en HubSpot. La colección `contactos` en Firestore queda como respaldo/legado del panel admin.

## Variables de Entorno

Configurar en **Netlify → Site settings → Environment variables**:

| Variable | Origen | Uso |
|---|---|---|
| `HUBSPOT_PRIVATE_APP_TOKEN` | HubSpot Private App | Auth a HubSpot CRM API v3 |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile | Verificación server-side del token |

Ver `WebSite/.env.example` para los scopes requeridos en HubSpot.

## Stack Tecnológico

- **Frontend:** HTML5, CSS3 (custom properties), Vanilla JS (ES6+). Sin frameworks.
- **Backend serverless:** Netlify Functions (Node, esbuild).
- **Datos:** Firebase Firestore (blog + contactos legacy), HubSpot CRM (contactos nuevos).
- **Auth:** Firebase Authentication con 2FA para panel admin.
- **Anti-bot:** Cloudflare Turnstile (cliente + verificación server-side).
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

Reglas completas en `WebSite/firestore.rules`.

## Desarrollo Local

```bash
# Opción recomendada (Netlify CLI ejecuta funciones localmente)
cd WebSite
npm install -g netlify-cli
netlify dev          # http://localhost:8888

# Alternativa solo-frontend (sin Netlify Functions)
cd WebSite
python3 -m http.server 8000
```

Para que el formulario de contacto funcione localmente: usar `netlify dev` y cargar las variables en `.env` (no commitear).

## Deployment

**Netlify** es el destino de producción.

```bash
cd WebSite
netlify deploy --prod
```

O por integración Git (push a la rama configurada en Netlify). Configuración mínima ya está en `netlify.toml`. **No** usar `firebase deploy` para hosting — el `firebase.json` está solo para desplegar reglas de Firestore.

## Páginas

| Página | Pública | Depende de |
|---|---|---|
| `index.html`, `servicios.html`, `aviso-privacidad.html` | ✅ | — |
| `contacto.html` | ✅ | Netlify Function + Turnstile + HubSpot |
| `blog.html`, `blog-post.html` | ✅ | Firestore (lectura) |
| `admin-login.html`, `admin-setup-2fa.html` | 🔒 | Firebase Auth + 2FA |
| `admin-contactos.html` | 🔒 | Firebase Auth + Firestore `contactos` |
| `verificar-configuracion.html` | 🔧 | Diagnóstico — útil al onboarding |

## Servicios y Metodología (contenido)

**9 servicios:** Evaluación y Estrategia Digital · Optimización de Procesos · Cloud · Data & Analytics · Experiencia del Cliente Digital · IA Generativa · Agentes de IA Autónomos · Analítica Predictiva · Computer Vision & NLP.

**Metodología (5 pasos):** Diagnóstico → Estrategia → Quick Wins → Transformación → Evolución.

## Archivos sensibles — leer antes de modificar

- `WebSite/js/firebase-config.js` — credenciales públicas de Firebase (no son secretas, pero reemplazarlas rompe todo).
- `WebSite/netlify/functions/hubspot-register.js` — flujo de validación + creación en HubSpot. Cambios aquí afectan la integración CRM.
- `WebSite/js/contact.js` — orquesta Turnstile + submit; el orden de inicialización del widget importa.
- `WebSite/firestore.rules` — un cambio incorrecto puede exponer la colección `contactos`.

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

- Setup detallado de Firebase: `WebSite/README.md`
- Variables de entorno y scopes de HubSpot: `WebSite/.env.example`
- Reglas de seguridad: `WebSite/firestore.rules`
- Documentos históricos (privacidad, framework): `archive/`

---
**Versión:** 3.0 (Híbrido Netlify + Firebase + HubSpot)
**Última actualización:** 2026-05-02
