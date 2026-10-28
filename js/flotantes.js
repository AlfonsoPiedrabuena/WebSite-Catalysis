/* ====================================
   BOTONES FLOTANTES: FORMULARIO CORTO Y ASISTENTE AUTOMÁTICO
   Se carga bajo demanda desde js/shell.js. Dos botones fijos ("Agenda tu diagnóstico" y
   "Habla con el agente"), paneles excluyentes (dialog con foco atrapado, Esc para cerrar,
   retorno del foco). Ambos envían por el mismo flujo que Contacto (js/lib/lead-form.mjs →
   lead-register, con Turnstile e idempotencia). El asistente es un guion fijo sin IA
   (js/lib/asistente.mjs); en Contacto solo se oculta el botón del formulario.
   ==================================== */
import {
  validarLead, construirPayload, enviarLead, limpiarTelefono, LIMITES,
} from '/js/lib/lead-form.mjs';
import { montarTurnstile } from '/js/lib/turnstile.mjs';
import { prepararHistorial, enviarHistorial, resultadoDe } from '/js/lib/chat-log.mjs';
import { SECTOR_ETIQUETAS } from '/js/data/sectores.mjs';
import {
  estadoInicial, generarClave, reducir, chips, enlaces, filasConfirmacion, datosParaLead, entradaDeTexto, CALENDLY,
} from '/js/lib/asistente.mjs';

const NS = 'http://www.w3.org/2000/svg';
const SS_NUDGE = 'cat_nudge_cerrado';
const enContacto = !!document.querySelector('.side .nv[data-nav="contacto"][aria-current="page"]');

// ---------- utilidades de DOM ----------
function h(tag, props = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...hijos.flat().filter((x) => x !== null && x !== undefined && x !== false));
  return el;
}
function icono(paths, size = 18) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = paths;
  return svg;
}
const ICO = {
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
  reiniciar: '<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/>',
  enviar: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  agenda: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  alerta: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  ok: '<path d="M5 12l5 5 9-10"/>',
  espera: '<path d="M21 12a9 9 0 11-6.2-8.55"/>',
};
const track = (name, params) => window.catTrack && window.catTrack.event(name, params);

// ---------- estado ----------
const S = {
  abierto: 'ninguno',          // 'ninguno' | 'form' | 'chat'
  opener: null,
  form: { status: 'idle', mas: false, enviado: null },
  chat: null,          // se crea justo debajo (necesita nuevoLog)
  log: null,           // historial de la conversación: { clave, inicio, sello, ultimo, cola }
  guardando: false,
};
let raiz;           // .fdock
let panelEl = null; // panel abierto
let tsForm = null;
let tsChat = null;
let tsLog = null;   // widget aparte para el historial: el token de tsChat es de un solo uso y lo necesita el registro
let btnForm = null;
let btnChat = null;

// ---------- montaje ----------
function montar() {
  if (raiz) return;
  btnForm = enContacto ? null : h('button', {
    type: 'button', class: 'fbtn fbtn--primary', 'aria-expanded': 'false', 'aria-haspopup': 'dialog',
    'data-cta': 'flotante_diagnostico', 'data-cta-location': 'flotante',
    onclick: (e) => alternar('form', e.currentTarget),
  }, icono(ICO.agenda, 20), h('span', { text: 'Agenda tu diagnóstico' }));
  btnChat = h('button', {
    type: 'button', class: 'fbtn fbtn--dark dk', 'aria-expanded': 'false', 'aria-haspopup': 'dialog',
    onclick: (e) => alternar('chat', e.currentTarget),
  }, h('span', { class: 'fdot', 'aria-hidden': 'true' }), h('span', { text: 'Habla con el agente' }));
  raiz = h('div', { class: 'fdock', id: 'flotantes' }, h('div', { class: 'fbtns' }, btnForm, btnChat));
  document.body.appendChild(raiz);
  programarSugerencia();
}

// ---------- sugerencia (burbuja) ----------
let nudge = null;
function programarSugerencia() {
  let cerrada = false;
  try { cerrada = sessionStorage.getItem(SS_NUDGE) === '1'; } catch { /* sin almacenamiento */ }
  if (cerrada) return;
  const mostrar = () => {
    if (nudge || S.abierto !== 'ninguno') return;
    nudge = h('div', { class: 'fnudge' },
      h('button', { type: 'button', text: 'Hola, ¿te ayudo a crear tu registro y agendar tu diagnóstico?', onclick: () => { quitarSugerencia(); abrir('chat', btnChat); } }),
      h('button', { type: 'button', class: 'ib', 'aria-label': 'Cerrar sugerencia', onclick: quitarSugerencia }, icono(ICO.cerrar, 16)));
    raiz.insertBefore(nudge, raiz.firstChild);
    window.removeEventListener('scroll', onScroll);
  };
  const onScroll = () => { if (window.scrollY > 320) mostrar(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  setTimeout(mostrar, 9000);
}
function quitarSugerencia() {
  if (nudge) { nudge.remove(); nudge = null; }
  try { sessionStorage.setItem(SS_NUDGE, '1'); } catch { /* sin almacenamiento */ }
}

// ---------- abrir / cerrar ----------
function alternar(cual, opener) {
  if (S.abierto === cual) cerrar(); else abrir(cual, opener);
}
function abrir(cual, opener) {
  montar();
  quitarSugerencia();
  if (S.abierto !== 'ninguno') cerrar({ devolverFoco: false });
  S.abierto = cual;
  S.opener = opener || document.activeElement;
  panelEl = cual === 'form' ? construirForm() : construirChat();
  raiz.insertBefore(panelEl, raiz.firstChild);
  btnForm && btnForm.setAttribute('aria-expanded', String(cual === 'form'));
  btnChat.setAttribute('aria-expanded', String(cual === 'chat'));
  document.addEventListener('keydown', onKey, true);
  ajustarTeclado();
  if (cual === 'form') { tsForm = tsForm || montarTurnstile(panelEl.querySelector('.turnstile-slot'), { appearance: 'interaction-only' }); }
  if (cual === 'chat') {
    tsChat = montarTurnstile(panelEl.querySelector('.turnstile-slot'), { appearance: 'interaction-only' });
    if (!S.log.sello) tsLog = montarTurnstile(panelEl.querySelector('.chat__tslog'), { appearance: 'interaction-only' });
  }
  track(cual === 'form' ? 'flotante_form_abrir' : 'flotante_chat_abrir', {});
  const primero = panelEl.querySelector('input:not([type=hidden]), button.fchip, .chat__chip, button');
  (cual === 'chat' ? panelEl.querySelector('.chat__composer input') || primero : panelEl.querySelector('input')).focus();
}
function cerrar({ devolverFoco = true } = {}) {
  if (S.abierto === 'chat') registrarHistorial();
  if (panelEl) { panelEl.remove(); panelEl = null; }
  if (tsForm) { tsForm.remove(); tsForm = null; }
  if (tsChat) { tsChat.remove(); tsChat = null; }
  if (tsLog) { tsLog.remove(); tsLog = null; }
  S.abierto = 'ninguno';
  btnForm && btnForm.setAttribute('aria-expanded', 'false');
  btnChat && btnChat.setAttribute('aria-expanded', 'false');
  document.removeEventListener('keydown', onKey, true);
  raiz && raiz.style.removeProperty('--kb');
  if (devolverFoco && S.opener && document.contains(S.opener)) S.opener.focus();
}

function onKey(e) {
  if (!panelEl) return;
  if (e.key === 'Escape') { e.stopPropagation(); cerrar(); return; }
  if (e.key !== 'Tab') return;
  const foco = [...panelEl.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled])')]
    .filter((el) => !el.closest('[hidden]') && el.offsetParent !== null);
  if (!foco.length) return;
  const primero = foco[0];
  const ultimo = foco[foco.length - 1];
  if (e.shiftKey && (document.activeElement === primero || !panelEl.contains(document.activeElement))) { e.preventDefault(); ultimo.focus(); }
  else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
}

// Móvil: la hoja inferior sube cuando aparece el teclado (visualViewport)
function ajustarTeclado() {
  const vv = window.visualViewport;
  if (!vv || !panelEl) return;
  const aplicar = () => {
    if (!panelEl) return;
    const tapado = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    panelEl.style.setProperty('bottom', window.matchMedia('(max-width: 640px)').matches ? `${tapado}px` : '');
  };
  vv.addEventListener('resize', aplicar);
  vv.addEventListener('scroll', aplicar);
  aplicar();
}

// ---------- formulario corto ----------
function campo({ id, etiqueta, tipo = 'text', auto, obligatorio, lista, valor = '', max, extra }) {
  const input = h('input', {
    class: 'input', id, name: id, type: tipo, autocomplete: auto || 'off', list: lista, maxlength: max,
    'aria-describedby': `${id}-e`, 'aria-invalid': 'false', value: valor,
  });
  if (tipo === 'tel') input.addEventListener('input', () => { const l = limpiarTelefono(input.value); if (l !== input.value) input.value = l; });
  return h('div', { class: 'field' },
    h('label', { for: id }, etiqueta, obligatorio ? h('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }) : null),
    input, extra, h('div', { class: 'field__err', id: `${id}-e`, hidden: true }));
}
function casilla(id, contenido, ayuda) {
  return h('div', {},
    h('div', { class: 'check' }, h('input', { type: 'checkbox', id, name: id, 'aria-describedby': `${id}-e` }), h('label', { for: id }, ...contenido)),
    ayuda ? h('div', { class: 'field__err', id: `${id}-e`, hidden: true }) : null);
}

function construirForm(prefill = {}) {
  const sectores = h('datalist', { id: 'fl-sectores' }, ...SECTOR_ETIQUETAS.map((s) => h('option', { value: s })));
  const nivel = h('select', { class: 'select', id: 'fl-nivel', name: 'nivel' },
    h('option', { value: '', text: 'No lo sé todavía' }),
    ...[['Nivel 1', 'Nivel 1 · Inicial'], ['Nivel 2', 'Nivel 2 · En desarrollo'], ['Nivel 3', 'Nivel 3 · Intermedia'], ['Nivel 4', 'Nivel 4 · Avanzada'], ['Nivel 5', 'Nivel 5 · Líder']]
      .map(([v, t]) => h('option', { value: v, text: t })));
  const mas = h('div', { class: 'fp__more', id: 'fl-mas', hidden: !S.form.mas },
    campo({ id: 'fl-sector', etiqueta: 'Sector (escribe para buscar)', lista: 'fl-sectores' }), sectores,
    h('div', { class: 'field' }, h('label', { for: 'fl-nivel', text: 'Nivel de madurez digital' }), nivel,
      h('div', { class: 'field__hint' }, h('a', { href: '/evaluacion.html', text: '¿No sabes tu nivel? Haz la evaluación' }))),
    campo({ id: 'fl-tel', etiqueta: 'Teléfono (opcional)', tipo: 'tel', auto: 'tel', max: LIMITES.tel }),
    casilla('fl-wa', ['Acepto que Catalysis me escriba por WhatsApp. ', h('span', { class: 'opt-note', text: '(Opcional)' })], false));
  const alerta = h('div', { class: 'alert', role: 'alert', id: 'fl-alerta', hidden: true });
  const submit = h('button', { type: 'submit', class: 'btn btn--primary', id: 'fl-enviar', text: 'Enviar y agendar' });
  const toggleMas = h('button', {
    type: 'button', class: 'btn-link', 'aria-expanded': String(S.form.mas), 'aria-controls': 'fl-mas',
    text: S.form.mas ? 'Mostrar menos' : 'Agregar más detalles (opcional)',
    onclick: (e) => {
      S.form.mas = !S.form.mas;
      mas.hidden = !S.form.mas;
      e.currentTarget.setAttribute('aria-expanded', String(S.form.mas));
      e.currentTarget.textContent = S.form.mas ? 'Mostrar menos' : 'Agregar más detalles (opcional)';
    },
  });
  const form = h('form', { class: 'form fp__body', novalidate: true },
    alerta,
    campo({ id: 'fl-nombre', etiqueta: 'Nombre', auto: 'name', obligatorio: true, max: LIMITES.nombre, valor: prefill.nombre }),
    campo({ id: 'fl-correo', etiqueta: 'Correo de trabajo', tipo: 'email', auto: 'email', obligatorio: true, valor: prefill.correo }),
    campo({ id: 'fl-empresa', etiqueta: 'Empresa', auto: 'organization', obligatorio: true, max: LIMITES.empresa, valor: prefill.empresa }),
    toggleMas, mas,
    casilla('fl-priv', ['Acepto el ', h('a', { href: '/aviso-privacidad.html', target: '_blank', rel: 'noopener', text: 'aviso de privacidad' }), '. ', h('span', { class: 'req', 'aria-hidden': 'true', text: '*' })], true),
    h('div', { class: 'turnstile-slot', style: 'min-height:0' }),
    submit,
    h('div', { class: 'fp__fine', text: 'Protegido con verificación anti-bot automática.' }),
    h('button', { type: 'button', class: 'btn-link', text: 'Prefiero el asistente automático', onclick: (e) => abrir('chat', e.currentTarget) }));
  form.addEventListener('submit', (e) => { e.preventDefault(); enviarForm(form); });

  return h('div', { class: 'fpanel fp-form', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'fl-titulo' },
    h('div', { class: 'fp__head' },
      h('div', {}, h('strong', { id: 'fl-titulo', text: 'Agenda tu diagnóstico' }), h('p', { text: 'Déjanos tus datos y te contactamos. Toma menos de un minuto.' })),
      h('button', { type: 'button', class: 'ib', 'aria-label': 'Cerrar', onclick: () => cerrar() }, icono(ICO.cerrar))),
    form);
}

function valoresForm(form) {
  const v = (id) => form.querySelector(`#${id}`);
  return {
    nombre: v('fl-nombre').value, correo: v('fl-correo').value, empresa: v('fl-empresa').value,
    sector: v('fl-sector').value, nivel: v('fl-nivel').value, tel: v('fl-tel').value,
    wa: v('fl-wa').checked, priv: v('fl-priv').checked,
  };
}
const CAMPOS_FORM = { nombre: 'fl-nombre', correo: 'fl-correo', empresa: 'fl-empresa', tel: 'fl-tel', priv: 'fl-priv' };

function marcarErroresForm(form, errores) {
  for (const [campo, id] of Object.entries(CAMPOS_FORM)) {
    const input = form.querySelector(`#${id}`);
    const err = form.querySelector(`#${id}-e`);
    if (!input || !err) continue;
    const msg = errores[campo];
    if (input.type !== 'checkbox') input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    err.hidden = !msg;
    err.replaceChildren(...(msg ? [icono(ICO.alerta, 14), h('span', { text: msg })] : []));
  }
}

async function enviarForm(form) {
  if (S.form.status === 'sending') return;
  const v = valoresForm(form);
  const errores = validarLead(v, { tel: 'opcional' });
  marcarErroresForm(form, errores);
  const alerta = form.querySelector('#fl-alerta');
  const claves = Object.keys(errores);
  if (claves.length) {
    if (errores.tel) { S.form.mas = true; form.querySelector('#fl-mas').hidden = false; }
    alerta.hidden = false;
    alerta.replaceChildren(icono(ICO.alerta), h('div', { text: `Revisa ${claves.length === 1 ? 'el campo marcado' : `los ${claves.length} campos marcados`} antes de enviar.` }));
    form.querySelector(`#${CAMPOS_FORM[claves[0]]}`).focus();
    return;
  }
  alerta.hidden = true;
  fijarEnviando(form, true);
  const res = await enviarLead(construirPayload(v, { canal: 'sitio-flotante' }), tsForm && tsForm.token());
  fijarEnviando(form, false);
  if (res.ok) {
    window.catTrack && window.catTrack.lead({ lead_source: 'floating_form' });
    mostrarEnviado(v);
    return;
  }
  alerta.hidden = false;
  alerta.replaceChildren(icono(ICO.alerta), h('div', {}, h('strong', { text: 'No pudimos enviar tu solicitud. ' }),
    document.createTextNode(`Tus datos siguen aquí. ${res.tipo === 'turnstile' ? res.mensaje : 'Intenta de nuevo; si el problema continúa, escríbenos a contacto@catalysis.com.mx.'}`)));
  form.querySelector('#fl-enviar').textContent = 'Reintentar envío';
  if (tsForm) tsForm.reset();
}
function fijarEnviando(form, on) {
  S.form.status = on ? 'sending' : 'idle';
  const btn = form.querySelector('#fl-enviar');
  btn.disabled = on;
  btn.textContent = on ? 'Enviando…' : 'Enviar y agendar';
  form.querySelectorAll('input, select').forEach((i) => { i.disabled = on; });
}
function mostrarEnviado(v) {
  const cuerpo = h('div', { class: 'fsent', role: 'status' },
    h('div', { class: 'fsent__head' }, icono(ICO.ok, 22), h('span', { text: 'Registro creado' })),
    h('div', { class: 'fsent__rows' },
      h('div', {}, h('span', { text: 'Nombre · ' }), document.createTextNode(v.nombre.trim())),
      h('div', {}, h('span', { text: 'Empresa · ' }), document.createTextNode(v.empresa.trim())),
      h('div', {}, h('span', { text: 'Correo · ' }), document.createTextNode(v.correo.trim()))),
    h('p', { style: 'font-size:14px;line-height:1.5;color:var(--ink-2)', text: 'Te escribiremos pronto. Para avanzar más rápido, agenda directamente en el calendario o conoce tu nivel de madurez digital.' }),
    h('a', { class: 'btn btn--primary', href: CALENDLY, 'data-cta': 'flotante_calendly', 'data-cta-location': 'flotante_enviado', text: 'Agendar en el calendario' }),
    h('a', { class: 'btn btn--outline', href: '/evaluacion.html', 'data-cta': 'flotante_evaluacion', 'data-cta-location': 'flotante_enviado', text: 'Hacer la evaluación de madurez' }));
  panelEl.querySelector('form').replaceWith(cuerpo);
  cuerpo.querySelector('a').focus();
}

// ---------- asistente ----------
function construirChat() {
  const log = h('div', { class: 'chat__log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions' });
  const chipsEl = h('div', { class: 'chat__chips' });
  const entrada = h('input', { class: 'input', id: 'chat-in', type: 'text', autocomplete: 'off', 'aria-label': 'Tu mensaje' });
  const enviar = h('button', { type: 'submit', class: 'chat__send', 'aria-label': 'Enviar mensaje' }, icono(ICO.enviar, 18));
  const composer = h('form', { class: 'chat__composer', novalidate: true }, entrada, enviar);
  composer.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = entrada.value.trim();
    if (!v || S.chat.paso === 'guardando') return;
    entrada.value = '';
    emitir({ tipo: 'texto', valor: v });
  });
  const pie = h('div', { class: 'chat__foot' },
    chipsEl, composer,
    h('div', { class: 'chat__note' },
      h('span', {}, 'Asistente automático: sigue un guion y busca palabras en el sitio; no usa IA. Guardamos la conversación para mejorarlo (',
        h('a', { href: '/aviso-privacidad.html', target: '_blank', rel: 'noopener', text: 'aviso de privacidad' }), '). Revisarás tus datos antes de registrarlos.'),
      h('button', { type: 'button', text: 'Ir al formulario', onclick: irAlFormulario })),
    h('div', { class: 'turnstile-slot chat__ts' }),
    h('div', { class: 'turnstile-slot chat__tslog', style: 'min-height:0' }));
  const panel = h('div', { class: 'fpanel fp-chat', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'chat-titulo' },
    h('div', { class: 'chat__head dk' },
      h('span', { class: 'chat__avatar', 'aria-hidden': 'true' }),
      h('div', {}, h('strong', { id: 'chat-titulo', text: 'Asistente de Catalysis' }), h('small', { text: 'Asistente automático · registro, citas y dudas' })),
      h('button', { type: 'button', class: 'ib', 'aria-label': 'Reiniciar la conversación', onclick: () => emitir({ tipo: 'reiniciar', clave: generarClave() }) }, icono(ICO.reiniciar)),
      h('button', { type: 'button', class: 'ib', 'aria-label': 'Cerrar', onclick: () => cerrar() }, icono(ICO.cerrar))),
    log, pie);
  panel._refs = { log, chipsEl, entrada, enviar };
  pintarChat(panel);
  return panel;
}

function pintarChat(panel = panelEl) {
  if (!panel || !panel._refs) return;
  const { log, chipsEl, entrada, enviar } = panel._refs;
  const e = S.chat;

  const burbujas = e.mensajes.map((m) => h('div', { class: `msg msg--${m.rol}${m.tipo === 'error' ? ' msg--error' : ''}` },
    h('div', { class: 'msg__b' }, m.tipo === 'error' ? icono(ICO.alerta, 16) : null, h('span', { text: m.texto }))));
  const extras = [];
  if (e.paso === 'consentimiento') extras.push(tarjetaConsentimiento());
  if (e.paso === 'confirmar' || e.paso === 'guardando') {
    extras.push(h('div', { class: 'chat__card' }, h('div', { class: 'eyebrow', text: 'Registro por crear' }),
      ...filasConfirmacion(e).map(([k, v]) => h('div', { class: 'chat__row' }, h('span', { text: k }), h('span', { text: v })))));
  }
  if (e.paso === 'guardando') extras.push(h('div', { role: 'status', 'aria-label': 'Guardando tu registro' }, h('div', { class: 'typing sk' }, h('span'), h('span'), h('span'))));
  const clave = e.clave ? h('p', { class: 'chat__clave' }, 'Clave de tu conversación: ', h('b', { text: e.clave }),
    '. Puedes referenciar esta conversación en el futuro mencionando esta clave.') : null;
  log.replaceChildren(...(clave ? [clave] : []), ...burbujas, ...extras);
  log.scrollTop = log.scrollHeight;

  const botones = chips(e).map((c) => h('button', {
    type: 'button', class: `chat__chip${c.primario ? ' chat__chip--primary' : ''}`, text: c.etiqueta,
    onclick: () => (c.accion === 'formulario' ? irAlFormulario() : emitir(c.evento)),
  }));
  const links = enlaces(e).map((l) => h('a', {
    class: 'chat__chip', href: /calendly/.test(l.href) && window.catTrack ? window.catTrack.calendlyUrl(l.href) : l.href,
    target: l.href.startsWith('http') ? '_blank' : null, rel: l.href.startsWith('http') ? 'noopener' : null,
    'data-cta': l.cta || 'chat_enlace', 'data-cta-location': 'chat', text: l.etiqueta,
  }));
  chipsEl.replaceChildren(...botones, ...links);
  chipsEl.hidden = botones.length + links.length === 0;

  const ent = entradaDeTexto(e);
  entrada.placeholder = ent.placeholder;
  entrada.disabled = ent.deshabilitado;
  enviar.disabled = ent.deshabilitado;
  entrada.setAttribute('aria-invalid', String(e.campoInvalido !== ''));
}

function tarjetaConsentimiento() {
  const c = S.chat.consentimientos;
  const priv = h('input', { type: 'checkbox', id: 'chat-priv', checked: c.priv, onchange: () => emitir({ tipo: 'alternar_consentimiento', valor: 'priv' }) });
  const wa = h('input', { type: 'checkbox', id: 'chat-wa', checked: c.wa, onchange: () => emitir({ tipo: 'alternar_consentimiento', valor: 'wa' }) });
  priv.checked = c.priv; wa.checked = c.wa;
  return h('div', { class: 'chat__card' },
    h('div', { class: 'eyebrow', text: 'Consentimiento' }),
    h('div', { class: 'check' }, priv, h('label', { for: 'chat-priv' }, 'Acepto el ', h('a', { href: '/aviso-privacidad.html', target: '_blank', rel: 'noopener', text: 'aviso de privacidad' }), '. ', h('span', { class: 'req', 'aria-hidden': 'true', text: '*' }))),
    h('div', { class: 'check' }, wa, h('label', { for: 'chat-wa' }, 'Acepto que Catalysis me escriba por WhatsApp. ', h('span', { class: 'opt-note', text: '(Opcional)' }))),
    h('button', { type: 'button', class: 'btn btn--primary', disabled: !c.priv, text: 'Continuar', onclick: () => emitir({ tipo: 'aceptar_consentimiento' }) }));
}

// ---------- historial (js/lib/chat-log.mjs → Function chat-log) ----------
function nuevoLog(clave) { return { clave, inicio: new Date().toISOString(), sello: '', ultimo: '', cola: Promise.resolve() }; }
S.chat = estadoInicial(generarClave());
S.log = nuevoLog(S.chat.clave);

/** Eventos GA4 del asistente (docs/medicion-leads.md). Nunca llevan texto del visitante ni datos del registro. */
function medirAsistente(estado, flujosAntes, pasoAntes, evento) {
  estado.flujos.slice(flujosAntes).forEach((flujo) => track('asistente_flujo', { flujo }));
  if (estado.paso !== pasoAntes && (estado.paso === 'hecho' || estado.paso === 'enlace')) track('asistente_resultado', { resultado: resultadoDe(estado) });
  if (evento.tipo === 'texto' && estado.noEntendido && ['bienvenida', 'dudas', 'enlace'].includes(estado.paso)) track('asistente_sin_respuesta', {});
}

/** Envía el historial si cambió. Silencioso: guardarlo nunca debe afectar al chat. */
function registrarHistorial(estado = S.chat, log = S.log) {
  const historial = prepararHistorial(estado, {
    inicio: log.inicio, pagina: window.location.pathname, fuente: window.getFuente ? window.getFuente('agente') : undefined,
  });
  if (!historial) return;
  const huella = JSON.stringify([historial.mensajes, historial.resultado]);
  if (huella === log.ultimo) return;
  const token = tsLog && tsLog.token();   // se lee ahora: el widget se quita al cerrar el panel
  log.cola = log.cola.then(async () => {
    const r = await enviarHistorial(historial, { turnstileToken: log.sello ? null : token, sello: log.sello });
    if (r.ok) { log.sello = r.sello || log.sello; log.ultimo = huella; }
  });
}
window.addEventListener('pagehide', () => registrarHistorial());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') registrarHistorial(); });

function emitir(evento) {
  const antes = S.chat.paso;
  if (evento.tipo === 'reiniciar') { registrarHistorial(); S.log = nuevoLog(evento.clave);
    if (tsLog) tsLog.reset();
    else if (panelEl && panelEl.querySelector('.chat__tslog')) tsLog = montarTurnstile(panelEl.querySelector('.chat__tslog'), { appearance: 'interaction-only' });
  }
  const flujosAntes = S.chat.flujos.length;
  S.chat = reducir(S.chat, evento);
  medirAsistente(S.chat, flujosAntes, antes, evento);
  if (S.chat.paso !== antes && (S.chat.paso === 'hecho' || S.chat.paso === 'enlace')) registrarHistorial();
  pintarChat();
  if (panelEl && panelEl._refs) {
    const { entrada } = panelEl._refs;
    const conCheck = evento.tipo === 'alternar_consentimiento';
    if (!conCheck && !entrada.disabled && /^(nombre|correo|empresa|telefono|dudas)$/.test(S.chat.paso)) entrada.focus();
    else if (!conCheck && S.chat.paso !== antes) {
      const primero = panelEl.querySelector('.chat__card button:not([disabled]), .chat__chip');
      if (primero) primero.focus();
    }
  }
  if ((evento.tipo === 'confirmar' || evento.tipo === 'reintentar') && S.chat.paso === 'guardando') guardarRegistro();
}

async function guardarRegistro() {
  if (S.guardando) return;
  S.guardando = true;
  const { valores, interes } = datosParaLead(S.chat);
  const payload = construirPayload(valores, { canal: 'agente', interes });
  const res = await enviarLead(payload, tsChat && tsChat.token());
  S.guardando = false;
  if (res.ok) {
    window.catTrack && window.catTrack.lead({ lead_source: 'agent' });
    emitir({ tipo: 'guardado' });
  } else {
    if (tsChat) tsChat.reset();
    emitir({ tipo: 'fallo' });
  }
}

function irAlFormulario() {
  const r = S.chat.registro;
  const opener = S.opener;
  cerrar({ devolverFoco: false });
  S.opener = opener;
  abrir('form', opener);
  const rellenar = (id, val) => { const el = panelEl.querySelector(`#${id}`); if (el && val && !el.value) el.value = val; };
  rellenar('fl-nombre', r.nombre); rellenar('fl-correo', r.correo); rellenar('fl-empresa', r.empresa); rellenar('fl-tel', r.tel);
}

// ---------- API pública ----------
export function abrirChat(opener) { abrir('chat', opener || btnChat); }
export function abrirFormulario(opener) { abrir('form', opener || btnForm); }
export { cerrar };

if (document.body) montar();
else document.addEventListener('DOMContentLoaded', montar, { once: true });
