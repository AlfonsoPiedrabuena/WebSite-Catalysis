# Requerimiento: Medición de leads (GA4 + atribución UTM hasta Catalysis CRM)

**Estado: PENDIENTE (spec escrita 2026-10-13, corregida el mismo día: el destino de los leads es el Catalysis CRM interno, no HubSpot).** Objetivo de negocio de la estrategia de contenidos: **generar leads**. Hoy no se puede medir qué pieza o teaser genera uno.

## Problema

- GA4 (`G-19DQMK1HYD`) reporta **0 conversiones**: ningún envío de formulario ni clic en CTA se registra como evento. Solo se mide tráfico.
- Los UTMs de los teasers en redes (`?utm_source=meta&utm_medium=social&utm_campaign=…&utm_content=…`) viven solo en la URL de aterrizaje. Al navegar de `blog-post.html` a `contacto.html` (CTA "Agendar consulta") se pierden, y el lead llega al Catalysis CRM sin saber de qué pieza vino.
- El CTA de diagnóstico de la sección `#marco-madurez` de `index.html` va a Calendly (sitio externo): hoy es una conversión invisible.
- `contact.js` envía `firstname, lastname, email, phone, company, industry, nivel_de_madurez, …` a `hubspot-register` (la función que hoy también da de alta el lead en el CRM); no viaja ningún dato de origen.

## Objetivo

1. Registrar en GA4 los eventos de conversión: `generate_lead` (envío exitoso de cualquier formulario) y `cta_click` (clic en CTAs de diagnóstico).
2. Persistir la atribución (UTMs + artículo de origen) entre páginas y enviarla junto con el lead.
3. Que el lead en Catalysis CRM quede etiquetado con su fuente, campaña, pieza y artículo de origen.

## Enfoque sugerido

### 1. `js/attribution.js` (nuevo, incluido en todas las páginas públicas con GA4)

Incluir antes de `contact.js`, en `index.html`, `contacto.html`, `blog.html`, `blog-post.html` (y en la página del lead magnet, ver `reqs/lead-magnet-checklist-cierre-fiscal.md`).

- Al cargar, leer de `location.search`: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`. Cada valor: `trim`, máximo 100 caracteres, solo `[A-Za-z0-9_\-.:+ ]`.
- **First-touch**: si existe algún UTM y `localStorage.cat_attr_first` no existe, guardar `{utm…, referrer: document.referrer.slice(0,200), landing: location.pathname, ts}`. Sin UTM, guardar solo `referrer` y `landing` si tampoco existe.
- **Last-touch**: si hay UTM en la URL, sobrescribir `localStorage.cat_attr_last` con los UTMs actuales.
- **Artículo de origen**: `blog-post.js` llama `window.catAttribution.setBlogSlug(slug)` al renderizar un post publicado; se guarda en `cat_attr_blog` (el slug de la URL, no el ID de Firestore).
- Expiración: 90 días (`ts`); descartar entradas más viejas.
- Exponer `window.catAttribution.get()` → `{first, last, blog_slug}`.
- Todo envuelto en `try/catch`: `localStorage` puede lanzar excepciones (modo privado). Si falla, el sitio funciona igual, solo sin atribución.

### 2. Eventos GA4 (`gtag`)

- **`generate_lead`**: en `handleSubmit` de `js/contact.js`, solo tras respuesta `res.ok`. Parámetros: `lead_source` (`'contact_page'` para `#contactForm`, `'home_quick'` para `#quick-contact-form`), `nivel_madurez` (valor del selector, sin PII), `blog_slug` (si existe). **No enviar** email, teléfono, nombre ni empresa a GA4.
- **`cta_click`**: un listener delegado en `document` para cualquier elemento con `data-cta`. Parámetros: `cta_id`, `cta_location` (= `data-cta-location`), `destination` (= `href`), `blog_slug`. Para enlaces externos usar `transport_type: 'beacon'`.
- Agregar atributos `data-cta` / `data-cta-location` en:

| Elemento | `data-cta` | `data-cta-location` |
|---|---|---|
| Nav "Agenda tu diagnóstico" (todas las páginas) | `nav_diagnostico` | `nav` |
| Hero "Agenda tu diagnóstico" de `index.html` | `hero_diagnostico` | `hero` |
| `blog-post.html` "Agendar consulta" | `blog_agendar_consulta` | `blog_post` |
| `index.html` "Agenda una evaluación gratuita" (Calendly) | `madurez_calendly` | `marco_madurez` |

- **Calendly**: al hacer clic en el enlace a Calendly, agregar al href los UTMs del last-touch (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`; Calendly los conserva en la reserva). La reserva en sí no es observable desde el sitio; el evento mide la intención (clic), y la reserva se ve en Calendly.

### 3. Atribución hasta el backend

- `contact.js`: agregar al body del POST `attribution: window.catAttribution?.get() || null`.
- `netlify/functions/hubspot-register.js`:
  - Sanear `attribution`: lista blanca de claves (`first`, `last`, `blog_slug`; y dentro, solo los UTMs y `referrer`/`landing`), cada valor como string de máximo 200 caracteres. Ignorar todo lo demás. Nunca fallar el envío por una atribución mal formada.
  - **CRM**: extender `notas` en `pushToCrm` con líneas como `Fuente: <utm_source>/<utm_medium>`, `Campaña: <utm_campaign>`, `Pieza: <utm_content>`, `Artículo de origen: <blog_slug>`, `Primer contacto: <first.utm_source|referrer>`. Mismo patrón que hoy para Sector y Nivel de madurez; **no requiere cambios en `catalysis-crm`**.
  - **Límite de `notas`**: el CRM acota el campo; el bloque de atribución debe quedar ≤ 1000 caracteres en total y **no** puede introducir claves nuevas en el payload (el endpoint del CRM rechaza con 400 cualquier clave fuera de su lista permitida, y el alta se perdería en silencio por ser best-effort).
  - **HubSpot: no se toca.** No se agrega ningún PATCH ni propiedad personalizada. HubSpot se retira por completo en `reqs/crm-destino-principal.md` (aprobada): implementar **esa spec primero**; esta se aplica sobre `netlify/functions/lead-register.js`.
  - **Fase 2 (campos estructurados en el CRM)**: ver `catalysis-crm/reqs/atribucion-leads-y-dedupe.md`. Cuando el CRM despliegue ese cambio, la función enviará un objeto `fuente` en vez de texto en `notas`. **Orden obligatorio: primero se despliega el CRM, después el sitio.**

### Acciones manuales previas (no son código)

1. **GA4 → Admin → Events**: marcar `generate_lead` como **key event** (conversión) una vez que aparezca. Opcional: marcar también `cta_click`.
2. **GA4 → Admin → Custom definitions**: registrar como dimensiones de evento `lead_source`, `cta_id`, `cta_location`, `blog_slug` para poder segmentar reportes.

### Higiene de conversión (misma entrega)

- `index.html:525` "Habla con nuestro agente" tiene `href="#"`: es un botón muerto en la sección que usamos como destino de campañas. **Decisión de Poncho (2026-10-13): ocultarlo por ahora** (`hidden`, sin borrar el markup, con un comentario HTML que indique que se reactiva cuando exista el agente).

## Criterios de aceptación

- En GA4 DebugView / Realtime (probar también con el MCP `correr_reporte_tiempo_real`): enviar el formulario de `contacto.html` produce un solo `generate_lead` con `lead_source=contact_page`; el de `index.html`, con `home_quick`. Un envío fallido (Turnstile, validación) **no** produce evento.
- Entrar a `blog-post.html?id=<slug>&utm_source=meta&utm_medium=social&utm_campaign=facturacion&utm_content=pieza1-t1`, hacer clic en "Agendar consulta" y enviar el formulario: el lead en Catalysis CRM trae esas cuatro líneas en `notas` y el artículo de origen, y la notificación de Telegram del CRM las muestra.
- `cta_click` aparece con `cta_id` correcto para cada CTA de la tabla; el href de Calendly sale con los UTMs.
- Con `localStorage` bloqueado, ambos formularios siguen funcionando y no hay errores no capturados.
- Una `attribution` ausente o mal formada no impide el alta del lead ni cambia la respuesta al navegador.
- Los datos personales no aparecen en ningún evento GA4 (revisar en DebugView).

## Cómo probar sin ensuciar producción

Usar `netlify dev` con las llaves de prueba de Turnstile y un email de prueba claramente identificable; verificar en DebugView. No enviar formularios reales en producción para probar.

## Documentación

Al terminar, documentar en `docs/medicion-leads.md` (convención de UTMs, tabla de eventos, formato de `notas`) y enlazarlo desde `CLAUDE.md` con una línea. No expandir `CLAUDE.md`: ya excede el límite de ~200 líneas.

### Convención de UTMs (para todos los teasers)

`utm_source=meta`, `utm_medium=social`, `utm_campaign=<pilar: facturacion | agentes-ia | crm>`, `utm_content=<pieza>-<teaser: pieza1-t1, pieza1-t2…>`. Instagram vía bio: `utm_source=instagram&utm_medium=bio`.

## Fuera de alcance

- Cookies o scripts de tracking de terceros (HubSpot u otros) en el sitio.
- Eventos de scroll o tiempo de lectura.
- Cambios en `catalysis-crm` (campos estructurados de fuente): fase 2, spec propia en ese repo.
- Medir la reserva final de Calendly.
