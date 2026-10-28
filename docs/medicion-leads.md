# Medición de leads (GA4 y atribución)

Cuándo leerlo: al agregar un CTA, un formulario o un evento, o al revisar reportes de conversión. ID de medición `G-19DQMK1HYD` (snippet inline en cada página pública). Implementado en `js/analytics.js`; la atribución (`js/attribution.js`) y el envío al CRM ya existían (`docs/crm-fuente-contrato.md`).

## Eventos

| Evento | Cuándo | Parámetros |
|---|---|---|
| `generate_lead` | Solo tras respuesta correcta de `lead-register`; nunca por un envío fallido | `lead_source`: `contact_page`, `floating_form`, `agent`, `maturity_assessment`, `lead_magnet` (más `home_quick`, histórico); `nivel_madurez` (si aplica); `lead_magnet_id` (lead magnet); `blog_slug` (si el visitante vino de un artículo) |
| `cta_click` | Clic en cualquier elemento con `data-cta` (delegado en `document`) | `cta_id`, `cta_location` (`data-cta-location`), `destination` (href), `blog_slug`; `transport_type: beacon` en enlaces externos |
| `evaluacion_inicio` / `evaluacion_completa` | Al empezar / terminar la evaluación | `nivel`, `promedio` (solo en completa) |
| `marco_nivel_ver` | Al elegir un nivel en el marco de madurez | `nivel` |
| `flotante_form_abrir` / `flotante_chat_abrir` | Al abrir cada panel | — |
| `asistente_flujo` | Al elegir un flujo del menú (o al hacer la primera pregunta de dudas) | `flujo`: `datos`, `agendar`, `dudas`, `checklist`, `persona` |
| `asistente_resultado` | Al llegar el chat a un enlace (agendar, checklist, persona) o completar el registro | `resultado`: `registro`, `agenda`, `whatsapp`, `checklist`, `dudas`. Es lo que el bot ofreció, no un clic |
| `asistente_sin_respuesta` | Cuando el buscador no encuentra nada | — (nunca se envía el texto escrito) |

Los clics en las ligas del chat ya los mide `cta_click` con `cta_location: chat` (`chat_calendly`, `chat_whatsapp`, `chat_checklist`, `chat_servicio`, `chat_nivel`, `chat_marco`, `chat_evaluacion`…). Para ver `flujo` y `resultado` en informes, registrarlos como dimensiones personalizadas de evento en GA4 (Admin → Definiciones personalizadas).

**Nunca** se envían a GA4 correo, teléfono, nombre ni empresa. Los enlaces a Calendly salen con los UTM del último toque (`catTrack.calendlyUrl`).

## IDs de `data-cta`

Convención `<página>_<acción>` con `data-cta-location` = sección (`hero`, `marco_madurez`, `servicios_banner`, `blog_post`, `sidebar`, `menu_movil`, `flotante`, `chat`, …). Ejemplos: `hero_evaluacion`, `hero_diagnostico`, `home_cta_final_diagnostico`, `blog_cierre_recurso`, `checklist_pdf`.

## UTM de los teasers

`utm_source=meta`, `utm_medium=social`, `utm_campaign=<pilar: facturacion | agentes-ia | crm>`, `utm_content=<pieza>-<teaser>` (`pieza1-t1`…). Instagram vía bio: `utm_source=instagram&utm_medium=bio`. Los UTM viven en `localStorage` (first/last touch + artículo de origen) y llegan al CRM en `contacto.fuente`.

## Acciones manuales en GA4 (no son código)

1. Admin → Events: marcar `generate_lead` como **key event** cuando aparezca (opcional: `cta_click`).
2. Admin → Custom definitions: dimensiones de evento `lead_source`, `cta_id`, `cta_location`, `blog_slug`, `lead_magnet_id`. **Hecho el 2026-10-27**; solo muestran datos desde esa fecha.

### Estado y retrasos de GA4 (verificado 2026-10-27)

- `generate_lead` llega a GA4 (visto en Realtime). Las pruebas de ese día (`emailprueba271026b@gmail.com` por Contacto, `correo_prueba271026@gmail.com` por el flotante) sí quedaron en el CRM.
- Retrasos: Realtime/DebugView = segundos (ventana de 30 min); *Admin → Events* = horas a 24 h; reportes y Data API = 24 a 48 h. Un evento que "no aparece" el mismo día no implica un fallo del sitio: confirmar primero en Realtime/DebugView.
- El key event se puede crear antes de que el evento aparezca en la lista (*Admin → Key events → New key event*, nombre `generate_lead`).
- Pendiente: confirmar en DebugView que el evento trae `lead_source` y ningún dato personal.
- El contador público de vistas del blog se eliminó; el tráfico por artículo se lee en GA4 (`pagePath` / `blog_slug`).

## Cómo probar sin ensuciar producción

`netlify dev` con las llaves de prueba de Turnstile y un correo claramente identificable; verificar en DebugView. No enviar formularios reales en producción para probar.
