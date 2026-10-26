/* ====================================
   PÁGINA DE EVALUACIÓN DE MADUREZ
   Orquesta el cuestionario (una pregunta por pantalla), muestra el resultado y
   envía el lead (canal 'evaluacion') por lead-register. El cálculo vive en
   js/lib/evaluacion.mjs; el banco de preguntas en content/evaluacion.mjs.
   ==================================== */
import { PREGUNTAS, RESULTADOS } from '/content/evaluacion.mjs';
import { calcularResultado, formatearPromedio, NUM_PREGUNTAS } from '/js/lib/evaluacion.mjs';
import { validarLead, construirPayload, enviarLead } from '/js/lib/lead-form.mjs';
import { montarTurnstile } from '/js/lib/turnstile.mjs';
import { SECTOR_ETIQUETAS, buscarSector } from '/js/data/sectores.mjs';

const $ = (sel, root = document) => root.querySelector(sel);
const panels = { intro: $('[data-panel="intro"]'), quiz: $('[data-panel="quiz"]'), result: $('[data-panel="result"]') };
const LETRAS = ['A', 'B', 'C', 'D', 'E'];

const estado = { paso: 0, respuestas: new Array(NUM_PREGUNTAS).fill(0), resultado: null, enviando: false };
let turnstile = null;

const track = (name, params) => window.catTrack && window.catTrack.event(name, params);

function mostrar(nombre) {
  Object.entries(panels).forEach(([k, el]) => { el.hidden = k !== nombre; });
}

function renderPregunta() {
  const q = PREGUNTAS[estado.paso - 1];
  const actual = estado.respuestas[estado.paso - 1];
  $('#q-step').textContent = `Pregunta ${estado.paso} de ${NUM_PREGUNTAS}`;
  $('#q-dim').textContent = q.dimension;
  const bar = $('#q-bar');
  bar.setAttribute('aria-valuenow', String(estado.paso));
  bar.firstElementChild.style.width = `${(estado.paso / NUM_PREGUNTAS) * 100}%`;
  $('#q-text').textContent = q.pregunta;

  const cont = $('#q-opts');
  cont.replaceChildren(...q.opciones.map((texto, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.setAttribute('aria-pressed', String(actual === i + 1));
    const chip = document.createElement('span');
    chip.className = 'opt__chip';
    chip.setAttribute('aria-hidden', 'true');
    chip.textContent = LETRAS[i];
    const t = document.createElement('span');
    t.textContent = texto;
    b.append(chip, t);
    b.addEventListener('click', () => {
      estado.respuestas[estado.paso - 1] = i + 1;
      renderPregunta();
      $('#q-opts').querySelectorAll('.opt')[i].focus();
    });
    return b;
  }));
  $('#q-next').disabled = actual === 0;
  $('#q-next').textContent = estado.paso === NUM_PREGUNTAS ? 'Ver mi resultado' : 'Siguiente';
}

function irAPaso(n) {
  estado.paso = n;
  if (n === 0) { mostrar('intro'); return; }
  if (n <= NUM_PREGUNTAS) {
    mostrar('quiz');
    renderPregunta();
    $('#q-text').focus({ preventScroll: false });
    return;
  }
  mostrarResultado();
}

function mostrarResultado() {
  const { promedio, nivel } = calcularResultado(estado.respuestas);
  estado.resultado = { promedio, nivel };
  const lv = RESULTADOS[nivel - 1];
  mostrar('result');

  $('#r-eyebrow').textContent = `TU RESULTADO · PUNTAJE PROMEDIO ${formatearPromedio(promedio)} DE 5`;
  $('#r-title').textContent = `Nivel ${lv.n}: ${lv.nombre}`;
  $('#r-state').textContent = lv.estado;
  $('#r-ladder').replaceChildren(...RESULTADOS.map((x) => {
    const d = document.createElement('div');
    if (x.n <= nivel) d.className = 'on';
    d.append(document.createElement('i'), document.createTextNode(x.nombre));
    return d;
  }));
  $('#r-dims').replaceChildren(...PREGUNTAS.map((p, i) => {
    const row = document.createElement('div');
    row.className = 'dim';
    row.innerHTML = '<div class="dim__name"></div><div class="dim__bar" aria-hidden="true"><span></span></div><div class="dim__val"></div>';
    row.firstElementChild.textContent = p.dimension;
    row.querySelector('.dim__bar span').style.width = `${(estado.respuestas[i] / 5) * 100}%`;
    row.lastElementChild.textContent = `${estado.respuestas[i]} / 5`;
    return row;
  }));
  $('#r-retos').replaceChildren(...lv.retos.map((r) => {
    const d = document.createElement('div');
    d.className = 'reto';
    d.innerHTML = '<strong></strong><p></p>';
    d.firstElementChild.textContent = r.titulo;
    d.lastElementChild.textContent = r.texto;
    return d;
  }));

  $('#r-form-card').hidden = false;
  $('#r-thanks').hidden = true;
  $('#r-alert').hidden = true;
  $('#r-title').focus();
  track('evaluacion_completa', { nivel, promedio: Number(formatearPromedio(promedio)) });

  if (!turnstile) turnstile = montarTurnstile($('#ev-turnstile'));
}

// ---------- formulario de resultado ----------
const form = $('#eval-form');
const CAMPOS = [['nombre', 'ev-nombre'], ['correo', 'ev-correo'], ['empresa', 'ev-empresa'], ['sector', 'ev-sector'], ['priv', 'ev-priv']];

function valores() {
  const f = new FormData(form);
  return {
    nombre: f.get('nombre') || '', correo: f.get('correo') || '', empresa: f.get('empresa') || '',
    sector: f.get('sector') || '', priv: f.get('priv') === 'on', wa: f.get('wa') === 'on',
  };
}

function marcarErrores(errores) {
  for (const [campo, id] of CAMPOS) {
    const input = document.getElementById(id);
    const err = document.getElementById(`${id}-e`);
    const msg = errores[campo];
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    err.hidden = !msg;
    err.textContent = msg || '';
  }
}

function fijarEnviando(on) {
  estado.enviando = on;
  const btn = $('#ev-submit');
  btn.disabled = on;
  btn.textContent = on ? 'Enviando…' : 'Quiero que me contacten';
  form.querySelectorAll('input').forEach((i) => { i.disabled = on; });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (estado.enviando) return;
  const v = valores();
  const errores = validarLead(v, { sector: true }, buscarSector);
  marcarErrores(errores);
  const alerta = $('#r-alert');
  const primerError = CAMPOS.find(([c]) => errores[c]);
  if (primerError) {
    alerta.hidden = false;
    alerta.textContent = `Revisa ${Object.keys(errores).length === 1 ? 'el campo marcado' : `los ${Object.keys(errores).length} campos marcados`} antes de enviar.`;
    document.getElementById(primerError[1]).focus();
    return;
  }
  alerta.hidden = true;

  const sector = buscarSector(v.sector);
  const payload = construirPayload({ ...v, sector: sector.etiqueta }, {
    canal: 'evaluacion',
    evaluacion: { respuestas: estado.respuestas },
  });
  fijarEnviando(true);
  const res = await enviarLead(payload, turnstile && turnstile.token());
  fijarEnviando(false);
  if (res.ok) {
    window.catTrack && window.catTrack.lead({ lead_source: 'maturity_assessment', nivel_madurez: `Nivel ${estado.resultado.nivel}` });
    $('#r-form-card').hidden = true;
    $('#r-thanks').hidden = false;
    $('#r-thanks').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  alerta.hidden = false;
  alerta.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg><div><strong>No pudimos enviar tus datos.</strong> Tu resultado sigue aquí y no se perdió nada. Intenta de nuevo; si el problema continúa, escríbenos a contacto@catalysis.com.mx.</div>';
  if (turnstile) turnstile.reset();
});

function reiniciar() {
  estado.respuestas = new Array(NUM_PREGUNTAS).fill(0);
  estado.resultado = null;
  form.reset();
  marcarErrores({});
  $('#r-alert').hidden = true;
  irAPaso(0);
  window.scrollTo({ top: 0 });
}

// ---------- eventos ----------
$('#ev-sectores').replaceChildren(...SECTOR_ETIQUETAS.map((s) => { const o = document.createElement('option'); o.value = s; return o; }));
$('[data-eval-start]').addEventListener('click', () => { track('evaluacion_inicio', {}); irAPaso(1); });
$('#q-back').addEventListener('click', () => irAPaso(Math.max(0, estado.paso - 1)));
$('#q-next').addEventListener('click', () => { if (estado.respuestas[estado.paso - 1]) irAPaso(estado.paso + 1); });
$('#ev-restart').addEventListener('click', reiniciar);
