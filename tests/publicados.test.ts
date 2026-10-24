import { beforeEach, describe, expect, it, vi } from "vitest";
import { toPost } from "../netlify/edge-lib/post.ts";

const doc = (fields: Record<string, unknown>) => ({ fields });
const str = (stringValue: string) => ({ stringValue });
const bool = (booleanValue: boolean) => ({ booleanValue });
const ts = (timestampValue: string) => ({ timestampValue });

function mockFirestore(docs: Record<string, Record<string, unknown>>) {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: { body?: string }) => {
    if (url.includes(":runQuery")) {
      const q = JSON.parse(init!.body!).structuredQuery;
      const slugFilter = q.where?.fieldFilter?.value?.stringValue;
      const rows = Object.values(docs).filter((d) => !slugFilter || (d.slug as { stringValue: string })?.stringValue === slugFilter);
      return new Response(JSON.stringify(rows.map((fields) => ({ document: { fields } }))));
    }
    const id = decodeURIComponent(url.split("/blog_posts/")[1]);
    return docs[id] ? new Response(JSON.stringify(doc(docs[id]))) : new Response("{}", { status: 404 });
  }));
}

beforeEach(() => { vi.resetModules(); });

const base = { titulo: str("Hola"), resumen: str("r"), contenido: str("<p>x</p>"), fecha_publicacion: ts("2026-01-01T00:00:00Z") };

describe("filtro de publicados", () => {
  it("toPost mapea tags de array y fechas ISO", () => {
    const p = toPost({ ...base, publicado: bool(true), tags: { arrayValue: { values: [str("a"), str("b")] } } } as never)!;
    expect(p.tags).toEqual(["a", "b"]);
    expect(p.fechaPublicacion).toBe("2026-01-01T00:00:00Z");
    expect(p.slug).toBe("hola");
  });

  it("borrador/inexistente → null; publicado → post", async () => {
    mockFirestore({
      pub: { ...base, titulo: str("Publicado"), publicado: bool(true) },
      draft: { ...base, titulo: str("Borrador"), publicado: bool(false) },
    });
    const { findPublishedPost } = await import("../netlify/edge-lib/firestore.ts");
    expect(await findPublishedPost("pub")).not.toBeNull();
    expect(await findPublishedPost("draft")).toBeNull();
    expect(await findPublishedPost("nada")).toBeNull();
  });

  it("listPublished excluye borradores (y por ende llms.txt, sitemap, RSS)", async () => {
    mockFirestore({
      a: { ...base, titulo: str("Uno"), publicado: bool(true) },
      b: { ...base, titulo: str("Dos"), publicado: bool(false) },
    });
    const { listPublished } = await import("../netlify/edge-lib/firestore.ts");
    const { buildLlmsTxt } = await import("../netlify/edge-lib/llms.ts");
    const { buildSitemap, buildFeed } = await import("../netlify/edge-lib/xml.ts");
    const posts = await listPublished();
    expect(posts.map((p) => p.titulo)).toEqual(["Uno"]);
    for (const out of [buildLlmsTxt(posts), buildSitemap(posts), buildFeed(posts, (p) => p.contenido)]) {
      expect(out).toContain("uno");
      expect(out.toLowerCase()).not.toContain("dos");
    }
  });
});
