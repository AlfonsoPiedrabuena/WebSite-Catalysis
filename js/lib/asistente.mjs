/* ====================================
   ASISTENTE AUTOMÁTICO: MOTOR DE GUION FIJO (sin IA, sin DOM)
   La interfaz (js/flotantes.js) solo lee { mensajes, paso, registro, consentimientos } y las
   opciones y enlaces que devuelven `chips()` y `enlaces()`, y emite eventos a `reducir()`. Otro
   motor (por ejemplo con IA) puede sustituir este módulo sin tocar la interfaz. El asistente NO
   interpreta mensajes libres: busca palabras en el contenido del sitio (js/lib/buscador-dudas.mjs)
   y, si no hay coincidencia, lo dice y ofrece el formulario, el calendario o a una persona.
   Cinco flujos desde el menú (paso 'bienvenida'): datos, agendar, dudas, checklist, persona.
   Registro: nombre → correo → empresa → interes → consentimiento → [telefono] → confirmar →
   guardando → hecho | error. Solo se guarda tras "Confirmar y guardar".
   Agendar, checklist y persona solo abren un enlace (paso 'enlace'); dudas usa el paso 'dudas'.
   ==================================== */
import { EMAIL_RE, PHONE_RE } from './lead-form.mjs';
import { buscarDuda } from './buscador-dudas.mjs';
import { RECURSOS } from '../../content/recursos.mjs';

export const INTERESES = ['Diagnóstico de madurez digital', 'CRM y automatización', 'IA y agentes', 'Otro tema'];
export const CALENDLY = 'https://calendly.com/alfonso-piedrabuena-1';

export const WHATSAPP = `https://wa.me/525539337086?text=${encodeURIComponent('Hola, vengo del sitio de Catalysis y me gustaría hablar con una persona.')}`;

export const BIENVENIDA = 'Hola, soy el asistente automático de Catalysis: sigo un guion y busco en el contenido del sitio, no soy una persona ni uso IA. Guardamos esta conversación para mejorar el asistente (ver aviso de privacidad). ¿Qué quieres hacer?';

export const FLUJOS = {
  datos: { etiqueta: 'Dejar mis datos' },
  agendar: { etiqueta: 'Agendar diagnóstico' },
  dudas: { etiqueta: 'Dudas sobre servicios' },
  checklist: { etiqueta: 'Recibir el checklist' },
  persona: { etiqueta: 'Hablar con una persona' },
};
const TEMAS_DUDAS = ['Automatización', 'Datos y analítica', 'Nube', 'Marco de madurez'];
const ENLACE_CALENDLY = { etiqueta: 'Agendar en el calendario', href: CALENDLY, cta: 'chat_calendly' };
const ENLACE_WHATSAPP = { etiqueta: 'Escribir por WhatsApp', href: WHATSAPP, cta: 'chat_whatsapp' };

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

/** Clave de conversación legible (ej. CAT-7K3Q-9XMD); sin 0/O/1/I para dictarla sin confusiones. */
export function generarClave() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  const c = globalThis.crypto;
  if (c && c.getRandomValues) c.getRandomValues(bytes); else for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  const t = Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
  return `CAT-${t.slice(0, 4)}-${t.slice(4)}`;
}

/** `clave` la genera la interfaz al abrir/reiniciar el chat (aquí no hay azar: el motor es determinista). */
export function estadoInicial(clave = '') {
  return {
    clave,
    mensajes: [{ rol: 'bot', texto: BIENVENIDA, tipo: '' }],
    paso: 'bienvenida',
    flujos: [],           // flujos elegidos, en orden (para medir y para el historial)
    enlacesExtra: [],     // enlaces del último mensaje del bot: [{ etiqueta, href, cta }]
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
    flujos: estado.flujos.slice(),
    enlacesExtra: [],
    campoInvalido: '',
    noEntendido: false,
  };
  // `privado`: el mensaje contiene datos del registro (nombre, correo, empresa, teléfono). Se muestra
  // en el chat, pero el historial (js/lib/chat-log.mjs) lo guarda como "[dato de registro]".
  const bot = (texto, tipo = '', privado = false) => { n.mensajes.push({ rol: 'bot', texto, tipo, ...(privado ? { privado: true } : {}) }); };
  const usuario = (texto, privado = false) => { n.mensajes.push({ rol: 'usuario', texto, tipo: '', ...(privado ? { privado: true } : {}) }); };
  const irAConfirmar = () => { n.paso = 'confirmar'; n.volverA = null; bot(PREGUNTAS.confirmar); };
  const { paso } = estado;

  switch (evento.tipo) {
    case 'reiniciar':
      return estadoInicial(evento.clave);

    case 'iniciar':
      if (paso !== 'bienvenida') return estado;
      return reducir(estado, { tipo: 'elegir_flujo', valor: 'datos' });

    case 'elegir_flujo': {
      const flujo = FLUJOS[evento.valor];
      if (!flujo || !['bienvenida', 'dudas', 'enlace'].includes(paso)) return estado;
      usuario(flujo.etiqueta);
      n.flujos.push(evento.valor);
      if (evento.valor === 'datos') {
        n.paso = 'nombre';
        bot(PREGUNTAS.nombre);
      } else if (evento.valor === 'dudas') {
        n.paso = 'dudas';
        bot('Cuéntame tu duda con una o dos palabras, por ejemplo: nube, procesos, datos o automatización. Busco en el contenido del sitio; no uso inteligencia artificial.');
      } else if (evento.valor === 'agendar') {
        n.paso = 'enlace';
        bot('Con gusto. El calendario se abre en otra ventana: ahí eliges el día y la hora de tu diagnóstico.');
        n.enlacesExtra = [ENLACE_CALENDLY];
      } else if (evento.valor === 'checklist') {
        const rec = RECURSOS['checklist-cierre-fiscal'];
        n.paso = 'enlace';
        bot(`${rec.titulo}: ${rec.texto} Es gratis y lo pides en su página.`);
        n.enlacesExtra = [{ etiqueta: 'Ir al checklist', href: rec.href, cta: 'chat_checklist' }];
      } else {
        n.paso = 'enlace';
        bot('Te atiende una persona del equipo por WhatsApp. Se abre en otra ventana con un mensaje listo para enviar.');
        n.enlacesExtra = [ENLACE_WHATSAPP];
      }
      return n;
    }

    case 'menu':
      if (paso !== 'dudas' && paso !== 'enlace') return estado;
      usuario('Volver al menú');
      n.paso = 'bienvenida';
      bot('¿Qué más quieres hacer?');
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
      bot(`Registro creado. Una persona del equipo te escribirá a ${estado.registro.correo}. Mientras tanto, puedes conocer tu nivel de madurez digital o agendar directo en el calendario.`, '', true);
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
      bot(PREGUNTAS[paso] || BIENVENIDA);
      return n;

    case 'texto': {
      const t = String(evento.valor ?? '').trim();
      if (t === '') return estado;
      if (paso === 'nombre') {
        usuario(t, true); n.registro.nombre = t;
        if (estado.volverA) irAConfirmar(); else { n.paso = 'correo'; bot(`Mucho gusto, ${t}. ${PREGUNTAS.correo}`, '', true); }
        return n;
      }
      if (paso === 'correo') {
        usuario(t, true);
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
        usuario(t, true); n.registro.empresa = t;
        if (estado.volverA) irAConfirmar(); else { n.paso = 'interes'; bot(PREGUNTAS.interes); }
        return n;
      }
      if (paso === 'telefono') {
        usuario(t, true);
        if (!PHONE_RE.test(t)) {
          bot('Usa solo números, espacios, + o -, entre 7 y 30 caracteres. También puedes omitir este paso.', 'error');
          n.campoInvalido = 'tel';
          return n;
        }
        n.registro.tel = t;
        irAConfirmar();
        return n;
      }
      if (paso === 'bienvenida' || paso === 'dudas' || paso === 'enlace') {
        usuario(t);
        const encontrados = buscarDuda(t);
        if (encontrados.length === 0) {
          bot('No encontré eso en el contenido del sitio: soy un asistente automático y no interpreto mensajes libres. Prueba con otra palabra, elige una opción del menú o habla con una persona.');
          n.noEntendido = true;
          return n;
        }
        n.paso = 'dudas';
        if (!n.flujos.includes('dudas')) n.flujos.push('dudas');
        bot(`${encontrados[0].titulo}: ${encontrados[0].texto}`);
        if (encontrados.length > 1) bot(`También podría interesarte: ${encontrados.slice(1).map((x) => x.titulo).join('; ')}.`);
        const vistos = new Set();
        n.enlacesExtra = encontrados
          .filter((x) => !vistos.has(x.href) && vistos.add(x.href))
          .map((x) => ({ etiqueta: x.etiqueta, href: x.href, cta: x.tipo === 'pagina' || x.tipo === 'recurso' ? `chat_${x.id}` : `chat_${x.tipo}` }));
        return n;
      }
      // Cualquier otro paso (opciones, consentimiento, confirmar…): no es un campo de texto.
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
    lista = Object.entries(FLUJOS).map(([id, f]) => ({ id: `flujo:${id}`, etiqueta: f.etiqueta, evento: { tipo: 'elegir_flujo', valor: id }, primario: id === 'datos' }));
    lista.push({ id: 'formulario', etiqueta: 'Prefiero el formulario', accion: 'formulario' });
  } else if (paso === 'dudas' || paso === 'enlace') {
    if (paso === 'dudas' && estado.enlacesExtra.length === 0) {
      lista = TEMAS_DUDAS.map((t) => ({ id: `tema:${t}`, etiqueta: t, evento: { tipo: 'texto', valor: t } }));
    }
    lista.push({ id: 'menu', etiqueta: 'Volver al menú', evento: { tipo: 'menu' } });
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
    if (!lista.some((c) => c.id === 'formulario')) lista.push({ id: 'formulario', etiqueta: 'Usar el formulario', accion: 'formulario' });
    if (!['bienvenida', 'dudas', 'enlace'].includes(paso)) lista.push({ id: 'continuar', etiqueta: 'Continuar donde iba', evento: { tipo: 'continuar' } });
  }
  return lista;
}

/** Enlaces que acompañan al paso (no son eventos del guion). */
export function enlaces(estado) {
  if (estado.paso === 'hecho') {
    return [
      { etiqueta: 'Hacer la evaluación de madurez', href: '/evaluacion.html', cta: 'chat_evaluacion' },
      ENLACE_CALENDLY,
      { etiqueta: 'Ir al checklist', href: RECURSOS['checklist-cierre-fiscal'].href, cta: 'chat_checklist' },
    ];
  }
  if (estado.paso === 'error') return [{ etiqueta: 'Escribir a contacto@catalysis.com.mx', href: 'mailto:contacto@catalysis.com.mx', cta: 'chat_correo' }];
  if (estado.noEntendido) return [ENLACE_CALENDLY, ENLACE_WHATSAPP];
  return estado.enlacesExtra;
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
  const marcadores = { bienvenida: 'Elige una opción o escribe tu duda', dudas: 'Escribe tu duda', enlace: 'Elige una opción o escribe tu duda', nombre: 'Escribe tu nombre', correo: 'nombre@empresa.com', empresa: 'Nombre de tu empresa', telefono: '55 1234 5678' };
  return {
    placeholder: marcadores[estado.paso] || 'Elige una opción o escribe aquí',
    deshabilitado: estado.paso === 'guardando',
  };
}
