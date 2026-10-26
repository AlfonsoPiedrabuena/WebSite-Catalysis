/* ============================================================
   LEAD REGISTER — Netlify Function
   Recibe los datos de los formularios de Catalysis, valida Turnstile
   y da de alta el lead (empresa + contacto) en Catalysis CRM
   (crm.catalysis.com.mx) vía su endpoint de integraciones externas.
   Contrato con el CRM: docs/crm-fuente-contrato.md
   ============================================================ */

const { randomUUID } = require('node:crypto');

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Claves exactas que acepta el CRM en contacto.fuente. Cualquier otra → 400 y
// el lead se pierde, por eso se filtra con lista blanca antes de enviar.
const FUENTE_KEYS = [
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmContent',
  'blogOrigen',
  'primerContacto',
  'canal',
  'leadMagnet',
];
const FUENTE_MAX_LEN = 200;
// Canales nuevos (sitio-flotante, agente, evaluacion): el CRM los debe aceptar ANTES de desplegar
// esto; un canal que el CRM no conoce responde 400 y el lead se pierde (ver docs/crm-fuente-contrato.md).
const CANALES_SITIO = ['sitio-contacto', 'sitio-home', 'lead-magnet', 'sitio-flotante', 'agente', 'evaluacion'];
// Lead magnets publicados: id → título que se anota en `notas`. Cualquier otro id se descarta.
const LEAD_MAGNETS = { 'checklist-cierre-fiscal': 'Checklist de cierre fiscal digital' };
// Dimensiones de la evaluación de madurez, en el orden de content/evaluacion.js (tests/evaluacion.test.ts lo verifica).
const DIMENSIONES = ['Procesos', 'Sistemas', 'Datos', 'Experiencia del cliente', 'IA y automatización', 'Equipo y cultura'];
const NOTAS_MAX_LEN = 1000;

const RETRY_DELAYS_MS = [500, 1500];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Deja solo claves permitidas con string no vacío, recortado a 200 caracteres. */
function buildFuente(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const fuente = {};
  for (const key of FUENTE_KEYS) {
    const value = raw[key];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim().slice(0, FUENTE_MAX_LEN);
    if (trimmed) fuente[key] = trimmed;
  }
  if (fuente.canal && !CANALES_SITIO.includes(fuente.canal)) delete fuente.canal;
  if (fuente.leadMagnet && !LEAD_MAGNETS[fuente.leadMagnet]) delete fuente.leadMagnet;
  return Object.keys(fuente).length ? fuente : undefined;
}

/**
 * Resumen de la evaluación a partir de las seis respuestas (nivel 1-5 por dimensión). Se recalcula
 * aquí (nivel = promedio redondeado, acotado a 1-5, igual que js/lib/evaluacion.mjs) para no confiar
 * en un nivel enviado por el navegador. Devuelve [] si las respuestas no son válidas.
 */
function lineasEvaluacion(evaluacion) {
  const r = evaluacion && evaluacion.respuestas;
  if (!Array.isArray(r) || r.length !== DIMENSIONES.length || !r.every((n) => Number.isInteger(n) && n >= 1 && n <= 5)) return [];
  const promedio = r.reduce((a, b) => a + b, 0) / r.length;
  const nivel = Math.min(5, Math.max(1, Math.round(promedio)));
  return [
    `Evaluación de madurez: Nivel ${nivel} (promedio ${promedio.toFixed(1)})`,
    `Puntaje por dimensión: ${DIMENSIONES.map((d, i) => `${d} ${r[i]}`).join(', ')}`,
  ];
}

/** Texto libre de contacto.notas (sin claves nuevas en el payload); ≤ 1000 caracteres. */
function construirNotas(data, fuente) {
  const interes = typeof data.interes === 'string' ? data.interes.trim().slice(0, 100) : '';
  return [
    data.industry ? `Sector: ${data.industry}` : null,
    data.nivel_de_madurez ? `Nivel de madurez: ${data.nivel_de_madurez}` : null,
    interes ? `Interés: ${interes}` : null,
    fuente && fuente.leadMagnet ? `Descargó: ${LEAD_MAGNETS[fuente.leadMagnet]}` : null,
    ...lineasEvaluacion(data.evaluacion),
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, NOTAS_MAX_LEN);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Alta en Catalysis CRM. Auth por API key (X-Api-Key); ver
 * app/api/external/v1/leads/route.ts en catalysis-crm.
 * Devuelve { ok, status, duplicated }. 429/5xx y fallos de red se reintentan
 * (500 ms y 1.5 s) con la MISMA Idempotency-Key; 4xx no se reintenta.
 */
async function pushToCrm(data, idempotencyKey) {
  const endpoint = process.env.CRM_LEADS_ENDPOINT;
  const apiKey = process.env.CRM_API_KEY;
  if (!endpoint || !apiKey) {
    console.error('[crm-lead] CRM_LEADS_ENDPOINT o CRM_API_KEY no configurados');
    return { ok: false, status: 500, config: true };
  }

  const fuente = buildFuente(data.fuente);
  const notas = construirNotas(data, fuente);

  const payload = JSON.stringify({
    empresa: { nombre: data.company },
    contacto: {
      nombre: data.firstname,
      ...(data.lastname ? { primerApellido: data.lastname } : {}),
      email: data.email,
      ...(data.phone ? { telefono: data.phone } : {}),
      ...(notas ? { notas } : {}),
      aceptaWhatsapp: !!data.acepto_recibir_mensajes_de_whatsapp,
      aceptaPrivacidad: !!data.acuerdodeprivacidad,
      ...(fuente ? { fuente } : {}),
    },
  });

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    let res = null;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'Idempotency-Key': idempotencyKey,
        },
        body: payload,
      });
    } catch (err) {
      console.error('[crm-lead] Error de red hacia el CRM:', err);
    }

    if (res && res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: true, status: res.status, duplicated: !!body.duplicated };
    }

    if (res) {
      const errText = await res.text().catch(() => '');
      const retryable = res.status === 429 || res.status >= 500;
      if (res.status === 401 || res.status === 403) {
        console.error('[crm-lead] ALERTA: API key o scope rechazado por el CRM:', res.status, errText);
      } else {
        console.error('[crm-lead] CRM respondió', res.status, errText);
      }
      if (!retryable) return { ok: false, status: res.status };
    }

    if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt]);
  }

  return { ok: false, status: 502 };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return resp(405, { error: 'Method not allowed' });
  }

  const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
  if (!TURNSTILE_SECRET) {
    console.error('TURNSTILE_SECRET_KEY no configurado en Netlify');
    return resp(500, { error: 'Configuración del servidor incompleta' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return resp(400, { error: 'JSON inválido' });
  }

  const {
    firstname,
    lastname = '',
    email,
    phone = '',
    company,
    industry = '',
    nivel_de_madurez = '',
    acepto_recibir_mensajes_de_whatsapp = false,
    acuerdodeprivacidad = false,
    fuente,
    evaluacion,
    interes,
    idempotencyKey,
    turnstileToken,
  } = body;

  // Verificar Turnstile ANTES de tocar el CRM
  if (!turnstileToken) {
    return resp(403, { error: 'Verificación de seguridad faltante' });
  }
  const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: TURNSTILE_SECRET,
      response: turnstileToken,
      remoteip: event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || '',
    }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
    console.error('Turnstile verify failed:', verifyData);
    return resp(403, { error: 'Verificación de seguridad fallida. Recarga la página e intenta de nuevo.' });
  }

  if (!firstname || !email || !company) {
    return resp(400, { error: 'Faltan campos requeridos: nombre, email y empresa' });
  }
  if (!acuerdodeprivacidad) {
    return resp(400, { error: 'Debes aceptar el aviso de privacidad' });
  }

  // Clave estable por envío (la genera el navegador y se reutiliza en reintentos)
  const key = typeof idempotencyKey === 'string' && UUID_RE.test(idempotencyKey) ? idempotencyKey : randomUUID();

  const result = await pushToCrm(
    {
      firstname,
      lastname,
      email,
      phone,
      company,
      industry,
      nivel_de_madurez,
      acepto_recibir_mensajes_de_whatsapp,
      acuerdodeprivacidad,
      fuente,
      evaluacion,
      interes,
    },
    key
  ).catch((err) => {
    console.error('[crm-lead] pushToCrm falló:', err);
    return { ok: false, status: 500 };
  });

  // El CRM es el destino principal: si no se pudo registrar, el visitante NO ve éxito.
  if (!result.ok) {
    return resp(502, {
      error: 'No pudimos registrar tu solicitud en este momento. Intenta de nuevo en unos minutos.',
    });
  }

  // 200 duplicated:true (correo ya existente) también es éxito para el visitante.
  return resp(201, { success: true });
};

function resp(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// Solo para pruebas (tests/lead-register.test.ts)
exports.__test = { buildFuente, construirNotas, lineasEvaluacion, CANALES_SITIO, LEAD_MAGNETS, DIMENSIONES };
