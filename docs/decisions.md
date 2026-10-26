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

## Abiertos (necesitan a Poncho)

1. **Logo** en SVG o PNG transparente: hoy hay un wordmark provisional (`data-slot="logo"` en `shell/*.html`).
2. **Preguntas de la evaluación** (`content/evaluacion.mjs`): son una propuesta; validar redacción y niveles.
3. **Canales nuevos en el CRM** (`sitio-flotante`, `agente`, `evaluacion`) y que `contacto.primerApellido` sea opcional: el repo `catalysis-crm` no estaba disponible al desarrollar. **Deben estar en producción antes de desplegar el sitio.**
4. **Teléfono del aviso de privacidad** (`+52 55 1234 5678`) distinto del resto del sitio (`+52 55 3933 7086`): texto legal, no se cambió sin revisión.
5. **Texto del marco de madurez**: el prototipo reescribió algunos ítems de `index.html` (p. ej. "Excel/papel" → "Excel o papel"); se usó el del prototipo.
6. **Lista de sectores**: el prototipo traía dos entradas espurias ("Nivel 1", "Nivel 2"); se usó la lista del sitio (148).
7. **Destacado del blog**: el del prototipo ("CRM a la medida vs. licencia") no está publicado; en el sitio es el publicado más reciente.
8. **GA4 (acciones manuales)**: marcar `generate_lead` como key event y registrar las dimensiones `lead_source`, `cta_id`, `cta_location`, `blog_slug`, `lead_magnet_id`.
9. **Checklist fiscal**: revisión del PDF por un contador y, después del deploy, actualizar el post con `actualizar_post_blog` (enlace a `/recursos/checklist-cierre-fiscal.html`). Fecha límite: 24 de noviembre.
10. **Repo público con `clients/`**: confirmar si es intencional (las cotizaciones están `noindex` pero son legibles en GitHub).
