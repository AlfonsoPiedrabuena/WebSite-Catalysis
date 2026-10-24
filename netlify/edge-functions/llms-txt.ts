import { listPublished } from "../edge-lib/firestore.ts";
import { buildLlmsTxt } from "../edge-lib/llms.ts";
import { textResponse } from "../edge-lib/respond.ts";

export default async () => {
  try {
    return textResponse(buildLlmsTxt(await listPublished()), "text/plain; charset=utf-8");
  } catch (error) {
    console.error("[llms-txt] falló:", error);
    return new Response("Service unavailable\n", { status: 503, headers: { "cache-control": "no-store" } });
  }
};

export const config = { path: "/llms.txt" };
