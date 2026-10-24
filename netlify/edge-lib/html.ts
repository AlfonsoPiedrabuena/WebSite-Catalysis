import { jsonLdScript, buildBlogPosting } from "./jsonld.ts";
import { type Post, postImage, postMdUrl, postUrl } from "./post.ts";
import { SITE, SITE_NAME } from "./site.ts";

export const escAttr = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Contenido que se incrusta en el HTML inicial. El CRM ya sanitiza al guardar y el cliente
// renderiza este mismo HTML con innerHTML; aquí solo se descartan <script> por defensa extra.
export const stripScripts = (html: string) => html.replace(/<script[\s\S]*?<\/script\s*>/gi, "");

export function headTags(post: Post): string {
  const title = `${post.titulo} - ${SITE_NAME}`;
  return [
    `<meta property="og:title" content="${escAttr(title)}">`,
    `<meta property="og:description" content="${escAttr(post.resumen)}">`,
    `<meta property="og:image" content="${escAttr(postImage(post))}">`,
    `<meta property="og:url" content="${escAttr(postUrl(post))}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="description" content="${escAttr(post.resumen)}">`,
    `<link rel="canonical" href="${escAttr(postUrl(post))}">`,
    `<link rel="alternate" type="text/markdown" href="${escAttr(postMdUrl(post))}">`,
    `<link rel="alternate" type="application/rss+xml" title="${SITE_NAME} Blog" href="${SITE}/blog/feed.xml">`,
    jsonLdScript(buildBlogPosting(post)),
  ].join("\n    ");
}

// Inyecta título, tags de <head> y cuerpo del post en blog-post.html. js/blog-post.js luego
// reemplaza #post-body con el mismo contenido (innerHTML =), así que no se duplica.
export function injectPost(html: string, post: Post): string {
  const title = `${post.titulo} - ${SITE_NAME}`;
  return html
    // Conserva el id="post-title": js/blog-post.js lo busca con getElementById.
    .replace(/(<title[^>]*>)[^<]*(<\/title>)/i, (_m, open, close) => `${open}${escAttr(title)}${close}`)
    .replace("</head>", () => `    ${headTags(post)}\n</head>`)
    .replace(
      /(<div id="post-body"[^>]*>)[\s\S]*?(<\/div>)/i,
      (_m, open, close) => `${open}${stripScripts(post.contenido)}${close}`,
    );
}
