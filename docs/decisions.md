# Decisiones de arquitectura y diseño

Cuándo leerlo: antes de cambiar algo que parezca arbitrario del rediseño; aquí está el porqué. Registro cronológico; las más recientes al final.

## Tomadas

| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-10-26 | Se mantiene el stack (HTML/CSS/JS vanilla, Netlify, Firebase); no se migra a Next.js | El sitio funciona y tiene SEO, `.md` para agentes y alta de leads; el rediseño es visual y de conversión |
| 2026-10-26 | Acento naranja `#C23E15` en la interfaz; el logo conserva su cian | Identidad de interfaz nueva; validar la combinación en el preview |
| 2026-10-26 | Dos botones flotantes siempre visibles ("Agenda tu diagnóstico" y "Habla con el agente"); el "agente" de las barras abre el chat | Prioridad de negocio: captar leads rápido |
| 2026-10-26 | El agente es un **asistente automático de guion fijo, sin IA**; se presenta como tal. La IA, si llega, es otro proyecto sobre la misma interfaz | Evita costo, riesgo de inyección y una función nueva; el prototipo ya era un guion |
| 2026-10-26 | El asistente sale en la Fase 2 junto con el formulario flotante (antes estaba en la Fase 3) | Comparten validación, Turnstile, idempotencia y el canal nuevo del CRM; evita publicar el botón sin bot |
| 2026-10-26 | Contacto tiene el formulario completo **y** existe el flotante; en Contacto se oculta solo el botón del formulario | Redundancia a propósito; evita dos widgets de Turnstile compitiendo en la misma página |
| 2026-10-26 | Sin herramienta de correo: la evaluación promete "te contactaremos" (no un reporte por correo) y no hay suscripción en el blog | Prometer solo lo que ocurre |
| 2026-10-26 | `industry` viaja como etiqueta legible (no el código heredado de HubSpot) | Va en `contacto.notas` como texto libre; el código ya no significa nada |
| 2026-10-26 | Shell por copia entre marcadores + `scripts/sync-shell.mjs` + prueba de deriva | Sin build en producción (Netlify publica la raíz), pero una sola fuente |
| 2026-10-26 | Servicios, metodología y marco de madurez se generan desde `content/*.mjs` al HTML y a `.md` | El contenido debe estar en el HTML (buscadores y agentes) y no duplicarse |
| 2026-10-26 | Atajos de una tecla (I S M E B R C) con interruptor "Atajos de teclado" en la barra lateral; solo `Ctrl/Cmd+K` queda fijo | WCAG 2.1.4; el interruptor es el único elemento no dibujado en el prototipo |
| 2026-10-26 | Token `--accent-on-dark` (`#F08A63`) para el número de nivel sobre fondo oscuro | `--accent` da ~3.4:1 sobre esa superficie y falla AA en texto pequeño |
| 2026-10-26 | `design/`, `reqs/`, `tests/`, `scripts/` y `shell/` responden 404 en producción (`netlify.toml`) | La raíz del repo es el directorio publicado |
| 2026-10-26 | `netlify.toml` omite el build si solo cambió documentación, specs, diseño, pruebas o herramientas | Créditos de build limitados |
| 2026-10-27 | Asistente etapa 1: cinco flujos (datos, agendar, dudas, checklist, hablar con una persona); dudas por coincidencia de palabras sobre `content/*.mjs`; Calendly solo abre la liga (API en etapa 2) | Sin IA ni costo; la API de Calendly es trabajo aparte |
| 2026-10-27 | "Hablar con una persona" = WhatsApp (+52 55 3933 7086); los registros entran por el canal `agente` existente | Deja lead y no requiere cambios en el CRM |
| 2026-10-27 | Las conversaciones del asistente se guardan en Firestore (`asistente_conversaciones`) vía Function, 5 meses, incluso sin registro, con correos/teléfonos enmascarados y clave de conversación visible; sin botón para no guardar | Datos para entrenar la etapa 2; la oposición y la eliminación se piden por correo (ARCO). Aviso de privacidad actualizado |

## Respuestas de Poncho (2026-10-26)

| # | Tema | Resolución |
|---|---|---|
| 1 | Logo | Se mantiene el wordmark provisional hasta tener el archivo definitivo |
| 3 | Canales nuevos del CRM | Documentado para el agente del CRM en `docs/crm-canales-rediseno.md`; **sigue bloqueando el deploy a producción** |
| 4 | Teléfono del aviso de privacidad | Se unificó a `+52 55 3933 7086` (el del resto del sitio) |
| 5, 6, 7 | Texto del marco, sectores, destacado del blog | Aprobado como quedó |
| 2 | Preguntas de la evaluación | Aprobadas tal como están (`content/evaluacion.mjs`) |
| 10 | Repo público con `clients/` | Las cotizaciones se mantienen como estaban |

## Abiertos

1. ~~Canales nuevos y `primerApellido` opcional en el CRM~~: en producción del CRM (confirmado 2026-10-27).
2. **GA4 (acciones manuales)**: las 5 dimensiones personalizadas ya están registradas (2026-10-27). **Pendiente:** marcar `generate_lead` como key event. No aparece aún en *Admin → Events* por el retraso de procesamiento de GA4 (24 a 48 h); se puede crear ya en *Admin → Key events → New key event* con el nombre exacto `generate_lead`. El evento sí llega (visto en Realtime el 2026-10-27). Detalle y retrasos: `docs/medicion-leads.md`.
3. **Checklist fiscal**: Poncho revisa el PDF (`downloads/checklist-cierre-fiscal-digital-pymes.pdf`); después del deploy, actualizar el post con `actualizar_post_blog` (enlace a `/recursos/checklist-cierre-fiscal.html`). Fecha límite: 24 de noviembre.
4. **Revisión visual y Lighthouse ≥ 90** en el preview de `sandbox` (escritorio, tablet, móvil, teclado).
5. **Versión en inglés** (acordado 2026-10-27, se trabaja en las próximas sesiones): páginas núcleo en `/en/` con hreflang, sitemap y `llms.txt`; después evaluación/formularios/asistente y blog bilingüe (`lang: en`). Por definir: público objetivo (EE. UU./LatAm o clientes que ya hablan inglés) y si la oferta y los precios son los mismos.
6. **Asistente conversacional (antes "Fase 3")**: alcance definido en `reqs/asistente-conversacional.md` (motor, buscador e interfaz hechos el 2026-10-27). Function `chat-log`, clave de conversación y reglas listas en código. Pendiente (manual): credencial de la cuenta de servicio en Netlify y activar la TTL de Firestore (ver la spec). Sin cambios de reglas; las reglas vivas son las del repo `catalysis-crm`, no desplegar `firestore.rules` de este repo. No publicar el aviso de privacidad nuevo sin el chat que lo cumple.
