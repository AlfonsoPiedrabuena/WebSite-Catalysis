// Decide por preferencia (q-values) si el cliente quiere markdown o HTML.
// Empate o ausencia de preferencia explícita por markdown → HTML (comportamiento actual).
export function prefersMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  const q = new Map<string, number>();
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().toLowerCase().split(";");
    if (!type) continue;
    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const value = qParam ? parseFloat(qParam.slice(2)) : 1;
    q.set(type.trim(), Number.isNaN(value) ? 1 : value);
  }
  const md = q.get("text/markdown");
  if (md === undefined || md <= 0) return false;
  // Un comodín (*/*, text/*) no cuenta como pedir markdown: debe estar nombrado.
  const html = Math.max(q.get("text/html") ?? 0, q.get("application/xhtml+xml") ?? 0);
  return md > html;
}
