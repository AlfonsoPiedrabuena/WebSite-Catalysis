import { type Post, postUrl } from "./post.ts";
import { MAX_FEED_POSTS, SITE, SITE_NAME, SITE_SUMMARY, SITEMAP_PAGES } from "./site.ts";

export const escXml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function buildSitemap(posts: Post[]): string {
  const pages = SITEMAP_PAGES.map((path) => `  <url><loc>${escXml(SITE + path)}</loc></url>`);
  const entries = posts.map((p) =>
    `  <url><loc>${escXml(postUrl(p))}</loc>${p.fechaPublicacion ? `<lastmod>${p.fechaPublicacion}</lastmod>` : ""}</url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    [...pages, ...entries].join("\n")
  }\n</urlset>\n`;
}

// RSS 2.0 con contenido completo (content:encoded) de los últimos 20 posts.
export function buildFeed(posts: Post[], renderContent: (p: Post) => string): string {
  const items = posts.slice(0, MAX_FEED_POSTS).map((p) => {
    const url = escXml(postUrl(p));
    return [
      "    <item>",
      `      <title>${escXml(p.titulo)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      p.fechaPublicacion ? `      <pubDate>${new Date(p.fechaPublicacion).toUTCString()}</pubDate>` : "",
      `      <description>${escXml(p.resumen)}</description>`,
      `      <content:encoded><![CDATA[${renderContent(p).replace(/\]\]>/g, "]]]]><![CDATA[>")}]]></content:encoded>`,
      "    </item>",
    ].filter(Boolean).join("\n");
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(SITE_NAME)} Blog</title>
    <link>${SITE}/blog.html</link>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${escXml(SITE_SUMMARY)}</description>
    <language>es-mx</language>
${items.join("\n")}
  </channel>
</rss>
`;
}
