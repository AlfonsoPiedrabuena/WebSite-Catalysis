// Debe mantenerse idéntica a slugify() de js/blog-utils.js (y a slugifyTitle() de lib/blogSlug.ts en catalysis-crm).
export function slugify(text: string): string {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
