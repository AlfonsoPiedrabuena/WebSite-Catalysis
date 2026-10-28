/* ============================================================
   CHAT LOG — Netlify Function
   Guarda el historial de las conversaciones del asistente automático en Firestore
   (colección asistente_conversaciones) para analizarlo y entrenar la etapa 2.
   Aviso de privacidad: se conserva 5 meses (campo `expira`, política TTL de Firestore).
   Sin dependencias: la cuenta de servicio firma su JWT con node:crypto y se escribe por la
   API REST de Firestore (las reglas de firestore.rules no aplican a este camino: el navegador
   no puede escribir en la colección).
   Autenticación: el primer envío de una conversación trae un token de Turnstile; la respuesta
   incluye un `sello` (HMAC de la clave) que los envíos siguientes presentan en su lugar,
   porque los tokens de Turnstile son de un solo uso.
   Variables: TURNSTILE_SECRET_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY. El id del proyecto no es
   secreto (ya es público en js/firebase-config.js) y va como constante: configurarlo como variable de Netlify
   rompería el build, porque el escáner de secretos lo encuentra en archivos versionados.
   ============================================================ */

const crypto = require('node:crypto');

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const PROJECT_ID = 'catalysis-blog';
const COLECCION = 'asistente_conversaciones';
const RETENCION_MESES = 5;

const CLAVE_RE = /^CAT-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
const FLUJOS = ['datos', 'agendar', 'dudas', 'checklist', 'persona'];
const RESULTADOS = ['registro', 'agenda', 'whatsapp', 'checklist', 'dudas', 'sin_resultado'];
const FUENTE_KEYS = ['utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'blogOrigen', 'primerContacto', 'canal', 'leadMagnet'];
const MAX_BODY = 60000;
const MAX_MENSAJES = 80;
const MAX_TEXTO = 600;
const FUENTE_MAX_LEN = 200;
const DATO_DE_REGISTRO = '[dato de registro]';

// Debe mantenerse idéntica a enmascarar() de js/lib/chat-log.mjs (tests/chat-log.test.ts lo verifica).
const CORREO_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const TELEFONO_RE = /(?:\+\s*)?\d(?:[\s().-]*\d){6,14}/g;
function enmascarar(texto) {
  return String(texto ?? '').replace(CORREO_RE, '[correo]').replace(TELEFONO_RE, '[teléfono]');
}

/** Sello de una conversación: solo esta Function puede generarlo (clave = secreto de Turnstile). */
function sellar(clave, secreto) {
  return crypto.createHmac('sha256', secreto).update(clave).digest('hex');
}
function selloValido(clave, sello, secreto) {
  if (typeof sello !== 'string' || sello.length !== 64) return false;
  const esperado = Buffer.from(sellar(clave, secreto));
  const recibido = Buffer.from(sello);
  return esperado.length === recibido.length && crypto.timingSafeEqual(esperado, recibido);
}

/** Valida y limpia el cuerpo; todo lo desconocido se descarta. `ahora` es un Date. */
function sanitizar(body, ahora = new Date()) {
  const mensajes = (Array.isArray(body.mensajes) ? body.mensajes : [])
    .slice(0, MAX_MENSAJES)
    .filter((m) => m && (m.rol === 'bot' || m.rol === 'usuario') && typeof m.texto === 'string')
    .map((m) => ({ rol: m.rol, texto: m.texto === DATO_DE_REGISTRO ? m.texto : enmascarar(m.texto).slice(0, MAX_TEXTO) }));

  const fuente = {};
  if (body.fuente && typeof body.fuente === 'object') {
    for (const k of FUENTE_KEYS) {
      if (typeof body.fuente[k] === 'string' && body.fuente[k].trim()) fuente[k] = body.fuente[k].trim().slice(0, FUENTE_MAX_LEN);
    }
  }

  // `inicio` lo manda el navegador; solo se acepta si es una fecha de los últimos 7 días.
  let inicio = new Date(body.inicio);
  const edad = ahora - inicio;
  if (Number.isNaN(inicio.getTime()) || edad < -60000 || edad > 7 * 86400000) inicio = ahora;
  const expira = new Date(inicio);
  expira.setMonth(expira.getMonth() + RETENCION_MESES);

  const pagina = typeof body.pagina === 'string' && body.pagina.startsWith('/') ? body.pagina.slice(0, 200) : '';
  return {
    clave: body.clave,
    inicio,
    actualizado: ahora,
    expira,
    pagina,
    fuente,
    flujos: (Array.isArray(body.flujos) ? body.flujos : []).filter((f) => FLUJOS.includes(f)).slice(0, 20),
    resultado: RESULTADOS.includes(body.resultado) ? body.resultado : 'sin_resultado',
    mensajes,
  };
}

/** Valor JS → formato de la API REST de Firestore. */
function aFirestore(v) {
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return { integerValue: String(Math.trunc(v)) };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(aFirestore) } };
  if (v && typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, aFirestore(x)])) } };
  return { nullValue: null };
}

const b64url = (b) => Buffer.from(b).toString('base64url');

/** Token de acceso OAuth2 de la cuenta de servicio (JWT RS256), con caché mientras viva. */
let cacheToken = { valor: '', expira: 0 };
async function tokenDeAcceso(env, fetchImpl) {
  if (cacheToken.valor && Date.now() < cacheToken.expira - 60000) return cacheToken.valor;
  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: env.FIREBASE_CLIENT_EMAIL, scope: 'https://www.googleapis.com/auth/datastore', aud: TOKEN_URL, iat: ahora, exp: ahora + 3600,
  }));
  const firma = crypto.createSign('RSA-SHA256').update(`${cabecera}.${claims}`).sign(env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'));
  const res = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${cabecera}.${claims}.${b64url(firma)}` }),
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const datos = await res.json();
  cacheToken = { valor: datos.access_token, expira: Date.now() + (datos.expires_in || 3600) * 1000 };
  return cacheToken.valor;
}

async function guardar(doc, env, fetchImpl) {
  const token = await tokenDeAcceso(env, fetchImpl);
  const { clave, ...campos } = doc;
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(PROJECT_ID)}/databases/(default)/documents/${COLECCION}/${clave}`;
  const res = await fetchImpl(url, {
    method: 'PATCH', // sin updateMask: crea el documento o lo reemplaza completo (se reenvía el historial entero)
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { clave: aFirestore(clave), ...aFirestore(campos).mapValue.fields } }),
  });
  if (!res.ok) throw new Error(`firestore ${res.status}`);
}

const ORIGENES = [/^https:\/\/(www\.)?catalysis\.com\.mx$/, /^https:\/\/[a-z0-9-]+--catalysis-site\.netlify\.app$/, /^https?:\/\/localhost(:\d+)?$/];

function resp(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function crearHandler(fetchImpl = globalThis.fetch, env = process.env) {
  return async (event) => {
    if (event.httpMethod !== 'POST') return resp(405, { error: 'Method not allowed' });

    const origen = event.headers && (event.headers.origin || event.headers.Origin);
    if (origen && !ORIGENES.some((re) => re.test(origen))) return resp(403, { error: 'Origen no permitido' });

    if (!env.TURNSTILE_SECRET_KEY || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
      console.error('[chat-log] faltan variables de entorno en Netlify');
      return resp(500, { error: 'Configuración del servidor incompleta' });
    }
    if ((event.body || '').length > MAX_BODY) return resp(413, { error: 'Cuerpo demasiado grande' });

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return resp(400, { error: 'JSON inválido' }); }
    if (!body || typeof body.clave !== 'string' || !CLAVE_RE.test(body.clave)) return resp(400, { error: 'Clave inválida' });

    // Autenticación: sello de una conversación ya verificada, o token de Turnstile (primer envío).
    if (!selloValido(body.clave, body.sello, env.TURNSTILE_SECRET_KEY)) {
      if (!body.turnstileToken) return resp(403, { error: 'Verificación de seguridad faltante' });
      const v = await fetchImpl(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: body.turnstileToken,
          remoteip: (event.headers && (event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'])) || '',
        }),
      });
      const datos = await v.json().catch(() => ({}));
      if (!datos.success) return resp(403, { error: 'Verificación de seguridad fallida' });
    }

    const doc = sanitizar(body);
    if (doc.mensajes.length === 0) return resp(400, { error: 'Sin mensajes' });

    try {
      await guardar(doc, env, fetchImpl);
    } catch (err) {
      console.error('[chat-log] no se pudo guardar:', err.message);
      return resp(502, { error: 'No se pudo guardar el historial' });
    }
    return resp(200, { ok: true, sello: sellar(body.clave, env.TURNSTILE_SECRET_KEY) });
  };
}

exports.handler = crearHandler();

// Solo para pruebas (tests/chat-log.test.ts)
exports.__test = { crearHandler, sanitizar, enmascarar, sellar, selloValido, aFirestore, CLAVE_RE };
