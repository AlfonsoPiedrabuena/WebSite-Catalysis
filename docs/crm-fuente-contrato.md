# Contrato sitio → CRM: `fuente` (atribución) y dedupe por correo

**Para:** quien implemente `lead-register.js`, `contact.js`, `lead-magnet.js` y `attribution.js` en `WebSite-Catalysis`.
**Origen:** implementado en `catalysis-crm` (commits locales, aún sin deploy al 2026-10-13). Este documento fija lo que el sitio debe mandar y esperar para que ambos lados queden alineados.
**Estado (2026-10-13):** implementado y desplegado en `production` (commit `9fb0e8b`) con el CRM ya en producción. Pendiente: lead magnet (`lead-magnet.js`, sin página ni spec) y verificación manual de los criterios de la sección 9. Notas de implementación: `hubspot-register.js` pasó a `lead-register.js` y HubSpot se eliminó del sitio; el CRM es el destino principal, así que un fallo tras los reintentos devuelve `502` al visitante (no es best-effort). `attribution.js` no se carga en `eventsync-sv-onepager.html` (sin formulario).
**Complementa:** `reqs/medicion-leads-ga4-utm.md` y `reqs/lead-magnet-checklist-cierre-fiscal.md` (pendientes).

## 1. Orden de despliegue (obligatorio)

1. Se despliega **primero el CRM** (y se corre su script de homologación).
2. **Después** el sitio, ya mandando `fuente`.

Si el sitio va antes, el CRM responde `400` por la clave desconocida `fuente`; el sitio no reintenta ante `4xx` y el lead se pierde. Esperar confirmación explícita de que el CRM ya está en producción.

## 2. Endpoint

`POST {CRM_LEADS_ENDPOINT}` con headers `X-Api-Key` e `Idempotency-Key` (sin cambios). El body gana **una clave opcional**: `contacto.fuente`.

```json
{
  "empresa": { "nombre": "Acme" },
  "contacto": {
    "nombre": "Ana",
    "primerApellido": "García",
    "email": "ana@acme.com",
    "telefono": "5555555555",
    "notas": "Sector: Salud\nNivel de madurez: 2",
    "aceptaPrivacidad": true,
    "fuente": {
      "utmSource": "meta",
      "utmMedium": "social",
      "utmCampaign": "facturacion",
      "utmContent": "pieza1-t1",
      "blogOrigen": "mi_articulo",
      "primerContacto": "meta",
      "canal": "sitio-contacto"
    }
  }
}
```

### Claves permitidas de `fuente` (exactas, camelCase)

| Clave | Contenido |
|---|---|
| `utmSource` | `utm_source` |
| `utmMedium` | `utm_medium` |
| `utmCampaign` | `utm_campaign` |
| `utmContent` | `utm_content` |
| `blogOrigen` | slug del artículo de origen (el de la URL, no el id de Firestore) |
| `primerContacto` | `first.utm_source`; si no hay, el `referrer` del primer toque |
| `canal` | ver tabla de valores abajo |
| `leadMagnet` | id del recurso descargado (p. ej. `checklist-cierre-fiscal`) |

Reglas (fail-closed):
- **Cualquier otra clave → `400`** y el lead se pierde. En particular **no** mandar `utm_source` (guion bajo), `utm_term`, `referrer`, `landing`, `first`, `last` ni `blog_slug`.
- Cada valor debe ser **string de máximo 200 caracteres**. Un valor que no sea string → `400`.
- **Strings vacíos o solo espacios: sin error**, se descartan.
- `fuente` es opcional; con todo vacío o ausente el lead se guarda como orgánico (sección 4).

### Valores de `canal`

| Valor | Cuándo |
|---|---|
| `sitio-contacto` | formulario de `contacto.html` (`#contactForm`) |
| `sitio-home` | formulario rápido de `index.html` (`#quick-contact-form`) |
| `lead-magnet` | descarga del checklist (además `leadMagnet: "checklist-cierre-fiscal"`) |

(`whatsapp` lo usa el flujo de WhatsApp, no el sitio.) Estos valores coinciden con `lead_source` de GA4: `contact_page` → `sitio-contacto`, `home_quick` → `sitio-home`.

## 3. Equivalencia con lo que ya guarda `attribution.js`

El sitio guarda `{ first, last, blog_slug }` en `localStorage`. Al construir `fuente` en `lead-register.js`:

| Origen en el sitio | Destino en `fuente` |
|---|---|
| `last.utm_source` (si no hay, `first.utm_source`) | `utmSource` |
| `last.utm_medium` (fallback `first`) | `utmMedium` |
| `last.utm_campaign` (fallback `first`) | `utmCampaign` |
| `last.utm_content` (fallback `first`) | `utmContent` |
| `blog_slug` | `blogOrigen` |
| `first.utm_source`, o `first.referrer` si no hay UTM | `primerContacto` |
| formulario que envía | `canal` (+ `leadMagnet` si aplica) |
| `utm_term`, `landing`, resto de `referrer` | **no se envían** (el CRM no tiene dónde guardarlos) |

Por qué `last` y no `first` para los UTM: el `fuente` del CRM es el **primer envío de ese correo**, no la primera visita del navegador. Lo que interesa saber es qué pieza provocó *este* envío; el primer toque ya viaja resumido en `primerContacto`.

La sanitización del sitio (≤100 caracteres, `[A-Za-z0-9_\-.:+ ]`) ya cumple el límite de 200 del CRM. Omitir las claves sin valor en lugar de mandarlas vacías (las vacías no dan error, pero no aportan).

**`notas`:** con `fuente` estructurada, **dejar de escribir** las líneas de atribución en `notas` (`Fuente:`, `Campaña:`, `Pieza:`, `Artículo de origen:`, `Primer contacto:`). Se conservan las que no son atribución (`Sector`, `Nivel de madurez`, `Descargó: …`). Tope de `notas`: 1000 caracteres.

## 4. Sin fuente = orgánico

Si `fuente` no viene, o viene sin `utmSource` con valor, el CRM guarda `utmSource: "organico"`. Es el comportamiento por omisión **hasta que cada canal mande su fuente correcta**; no hay que mandar `"organico"` desde el sitio, basta con no mandar `utmSource`. El resto de las claves que sí lleguen se conservan.

## 5. Respuestas del CRM

| Código | Significado | Qué hace el sitio |
|---|---|---|
| `201` | Alta nueva (empresa + contacto) | éxito |
| `200` con `duplicated: true` | El correo ya existía (mismo dueño, sin importar mayúsculas): **no** se creó nada nuevo | **éxito** para el visitante (no mostrar error ni "ya estás registrado") |
| `200`/`201` con `idempotent: true` | Reintento con la misma `Idempotency-Key` | éxito |
| `400` | Payload inválido (p. ej. clave de `fuente` desconocida) | no reintentar; log con el motivo |
| `401`/`403` | API key / scope | no reintentar; alerta |
| `429` / `5xx` | Límite o error del servidor | reintentar (2 veces, 500 ms y 1.5 s) |

Ojo: `crm-destino-principal.md` ya pide tratar como éxito toda respuesta `res.ok`; `200` y `201` lo cumplen. Cuerpo de respuesta: `{ ok, companyId, contactId, idempotent, duplicated }`.

## 6. Qué hace el CRM con un correo repetido

Para que nadie se sorprenda al revisar el CRM:
- No crea empresa ni contacto; reutiliza los existentes.
- **No** modifica `fuente` del contacto (es del primer envío); guarda la nueva en `ultimaFuente`.
- Anexa a `notas` una línea fechada `[YYYY-MM-DD] Nueva interacción (…)` con la fuente y las notas recibidas (si se pasa de 1000 caracteres, descarta lo más antiguo).
- No pisa nombre, teléfono, cargo ni empresa; solo rellena teléfono/cargo si estaban vacíos.
- Telegram avisa **"Contacto existente: nueva interacción"** (y para altas nuevas incluye fuente, campaña, artículo, recurso y canal).
- El nombre de **empresa** que mande el sitio en un duplicado se ignora (queda el de la primera vez).

## 7. `Idempotency-Key`

Hoy la función genera `randomUUID()` en cada llamada (`hubspot-register.js`, línea ~42). Con el dedupe por correo un reintento ya no crea un segundo contacto, pero sí **agregaría otra línea a `notas` y pisaría `ultimaFuente`** por cada reintento. Por eso sigue vigente lo que pide `crm-destino-principal.md`: **una clave estable por envío** (UUID generado en el navegador al enviar y reutilizado en reintentos), reenviada tal cual al CRM.

## 8. Cambios a las specs del sitio

- `medicion-leads-ga4-utm.md`, sección "Atribución hasta el backend": la fase 2 pasa a ser este contrato. Se puede implementar **directo** con `fuente` y omitir la fase 1 (líneas de atribución en `notas`), siempre que el despliegue respete la sección 1.
- `lead-magnet-checklist-cierre-fiscal.md` (línea ~29): ya no es cierto que "el CRM no deduplica por correo"; actualizar el texto. La línea `Descargó: …` en `notas` puede quedarse como apoyo, pero la fuente real va en `fuente.leadMagnet`.

## 9. Criterios de aceptación (lado sitio)

- Envío con UTM y artículo de origen → en el CRM, el contacto muestra "Origen" con `canal`, campaña, medio y artículo; Telegram trae campaña/artículo.
- Envío sin UTM (visita directa) → `Fuente: organico` en Telegram y `utmSource: organico` en el contacto, sin error.
- Segundo envío con el mismo correo (otra `Idempotency-Key`) → el sitio muestra éxito; en el CRM no hay contacto nuevo, aparece la línea "Nueva interacción" y "Última interacción".
- Un payload con una clave extra en `fuente` (prueba en `netlify dev`) → `400` registrado en logs, **nunca** éxito falso al visitante.
- Con `localStorage` bloqueado el envío sigue funcionando y se guarda como orgánico.

## 10. Cómo probar

Contra el CRM ya desplegado, con un correo de prueba claramente identificable (p. ej. `prueba+fuente@…`) y la API key de pruebas si existe. No probar con correos de clientes reales: el dedupe los reutilizaría y anexaría notas a su contacto.
