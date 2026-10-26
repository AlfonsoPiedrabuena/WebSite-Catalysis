/* ====================================
   BLOG: DATOS Y TARJETAS (compartido por blog.html, la home y blog-post)
   Lee blog_posts de Firestore (solo publicados) y crea tarjetas con DOM seguro
   (textContent): el contenido de los posts nunca se interpola como HTML aquí.
   ==================================== */
import { RECURSO_POR_SLUG } from '/content/recursos.mjs';

const SDK = [
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
];

function cargarClasico(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`No cargó ${src}`));
    document.head.appendChild(s);
  });
}

/** Asegura window.firestoreDb (carga el SDK y la config si la página no los trae). */
export async function obtenerDb() {
  if (window.firestoreDb) return window.firestoreDb;
  if (typeof window.firebase === 'undefined') {
    for (const src of SDK) await cargarClasico(src);
  }
  if (!window.firestoreDb) await cargarClasico('/js/firebase-config.js');
  if (typeof window.getPostSlug !== 'function') await cargarClasico('/js/blog-utils.js');
  if (!window.firestoreDb) throw new Error('Firebase no inicializó');
  return window.firestoreDb;
}

/**
 * Posts publicados, el más reciente primero. Se pide orderBy sin where (evita el índice
 * compuesto) y se filtra `publicado === true` en el cliente: nunca se muestran borradores.
 */
export async function publicados(db, limite = 50) {
  if (typeof window.getPostSlug !== 'function') await cargarClasico('/js/blog-utils.js');
  const snap = await db.collection('blog_posts').orderBy('fecha_publicacion', 'desc').limit(limite).get();
  const out = [];
  snap.forEach((doc) => {
    const data = doc.data();
    if (data.publicado !== true) return;
    const slug = window.getPostSlug(data);
    out.push({
      id: doc.id,
      data,
      slug,
      url: `/blog-post.html?id=${encodeURIComponent(slug || doc.id)}`,
      fecha: data.fecha_publicacion && data.fecha_publicacion.toDate ? data.fecha_publicacion.toDate() : null,
    });
  });
  return out;
}

export const formatearFecha = (fecha) =>
  fecha ? fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export function resumenCorto(texto, max = 150) {
  const t = String(texto || '').trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
}

const span = (clase, texto) => {
  const el = document.createElement('span');
  if (clase) el.className = clase;
  el.textContent = texto;
  return el;
};

/** Imagen de portada decorativa (el título ya está en el encabezado de la tarjeta). */
function portada(data) {
  if (!data.imagen_portada) return null;
  const img = document.createElement('img');
  img.src = data.imagen_portada;
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}

/** Tarjeta de la cuadrícula del blog. */
export function tarjetaPost(post) {
  const { data } = post;
  const a = document.createElement('a');
  a.className = 'card card--link post-card';
  a.href = post.url;
  const img = portada(data);
  if (img) a.appendChild(img);
  const top = document.createElement('div');
  top.className = 'card__top';
  top.append(span('cat', data.categoria || 'General'), span('date', formatearFecha(post.fecha)));
  const h3 = document.createElement('h3');
  h3.textContent = data.titulo || '';
  const p = document.createElement('p');
  p.className = 'card__text';
  p.textContent = resumenCorto(data.resumen);
  const pie = document.createElement('div');
  pie.className = 'post-card__foot';
  const descargable = !!RECURSO_POR_SLUG[post.slug];
  pie.append(span('', data.autor || 'Equipo Catalysis'), span(`pill${descargable ? '' : ' pill--plain'}`, descargable ? 'Descargable' : 'Leer'));
  a.append(top, h3, p, pie);
  return a;
}

/** Fila compacta (home) */
export function filaPost(post) {
  const { data } = post;
  const a = document.createElement('a');
  a.className = 'post-row';
  a.href = post.url;
  const img = portada(data);
  if (img) a.appendChild(img);
  const cuerpo = document.createElement('div');
  cuerpo.className = 'post-row__body';
  const meta = document.createElement('div');
  meta.className = 'post-row__meta';
  meta.append(span('cat', data.categoria || 'General'), span('date', formatearFecha(post.fecha)));
  const h3 = document.createElement('h3');
  h3.className = 'h3';
  h3.style.fontSize = '16px';
  h3.textContent = data.titulo || '';
  cuerpo.append(meta, h3);
  a.appendChild(cuerpo);
  return a;
}

/** Destacado de la home. */
export function destacadoHome(post) {
  const { data } = post;
  const a = document.createElement('a');
  a.className = 'blog-home__featured';
  a.href = post.url;
  const arriba = document.createElement('div');
  arriba.style.cssText = 'display:flex;flex-direction:column;gap:16px';
  const meta = document.createElement('div');
  meta.className = 'featured__meta';
  meta.append(span('pill', 'Destacado'), span('date', data.categoria || 'General'));
  arriba.appendChild(meta);
  const img = portada(data);
  if (img) { img.style.cssText = 'width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px'; arriba.appendChild(img); }
  const h3 = document.createElement('h3');
  h3.className = 'h2';
  h3.style.fontSize = '30px';
  h3.textContent = data.titulo || '';
  const p = document.createElement('p');
  p.style.cssText = 'font-size:15px;line-height:1.6;color:var(--ink-2)';
  p.textContent = resumenCorto(data.resumen, 260);
  arriba.append(h3, p);
  const pie = span('', `${data.autor || 'Equipo Catalysis'} · ${formatearFecha(post.fecha)}`);
  pie.style.cssText = 'font-size:13px;color:var(--ink-3)';
  a.append(arriba, pie);
  return a;
}

/** Destacado del blog (ancho completo): portada a la izquierda, texto a la derecha. */
export function destacadoBlog(post) {
  const { data } = post;
  const a = document.createElement('a');
  a.className = 'featured';
  a.href = post.url;
  const img = portada(data);
  if (img) a.appendChild(img);
  const cuerpo = document.createElement('div');
  cuerpo.className = 'featured__body';
  const meta = document.createElement('div');
  meta.className = 'featured__meta';
  meta.append(span('pill', 'Destacado'), span('date', `${data.categoria || 'General'} · ${formatearFecha(post.fecha)}`));
  const h2 = document.createElement('h2');
  h2.className = 'h2';
  h2.textContent = data.titulo || '';
  const p = document.createElement('p');
  p.style.cssText = 'font-size:15px;line-height:1.6;color:var(--ink-2)';
  p.textContent = resumenCorto(data.resumen, 300);
  cuerpo.append(meta, h2, p, span('card__cta', 'Leer artículo'));
  a.appendChild(cuerpo);
  return a;
}
