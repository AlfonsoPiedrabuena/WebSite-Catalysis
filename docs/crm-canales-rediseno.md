# Cambios requeridos en el CRM por el rediseño del sitio

**Para:** quien implemente la parte del CRM (repo `catalysis-crm`, endpoint `app/api/external/v1/leads`).
**Origen:** rediseño del sitio (fases 1 y 2). Complementa `docs/crm-fuente-contrato.md`.
**Orden obligatorio:** el CRM va **antes** que el sitio. Si el sitio sale primero, el CRM responde `400` y el lead se pierde (el sitio no reintenta `4xx`).

## 1. Canales nuevos en `contacto.fuente.canal`

Agregar a la lista blanca, además de `sitio-contacto`, `sitio-home` y `lead-magnet`:

| Valor | Cuándo lo manda el sitio |
|---|---|
| `sitio-flotante` | formulario del botón flotante "Agenda tu diagnóstico" |
| `agente` | asistente automático (bot de guion fijo, sin IA) tras "Confirmar y guardar" |
| `evaluacion` | resultado de la evaluación de madurez digital (`/evaluacion.html`) |

Ningún otro cambio en `fuente` (las claves siguen siendo las de `crm-fuente-contrato.md`).

## 2. `contacto.primerApellido` opcional

El asistente y el formulario flotante piden solo un nombre. Cuando no hay apellido, el sitio **omite** la clave `primerApellido` (no manda cadena vacía). Confirmar que el CRM acepta un contacto sin `primerApellido`; si hoy es obligatorio, volverlo opcional.

## 3. Sin cambios de esquema

Sector, nivel de madurez, interés y el resultado de la evaluación viajan como texto libre en `contacto.notas` (máximo 1000 caracteres, ya truncado por el sitio). `aceptaWhatsapp` y `aceptaPrivacidad` siguen siendo campos propios.

## 4. Verificación sugerida (antes de desplegar el sitio)

1. `POST` con `fuente.canal` = cada uno de los tres valores nuevos → `200` (o `200` con `duplicated: true`).
2. `POST` sin `primerApellido` → `200`.
3. `POST` con un canal inventado → sigue en `400` (la lista blanca debe seguir cerrada).

Cuando esté desplegado, avisar para marcarlo resuelto en `docs/decisions.md` y desplegar el sitio.
