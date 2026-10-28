/* ====================================
   HISTORIAL DE CONVERSACIONES DEL ASISTENTE (sin DOM)
   Arma lo que se envía a /.netlify/functions/chat-log para entrenar la etapa 2 (aviso de
   privacidad: se guarda 5 meses). El historial NO lleva nombre, correo ni teléfono: los mensajes
   del registro se sustituyen y los correos/teléfonos del texto libre se enmascaran. La Function
   repite el enmascarado (netlify/functions/chat-log.js: `enmascarar` debe mantenerse idéntica;
   tests/chat-log.test.ts lo verifica).
   ==================================== */

export const CHAT_LOG_ENDPOINT = '/.netlify/functions/chat-log';
export const DATO_DE_REGISTRO = '[dato de registro]';
export const MAX_MENSAJES = 80;
export const MAX_TEXTO = 600;

const CORREO_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
// 7 a 15 dígitos con espacios, guiones, puntos o paréntesis entre ellos (y + inicial opcional)
const TELEFONO_RE = /(?:\+\s*)?\d(?:[\s().-]*\d){6,14}/g;

/** Correos y teléfonos del texto libre → [correo] y [teléfono]. */
export function enmascarar(texto) {
  return String(texto ?? '').replace(CORREO_RE, '[correo]').replace(TELEFONO_RE, '[teléfono]');
}

/** Qué ofreció la conversación al final: 'registro' | 'agenda' | 'whatsapp' | 'checklist' | 'dudas' | 'sin_resultado'. */
export function resultadoDe(estado) {
  if (estado.paso === 'hecho') return 'registro';
  const ultimo = [...estado.flujos].reverse().find((f) => f !== 'datos');
  return { agendar: 'agenda', persona: 'whatsapp', checklist: 'checklist', dudas: 'dudas' }[ultimo] || 'sin_resultado';
}

/** ¿Hay algo que guardar? (el saludo del bot por sí solo no es una conversación). */
export const hayConversacion = (estado) => estado.mensajes.some((m) => m.rol === 'usuario');

/**
 * Historial listo para enviar. `ctx`: { inicio (ISO), pagina, fuente }.
 * Devuelve null si el visitante aún no ha escrito ni elegido nada.
 */
export function prepararHistorial(estado, ctx = {}) {
  if (!estado.clave || !hayConversacion(estado)) return null;
  return {
    clave: estado.clave,
    inicio: ctx.inicio || '',
    pagina: ctx.pagina || '',
    fuente: ctx.fuente || undefined,
    flujos: estado.flujos.slice(),
    resultado: resultadoDe(estado),
    mensajes: estado.mensajes.slice(0, MAX_MENSAJES).map((m) => ({
      rol: m.rol,
      texto: m.privado ? DATO_DE_REGISTRO : enmascarar(m.texto).slice(0, MAX_TEXTO),
    })),
  };
}

/**
 * Envía el historial. Primer envío: `turnstileToken`; la Function responde un `sello` para los
 * siguientes (los tokens de Turnstile son de un solo uso). Nunca lanza: guardar el historial no
 * debe afectar al chat. Devuelve { ok, sello? }.
 */
export async function enviarHistorial(historial, { turnstileToken = null, sello = '' } = {}, fetchImpl = globalThis.fetch) {
  if (!historial || (!sello && !turnstileToken)) return { ok: false };
  try {
    const res = await fetchImpl(CHAT_LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sello ? { ...historial, sello } : { ...historial, turnstileToken }),
      keepalive: true,
    });
    if (!res.ok) return { ok: false };
    const datos = await res.json().catch(() => ({}));
    return { ok: true, sello: datos.sello || sello };
  } catch {
    return { ok: false };
  }
}
