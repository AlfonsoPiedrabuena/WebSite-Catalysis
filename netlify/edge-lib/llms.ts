import { type Post, postMdUrl } from "./post.ts";
import { KEY_PAGES, MAX_LLMS_POSTS, SITE, SITE_NAME, SITE_SUMMARY } from "./site.ts";

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

// Formato del estándar llms.txt. `posts` ya viene publicado y ordenado (más reciente primero).
export function buildLlmsTxt(posts: Post[]): string {
  const lines = [`# ${SITE_NAME}`, "", `> ${SITE_SUMMARY}`, "", "## Páginas clave", ""];
  for (const p of KEY_PAGES) lines.push(`- [${p.title}](${SITE}${p.path}): ${p.description}`);
  lines.push("", "## Blog", "");
  for (const p of posts.slice(0, MAX_LLMS_POSTS)) {
    const desc = oneLine(p.resumen);
    lines.push(`- [${oneLine(p.titulo).replace(/[[\]]/g, "")}](${postMdUrl(p)})${desc ? `: ${desc}` : ""}`);
  }
  if (posts.length > MAX_LLMS_POSTS) {
    lines.push("", `Hay más artículos en el [índice del blog](${SITE}/blog.html).`);
  }
  return `${lines.join("\n")}\n`;
}
