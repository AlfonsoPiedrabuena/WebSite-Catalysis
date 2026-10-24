// Constantes del sitio compartidas por las Edge Functions del blog agent-friendly.
export const SITE = "https://catalysis.com.mx";
export const SITE_NAME = "Catalysis";
export const SITE_SUMMARY =
  "Consultoría en transformación digital: estrategia digital, optimización de procesos, cloud, data & analytics, IA generativa, agentes de IA, analítica predictiva y computer vision.";
export const DEFAULT_LANG = "es-MX";
export const FALLBACK_IMAGE = `${SITE}/images/catalysis_logo.png`;

// Páginas institucionales (solo HTML en fase 1; su versión markdown es backlog fase 2).
export const KEY_PAGES = [
  { title: "Inicio", path: "/", description: "Qué hace Catalysis y cómo trabaja" },
  { title: "Servicios", path: "/servicios.html", description: "Catálogo de los 9 servicios de consultoría" },
  { title: "Contacto", path: "/contacto.html", description: "Agenda un diagnóstico" },
];

// Páginas públicas indexables para el sitemap (las admin y clients/ quedan fuera a propósito).
export const SITEMAP_PAGES = [
  "/",
  "/servicios.html",
  "/contacto.html",
  "/blog.html",
  "/aviso-privacidad.html",
  "/eventsync-sv-onepager.html",
];

export const MAX_LLMS_POSTS = 50;
export const MAX_FEED_POSTS = 20;

// Caché de CDN para .md, llms.txt, sitemap y feed. Publicar sin deploy = esperar a que expire (~5 min).
export const CACHE_CONTROL = "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";
