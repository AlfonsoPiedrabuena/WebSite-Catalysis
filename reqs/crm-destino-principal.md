# Requerimiento: Catalysis CRM como destino principal de leads del sitio (retirar HubSpot)

**Estado: APROBADA por Poncho el 2026-10-13 — lista para implementar, y es la PRIMERA de las specs de leads del sitio** (las de medición y lead magnet se construyen sobre `lead-register.js`). Decisiones: se retira todo lo relacionado con HubSpot; el respaldo ante falla del CRM es Telegram **y** Firestore `contactos`.

## Contexto y problema

Catalysis ya opera con su CRM interno (`crm.catalysis.com.mx`, repo `catalysis-crm`), pero el sitio se quedó con el diseño anterior:

- `netlify/functions/hubspot-register.js` escribe **primero y como fuente primaria** a HubSpot (contacto + empresa + asociación) y solo "de pasada", best-effort, al CRM.
- Si HubSpot falla (token vencido, cuenta cerrada, límites), la función responde `500` y el visitante ve un error **aunque el lead ya se creó en el CRM**. Si el token ya no es válido, hoy cada envío del formulario muestra error al visitante. **Verificar esto primero en producción** (Netlify → Functions → logs de `hubspot-register`).
- Si falla el CRM, no se entera nadie: solo `console.error`. Es el sistema de verdad, y es la parte que no debería ser silenciosa.
- La documentación (`CLAUDE.md`, `.env.example`) y el aviso de privacidad todavía describen HubSpot como plataforma de CRM.

## Objetivo

Que el CRM interno sea el único destino del formulario, con falla visible y reintento, sin depender de HubSpot.

## Cambios propuestos

1. **`hubspot-register.js` → renombrar** a `lead-register.js` (y `HUBSPOT_ENDPOINT` en `js/contact.js` y `js/lead-magnet.js` a `/.netlify/functions/lead-register`). Mantener un alias temporal `hubspot-register` (redirect interno o re-export) un ciclo de deploy por si hay caché del navegador con el JS viejo.
2. **Quitar** el bloque de HubSpot: upsert de contacto, creación de empresa, asociación, `HS_BASE`, lectura de `HUBSPOT_PRIVATE_APP_TOKEN` y su verificación al inicio.
3. **El alta en el CRM pasa a ser obligatoria y esperada** (`await`), no best-effort:
   - `Idempotency-Key` **estable por envío**: generarla en el navegador al enviar (un UUID por intento de usuario, reutilizado en reintentos) y pasarla a la función; la función la reenvía al CRM. Así un reintento nunca duplica el lead.
   - Hasta 2 reintentos con espera corta (p. ej. 500 ms, 1.5 s) ante error de red o `5xx`/`429`. Ningún reintento ante `4xx` de validación.
   - Si tras los reintentos falla: responder `502` con mensaje controlado ("No pudimos registrar tu solicitud, escríbenos a contacto@catalysis.com.mx") y `console.error` con el motivo. El visitante nunca ve un éxito falso.
   - **Respaldo mínimo**: en caso de falla definitiva, enviar un aviso a Telegram (el CRM ya notifica así; reutilizar el mismo canal vía el MCP/endpoint existente o un webhook propio) con los datos del lead, para que no se pierda un prospecto. Decidir con Poncho si se acepta guardar el lead fallido en Firestore `contactos` (legado, `create` público) como cola de reintento manual.
4. **Variables de entorno**: eliminar `HUBSPOT_PRIVATE_APP_TOKEN` de Netlify y de `.env.example`. Se conservan `TURNSTILE_SECRET_KEY`, `CRM_LEADS_ENDPOINT`, `CRM_API_KEY`. Recordar la regla del secret scanner: no escribir el valor literal de ninguna variable en archivos versionados.
5. **Documentación**: actualizar `CLAUDE.md` (resumen, diagrama de arquitectura, tabla de variables, "Páginas", "Ver contactos nuevos": ahora CRM; `contactos` de Firestore sigue como legado) y el comentario de cabecera de la función.
6. **Aviso de privacidad (`aviso-privacidad.html`, líneas ~409 y ~771)**: hoy nombra HubSpot/Salesforce como plataformas/encargados del tratamiento. Al cambiar los encargados, el texto debe reflejarlo. **No editar sin revisión legal**: dejar el cambio propuesto en el PR para que Poncho lo valide.

## Decisiones tomadas (2026-10-13)

1. **HubSpot se retira por completo** del sitio: código, variables, documentación y textos. Datos históricos de HubSpot: fuera de alcance.
2. **Respaldo ante falla definitiva del CRM: ambos** — aviso a Telegram con los datos del lead **y** guardado en Firestore `contactos` (colección legada, `create` público) como cola de reintento manual. El guardado en Firestore no debe bloquear la respuesta: si también falla, se loguea y se responde `502`.
3. **Pendiente de verificar por Poncho (no se puede desde aquí):** si el `HUBSPOT_PRIVATE_APP_TOKEN` de Netlify sigue vigente. Si ya no lo está, el formulario hoy responde error al visitante aunque el CRM recibe el lead: revisar Netlify → Functions → logs de `hubspot-register`. En ese caso esta spec es corrección urgente.

## Alcance de la limpieza de HubSpot (checklist)

- `netlify/functions/hubspot-register.js` → `lead-register.js` sin llamadas a `api.hubapi.com`.
- `js/contact.js`: cabecera "SEND TO HUBSPOT", constante `HUBSPOT_ENDPOINT` y URL del endpoint.
- `.env.example`: quitar `HUBSPOT_PRIVATE_APP_TOKEN` y sus scopes.
- Netlify: eliminar la variable `HUBSPOT_PRIVATE_APP_TOKEN` (acción manual, después del deploy).
- `CLAUDE.md` y `README.md` (líneas ~8, ~27 y ~141 mencionan HubSpot como destino).
- `reqs/og-tags-blog-post.md` línea ~31 (referencia al nombre antiguo de la función): actualizar al nuevo nombre.
- `aviso-privacidad.html` (~409, ~771): propuesta de redacción en el PR, **sin publicar sin revisión legal**.
- Se conserva el contenido editorial sobre HubSpot (artículo "HubSpot vs. SFMC", textos de servicios).

## Orden de implementación

Sin dependencia de `catalysis-crm`, pero conviene que entre **antes** o junto con `reqs/medicion-leads-ga4-utm.md`, para no construir atribución sobre la función que se va a reescribir. Si se implementa en ese orden, las specs de medición y lead magnet aplican sobre `lead-register.js`.

## Criterios de aceptación

- Un envío válido crea empresa + contacto en el CRM y responde `201`; no hay llamadas a `api.hubapi.com` (verificar en logs).
- Con el CRM caído (simular con endpoint inválido en `netlify dev`): tras los reintentos la respuesta es `502` con mensaje controlado, el visitante ve un error claro y llega el aviso de respaldo.
- Reintentar el mismo envío (misma `Idempotency-Key`) no crea un segundo lead.
- Turnstile inválido sigue respondiendo `403` sin tocar el CRM.
- `grep -ri hubspot` en el repo solo encuentra contenido editorial del blog/servicios y la nota legal pendiente.

## Fuera de alcance

- Migrar datos históricos de HubSpot.
- Contenido editorial sobre HubSpot (p. ej. el artículo "HubSpot vs Salesforce Marketing Cloud" es contenido de consultoría y se queda).
- Dedupe y campos de fuente en el CRM (`catalysis-crm/reqs/atribucion-leads-y-dedupe.md`).
