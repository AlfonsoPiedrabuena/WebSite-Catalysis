# Requerimiento: Open Graph tags server-side para `blog-post.html`

**Estado: IMPLEMENTADO (2026-10-03, commit `9799ebd`, `netlify/edge-functions/blog-og.ts`; verificado con `curl` en producción; falta solo validar en el Facebook Sharing Debugger).** URLs con slug ya confirmadas funcionando (commit `347e7ed`, verificado en navegador real el 2026-10-03 en múltiples posts — carga correcta de título, contenido y meta). Este documento cubre lo que falta: la vista previa del link en redes sociales.

## Problema

`blog-post.html` es una SPA: el `<head>` siempre sirve `<title>Blog - Catalysis</title>` sin ninguna etiqueta Open Graph, y el contenido real (título, resumen, imagen) se inyecta con JavaScript después de que Firestore responde (`js/blog-post.js`).

Los crawlers que generan la vista previa de un link al compartirlo en Facebook, Instagram, WhatsApp o Twitter/X **no ejecutan JavaScript**. Reciben el HTML estático tal cual, así que para ellos cualquier post se ve igual: título "Blog - Catalysis", sin descripción, sin imagen.

Esto bloquea la campaña de posts "teaser" en redes sociales que invitan a leer el blog (plan en `claude/plan-contenidos-multicanal.md`, proyecto Consultancy) — sin preview decente, el link se ve roto o genérico.

## Objetivo

Que un crawler que pida `GET /blog-post.html?id=<slug>` reciba HTML con estas etiquetas ya resueltas en el `<head>`, sin depender de JS:

```html
<meta property="og:title" content="<titulo del post> - Catalysis">
<meta property="og:description" content="<resumen del post>">
<meta property="og:image" content="<imagen_portada o fallback>">
<meta property="og:url" content="https://catalysis.com.mx/blog-post.html?id=<slug>">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://catalysis.com.mx/blog-post.html?id=<slug>">
```

Los visitantes humanos deben seguir viendo el sitio exactamente igual que hoy (SPA renderizada por `js/blog-post.js`). No se pide migrar el blog a SSR completo — solo resolver el caso de los crawlers.

## Enfoque sugerido

El sitio ya usa Netlify Functions (`netlify/functions/hubspot-register.js`), así que el patrón más consistente con la arquitectura actual es:

1. **Netlify Edge Function** (o Function regular si Edge no está habilitado en el plan) que intercepta requests a `/blog-post.html`:
   - Lee el parámetro `id` de la URL.
   - Resuelve el post en Firestore por el mismo criterio que `findPostDoc()` en `js/blog-post.js` (ID legado → campo `slug` → slug derivado de `titulo`, usando `slugify()`/`getPostSlug()` de `js/blog-utils.js`) — para no duplicar lógica, considerar extraer esa resolución a un módulo compartido o reimplementarla server-side con el mismo orden de prioridad.
   - Si encuentra el post y `publicado === true`: inyecta las etiquetas OG en el `<head>` del HTML estático antes de servirlo.
   - Si no lo encuentra, o es un visitante normal (no crawler) y no quieres pagar el costo de la consulta a Firestore en cada carga: sirve el HTML sin modificar, igual que hoy, y deja que el JS del cliente resuelva el resto como ya hace.
   - Opcional para optimizar: detectar el User-Agent del crawler (`facebookexternalhit`, `Twitterbot`, `WhatsApp`, `Slackbot`, etc.) y solo correr la inyección server-side para esos casos, sirviendo el HTML sin tocar a todos los demás — así no se agrega latencia a cada visita humana.

2. **Imagen de fallback:** si un post no tiene `imagen_portada`, usar `images/catalysis_logo.png` como `og:image` en vez de dejarlo vacío.

3. **`og:description`:** usar el campo `resumen` del post (ya existe en todos los posts actuales según `listar_posts_blog` del MCP de CRM).

## Verificación previa necesaria (antes de implementar)

Confirmar que los 9 posts publicados en `blog_posts` ya tienen el campo `imagen_portada` apuntando a una de las imágenes que ya están en este repo (`images/pieza1-facturacion_1.jpg` … `images/pieza9-bi-crm_1.jpg`, confirmadas presentes en el commit `347e7ed`). El tool `listar_posts_blog` del MCP de CRM no devuelve ese campo en su resumen, así que hay que revisarlo directo en Firestore o con `actualizar_post_blog` para confirmar/completar el valor en cada post antes de que la inyección de OG tags tenga imagen que mostrar.

## Criterio de aceptación

- `curl -A "facebookexternalhit/1.1" https://catalysis.com.mx/blog-post.html?id=<slug-de-un-post-real>` devuelve HTML con `og:title`, `og:description` y `og:image` ya resueltos (sin ejecutar JS).
- Probar con el [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) sobre al menos 2 de los 9 posts publicados — debe mostrar título, resumen e imagen de portada correctos.
- Un visitante humano normal sigue viendo el sitio exactamente igual que hoy (sin regresión visual ni de performance notoria) — ya confirmado funcionando para el flujo de slug en sí.
- Un `id` inexistente o no publicado sigue mostrando "Artículo no encontrado" tanto para crawler como para humano.

## Fuera de alcance

- Migrar el blog completo a SSR/SSG.
- Cambiar el esquema de Firestore (`fecha_publicacion`, `imagen_portada` ya están correctos y alineados entre `website-catalysis` y `catalysis-crm`, confirmado revisando ambos repos).
- Tocar la resolución de slugs en `js/blog-post.js`/`js/blog-utils.js` — ya funciona correctamente, no se toca.
