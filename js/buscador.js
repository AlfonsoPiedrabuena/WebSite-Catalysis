/* ====================================
   BUSCADOR (Ctrl/Cmd + K)
   Panel de búsqueda sobre páginas, artículos y servicios. Las páginas y servicios salen de
   content/*.js; los artículos se leen una vez de /blog/feed.xml (si falla, solo se omite el
   grupo). Dialog con foco atrapado, Esc para cerrar y retorno del foco.
   ==================================== */
import { SERVICIOS } from '/content/servicios.mjs';

const PAGINAS = [
  { t: 'Inicio', s: 'Qué hacemos y cómo empezar', h: '/' },
  { t: 'Servicios', s: 'Los nueve servicios de Catalysis', h: '/servicios.html' },
  { t: 'Marco de madurez digital', s: 'Los cinco niveles y sus retos', h: '/marco-madurez.html' },
  { t: 'Evaluación de madurez', s: 'Seis preguntas para ubicar tu nivel', h: '/evaluacion.html' },
  { t: 'Blog y recursos', s: 'Artículos y recursos descargables', h: '/blog.html' },
  { t: 'Checklist de cierre fiscal digital', s: 'Recurso gratuito para PyMEs', h: '/recursos/checklist-cierre-fiscal.html' },
  { t: 'Contacto', s: 'Escríbenos o agenda tu diagnóstico', h: '/contacto.html' },
  { t: 'Aviso de privacidad', s: 'Cómo tratamos tus datos', h: '/aviso-privacidad.html' },
];
const SUGERENCIAS = ['Marco de madurez', 'CRM', 'Agentes de IA', 'Facturación'];
const SERVICIOS_IDX = SERVICIOS.map((s) => ({ t: s.titulo, s: s.resumen, h: `/servicios.html#servicio-${s.n}` }));

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const buscar = (lista, q) => {
  const n = norm(q).trim();
  return n === '' ? [] : lista.filter((x) => norm(x.t).includes(n) || norm(x.s).includes(n));
};

let articulos = null;
function cargarArticulos() {
  if (!articulos) {
    articulos = fetch('/blog/feed.xml')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('feed'))))
      .then((xml) => {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        return [...doc.querySelectorAll('item')].map((it) => {
          const link = it.querySelector('link')?.textContent || '';
          let h = link;
          try { const u = new URL(link); h = u.pathname + u.search; } catch { /* enlace relativo */ }
          return { t: it.querySelector('title')?.textContent || '', s: it.querySelector('category')?.textContent || 'Artículo', h, d: it.querySelector('description')?.textContent || '' };
        });
      })
      .catch(() => []);
  }
  return articulos;
}

let abierto = null;
export function abrirBuscador(opener) {
  if (abierto) { abierto.input.focus(); return; }
  const previo = opener && document.contains(opener) ? opener : document.activeElement;
  const input = Object.assign(document.createElement('input'), {
    id: 'bus-q', type: 'search', placeholder: 'Buscar páginas, artículos y servicios', autocomplete: 'off',
  });
  const etiqueta = Object.assign(document.createElement('label'), { htmlFor: 'bus-q', textContent: 'Buscar en el sitio' });
  etiqueta.className = 'sr-only';
  const cerrarBtn = Object.assign(document.createElement('button'), { type: 'button', className: 'ib', ariaLabel: 'Cerrar búsqueda' });
  cerrarBtn.setAttribute('aria-label', 'Cerrar búsqueda');
  cerrarBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const form = document.createElement('form');
  form.setAttribute('role', 'search');
  const lupa = document.createElement('span');
  lupa.setAttribute('aria-hidden', 'true');
  lupa.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A6068" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  const esc = Object.assign(document.createElement('span'), { className: 'kbd', textContent: 'Esc' });
  esc.setAttribute('aria-hidden', 'true');
  form.append(lupa, etiqueta, input, esc, cerrarBtn);
  const res = Object.assign(document.createElement('div'), { className: 'sres' });
  res.setAttribute('aria-live', 'polite');
  const caja = document.createElement('div');
  caja.className = 'sbox';
  caja.setAttribute('role', 'dialog');
  caja.setAttribute('aria-modal', 'true');
  caja.setAttribute('aria-label', 'Buscar en el sitio');
  caja.append(form, res);
  const fondo = document.createElement('div');
  fondo.className = 'sbk';
  fondo.appendChild(caja);
  document.body.appendChild(fondo);
  abierto = { input, fondo };

  const cerrar = () => {
    fondo.remove();
    document.removeEventListener('keydown', onKey, true);
    abierto = null;
    if (previo && document.contains(previo)) previo.focus();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); cerrar(); return; }
    if (e.key !== 'Tab') return;
    const foco = [...caja.querySelectorAll('a[href], button, input')].filter((el) => el.offsetParent !== null);
    if (!foco.length) return;
    const a = foco[0]; const z = foco[foco.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };
  document.addEventListener('keydown', onKey, true);
  fondo.addEventListener('mousedown', (e) => { if (e.target === fondo) cerrar(); });
  cerrarBtn.addEventListener('click', cerrar);
  form.addEventListener('submit', (e) => e.preventDefault());

  function pintar(q) {
    const hayQ = q.trim() !== '';
    if (!hayQ) {
      const sug = document.createElement('div');
      sug.className = 'sres__hint';
      sug.append(Object.assign(document.createElement('div'), { className: 'eyebrow', textContent: 'Prueba con' }));
      const fila = Object.assign(document.createElement('div'), { className: 'sres__sug' });
      SUGERENCIAS.forEach((t) => {
        const b = Object.assign(document.createElement('button'), { type: 'button', textContent: t });
        b.addEventListener('click', () => { input.value = t; pintar(t); input.focus(); });
        fila.appendChild(b);
      });
      sug.append(fila, Object.assign(document.createElement('div'), { textContent: 'Atajo en el sitio: Ctrl K (o ⌘ K en Mac).' }));
      res.replaceChildren(sug);
      return;
    }
    const grupos = [['Páginas', buscar(PAGINAS, q)], ['Artículos', buscar(articulos_ || [], q)], ['Servicios', buscar(SERVICIOS_IDX, q)]]
      .filter(([, items]) => items.length);
    if (!grupos.length) {
      const vacio = document.createElement('div');
      vacio.className = 'sres__empty';
      vacio.setAttribute('role', 'status');
      const strong = Object.assign(document.createElement('strong'), { textContent: `Sin resultados para “${q.trim()}”` });
      const p = Object.assign(document.createElement('p'), { textContent: 'Revisa la ortografía o prueba con una palabra más corta, por ejemplo “CRM” o “madurez”.' });
      const acciones = Object.assign(document.createElement('div'), { className: 'btn-row' });
      const limpiar = Object.assign(document.createElement('button'), { type: 'button', className: 'btn btn--outline', textContent: 'Limpiar búsqueda' });
      limpiar.addEventListener('click', () => { input.value = ''; pintar(''); input.focus(); });
      const escribir = Object.assign(document.createElement('a'), { className: 'btn btn--primary', href: '/contacto.html', textContent: 'Escríbenos tu duda' });
      acciones.append(limpiar, escribir);
      vacio.append(strong, p, acciones);
      res.replaceChildren(vacio);
      return;
    }
    res.replaceChildren(...grupos.map(([titulo, items]) => {
      const g = Object.assign(document.createElement('div'), { className: 'sres__group' });
      g.append(Object.assign(document.createElement('div'), { className: 'sres__title', textContent: `${titulo.toUpperCase()} · ${items.length}` }));
      items.slice(0, 4).forEach((it) => {
        const a = Object.assign(document.createElement('a'), { href: it.h });
        a.append(Object.assign(document.createElement('span'), { textContent: it.t }), Object.assign(document.createElement('span'), { textContent: it.s }));
        g.appendChild(a);
      });
      return g;
    }));
  }

  let articulos_ = null;
  cargarArticulos().then((lista) => { articulos_ = lista; if (abierto) pintar(input.value); });
  input.addEventListener('input', () => pintar(input.value));
  pintar('');
  input.focus();
}
