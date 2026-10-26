/* ====================================
   CONTACTO: FORMULARIO COMPLETO → CATALYSIS CRM
   Valida con js/lib/lead-form.mjs (compartido con los flotantes), muestra errores por campo,
   verifica con Turnstile y envía a /.netlify/functions/lead-register (canal 'sitio-contacto').
   js/attribution.js debe cargar antes (lo hace shell/bottom.html): aporta contacto.fuente.
   ==================================== */
import { validarLead, construirPayload, enviarLead, limpiarTelefono } from '/js/lib/lead-form.mjs';
import { montarTurnstile } from '/js/lib/turnstile.mjs';
import { SECTOR_ETIQUETAS, buscarSector, norm } from '/js/data/sectores.mjs';

const $ = (id) => document.getElementById(id);
const form = $('contactForm');
const campos = ['nombre', 'apellido', 'correo', 'tel', 'empresa', 'sector', 'nivel', 'priv'];
let enviando = false;

const turnstile = montarTurnstile($('turnstile-slot'));

// ---------- teléfono: solo números, espacios, + y - ----------
$('tel').addEventListener('input', (e) => {
  const limpio = limpiarTelefono(e.target.value);
  if (limpio !== e.target.value) e.target.value = limpio;
});

// ---------- selector de sector con búsqueda (combobox) ----------
const sector = $('sector');
const lista = $('sector-list');
let opciones = [];
let activa = -1;

function abrirLista(abrir) {
  lista.hidden = !abrir;
  sector.setAttribute('aria-expanded', String(abrir));
  if (!abrir) { activa = -1; sector.removeAttribute('aria-activedescendant'); }
}
function pintarLista() {
  const q = norm(sector.value);
  const coincidencias = SECTOR_ETIQUETAS.filter((s) => q === '' || norm(s).includes(q));
  opciones = coincidencias.slice(0, 6);
  activa = -1;
  const filas = opciones.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'combo__opt';
    b.id = `sector-op-${i}`;
    b.setAttribute('role', 'option');
    b.setAttribute('aria-selected', 'false');
    b.tabIndex = -1;
    b.textContent = s;
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => elegirSector(s));
    return b;
  });
  const nota = document.createElement('div');
  nota.className = 'combo__note';
  nota.textContent = coincidencias.length === 0
    ? 'Sin coincidencias. Prueba con otra palabra.'
    : coincidencias.length > 6 ? `${coincidencias.length - 6} sectores más. Sigue escribiendo para filtrar.` : '';
  lista.replaceChildren(...filas, ...(nota.textContent ? [nota] : []));
  abrirLista(true);
}
function elegirSector(s) {
  sector.value = s;
  abrirLista(false);
  limpiarError('sector');
}
function moverActiva(delta) {
  if (lista.hidden) pintarLista();
  if (!opciones.length) return;
  activa = (activa + delta + opciones.length) % opciones.length;
  lista.querySelectorAll('[role="option"]').forEach((b, i) => b.setAttribute('aria-selected', String(i === activa)));
  sector.setAttribute('aria-activedescendant', `sector-op-${activa}`);
}
sector.addEventListener('input', pintarLista);
sector.addEventListener('focus', pintarLista);
sector.addEventListener('blur', () => setTimeout(() => abrirLista(false), 120));
sector.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moverActiva(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moverActiva(-1); }
  else if (e.key === 'Enter' && !lista.hidden && activa >= 0) { e.preventDefault(); elegirSector(opciones[activa]); }
  else if (e.key === 'Escape' && !lista.hidden) { e.stopPropagation(); abrirLista(false); }
});

// ---------- errores ----------
function limpiarError(campo) {
  const input = $(campo);
  const err = $(`${campo}-e`);
  if (input && input.type !== 'checkbox') input.setAttribute('aria-invalid', 'false');
  if (err) { err.hidden = true; err.replaceChildren(); }
}
const ICONO_ERR = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>';
function marcarErrores(errores) {
  for (const c of campos) {
    const msg = errores[c];
    const input = $(c);
    const err = $(`${c}-e`);
    if (input.type !== 'checkbox') input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    err.hidden = !msg;
    err.innerHTML = msg ? ICONO_ERR : '';
    if (msg) err.append(Object.assign(document.createElement('span'), { textContent: msg }));
  }
}
function banner(tipo, titulo, texto) {
  const b = $('form-banner');
  if (!tipo) { b.hidden = true; b.replaceChildren(); return; }
  b.hidden = false;
  b.innerHTML = ICONO_ERR.replace('width="14" height="14"', 'width="18" height="18"');
  const d = document.createElement('div');
  d.append(Object.assign(document.createElement('strong'), { textContent: titulo }), document.createElement('br'), document.createTextNode(texto));
  b.append(d);
}

// ---------- envío ----------
function valores() {
  const g = (id) => $(id).value;
  return {
    nombre: g('nombre'), apellido: g('apellido'), correo: g('correo'), tel: g('tel'), empresa: g('empresa'),
    sector: g('sector'), nivel: g('nivel'), priv: $('priv').checked, wa: $('wa').checked,
  };
}
function fijarEnviando(on) {
  enviando = on;
  const btn = $('enviar');
  btn.disabled = on;
  btn.textContent = on ? 'Enviando…' : btn.dataset.reintento ? 'Reintentar envío' : 'Enviar consulta';
  form.querySelectorAll('input, select').forEach((i) => { i.disabled = on; });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (enviando) return;
  const v = valores();
  const errores = validarLead(v, { apellido: true, tel: 'requerido', sector: true, nivel: true }, buscarSector);
  marcarErrores(errores);
  const fallidos = campos.filter((c) => errores[c]);
  if (fallidos.length) {
    banner('error', `Revisa ${fallidos.length === 1 ? 'el campo marcado' : `los ${fallidos.length} campos marcados`} antes de enviar`, 'Cada campo marcado explica qué falta.');
    $(fallidos[0]).focus();
    return;
  }
  banner(null);

  const etiqueta = buscarSector(v.sector).etiqueta;
  const payload = construirPayload({ ...v, sector: etiqueta }, { canal: 'sitio-contacto' });
  fijarEnviando(true);
  const res = await enviarLead(payload, turnstile.token());
  fijarEnviando(false);

  if (res.ok) {
    window.catTrack && window.catTrack.lead({ lead_source: 'contact_page', nivel_madurez: v.nivel });
    delete $('enviar').dataset.reintento;
    form.hidden = true;
    $('contact-ok').hidden = false;
    $('contact-ok').querySelector('h2').scrollIntoView({ behavior: 'smooth', block: 'center' });
    turnstile.reset();
    return;
  }
  console.error('Error al enviar el formulario de contacto:', res);
  $('enviar').dataset.reintento = '1';
  $('enviar').textContent = 'Reintentar envío';
  banner('error', 'No pudimos enviar tu mensaje', res.tipo === 'turnstile' ? res.mensaje : 'Tus datos siguen aquí, no se perdió nada. Intenta de nuevo; si el problema continúa, escríbenos a contacto@catalysis.com.mx.');
  turnstile.reset();
});

$('otra-consulta').addEventListener('click', () => {
  form.reset();
  marcarErrores({});
  banner(null);
  $('contact-ok').hidden = true;
  form.hidden = false;
  $('nombre').focus();
});
