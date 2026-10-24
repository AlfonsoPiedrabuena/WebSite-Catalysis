import { listPublished } from "../edge-lib/firestore.ts";
import { absolutizeHtml } from "../edge-lib/markdown.ts";
import { stripScripts } from "../edge-lib/html.ts";
import { textResponse } from "../edge-lib/respond.ts";
import { buildFeed } from "../edge-lib/xml.ts";

export default async () => {
  try {
    const xml = buildFeed(await listPublished(), (p) => absolutizeHtml(stripScripts(p.contenido)));
    return textResponse(xml, "application/rss+xml; charset=utf-8");
  } catch (error) {
    console.error("[blog-feed] falló:", error);
    return new Response("Service unavailable\n", { status: 503, headers: { "cache-control": "no-store" } });
  }
};

export const config = { path: "/blog/feed.xml" };
