# Blog: slugs y Open Graph

Movido desde CLAUDE.md. Versión markdown, llms.txt, caché y bots: `docs/agent-friendly.md`.

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


**Open Graph y agent-friendly:** `blog-og.ts` intercepta `/blog-post.html` y, para
**todos** los UA, inyecta `og:*`, `canonical`, JSON-LD `BlogPosting`, `<link rel="alternate"
type="text/markdown">` y el cuerpo del post (`js/blog-post.js` lo reemplaza luego con el mismo
contenido). Cualquier fallo sirve el HTML original. Probar con
`curl -A "facebookexternalhit/1.1" "https://catalysis.com.mx/blog-post.html?id=<slug>"`.
Si Facebook ya cacheó un
link, usar "Scrape Again" en el Sharing Debugger.
