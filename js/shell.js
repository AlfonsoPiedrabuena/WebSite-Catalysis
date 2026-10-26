/* ====================================
   SHELL: menú móvil, atajos, buscador y flotantes
   Carga en todas las páginas públicas rediseñadas (shell/bottom.html).
   Los flotantes y el buscador se cargan bajo demanda para no pesar en el LCP.
   ==================================== */

const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---------- año del pie ----------
$$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

// ---------- menú móvil ----------
const menuBtn = document.querySelector('[data-menu-toggle]');
const menu = document.getElementById('mbar-menu');
const ICON_MENU = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F4F2EC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const ICON_CLOSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F4F2EC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function setMenu(open) {
  if (!menuBtn || !menu) return;
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.innerHTML = open ? ICON_CLOSE : ICON_MENU;
}
if (menuBtn && menu) {
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
  });
}

// ---------- módulos bajo demanda ----------
let flotantes = null;
function cargarFlotantes() {
  if (!flotantes) flotantes = import('/js/flotantes.js');
  return flotantes;
}
let buscador = null;
function cargarBuscador() {
  if (!buscador) buscador = import('/js/buscador.js');
  return buscador;
}

document.addEventListener('click', (e) => {
  const chat = e.target.closest('[data-chat-open]');
  if (chat) {
    e.preventDefault();
    setMenu(false);
    cargarFlotantes().then((m) => m.abrirChat(chat));
    return;
  }
  const search = e.target.closest('[data-search-open]');
  if (search) {
    e.preventDefault();
    setMenu(false);
    cargarBuscador().then((m) => m.abrirBuscador(search));
  }
});

// Flotantes: tras la carga y un momento de reposo (no compiten con el LCP)
function programarFlotantes() {
  const arrancar = () => cargarFlotantes();
  if ('requestIdleCallback' in window) window.requestIdleCallback(arrancar, { timeout: 4000 });
  else setTimeout(arrancar, 2000);
}
if (document.readyState === 'complete') programarFlotantes();
else window.addEventListener('load', programarFlotantes, { once: true });

// ---------- atajos de teclado ----------
// Ctrl/Cmd + K siempre abre el buscador. Los de una sola tecla (I S M E B R C) se pueden
// desactivar (WCAG 2.1.4) y no actúan con foco en un campo ni con un panel abierto.
const KEY_PREF = 'cat_shortcuts';
const leerPref = () => { try { return localStorage.getItem(KEY_PREF) !== 'off'; } catch { return true; } };
const guardarPref = (on) => { try { localStorage.setItem(KEY_PREF, on ? 'on' : 'off'); } catch { /* sin almacenamiento */ } };
let atajos = leerPref();

const toggle = document.querySelector('[data-shortcuts-toggle]');
function pintarToggle() {
  if (!toggle) return;
  toggle.setAttribute('aria-pressed', String(atajos));
  toggle.textContent = `Atajos de teclado: ${atajos ? 'activados' : 'desactivados'}`;
  document.querySelectorAll('.nv__key').forEach((k) => { k.hidden = !atajos; });
}
if (toggle) {
  toggle.addEventListener('click', () => { atajos = !atajos; guardarPref(atajos); pintarToggle(); });
  pintarToggle();
}

const enCampo = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    cargarBuscador().then((m) => m.abrirBuscador(document.activeElement));
    return;
  }
  if (!atajos || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.defaultPrevented) return;
  if (enCampo(e.target) || document.querySelector('.sbk, .fpanel')) return;
  const link = document.querySelector(`.side .nv[data-key="${e.key.toLowerCase()}"]`);
  if (link) { e.preventDefault(); location.href = link.getAttribute('href'); }
});
