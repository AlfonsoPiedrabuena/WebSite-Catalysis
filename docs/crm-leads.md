# Alta de leads en Catalysis CRM

Movido desde CLAUDE.md. Contrato del campo `fuente`: `docs/crm-fuente-contrato.md`.

**Alta en Catalysis CRM:** `lead-register.js` crea empresa + contacto en `crm.catalysis.com.mx`
(repo `catalysis-crm`) vía su endpoint machine-to-machine `app/api/external/v1/leads` (auth por header
`X-Api-Key`, scope `leads:create`). Es el destino principal: si el CRM falla tras los reintentos
(2, a 500 ms y 1.5 s, ante `429`/`5xx`/red, con la misma `Idempotency-Key`) la función responde `502` y el
visitante ve un error — nunca un éxito falso. `4xx` no se reintenta; `401/403` se loguea como alerta.
Un `200` con `duplicated: true` (correo ya existente) es éxito para el visitante. La `Idempotency-Key`
la genera el navegador por envío (`contact.js`). Sector y nivel de madurez van como texto libre en
`contacto.notas`; consentimiento de WhatsApp y privacidad son campos propios (`aceptaWhatsapp`,
`aceptaPrivacidad`).

**Atribución (`fuente`):** `js/attribution.js` guarda `{first, last, blog_slug}` en `localStorage` y
`window.getFuente(canal)` arma `contacto.fuente`; la función filtra con lista blanca (el CRM responde
`400` ante cualquier clave desconocida). Contrato completo: `docs/crm-fuente-contrato.md`. **Orden de
despliegue: primero el CRM, después el sitio.**
