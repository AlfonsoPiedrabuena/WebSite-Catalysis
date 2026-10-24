import { serializePost } from "./markdown.ts";
import type { Post } from "./post.ts";
import { CACHE_CONTROL } from "./site.ts";

export function markdownResponse(post: Post): Response {
  return new Response(serializePost(post), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": CACHE_CONTROL,
      vary: "Accept",
      "netlify-vary": "header=Accept",
    },
  });
}

export function textResponse(body: string, contentType: string): Response {
  return new Response(body, { headers: { "content-type": contentType, "cache-control": CACHE_CONTROL } });
}
