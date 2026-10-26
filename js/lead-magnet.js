/* ====================================
   LEAD MAGNET: Checklist de cierre fiscal digital
   Formulario corto (nombre, correo, empresa, privacidad) → lead-register con
   fuente.canal = 'lead-magnet' y fuente.leadMagnet = id. La descarga solo aparece
   tras respuesta correcta; sin correo (la promesa es "descárgalo al instante").
   ==================================== */
import { validarLead, construirPayload, enviarLead } from '/js/lib/lead-form.mjs';
import { montarTurnstile } from '/js/lib/turnstile.mjs';

const LEAD_MAGNET_ID = 'checklist-cierre-fiscal';
const $ = (id) => document.getElementById(id);
const form = $('lm-form');
const campos = [['nombre', 'lm-nombre'], ['correo', 'lm-correo'], ['empresa', 'lm-empresa'], ['priv', 'lm-priv']];
const turnstile = montarTurnstile($('lm-turnstile'));
let enviando = false;

const ICONO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>';

function marcar(errores) {
  for (const [campo, id] of campos) {
    const input = $(id);
    const err = $(`${id}-e`);
    const msg = errores[campo];
    if (input.type !== 'checkbox') input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    err.hidden = !msg;
    err.innerHTML = msg ? ICONO : '';
    if (msg) err.append(Object.assign(document.createElement('span'), { textContent: msg }));
  }
}
function banner(titulo, texto) {
  const b = $('lm-banner');
  b.hidden = !titulo;
  b.replaceChildren();
  if (!titulo) return;
  b.append(Object.assign(document.createElement('div'), {}));
  b.firstChild.append(Object.assign(document.createElement('strong'), { textContent: titulo }), document.createElement('br'), document.createTextNode(texto));
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (enviando) return;
  const v = {
    nombre: $('lm-nombre').value, correo: $('lm-correo').value, empresa: $('lm-empresa').value,
    nivel: $('lm-nivel').value, priv: $('lm-priv').checked, wa: false,
  };
  const errores = validarLead(v);
  marcar(errores);
  const primero = campos.find(([c]) => errores[c]);
  if (primero) {
    banner(`Revisa ${Object.keys(errores).length === 1 ? 'el campo marcado' : `los ${Object.keys(errores).length} campos marcados`} antes de enviar`, 'Cada campo marcado explica qué falta.');
    $(primero[1]).focus();
    return;
  }
  banner(null);

  enviando = true;
  const btn = $('lm-enviar');
  btn.disabled = true; btn.textContent = 'Enviando…';
  form.querySelectorAll('input, select').forEach((i) => { i.disabled = true; });
  const res = await enviarLead(construirPayload(v, { canal: 'lead-magnet', leadMagnet: LEAD_MAGNET_ID }), turnstile.token());
  enviando = false;
  btn.disabled = false; btn.textContent = res.ok ? 'Quiero el checklist' : 'Reintentar envío';
  form.querySelectorAll('input, select').forEach((i) => { i.disabled = false; });

  if (res.ok) {
    window.catTrack && window.catTrack.lead({ lead_source: 'lead_magnet', lead_magnet_id: LEAD_MAGNET_ID });
    form.hidden = true;
    $('lm-ok').hidden = false;
    $('lm-ok').querySelector('a').focus();
    return;
  }
  banner('No pudimos enviar tus datos', res.tipo === 'turnstile' ? res.mensaje : 'Tus datos siguen aquí. Intenta de nuevo; si el problema continúa, escríbenos a contacto@catalysis.com.mx.');
  turnstile.reset();
});
