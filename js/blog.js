/* ====================================
   BLOG: LISTADO DESDE FIRESTORE
   Solo posts publicados (nunca borradores). Destacado = el publicado más reciente.
   Filtros por categoría sobre los posts cargados y "Cargar más" de 9 en 9, para no
   perder posts cuando haya más de 12. Estados: cargando, vacío, error y sin resultados.
   ==================================== */
import { obtenerDb, publicados, tarjetaPost, destacadoBlog } from '/js/lib/blog-data.mjs';

const POR_PAGINA = 9;
const $ = (id) => document.getElementById(id);
const el = {
  carga: $('estado-carga'), grid: $('posts-grid'), mas: $('mas'), vacio: $('estado-vacio'), error: $('estado-error'),
  filtros: $('filtros'), conteo: $('conteo'), destacadoSec: $('destacado-sec'), destacado: $('destacado'),
};
const estado = { posts: [], categoria: 'Todos', mostrados: POR_PAGINA };

function ver(que) {
  el.carga.hidden = que !== 'carga';
  el.grid.hidden = que !== 'ok';
  el.vacio.hidden = que !== 'vacio' && que !== 'vacio-categoria';
  el.error.hidden = que !== 'error';
  if (que !== 'ok') el.mas.hidden = true;
}

function pintarFiltros() {
  const cats = ['Todos', ...new Set(estado.posts.map((p) => p.data.categoria || 'General'))];
  el.filtros.replaceChildren(...cats.map((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fchip';
    b.textContent = c;
    b.setAttribute('aria-pressed', String(c === estado.categoria));
    b.addEventListener('click', () => { estado.categoria = c; estado.mostrados = POR_PAGINA; pintar(); });
    return b;
  }));
}

function pintar() {
  const filtrados = estado.posts.filter((p) => estado.categoria === 'Todos' || (p.data.categoria || 'General') === estado.categoria);
  // El destacado (el publicado más reciente) tiene su propio bloque: no se repite en la cuadrícula
  const resto = filtrados.filter((p) => p !== estado.posts[0]);
  const visibles = resto.slice(0, estado.mostrados);

  pintarFiltros();
  el.conteo.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'artículo' : 'artículos'}`;

  if (!filtrados.length) {
    $('vacio-titulo').textContent = 'Aún no hay artículos en esta categoría';
    $('vacio-texto').textContent = 'Prueba con otra categoría o vuelve pronto.';
    ver('vacio-categoria');
    return;
  }
  el.grid.replaceChildren(...visibles.map(tarjetaPost));
  ver('ok');
  el.grid.hidden = visibles.length === 0;
  el.mas.hidden = resto.length <= visibles.length;
}

async function cargar() {
  ver('carga');
  el.conteo.textContent = 'Cargando…';
  try {
    const db = await obtenerDb();
    estado.posts = await publicados(db);
    if (!estado.posts.length) {
      $('vacio-titulo').textContent = 'Todavía no hay artículos publicados';
      $('vacio-texto').textContent = 'Estamos preparando contenido nuevo. Mientras tanto, conoce el nivel de madurez digital de tu empresa.';
      el.conteo.textContent = '';
      el.filtros.replaceChildren();
      ver('vacio');
      return;
    }
    const [destacado] = estado.posts;
    el.destacado.replaceChildren(destacadoBlog(destacado));
    el.destacadoSec.hidden = false;
    pintar();
  } catch (e) {
    console.error('Error al cargar el blog:', e);
    el.conteo.textContent = '';
    ver('error');
  }
}

el.mas.querySelector('button').addEventListener('click', () => { estado.mostrados += POR_PAGINA; pintar(); });
$('reintentar').addEventListener('click', cargar);
cargar();
