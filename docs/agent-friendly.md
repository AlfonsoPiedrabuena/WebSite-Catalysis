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

`turndown` vía import map de Deno (`netlify/import_map.json`, referenciado en `netlify.toml`). Los tests en Node lo
resuelven desde `tests/node_modules` (alias en `tests/vitest.config.ts`).

## Mantener sincronizado

`slugify()` existe en `js/blog-utils.js`, `netlify/edge-lib/slug.ts` y en `catalysis-crm`; deben ser idénticas.
