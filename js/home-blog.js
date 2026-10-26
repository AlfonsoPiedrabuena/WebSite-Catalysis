/* ====================================
   HOME: BLOG (destacado + 3 recientes)
   El SDK de Firebase se carga tras el primer pintado para no pesar en el LCP.
   Si algo falla, la sección queda con el enlace al blog (nunca un error visible).
   ==================================== */
import { obtenerDb, publicados, destacadoHome, filaPost } from '/js/lib/blog-data.mjs';

const cont = document.getElementById('home-blog');

async function cargar() {
  try {
    const db = await obtenerDb();
    const posts = await publicados(db, 12);
    if (!posts.length) { cont.closest('section').hidden = true; return; }
    const [destacado, ...resto] = posts;
    const lista = document.createElement('div');
    lista.className = 'blog-home__list';
    lista.append(...resto.slice(0, 3).map(filaPost));
    cont.replaceChildren(destacadoHome(destacado), lista);
  } catch (e) {
    console.error('Blog en la home no disponible:', e);
    cont.replaceChildren(Object.assign(document.createElement('a'), { href: '/blog.html', className: 'link-text', textContent: 'Lee los artículos más recientes en el blog.' }));
  }
}

const arrancar = () => ('requestIdleCallback' in window ? window.requestIdleCallback(cargar, { timeout: 3000 }) : setTimeout(cargar, 800));
if (document.readyState === 'complete') arrancar(); else window.addEventListener('load', arrancar, { once: true });
