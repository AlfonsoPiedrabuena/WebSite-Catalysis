/* ====================================
   ASISTENTE AUTOMÁTICO: MOTOR DE GUION FIJO (sin IA, sin DOM)
   La interfaz (js/flotantes.js) solo lee { mensajes, paso, registro, consentimientos } y las
   opciones que devuelve `chips()`, y emite eventos a `reducir()`. Otro motor (por ejemplo con
   IA) puede sustituir este módulo sin tocar la interfaz. El asistente NO interpreta mensajes
   libres: lo que no entiende lo dice y ofrece el formulario o el calendario.
   Pasos: bienvenida → nombre → correo → empresa → interes → consentimiento → [telefono] →
   confirmar → guardando → hecho | error. Solo se guarda tras "Confirmar y guardar".
   ==================================== */
import { EMAIL_RE, PHONE_RE } from './lead-form.mjs';

export const INTERESES = ['Diagnóstico de madurez digital', 'CRM y automatización', 'IA y agentes', 'Otro tema'];
export const CALENDLY = 'https://calendly.com/alfonso-piedrabuena-1';

export const BIENVENIDA = 'Hola, soy el asistente automático de Catalysis. Sigo un guion corto para registrar tu solicitud de diagnóstico en menos de un minuto. ¿Empezamos?';

const PREGUNTAS = {
  nombre: '¿Cómo te llamas?',
  correo: '¿Cuál es tu correo de trabajo?',
  empresa: '¿Cómo se llama tu empresa?',
  interes: '¿Qué te gustaría resolver primero?',
  consentimiento: 'Antes de guardar tu registro necesito tu consentimiento.',
  telefono: '¿Cuál es tu número de WhatsApp? Es opcional.',
  confirmar: 'Revisa tu registro antes de guardarlo.',
};
const ETIQUETA_CAMPO = { nombre: 'Nombre', correo: 'Correo', empresa: 'Empresa', interes: 'Interés', tel: 'Teléfono' };
const PASO_DE_CAMPO = { nombre: 'nombre', correo: 'correo', empresa: 'empresa', interes: 'interes', tel: 'telefono' };

export function estadoInicial() {
  return {
    mensajes: [{ rol: 'bot', texto: BIENVENIDA, tipo: '' }],
    paso: 'bienvenida',
    registro: { nombre: '', correo: '', empresa: '', interes: '', tel: '' },
    consentimientos: { priv: false, wa: false },
    volverA: null,        // 'confirmar' mientras se corrige un campo
    campoInvalido: '',    // 'correo' | 'tel' tras una entrada inválida
    noEntendido: false,
  };
}

/** Aplica un evento y devuelve el nuevo estado (el anterior no se muta). */
export function reducir(estado, evento) {
  const n = {
    ...estado,
    mensajes: estado.mensajes.slice(),
    registro: { ...estado.registro },
    consentimientos: { ...estado.consentimientos },
    campoInvalido: '',
    noEntendido: false,
  };
  const bot = (texto, tipo = '') => { n.mensajes.push({ rol: 'bot', texto, tipo }); };
  const usuario = (texto) => { n.mensajes.push({ rol: 'usuario', texto, tipo: '' }); };
  const irAConfirmar = () => { n.paso = 'confirmar'; n.volverA = null; bot(PREGUNTAS.confirmar); };
  const { paso } = estado;

  switch (evento.tipo) {
    case 'reiniciar':
      return estadoInicial();

    case 'iniciar':
      if (paso !== 'bienvenida') return estado;
      usuario('Sí, empecemos');
      n.paso = 'nombre';
      bot(PREGUNTAS.nombre);
      return n;

    case 'alternar_consentimiento':
      if (evento.valor !== 'priv' && evento.valor !== 'wa') return estado;
      n.consentimientos[evento.valor] = !n.consentimientos[evento.valor];
      return n;

    case 'aceptar_consentimiento':
      if (paso !== 'consentimiento' || !estado.consentimientos.priv) return estado;
      usuario(`Acepto el aviso de privacidad${estado.consentimientos.wa ? ' y que me escriban por WhatsApp' : ''}`);
      if (estado.consentimientos.wa) { n.paso = 'telefono'; bot(PREGUNTAS.telefono); } else { irAConfirmar(); }
      return n;

    case 'elegir':
      if (paso !== 'interes' || !INTERESES.includes(evento.valor)) return estado;
      usuario(evento.valor);
      n.registro.interes = evento.valor;
      if (estado.volverA) { irAConfirmar(); } else { n.paso = 'consentimiento'; bot(PREGUNTAS.consentimiento); }
      return n;

    case 'omitir_telefono':
      if (paso !== 'telefono') return estado;
      usuario('Omitir');
      n.registro.tel = '';
      irAConfirmar();
      return n;

    case 'confirmar':
    case 'reintentar':
      if (paso !== 'confirmar' && paso !== 'error') return estado;
      usuario(evento.tipo === 'confirmar' ? 'Confirmar y guardar' : 'Reintentar');
      n.paso = 'guardando';
      return n;

    case 'guardado':
      if (paso !== 'guardando') return estado;
      n.paso = 'hecho';
      bot(`Registro creado. Una persona del equipo te escribirá a ${estado.registro.correo}. Mientras tanto, puedes conocer tu nivel de madurez digital o agendar directo en el calendario.`);
      return n;

    case 'fallo':
      if (paso !== 'guardando') return estado;
      n.paso = 'error';
      bot('No pudimos guardar tu registro. Tus datos siguen aquí, no se perdió nada. Puedes reintentar o usar el formulario.', 'error');
      return n;

    case 'corregir':
      if (paso !== 'confirmar') return estado;
      usuario('Corregir');
      n.paso = 'corregir';
      bot('¿Qué quieres corregir?');
      return n;

    case 'elegir_campo': {
      if (paso !== 'corregir' || !PASO_DE_CAMPO[evento.valor]) return estado;
      usuario(ETIQUETA_CAMPO[evento.valor]);
      n.volverA = 'confirmar';
      n.paso = PASO_DE_CAMPO[evento.valor];
      bot(evento.valor === 'interes' ? 'Elige una opción.' : PREGUNTAS[PASO_DE_CAMPO[evento.valor]]);
      return n;
    }

    case 'continuar':
      // tras "no entendí": repetir la pregunta del paso actual
      bot(PREGUNTAS[paso === 'bienvenida' ? 'nombre' : paso] || BIENVENIDA);
      return n;

    case 'texto': {
      const t = String(evento.valor ?? '').trim();
      if (t === '') return estado;
      if (paso === 'nombre') {
        usuario(t); n.registro.nombre = t;
        if (estado.volverA) irAConfirmar(); else { n.paso = 'correo'; bot(`Mucho gusto, ${t}. ${PREGUNTAS.correo}`); }
        return n;
      }
      if (paso === 'correo') {
        usuario(t);
        if (!EMAIL_RE.test(t)) {
          bot('Ese correo no parece válido. Revisa que tenga el formato nombre@empresa.com y vuelve a escribirlo.', 'error');
          n.campoInvalido = 'correo';
          return n;
        }
        n.registro.correo = t;
        if (estado.volverA) irAConfirmar(); else { n.paso = 'empresa'; bot(`Gracias. ${PREGUNTAS.empresa}`); }
        return n;
      }
      if (paso === 'empresa') {
        usuario(t); n.registro.empresa = t;
        if (estado.volverA) irAConfirmar(); else { n.paso = 'interes'; bot(PREGUNTAS.interes); }
        return n;
      }
      if (paso === 'telefono') {
        usuario(t);
        if (!PHONE_RE.test(t)) {
          bot('Usa solo números, espacios, + o -, entre 7 y 30 caracteres. También puedes omitir este paso.', 'error');
          n.campoInvalido = 'tel';
          return n;
        }
        n.registro.tel = t;
        irAConfirmar();
        return n;
      }
      // Cualquier otro paso (bienvenida, opciones, consentimiento, confirmar…): no es un campo de texto.
      usuario(t);
      bot('No entendí ese mensaje: soy un asistente automático y solo sigo este guion. Puedes elegir una de las opciones, usar el formulario o agendar directo en el calendario.');
      n.noEntendido = true;
      return n;
    }

    default:
      return estado;
  }
}

/** Opciones (chips) del paso actual. `evento` es lo que la interfaz debe emitir al pulsarlas. */
export function chips(estado) {
  const { paso } = estado;
  let lista = [];
  if (paso === 'bienvenida') {
    lista = [
      { id: 'iniciar', etiqueta: 'Sí, empecemos', evento: { tipo: 'iniciar' }, primario: true },
      { id: 'formulario', etiqueta: 'Prefiero el formulario', accion: 'formulario' },
    ];
  } else if (paso === 'interes') {
    lista = INTERESES.map((t) => ({ id: `interes:${t}`, etiqueta: t, evento: { tipo: 'elegir', valor: t } }));
  } else if (paso === 'telefono') {
    lista = [{ id: 'omitir', etiqueta: 'Omitir', evento: { tipo: 'omitir_telefono' } }];
  } else if (paso === 'confirmar') {
    lista = [
      { id: 'confirmar', etiqueta: 'Confirmar y guardar', evento: { tipo: 'confirmar' }, primario: true },
      { id: 'corregir', etiqueta: 'Corregir', evento: { tipo: 'corregir' } },
    ];
  } else if (paso === 'corregir') {
    const campos = ['nombre', 'correo', 'empresa', 'interes'].concat(estado.consentimientos.wa ? ['tel'] : []);
    lista = campos.map((c) => ({ id: `campo:${c}`, etiqueta: ETIQUETA_CAMPO[c], evento: { tipo: 'elegir_campo', valor: c } }));
  } else if (paso === 'error') {
    lista = [
      { id: 'reintentar', etiqueta: 'Reintentar', evento: { tipo: 'reintentar' }, primario: true },
      { id: 'formulario', etiqueta: 'Usar el formulario', accion: 'formulario' },
    ];
  } else if (paso === 'hecho') {
    lista = [{ id: 'reiniciar', etiqueta: 'Iniciar otra conversación', evento: { tipo: 'reiniciar' } }];
  }
  if (estado.noEntendido) {
    lista = lista.concat([
      { id: 'formulario', etiqueta: 'Usar el formulario', accion: 'formulario' },
      { id: 'continuar', etiqueta: 'Continuar donde iba', evento: { tipo: 'continuar' } },
    ]);
  }
  return lista;
}

/** Enlaces que acompañan al paso (no son eventos del guion). */
export function enlaces(estado) {
  if (estado.paso === 'hecho') {
    return [
      { etiqueta: 'Hacer la evaluación de madurez', href: '/evaluacion.html' },
      { etiqueta: 'Agendar en el calendario', href: CALENDLY },
    ];
  }
  if (estado.paso === 'error') return [{ etiqueta: 'Escribir a contacto@catalysis.com.mx', href: 'mailto:contacto@catalysis.com.mx' }];
  if (estado.noEntendido) return [{ etiqueta: 'Agendar en el calendario', href: CALENDLY }];
  return [];
}

/** Filas de la tarjeta "Registro por crear". */
export function filasConfirmacion(estado) {
  const { registro: r, consentimientos: c } = estado;
  const filas = [['Nombre', r.nombre], ['Correo', r.correo], ['Empresa', r.empresa], ['Interés', r.interes]];
  if (r.tel) filas.push(['Teléfono', r.tel]);
  filas.push(['Aviso de privacidad', c.priv ? 'Aceptado' : 'Pendiente']);
  filas.push(['WhatsApp', c.wa ? 'Sí, acepta' : 'No']);
  return filas;
}

/** Datos para construirPayload() del flujo de lead. Solo válido en 'guardando'. */
export function datosParaLead(estado) {
  const { registro: r, consentimientos: c } = estado;
  return { valores: { nombre: r.nombre, correo: r.correo, empresa: r.empresa, tel: r.tel, priv: c.priv, wa: c.wa }, interes: r.interes };
}

/** Texto de entrada y si el campo de texto debe estar activo, según el paso. */
export function entradaDeTexto(estado) {
  const marcadores = { nombre: 'Escribe tu nombre', correo: 'nombre@empresa.com', empresa: 'Nombre de tu empresa', telefono: '55 1234 5678' };
  return {
    placeholder: marcadores[estado.paso] || 'Elige una opción o escribe aquí',
    deshabilitado: estado.paso === 'guardando',
  };
}
