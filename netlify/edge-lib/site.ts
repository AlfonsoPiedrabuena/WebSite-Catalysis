// Constantes del sitio compartidas por las Edge Functions del blog agent-friendly.
export const SITE = "https://catalysis.com.mx";
export const SITE_NAME = "Catalysis";
export const SITE_SUMMARY =
  "Consultoría en transformación digital: estrategia digital, optimización de procesos, cloud, data & analytics, IA generativa, agentes de IA, analítica predictiva y computer vision.";
export const DEFAULT_LANG = "es-MX";
export const FALLBACK_IMAGE = `${SITE}/images/catalysis_logo.png`;

// Páginas institucionales. Servicios y marco de madurez tienen versión markdown estática
// (/servicios.md, /marco-madurez.md; las genera scripts/build-content.mjs desde content/*.js).
export const KEY_PAGES = [
  { title: "Inicio", path: "/", description: "Qué hace Catalysis y cómo trabaja" },
  { title: "Servicios", path: "/servicios.html", description: "Catálogo de los 9 servicios de consultoría" },
  { title: "Servicios (markdown)", path: "/servicios.md", description: "Los 9 servicios y la metodología en texto plano" },
  { title: "Marco de madurez digital", path: "/marco-madurez.html", description: "Los cinco niveles de madurez digital, sus características y retos" },
  { title: "Marco de madurez digital (markdown)", path: "/marco-madurez.md", description: "El marco de madurez completo en texto plano" },
  { title: "Evaluación de madurez", path: "/evaluacion.html", description: "Seis preguntas para ubicar el nivel de madurez digital de una empresa" },
  { title: "Checklist de cierre fiscal digital", path: "/recursos/checklist-cierre-fiscal.html", description: "Recurso gratuito para PyMEs" },
  { title: "Contacto", path: "/contacto.html", description: "Agenda un diagnóstico" },
];

// Páginas públicas indexables para el sitemap (las admin y clients/ quedan fuera a propósito).
export const SITEMAP_PAGES = [
  "/",
  "/servicios.html",
  "/marco-madurez.html",
  "/evaluacion.html",
  "/recursos/checklist-cierre-fiscal.html",
  "/contacto.html",
  "/blog.html",
  "/aviso-privacidad.html",
  "/eventsync-sv-onepager.html",
];

export const MAX_LLMS_POSTS = 50;
export const MAX_FEED_POSTS = 20;

// Caché de CDN para .md, llms.txt, sitemap y feed. Publicar sin deploy = esperar a que expire (~5 min).
export const CACHE_CONTROL = "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";
