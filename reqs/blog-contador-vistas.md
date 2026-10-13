# Requerimiento: Quitar el contador público de "vistas" del blog

**Estado: PENDIENTE (spec escrita 2026-10-13).**

## Problema

Todos los artículos muestran "0 vistas" a cualquier visitante (`js/blog-post.js`, `populatePost`: `${post.vistas || 0} vistas`). Resta credibilidad en cada artículo, justo el que queremos que convierta.

**Causa raíz confirmada:** `incrementViewCount()` hace un `update` de `vistas` desde el navegador, pero `firestore.rules` solo permite `write` en `blog_posts` a usuarios autenticados (`request.auth != null`). Para un visitante anónimo el `update` falla con `permission-denied`, que el `catch` solo manda a `console.error`. El contador nunca ha avanzado.

## Decisión

**Ocultar el contador y dejar de intentar escribirlo**, en lugar de abrir una regla de escritura pública sobre `blog_posts`:

- `firestore.rules` es un archivo sensible (CLAUDE.md): una regla de `update` anónimo, aunque se restrinja a `vistas`, es spoofeable por cualquiera y mantiene una superficie de escritura pública sobre contenido publicado.
- La fuente de verdad del tráfico por artículo es GA4 (`pagePath` / `blog_slug`), que además distingue usuarios y fuentes. Un contador pequeño y manipulable no aporta a una estrategia orientada a leads.

## Cambios

1. `js/blog-post.js`: eliminar el `<span>` de vistas de `populatePost` y la llamada a `incrementViewCount(docId)` junto con la función.
2. `js/blog.js` / `blog.html`: confirmar que el listado tampoco muestra vistas; si lo hace, quitarlo.
3. **No** tocar el campo `vistas` en Firestore ni su uso en el MCP del CRM (`listar_posts_blog` lo seguirá devolviendo en 0; es inofensivo).
4. **No** modificar `firestore.rules`.

## Criterios de aceptación

- Ningún artículo ni el listado muestran "vistas".
- La consola del navegador ya no registra `Error incrementing view count`.
- Fecha y autor del post se siguen mostrando con el mismo formato.

## Fuera de alcance

- Un contador propio con Cloud Function o conteo desde GA4: solo si más adelante se quiere mostrar prueba social de lectura, con umbral mínimo.
