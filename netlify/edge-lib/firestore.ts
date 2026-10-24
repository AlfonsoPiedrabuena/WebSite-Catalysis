import { type FsFields, type Post, toPost } from "./post.ts";
import { slugify } from "./slug.ts";

// Proyecto Firebase público (.firebaserc / js/firebase-config.js); blog_posts es de lectura pública.
const FIRESTORE = "https://firestore.googleapis.com/v1/projects/catalysis-blog/databases/(default)/documents";
const LIST_LIMIT = 200;
const CACHE_TTL_MS = 5 * 60 * 1000;

// Caché en memoria por isolate: evita repetir lecturas a Firestore mientras el isolate vive.
const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function runQuery(structuredQuery: unknown): Promise<FsFields[]> {
  const res = await fetch(`${FIRESTORE}:runQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ structuredQuery }),
  });
  if (!res.ok) throw new Error(`Firestore runQuery ${res.status}`);
  const rows: { document?: { fields: FsFields } }[] = await res.json();
  return rows.flatMap((r) => (r.document ? [r.document.fields] : []));
}

// Posts publicados, más reciente primero. Se filtra `publicado` en código (como hace blog.js)
// para no requerir un índice compuesto en Firestore.
export function listPublished(): Promise<Post[]> {
  return cached("list", async () => {
    const rows = await runQuery({
      from: [{ collectionId: "blog_posts" }],
      orderBy: [{ field: { fieldPath: "fecha_publicacion" }, direction: "DESCENDING" }],
      limit: LIST_LIMIT,
    });
    return rows.map(toPost).filter((p): p is Post => !!p && p.publicado && !!p.slug);
  });
}

// Mismo orden de prioridad que findPostDoc() en js/blog-post.js:
// ID de documento → campo `slug` → slug derivado del título. Devuelve solo posts publicados.
export function findPublishedPost(idOrSlug: string): Promise<Post | null> {
  return cached(`post:${idOrSlug}`, async () => {
    const byId = await fetch(`${FIRESTORE}/blog_posts/${encodeURIComponent(idOrSlug)}`);
    if (byId.ok) {
      const p = toPost((await byId.json()).fields);
      return p?.publicado ? p : null;
    }

    const bySlug = await runQuery({
      from: [{ collectionId: "blog_posts" }],
      where: { fieldFilter: { field: { fieldPath: "slug" }, op: "EQUAL", value: { stringValue: idOrSlug } } },
      limit: 1,
    });
    if (bySlug.length) {
      const p = toPost(bySlug[0]);
      return p?.publicado ? p : null;
    }

    const target = slugify(idOrSlug);
    return (await listPublished()).find((p) => p.slug === target) ?? null;
  });
}
