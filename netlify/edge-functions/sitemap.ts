import { listPublished } from "../edge-lib/firestore.ts";
import { textResponse } from "../edge-lib/respond.ts";
import { buildSitemap } from "../edge-lib/xml.ts";

export default async () => {
  try {
    return textResponse(buildSitemap(await listPublished()), "application/xml; charset=utf-8");
  } catch (error) {
    console.error("[sitemap] falló:", error);
    return new Response("Service unavailable\n", { status: 503, headers: { "cache-control": "no-store" } });
  }
};

export const config = { path: "/sitemap.xml" };
