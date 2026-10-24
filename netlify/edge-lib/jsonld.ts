import { type Post, postImage, postUrl } from "./post.ts";
import { SITE, SITE_NAME } from "./site.ts";

export function buildBlogPosting(post: Post): Record<string, unknown> {
  // "Catalysis" / "Equipo Catalysis" son la organización, no una persona; con url cumple el campo opcional de Google.
  const author = post.autor && !/catalysis/i.test(post.autor)
    ? { "@type": "Person", name: post.autor }
    : { "@type": "Organization", name: post.autor || SITE_NAME, url: SITE };
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description: post.resumen,
    ...(post.fechaPublicacion && { datePublished: post.fechaPublicacion, dateModified: post.fechaPublicacion }),
    author,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE },
    image: [postImage(post)],
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl(post) },
    inLanguage: post.lang,
    ...(post.tags.length && { keywords: post.tags.join(", ") }),
  };
}

// Serializa para incrustar en <script type="application/ld+json">: evita cerrar el script con "</".
export const jsonLdScript = (data: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
