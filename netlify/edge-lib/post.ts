import { DEFAULT_LANG, FALLBACK_IMAGE, SITE } from "./site.ts";
import { slugify } from "./slug.ts";

// Solo los campos públicos del post; no se copian IDs de Firestore, `vistas` ni nada interno.
export interface Post {
  titulo: string;
  slug: string;
  resumen: string;
  contenido: string;
  autor: string;
  categoria: string;
  tags: string[];
  imagen: string; // URL absoluta o ""
  publicado: boolean;
  fechaPublicacion: string; // ISO 8601 o ""
  lang: string;
}

type FsValue = {
  stringValue?: string;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: { values?: FsValue[] };
};
export type FsFields = Record<string, FsValue>;

export function absoluteUrl(url: string): string {
  try {
    return new URL(url, SITE).href;
  } catch {
    return url;
  }
}

export function toPost(fields: FsFields | undefined): Post | null {
  if (!fields) return null;
  const s = (k: string) => fields[k]?.stringValue ?? "";
  const rawTags = fields.tags?.arrayValue?.values?.map((v) => v.stringValue ?? "") ?? (s("tags") ? s("tags").split(",") : []);
  const imagen = s("imagen_portada");
  return {
    titulo: s("titulo"),
    slug: slugify(s("slug") || s("titulo")),
    resumen: s("resumen"),
    contenido: s("contenido"),
    autor: s("autor"),
    categoria: s("categoria"),
    tags: rawTags.map((t) => t.trim()).filter(Boolean),
    imagen: imagen ? absoluteUrl(imagen) : "",
    publicado: fields.publicado?.booleanValue === true,
    fechaPublicacion: fields.fecha_publicacion?.timestampValue ?? "",
    // No existe campo `lang` en Firestore todavía; si el CRM lo agrega se respeta.
    lang: s("lang") || DEFAULT_LANG,
  };
}

// URL canónica HTML: se mantiene el formato actual blog-post.html?id=<slug>.
export const postUrl = (p: Post) => `${SITE}/blog-post.html?id=${encodeURIComponent(p.slug)}`;
export const postMdUrl = (p: Post) => `${SITE}/blog/${encodeURIComponent(p.slug)}.md`;
export const postImage = (p: Post) => p.imagen || FALLBACK_IMAGE;
