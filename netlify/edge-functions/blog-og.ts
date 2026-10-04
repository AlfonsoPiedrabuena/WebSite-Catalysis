// Inyecta etiquetas Open Graph en blog-post.html SOLO para crawlers de redes
// sociales (que no ejecutan JS). Los visitantes humanos reciben el HTML tal cual
// y js/blog-post.js renderiza el post como siempre. Cualquier fallo (post no
// encontrado, no publicado, Firestore caído) cae al HTML sin modificar.
import type { Context } from "https://edge.netlify.com";

const SITE = "https://catalysis.com.mx";
const FALLBACK_IMAGE = `${SITE}/images/catalysis_logo.png`;
// Proyecto Firebase público (.firebaserc / js/firebase-config.js); blog_posts es de lectura pública.
const FIRESTORE = "https://firestore.googleapis.com/v1/projects/catalysis-blog/databases/(default)/documents";

const CRAWLER_UA =
  /facebookexternalhit|facebot|meta-externalagent|twitterbot|whatsapp|slackbot|linkedinbot|telegrambot|discordbot|pinterest|skypeuripreview|embedly|redditbot|googlebot|bingbot/i;

// Debe mantenerse idéntica a slugify() de js/blog-utils.js.
function slugify(text: string): string {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

type Fields = Record<string, { stringValue?: string; booleanValue?: boolean }>;
interface Post { titulo: string; slug: string; resumen: string; imagen: string; publicado: boolean }

function toPost(fields: Fields | undefined): Post | null {
  if (!fields) return null;
  const s = (k: string) => fields[k]?.stringValue ?? "";
  return {
    titulo: s("titulo"),
    slug: slugify(s("slug") || s("titulo")),
    resumen: s("resumen"),
    imagen: s("imagen_portada"),
    publicado: fields.publicado?.booleanValue === true,
  };
}

// Mismo orden de prioridad que findPostDoc() en js/blog-post.js:
// ID de documento → campo `slug` → slug derivado del título (50 más recientes).
async function findPost(idOrSlug: string): Promise<Post | null> {
  const byId = await fetch(`${FIRESTORE}/blog_posts/${encodeURIComponent(idOrSlug)}`);
  if (byId.ok) return toPost((await byId.json()).fields);

  const runQuery = async (structuredQuery: unknown) => {
    const res = await fetch(`${FIRESTORE}:runQuery`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ structuredQuery }),
    });
    if (!res.ok) return [];
    const rows: { document?: { fields: Fields } }[] = await res.json();
    return rows.flatMap((r) => (r.document ? [r.document.fields] : []));
  };

  const bySlug = await runQuery({
    from: [{ collectionId: "blog_posts" }],
    where: { fieldFilter: { field: { fieldPath: "slug" }, op: "EQUAL", value: { stringValue: idOrSlug } } },
    limit: 1,
  });
  if (bySlug.length) return toPost(bySlug[0]);

  const target = slugify(idOrSlug);
  const recent = await runQuery({
    from: [{ collectionId: "blog_posts" }],
    orderBy: [{ field: { fieldPath: "fecha_publicacion" }, direction: "DESCENDING" }],
    limit: 50,
  });
  return recent.map(toPost).find((p) => p && p.slug === target) ?? null;
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async (request: Request, context: Context) => {
  const ua = request.headers.get("user-agent") ?? "";
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !CRAWLER_UA.test(ua)) return context.next();

  try {
    const post = await findPost(id);
    if (!post || !post.publicado) return context.next();

    const url = `${SITE}/blog-post.html?id=${encodeURIComponent(post.slug)}`;
    const image = post.imagen ? new URL(post.imagen, SITE).href : FALLBACK_IMAGE;
    const title = `${post.titulo} - Catalysis`;
    const tags = [
      `<meta property="og:title" content="${esc(title)}">`,
      `<meta property="og:description" content="${esc(post.resumen)}">`,
      `<meta property="og:image" content="${esc(image)}">`,
      `<meta property="og:url" content="${esc(url)}">`,
      `<meta property="og:type" content="article">`,
      `<meta property="og:site_name" content="Catalysis">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="description" content="${esc(post.resumen)}">`,
      `<link rel="canonical" href="${esc(url)}">`,
    ].join("\n    ");

    const response = await context.next();
    const html = await response.text();
    const body = html
      // Conserva el id="post-title": js/blog-post.js lo busca con getElementById.
      .replace(/(<title[^>]*>)[^<]*(<\/title>)/i, (_m, open, close) => `${open}${esc(title)}${close}`)
      .replace("</head>", `    ${tags}\n</head>`);
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(body, { status: response.status, headers });
  } catch (error) {
    console.error("[blog-og] falló, sirviendo HTML sin modificar:", error);
    return context.next();
  }
};

export const config = { path: ["/blog-post.html", "/blog-post"] };
