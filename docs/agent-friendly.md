# Blog agent-friendly (fase 1)

Spec: `reqs/agent-friendly-web.md`. Decisiones de Fase 0: `reqs/agent-friendly-web-fase0.md`.
Arquitectura: sitio estático + Netlify Edge Functions leyendo Firestore por REST (sin Next.js).

## Rutas

| Ruta | Función | Notas |
|---|---|---|
| `/blog/<slug>.md` | `blog-md.ts` | `text/markdown; charset=utf-8`. 404 si no existe o no está publicado. |
| `/blog-post.html?id=<slug>` + `Accept: text/markdown` | `blog-og.ts` | Mismo cuerpo que el `.md`. Resuelve por q-values (`negotiate.ts`); empate → HTML. |
| `/blog-post.html?id=<slug>` | `blog-og.ts` | HTML con canonical, OG, JSON-LD, `link rel=alternate` (markdown y RSS) y cuerpo inyectado. |
| `/llms.txt` | `llms-txt.ts` | Estándar llms.txt; máx. 50 posts, más reciente primero; enlaces `.md`. |
| `/sitemap.xml` | `sitemap.ts` | Páginas públicas + posts con `lastmod`. |
| `/blog/feed.xml` | `blog-feed.ts` | RSS 2.0, 20 posts, contenido completo. |
| `/robots.txt` | archivo estático | Política de bots en un solo grupo (los bots con grupo propio ignoran `*`). |

Las URLs canónicas **no cambian** (`blog-post.html?id=<slug>`).

## Frontmatter del `.md`

`title`, `description`, `date`, `updated`, `author`, `tags`, `lang`, `canonical`. Valores siempre entre comillas
dobles (YAML escapado). Enlaces e imágenes en URL absoluta. No se exponen IDs de Firestore, `vistas` ni `publicado`.
`updated` = `date` mientras Firestore no tenga fecha de modificación. `lang` = `es-MX` por defecto; si un post trae
campo `lang` se respeta (base para versiones en inglés: documento aparte con `lang: en`).

## Caché y publicación sin deploy

Todo se genera desde Firestore: no hay datos por post en el repo. Respuestas con
`Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`, `Vary: Accept` y
`Netlify-Vary: header=Accept`; además caché en memoria de 5 min por isolate (`netlify/edge-lib/firestore.ts`).
Un post nuevo o editado se refleja en ≤ ~5 min. No hay endpoint de revalidación (backlog si se quiere inmediatez).

## Convertidor HTML → markdown

`turndown` vía import map de Deno, por URL de esm.sh porque el bundler de producción no acepta `npm:` (`netlify/import_map.json`, referenciado en `netlify.toml`). Los tests en Node lo
resuelven desde `tests/node_modules` (alias en `tests/vitest.config.ts`).

## Mantener sincronizado

`slugify()` existe en `js/blog-utils.js`, `netlify/edge-lib/slug.ts` y en `catalysis-crm`; deben ser idénticas.

## Estado (2026-10-23)

Fase 1 en producción; criterios de aceptación 1-9 cumplidos (Lighthouse SEO del post 91 → 100; JSON-LD validado en
Rich Results Test; post nuevo del CRM visible en `llms.txt`, sitemap, RSS y `.md` sin deploy).

Limitación conocida: las Edge Functions no se cachean en el CDN (una invocación por petición). Aceptado por tráfico bajo;
si crece, mover `.md`, `llms.txt`, sitemap y feed a Netlify Functions con `Netlify-CDN-Cache-Control` (caché durable).

## Pendientes / backlog

- Enviar `https://catalysis.com.mx/sitemap.xml` a Google Search Console.
- Contenido en inglés: posts como documentos aparte con `lang: en` (el `.md` ya respeta el campo `lang`); falta enlazar
  traducciones (alternates/hreflang) en frontmatter, `llms.txt` y HTML.
- `updated`/`dateModified`: hoy repiten la fecha de publicación; requiere que el CRM guarde fecha de modificación.
- Fase 2 (spec): versión markdown de páginas institucionales; `/llms-full.txt` y analítica de bots siguen fuera.

## Despliegue

Rama de deploy: `production` (no `main`). Tras fusionar el PR a `main`: `git push origin main:production`.
Si el bundler falla con `npm:`, usar URLs (esm.sh) en `netlify/import_map.json`.

