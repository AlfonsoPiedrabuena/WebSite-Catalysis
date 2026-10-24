// Sirve blog-post.html enriquecido para todos los visitantes: canonical, Open Graph, JSON-LD
// BlogPosting, <link rel="alternate" type="text/markdown"> y el cuerpo del post en el HTML inicial
// (los agentes y crawlers no ejecutan JS). Con `Accept: text/markdown` devuelve la versión markdown.
// Cualquier fallo (post no encontrado, no publicado, Firestore caído) cae al HTML sin modificar.
import type { Context } from "https://edge.netlify.com";
import { findPublishedPost } from "../edge-lib/firestore.ts";
import { injectPost } from "../edge-lib/html.ts";
import { prefersMarkdown } from "../edge-lib/negotiate.ts";
import { markdownResponse } from "../edge-lib/respond.ts";
import { CACHE_CONTROL } from "../edge-lib/site.ts";

export default async (request: Request, context: Context) => {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return context.next();

  try {
    const post = await findPublishedPost(id);
    if (!post) return context.next();

    if (prefersMarkdown(request.headers.get("accept"))) return markdownResponse(post);

    const response = await context.next();
    const body = injectPost(await response.text(), post);
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("vary", "Accept");
    headers.set("netlify-vary", "header=Accept");
    headers.set("cache-control", CACHE_CONTROL);
    return new Response(body, { status: response.status, headers });
  } catch (error) {
    console.error("[blog-og] falló, sirviendo HTML sin modificar:", error);
    return context.next();
  }
};

export const config = { path: ["/blog-post.html", "/blog-post"] };
