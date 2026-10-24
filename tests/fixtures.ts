import type { Post } from "../netlify/edge-lib/post.ts";

export const post = (over: Partial<Post> = {}): Post => ({
  titulo: "Cómo automatizar procesos con BI + CRM",
  slug: "como_automatizar_procesos_con_bi_crm",
  resumen: "Una guía práctica.",
  contenido: '<h2>Intro</h2><p>Hola <a href="/servicios.html">servicios</a></p><img src="images/a.png" alt="a">',
  autor: "Ana",
  categoria: "BI",
  tags: ["bi", "crm"],
  imagen: "https://catalysis.com.mx/images/cover.png",
  publicado: true,
  fechaPublicacion: "2026-10-01T15:00:00Z",
  lang: "es-MX",
  ...over,
});
