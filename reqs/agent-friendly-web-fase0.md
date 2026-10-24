# Fase 0: Reporte de descubrimiento (agent-friendly web, blog)

> Spec: `reqs/agent-friendly-web.md`. Fecha: 2026-10-23. Solo lectura, sin cambios de código.
> **Decisión de arquitectura tomada: camino A** (sitio estático + Netlify Edge Functions; sin migrar a Next.js).

## 1. Modelo de datos (Firestore `blog_posts`)

| Campo | Notas |
|---|---|
| `titulo`, `resumen`, `autor`, `categoria` | strings |
| `slug` | opcional: los posts cargados a mano no lo tienen; se deriva de `titulo` con `slugify()` |
| `contenido` | **HTML** |
| `imagen_portada` | string; puede ser relativa → hay que absolutizar |
| `tags[]` | array (el cliente tolera string separado por comas) |
| `publicado` | bool; único estado existente (no hay "programado") |
| `fecha_publicacion`, `fecha_creacion` | Timestamp |
| `vistas` | contador; interno, no exponer |

- **No existen:** `lang`, `updated`/`fecha_actualizacion`, `contentMarkdown`.
- Lectura pública por REST (`firestore.rules`: `allow read: if true`), ya usada por `blog-og.ts`.

## 2. Formato del contenido

HTML, no markdown. Según el spec corresponde un campo derivado `contentMarkdown` generado al publicar/actualizar, nunca por request. Quien escribe los posts es el MCP del CRM (`crear_post_blog` / `actualizar_post_blog`, repo `catalysis-crm`, fuera de alcance del spec). Ver decisión pendiente D2.

## 3. Renderizado actual

- 100 % cliente: `blog-post.html` trae un contenedor vacío y `js/blog-post.js` hace `bodyEl.innerHTML = post.contenido` tras consultar Firestore con el SDK cliente.
- El HTML inicial **no contiene el post**: agentes y buscadores que no ejecutan JS no ven contenido. Esto incumple la regla del spec "contenido siempre en el HTML inicial".
- URL pública: `blog-post.html?id=<slug>`. No existe `/blog/{slug}`.
- `blog-post.html` no tiene canonical, meta description ni JSON-LD (solo `<title>` genérico). `netlify/edge-functions/blog-og.ts` inyecta OG/canonical **solo para crawlers por User-Agent**.

## 4. Artefactos SEO existentes

| Artefacto | Estado |
|---|---|
| `sitemap.xml`, `robots.txt`, `llms.txt`, RSS | no existen |
| canonical | solo vía `blog-og.ts` para crawlers |
| JSON-LD | no existe |
| OG tags | sí, solo crawlers |

## 5. Revalidación al publicar

No hay mecanismo: hoy el blog no necesita deploy porque lo lee el navegador. Con el camino A el equivalente es purga de caché CDN (tags de Netlify) disparada desde el CRM mediante un endpoint protegido por secreto. **Ese endpoint no existe; propuesta en D3, requiere confirmación.**

## 6. Estado de ramas

- Deploy: `production`. `main` no despliega.
- `origin/sandbox` está **divergida**: 3 commits que `main` no tiene (solo docs de `reqs/`) y le faltan 2 de `main`. Antes de implementar hay que rebasarla o recrearla desde `main` (D5).

## 7. Línea base Lighthouse (criterio 9)

**Pendiente.** Requiere medir contra el entorno de sandbox desplegado; no se pudo desde local.

## Decisiones pendientes (el spec pide detenerse aquí)

- **D1. URLs limpias `/blog/{slug}`.** Los criterios de aceptación las asumen. Propuesta: rewrite `/blog/:slug` → `blog-post.html?id=:slug` y 301 desde `blog-post.html?id=`. Impacta enlaces de `blog.js`, canonical, OG y el sitemap. Sin esto, `Accept: text/markdown` sobre `/blog/{slug}` no es posible.
- **D2. Origen del markdown.** (a) campo `contentMarkdown` escrito por el CRM (fuera de alcance, requiere cambio en `catalysis-crm`); (b) conversión HTML→MD en la edge function una vez por invalidación de caché (sin tocar el CRM; contradice "nunca convertir por request", mitigado por caché CDN). Recomendación: (b) en fase 1 y (a) como evolución.
- **D3. Disparador de purga.** Función `revalidate` protegida con secreto (`REVALIDATE_SECRET`) que el CRM invoque al publicar/editar. Requiere un cambio mínimo en el CRM o, mientras tanto, TTL corto (`s-maxage=300`) como fallback.
- **D4. Inyección en HTML inicial.** Propuesta: la edge function inyecta para **todos** los UA canonical, `link rel=alternate`, JSON-LD y el cuerpo del post en `#post-body`, para que el contenido exista sin JS. Hay que garantizar que `blog-post.js` no duplique el render.
- **D5. Rama `sandbox`.** Recrear desde `main` (descartando o cherry-pickeando los 3 commits de docs) o rebasar.
- **D6. Idioma.** Asumir `es-MX` fijo (`<html lang="es">` ya lo es) ya que no hay campo `lang`.
- **D7. `updated`.** No existe fecha de modificación; propuesta: usar `fecha_publicacion` como `dateModified` hasta que el CRM guarde `fecha_actualizacion`.
