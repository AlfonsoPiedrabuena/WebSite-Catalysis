/* ====================================
   LÓGICA COMPARTIDA DE FORMULARIOS DE LEAD
   Contacto, formulario flotante, asistente, evaluación y lead magnet validan y
   envían igual: un solo POST a la Netlify Function lead-register (Turnstile del
   lado servidor, alta en Catalysis CRM). Sin DOM: la usan las páginas y vitest.
   ==================================== */

export const LEAD_ENDPOINT = '/.netlify/functions/lead-register';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[0-9 +\-]{7,30}$/;

export const LIMITES = { nombre: 100, apellido: 100, tel: 30, empresa: 50 };

export const MENSAJES = {
  nombre: 'Escribe tu nombre.',
  apellido: 'Escribe tu primer apellido.',
  correo: 'Escribe un correo válido, por ejemplo nombre@empresa.com.',
  telRequerido: 'Usa solo números, espacios, + o - (de 7 a 30 caracteres).',
  telOpcional: 'Usa solo números, espacios, + o -.',
  empresa: 'Escribe el nombre de tu empresa.',
  sector: 'Elige un sector de la lista.',
  nivel: 'Elige tu nivel o «No lo sé todavía».',
  priv: 'Acepta el aviso de privacidad para continuar.',
  max: (n) => `Máximo ${n} caracteres.`,
};

/**
 * Valida los campos de un formulario de lead y devuelve { campo: mensaje } (vacío = válido).
 * reglas: { apellido, tel: 'requerido' | 'opcional' | undefined, sector, nivel } (nombre, correo,
 * empresa y privacidad siempre son obligatorios). `buscarSector` valida contra la lista compartida.
 */
export function validarLead(v, reglas = {}, buscarSector = null) {
  const e = {};
  const t = (x) => String(x ?? '').trim();

  if (!t(v.nombre)) e.nombre = MENSAJES.nombre;
  else if (t(v.nombre).length > LIMITES.nombre) e.nombre = MENSAJES.max(LIMITES.nombre);

  if (reglas.apellido) {
    if (!t(v.apellido)) e.apellido = MENSAJES.apellido;
    else if (t(v.apellido).length > LIMITES.apellido) e.apellido = MENSAJES.max(LIMITES.apellido);
  }

  if (!EMAIL_RE.test(t(v.correo))) e.correo = MENSAJES.correo;

  if (reglas.tel === 'requerido' || (reglas.tel === 'opcional' && t(v.tel) !== '')) {
    if (!PHONE_RE.test(t(v.tel))) e.tel = reglas.tel === 'requerido' ? MENSAJES.telRequerido : MENSAJES.telOpcional;
  }

  if (!t(v.empresa)) e.empresa = MENSAJES.empresa;
  else if (t(v.empresa).length > LIMITES.empresa) e.empresa = MENSAJES.max(LIMITES.empresa);

  if (reglas.sector) {
    const ok = buscarSector ? !!buscarSector(t(v.sector)) : t(v.sector) !== '';
    if (!ok) e.sector = MENSAJES.sector;
  }
  if (reglas.nivel && !t(v.nivel)) e.nivel = MENSAJES.nivel;
  if (!v.priv) e.priv = MENSAJES.priv;
  return e;
}

/** Solo números, espacios, + y - (se aplica al escribir en campos de teléfono). */
export const limpiarTelefono = (s) => String(s).replace(/[^0-9 +\-]/g, '');

/**
 * Cuerpo del POST a lead-register. `ctx`: { canal, leadMagnet, evaluacion: { respuestas }, interes }.
 * La atribución (`fuente`) la arma window.getFuente (js/attribution.js); sin ella, solo el canal.
 */
export function construirPayload(v, ctx = {}) {
  const t = (x) => String(x ?? '').trim();
  const fuente = typeof globalThis.getFuente === 'function'
    ? globalThis.getFuente(ctx.canal, ctx.leadMagnet)
    : { canal: ctx.canal };
  return {
    firstname: t(v.nombre),
    lastname: t(v.apellido),
    email: t(v.correo),
    phone: t(v.tel),
    company: t(v.empresa),
    industry: t(v.sector),
    nivel_de_madurez: t(v.nivel),
    acepto_recibir_mensajes_de_whatsapp: !!v.wa,
    acuerdodeprivacidad: !!v.priv,
    fuente,
    ...(ctx.evaluacion ? { evaluacion: ctx.evaluacion } : {}),
    ...(ctx.interes ? { interes: t(ctx.interes) } : {}),
  };
}

// Clave de idempotencia estable por envío: se reutiliza si la persona reintenta el mismo
// contenido tras un fallo, y cambia si modifica los datos (misma regla que tenía contact.js).
let pendiente = null;
export function claveIdempotencia(payload) {
  const huella = JSON.stringify(payload);
  if (!pendiente || pendiente.huella !== huella) {
    pendiente = { huella, clave: globalThis.crypto.randomUUID() };
  }
  return pendiente.clave;
}
export const olvidarEnvio = () => { pendiente = null; };

/**
 * Envía el lead. Devuelve { ok: true } o { ok: false, tipo, mensaje }.
 * Éxito = respuesta 2xx; 502 y errores de red nunca se muestran como éxito.
 */
export async function enviarLead(payload, turnstileToken, fetchImpl = globalThis.fetch) {
  if (!turnstileToken) {
    return { ok: false, tipo: 'turnstile', mensaje: 'Verificación de seguridad pendiente. Espera un segundo e intenta de nuevo.' };
  }
  let res;
  try {
    res = await fetchImpl(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, idempotencyKey: claveIdempotencia(payload), turnstileToken }),
    });
  } catch {
    return { ok: false, tipo: 'red', mensaje: 'No pudimos conectar. Revisa tu conexión e intenta de nuevo.' };
  }
  if (res.ok) {
    olvidarEnvio();
    return { ok: true };
  }
  const cuerpo = await res.json().catch(() => ({}));
  if (res.status === 403) return { ok: false, tipo: 'turnstile', mensaje: cuerpo.error || 'La verificación de seguridad falló. Intenta de nuevo.' };
  if (res.status === 400) return { ok: false, tipo: 'validacion', mensaje: cuerpo.error || 'Revisa los datos e intenta de nuevo.' };
  return { ok: false, tipo: 'servidor', mensaje: cuerpo.error || 'No pudimos registrar tu solicitud en este momento. Intenta de nuevo en unos minutos.' };
}
