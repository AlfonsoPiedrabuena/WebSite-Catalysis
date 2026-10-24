# REQ: Sitio web agent-friendly (fase 1: blog)

> Destino sugerido en el repo: `reqs/agent-friendly-web.md`
> Repo: sitio web de marketing de Catalysis (Next.js 16 App Router, Firebase proyecto `catalysis-blog`, Netlify).
> Regla de este spec: **no ejecutar actividades fuera de lo que aquí se describe.** Si algo no está claro, documentarlo en el reporte de la Fase 0 y detenerse antes de decidir por cuenta propia.

## 1. Objetivo

Que el contenido del blog sea consumible por agentes de IA y buscadores con IA sin parsear HTML: versión markdown por post, descubrimiento automático, índice `llms.txt` y base técnica de datos estructurados. Meta secundaria: que esto **no aumente** el consumo de créditos de Netlify.

## 2. Alcance

**Dentro (fase 1):**
- Versión markdown de cada post publicado.
- Negociación de contenido por header `Accept`.
- `/llms.txt` generado dinámicamente.
- JSON-LD `BlogPosting`, sitemap, RSS, canonical, `robots.txt`.
- Estrategia de caché y revalidación que evite deploys para publicar contenido.

**Fuera (no tocar):**
- El CRM (`crm.catalysis.com.mx`) y cualquier ruta autenticada.
- El MCP del sitio web.
- `/llms-full.txt` (backlog: consume demasiados tokens por consulta).
- Versión markdown de páginas institucionales (home, servicios, contacto). Backlog fase 2; en fase 1 solo se listan en `llms.txt` con su URL HTML.
- Analítica de tráfico de bots (backlog).
- Cambios de diseño visual del blog.

## 3. Fase 0: Descubrimiento (solo lectura, sin cambios de código)

Antes de implementar, inspeccionar y reportar en un bloque corto al inicio del PR:

1. Modelo de datos del post en Firestore: nombres reales de campos (título, slug, contenido, fechas, autor, tags, estado/publicado, idioma).
2. **Formato del contenido**: ¿markdown, HTML o rich text? Si **no** es markdown, la solución es convertir en el momento de publicar/actualizar y guardar un campo derivado `contentMarkdown` (por ejemplo con `turndown`), nunca convertir en cada request.
3. Cómo se renderiza hoy el post (SSG, ISR o dinámico) y cómo se obtienen los datos (SDK cliente o admin).
4. Si ya existen `sitemap`, `robots`, RSS, canonical o JSON-LD.
5. Mecanismo actual de revalidación o de deploy al publicar desde el CRM (`crear_post_blog` / `actualizar_post_blog`).

Decisión que se toma con ese reporte: si ya hay markdown como fuente, el HTML y el `.md` salen del mismo campo (única fuente de verdad).

## 4. Requerimientos funcionales

### RF1. Ruta markdown por post
- `GET /blog/{slug}.md` devuelve el post en markdown.
- Implementación sugerida: rewrite en `next.config` de `/blog/:slug.md` hacia un Route Handler interno (`app/blog/[slug]/md/route.ts`). Verificar que el patrón funcione en Next.js 16; si no, proponer alternativa equivalente.
- `Content-Type: text/markdown; charset=utf-8`.
- Estructura de la respuesta:
  - Frontmatter YAML: `title`, `description`, `date`, `updated`, `author`, `tags`, `lang`, `canonical` (URL HTML del post).
  - Cuerpo: markdown del post, con enlaces e imágenes en **URL absolutas**.
- Solo posts **publicados**. Borrador, programado o inexistente devuelve `404`. No exponer campos internos (IDs de Firestore, notas, estado).

### RF2. Negociación de contenido
- `GET /blog/{slug}` con `Accept: text/markdown` devuelve lo mismo que RF1 (rewrite en middleware).
- Con `Accept: text/html` (navegadores) o sin header, comportamiento actual sin cambios. Resolver por preferencia (q-values), no por coincidencia simple de substring.
- Respuestas con `Vary: Accept`.
- En el `<head>` de cada post: `<link rel="alternate" type="text/markdown" href="/blog/{slug}.md">`.

### RF3. `/llms.txt`
- Generado dinámicamente desde los posts publicados. Formato del estándar llms.txt:
  - `# Catalysis` (H1)
  - Blockquote con resumen de una o dos líneas de qué es Catalysis.
  - Sección `## Páginas clave` con home, servicios y contacto (URL HTML).
  - Sección `## Blog` con un ítem por post: `- [Título](https://.../blog/slug.md): descripción corta`.
- Orden: más reciente primero. Máximo 50 posts; si hay más, enlazar al índice del blog.
- `Content-Type: text/plain; charset=utf-8`.

### RF4. Base técnica
- **JSON-LD** `BlogPosting` en cada post: `headline`, `description`, `datePublished`, `dateModified`, `author`, `image`, `mainEntityOfPage`, `inLanguage`.
- **Sitemap** (`app/sitemap.ts`) con posts publicados y `lastModified` real. Si ya existe, extender, no reemplazar.
- **RSS** en `/blog/feed.xml` (RSS 2.0 o Atom) con los últimos 20 posts, contenido completo.
- **Canonical** en HTML y en el frontmatter del `.md`.
- **`robots.txt`** (`app/robots.ts`): permitir `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` y bots generales; `Disallow: /api/`; referencia al sitemap. La política de bots es una decisión de negocio fácil de cambiar: dejarla en una constante nombrada y única.
- Contenido siempre presente en el HTML inicial (SSG/ISR), nada detrás de JS del cliente.

### RF5. Caché y revalidación (restricción de costos)
- Posts y `.md` se generan estáticamente (`generateStaticParams`) con revalidación **bajo demanda** (`revalidateTag` / `revalidatePath`) al publicar o editar un post. Publicar contenido **no debe requerir un deploy**.
- Endpoint de revalidación protegido por secreto en variable de entorno. Reutilizar el mecanismo existente si lo hay (Fase 0, punto 5); si no, proponerlo en el reporte y esperar confirmación.
- Headers para `.md` y `llms.txt`: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- Criterio de costo: una petición repetida a un `.md` no debe invocar función serverless si está en caché.

## 5. Criterios de aceptación

Verificables con `curl` contra el entorno de `sandbox`:

1. `curl -i {host}/blog/{slug}.md` → `200`, `Content-Type` de markdown, frontmatter válido, imágenes absolutas.
2. `curl -i -H "Accept: text/markdown" {host}/blog/{slug}` → mismo cuerpo que el punto 1, con `Vary: Accept`.
3. `curl -i {host}/blog/{slug}` (sin header) y desde navegador → HTML igual que antes.
4. Un post en borrador o inexistente: `/blog/{slug}.md` → `404`.
5. `/llms.txt` lista solo posts publicados, con enlaces `.md` y descripciones.
6. El HTML de un post contiene `<link rel="alternate" type="text/markdown">` y un bloque JSON-LD válido (validar con el Rich Results Test o un validador de schema.org).
7. `/sitemap.xml`, `/robots.txt` y `/blog/feed.xml` responden y son válidos.
8. Publicar un post nuevo desde el CRM hace que aparezca en `/llms.txt`, el sitemap, el RSS y su `.md` **sin deploy**.
9. Lighthouse/SEO del blog no empeora respecto a la línea base medida en Fase 0.

## 6. Pruebas (agente de testing, vitest)

- Serializador markdown: frontmatter completo, escape de caracteres especiales en YAML, URLs absolutas, post sin imagen, post sin tags.
- Negociación de `Accept`: `text/markdown`, `text/html`, `*/*`, vacío, `text/html;q=0.9, text/markdown;q=1`.
- Filtro de publicados: borrador/programado/inexistente → 404 en `.md`, ausente en llms.txt, sitemap y RSS.
- Generador de `llms.txt`: orden, límite de 50, formato de cada línea.
- JSON-LD: campos requeridos presentes y fechas en ISO 8601.
- Que ningún campo interno aparezca en el `.md`.

## 7. Flujo de trabajo y agentes

- Trabajar en rama `sandbox`; PR hacia `main`. Sin commits directos a `main`.
- **Netlify tiene créditos limitados:** acumular el trabajo y hacer **un solo merge a producción**. No empujar cambios solo de documentación a ramas con deploy.
- Agente de testing (Claude Haiku 4.5, vitest) corre en cada push a `sandbox`.
- Agente de documentación (Claude Haiku 4.5) corre post-merge y actualiza:
  - `CLAUDE.md`: sección breve (máx. ~10 líneas) con rutas `.md`, `llms.txt` y la regla "al agregar un tipo de contenido nuevo, exponer su versión markdown y registrarlo en llms.txt".
  - `README.md`: una línea de resumen.
  - `docs/agent-friendly.md`: detalle técnico (formato del frontmatter, negociación, caché, revalidación, política de bots).
  - Mantener `CLAUDE.md` por debajo de ~200 líneas.
- Decisiones de arquitectura (p. ej. si el contenido no es markdown y hay que agregar campo derivado) se quedan en el agente principal.

## 8. Definición de terminado

- Fase 0 reportada y sus decisiones registradas en el PR.
- Los 9 criterios de aceptación cumplidos en `sandbox`.
- Pruebas en verde.
- Documentación actualizada por el agente correspondiente.
- Merge único a `main`, verificado en producción con los mismos `curl`.
