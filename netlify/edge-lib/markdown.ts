import TurndownService from "turndown";
import { type Post, postUrl } from "./post.ts";
import { SITE } from "./site.ts";

// Convierte rutas relativas a absolutas en href/src (los agentes no tienen "página actual").
// Los anclas (#x), mailto:, tel: y data: se dejan igual.
export function absolutizeHtml(html: string): string {
  return html.replace(/\b(href|src)=(["'])([^"']*)\2/gi, (m, attr, quote, value) => {
    if (/^(#|mailto:|tel:|data:|javascript:)/i.test(value) || value === "") return m;
    try {
      return `${attr}=${quote}${new URL(value, SITE).href}${quote}`;
    } catch {
      return m;
    }
  });
}

let turndown: TurndownService | undefined;
export function htmlToMarkdown(html: string): string {
  turndown ??= new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
  return turndown.turndown(absolutizeHtml(html)).trim();
}

// Escapa un escalar YAML: siempre entre comillas dobles para no depender de reglas de tipos implícitos.
export function yamlString(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
  return `"${escaped}"`;
}

export function serializePost(post: Post): string {
  const lines = ["---", `title: ${yamlString(post.titulo)}`];
  lines.push(`description: ${yamlString(post.resumen)}`);
  if (post.fechaPublicacion) {
    lines.push(`date: ${yamlString(post.fechaPublicacion)}`);
    // Aún no existe fecha de modificación en Firestore: se usa la de publicación.
    lines.push(`updated: ${yamlString(post.fechaPublicacion)}`);
  }
  lines.push(`author: ${yamlString(post.autor || "Catalysis")}`);
  lines.push(post.tags.length ? `tags: [${post.tags.map(yamlString).join(", ")}]` : "tags: []");
  lines.push(`lang: ${yamlString(post.lang)}`);
  lines.push(`canonical: ${yamlString(postUrl(post))}`);
  lines.push("---", "");
  const body = htmlToMarkdown(post.contenido || "");
  const cover = post.imagen ? `![${post.titulo.replace(/[[\]]/g, "")}](${post.imagen})\n\n` : "";
  return `${lines.join("\n")}\n# ${post.titulo}\n\n${cover}${body}\n`;
}
