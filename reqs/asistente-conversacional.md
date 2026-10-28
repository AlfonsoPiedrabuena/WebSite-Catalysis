# Asistente conversacional, etapa 1 (sin IA)

Estado: pasos 1 a 5 implementados (2026-10-27) y probados; falta activar en Netlify/Firebase (ver «Para activarlo») y registrar las dimensiones en GA4. Al implementarlo, lo permanente pasa a `docs/rediseno-frontend.md` y esta spec se borra.

## Alcance

Convertir el guion lineal de `js/lib/asistente.mjs` (solo registro) en un **menú con cinco flujos** y un buscador de palabras. Sigue siendo un bot de guion fijo, se presenta como tal y no interpreta texto libre con IA. La interfaz (`js/flotantes.js`) no cambia de contrato: lee `{ mensajes, paso, registro, consentimientos }` y emite eventos a `reducir()`.

| Flujo | Qué hace | Destino |
|---|---|---|
| Dejar mis datos | El guion actual (nombre → correo → empresa → interés → consentimiento → confirmar) | `lead-register`, canal `agente` |
| Agendar diagnóstico | Abre Calendly en otra ventana con UTM (`CALENDLY` en `asistente.mjs`) | Calendly |
| Dudas sobre servicios | Coincidencia de palabras sobre `content/servicios.mjs`, `metodologia` y `niveles.mjs`; responde con resumen y liga a la sección | `servicios.html#…`, `marco-madurez.html` |
| Recibir el checklist | Liga a `/recursos/checklist-cierre-fiscal.html` (el formulario ya existe ahí) | Lead magnet |
| Hablar con una persona | Abre WhatsApp `https://wa.me/525539337086` con texto prellenado | WhatsApp |

Ligas de valor, además del checklist: evaluación de madurez, marco de madurez, la sección de cada servicio, artículos del blog por tema (`categoria` y `tags` de Firestore con el mismo buscador), aviso de privacidad. Tras un registro exitoso el bot ofrece agendar y el checklist. Si el visitante no sabe qué necesita, lo manda primero a `evaluacion.html`. Cada liga lleva `data-cta` y UTM.

Fuera de alcance (etapa 2): elegir horario dentro del chat con la API de Calendly, y cualquier IA generativa.

## Buscador de dudas

- Módulo nuevo `js/lib/buscador-dudas.mjs`, sin DOM, con pruebas en `tests/`.
- Normaliza (minúsculas, sin acentos, sin palabras vacías), puntúa por coincidencia con título, palabras clave y resumen de cada servicio/nivel, y devuelve hasta 3 resultados.
- Sin coincidencia suficiente: lo dice y ofrece el menú, el formulario o WhatsApp. Nunca inventa una respuesta.
- Fuente única: los `content/*.mjs` (no duplicar textos en el motor).

## Registro de leads

Entran por el canal `agente` que ya acepta el CRM; no hay canal ni campos nuevos, así que no hay orden de despliegue CRM → sitio para esta etapa. El registro sigue exigiendo consentimiento de privacidad y Turnstile (`js/lib/turnstile.mjs`).

## Conversaciones guardadas (para entrenar la etapa 2)

Decididos (2026-10-27): **Firestore**, colección `asistente_conversaciones`; **5 meses** de retención; se guardan **también las conversaciones que no terminan en registro**.

- **Escritura**: solo desde una Netlify Function nueva (`chat-log`) que valida Turnstile y escribe con Firebase Admin. El navegador **no** escribe directo a Firestore (misma regla que `contactos`). Excepción justificada a "no crear endpoints nuevos": ese principio aplica a formularios que tocan el CRM, y esta Function no toca el CRM.
- **Variable de entorno nueva** en Netlify: credenciales de servicio de Firebase (`FIREBASE_SERVICE_ACCOUNT`). No escribir su valor en archivos versionados (secret scanner).
- **Reglas**: no hace falta ninguna. La Function escribe con cuenta de servicio (las reglas no aplican) y, sin un `match`, la colección queda denegada al navegador por omisión. **No desplegar `firestore.rules` de este repo**: las reglas vivas del proyecto `catalysis-blog` son las del repo `catalysis-crm` (CRM, cotizaciones, OAuth del MCP) y el archivo de aquí está desactualizado; un `firebase deploy --only firestore:rules` desde este repo las borraría.
- **Documento**: `id` aleatorio (clave de conversación), `inicio`, `fin`, `pagina`, `fuente` (lista blanca de `attribution.js`, sin IP), `mensajes[{rol, texto, ts}]`, `flujos[]`, `resultado` (`registro` | `agenda` | `whatsapp` | `checklist` | `dudas` | `sin_resultado`; es lo último que el bot ofreció, no un clic confirmado), `expira` (`inicio` + 5 meses). **Sin nombre, correo ni teléfono**: los de un registro viven solo en el CRM.
- **Enmascarado**: antes de guardar, correos y teléfonos del texto libre se reemplazan por `[correo]` y `[teléfono]` (lógica pura en `js/lib/`, con pruebas). Se aplica también del lado servidor en `chat-log`.
- **Envío**: al cerrar el chat o al pasar a un resultado final (`sendBeacon`/`fetch keepalive`), con tope de mensajes y de longitud por mensaje.
- **Retención**: borrado a los 5 meses. Opción A: política TTL de Firestore sobre `expira` (sin código); opción B: Function programada. Preferir A.
- **Aviso en el chat**: en la bienvenida, una línea con liga a `/aviso-privacidad.html` que avisa que la conversación se guarda para mejorar el asistente. No hay botón para no guardar (decidido 2026-10-27): la oposición y la eliminación se piden por correo (ARCO) a `alfonso@catalysis.com.mx` con la **clave de conversación**, que el chat muestra al visitante.
- **Admin**: revisar conversaciones desde el panel (`admin-*.html`) es opcional; mientras tanto, la consola de Firebase.

El aviso de privacidad ya refleja todo lo anterior (2026-10-27): datos recopilados, finalidad secundaria, proveedores, retención de 5 meses y la oposición por correo. **No publicar el sitio con el aviso nuevo sin el chat que lo cumple, ni al revés.**

## Medición

Implementado: `asistente_flujo`, `asistente_resultado` y `asistente_sin_respuesta`; los clics en ligas ya salen como `cta_click` con `data-cta` `chat_*`. Detalle en `docs/medicion-leads.md`. Pendiente (manual): registrar `flujo` y `resultado` como dimensiones en GA4.

## Orden de trabajo

1. ~~Motor de flujos y menú (`asistente.mjs`) + pruebas.~~ Hecho.
2. ~~Buscador de dudas + pruebas.~~ Hecho.
3. ~~Interfaz (`flotantes.js`): menú, ligas, aviso de guardado y clave de conversación.~~ Hecho.
4. ~~`chat-log`, enmascarado y reglas.~~ Hecho (falta activar la TTL, ver abajo; sin cambios de reglas).
5. ~~Eventos GA4 y `docs/`.~~ Hecho. Falta la revisión en preview de `sandbox`.

## Implementación del historial (paso 4)

- `js/lib/chat-log.mjs` (cliente, puro): `prepararHistorial`, `enmascarar`, `enviarHistorial`. Los mensajes del registro (`privado` en el motor) se guardan como `[dato de registro]`.
- `netlify/functions/chat-log.js`: sin dependencias; firma el JWT de la cuenta de servicio con `node:crypto` y escribe por la API REST de Firestore. Valida origen, clave, tamaño y lista blanca de campos, y repite el enmascarado.
- **Autenticación**: el primer envío de cada conversación lleva un token de Turnstile (widget propio, `tsLog`, porque el del registro es de un solo uso); la Function responde un `sello` (HMAC de la clave con `TURNSTILE_SECRET_KEY`) que usan los envíos siguientes. Sin token ni sello (por ejemplo, con un bloqueador), simplemente no se guarda nada.
- **Cuándo se envía**: al llegar a un enlace o al registro, al cerrar el chat, al reiniciar y al ocultar o cerrar la página; solo si el historial cambió.

## Para activarlo (acciones manuales)

1. Firebase Console → Configuración del proyecto → Cuentas de servicio → generar clave privada. Cargar en Netlify `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` (ver `.env.example`). **No** crear `FIREBASE_PROJECT_ID`: su valor está en archivos versionados y el escáner de secretos rompería el build. No subir el JSON al repo.
2. Crear la política TTL: `gcloud firestore fields ttls update expira --collection-group=asistente_conversaciones --enable-ttl --project=catalysis-blog` (o Firebase Console → Firestore → TTL).
3. Probar en un preview de `sandbox`: abrir el chat, elegir un flujo y verificar en Firestore que aparece el documento `CAT-…` sin datos personales.

## Por verificar

- Texto de la bienvenida con el aviso de guardado (revisión legal del aviso por quien corresponda).
- Que la política TTL esté habilitada en el proyecto de Firebase.
- Mensaje prellenado de WhatsApp.
