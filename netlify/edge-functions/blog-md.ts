// GET /blog/<slug>.md → post en markdown con frontmatter. Solo posts publicados; el resto 404.
import type { Context } from "https://edge.netlify.com";
import { findPublishedPost } from "../edge-lib/firestore.ts";
import { markdownResponse } from "../edge-lib/respond.ts";

export default async (request: Request, context: Context) => {
  const match = new URL(request.url).pathname.match(/^\/blog\/(.+)\.md$/);
  if (!match) return context.next();

  try {
    const post = await findPublishedPost(decodeURIComponent(match[1]));
    if (!post) {
      return new Response("Not found\n", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, s-maxage=60" },
      });
    }
    return markdownResponse(post);
  } catch (error) {
    console.error("[blog-md] falló:", error);
    return new Response("Service unavailable\n", { status: 503, headers: { "cache-control": "no-store" } });
  }
};

export const config = { path: "/blog/*", excludedPath: "/blog/feed.xml" };
