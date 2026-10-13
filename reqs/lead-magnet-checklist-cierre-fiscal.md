# Requerimiento: Lead magnet "Checklist de cierre fiscal digital para PyMEs"

**Estado: PENDIENTE (spec escrita 2026-10-13).** Depende de `reqs/medicion-leads-ga4-utm.md` para la atribución y el evento `generate_lead` (se puede implementar en paralelo si se respeta el contrato descrito aquí).

## Problema

El artículo "Checklist de cierre fiscal digital para PyMEs" (pieza 3 del plan de contenidos) dice: *"Descarga el checklist completo dejando tu correo abajo — te llega en PDF"*. **No existe ni el formulario ni el PDF.** Es la única pieza pensada como captura de leads y hoy es una promesa rota en una página pública. El pico de interés es noviembre–diciembre (cierre de año), así que debe estar listo antes del 24 de noviembre.

## Objetivo

Una página de aterrizaje con formulario corto que entregue el PDF al instante y registre al lead (HubSpot + Catalysis CRM) con su atribución, reutilizando la infraestructura existente.

## Enfoque sugerido

### 1. Página `recursos/checklist-cierre-fiscal.html` (nueva)

- Misma plantilla visual que `contacto.html` (nav, footer, `css/style.css`), con el snippet de GA4 copiado de `index.html`, el script de Turnstile y `js/attribution.js`.
- Contenido: título, 3 viñetas de lo que incluye, formulario. Texto de la promesa: **"Descárgalo al instante"** (no prometer envío por correo; no se construye en esta fase).
- Formulario corto: **nombre, correo, empresa, aceptación de privacidad** + widget Turnstile (mismo `data-sitekey` que `contacto.html`). Sin teléfono ni sector, para reducir fricción. El selector de nivel de madurez va como opcional.
- `<title>`, `meta description`, `og:*` propios, `canonical`. Indexable.

### 2. Envío: reutilizar `hubspot-register` (no crear endpoint nuevo, ver CLAUDE.md)

- Nuevo archivo `js/lead-magnet.js`: valida (mismas reglas de nombre/correo/empresa que `contact.js`; extraer `validateFormData` a una función compartida o duplicarla de forma explícita), exige token de Turnstile y hace POST a `/.netlify/functions/hubspot-register` con `{firstname, email, company, acuerdodeprivacidad, turnstileToken, lead_magnet: 'checklist-cierre-fiscal', attribution}`. `phone` y `lastname` ya son opcionales en la función.
- `hubspot-register.js`:
  - Aceptar `lead_magnet` (string, lista blanca: solo `'checklist-cierre-fiscal'`; cualquier otro valor se ignora).
  - **CRM**: agregar a `notas` la línea `Descargó: Checklist de cierre fiscal digital`.
  - **HubSpot**: en el PATCH best-effort posterior al upsert (el mismo de la spec de medición), incluir `catalysis_lead_magnet = checklist-cierre-fiscal`. Si la propiedad no existe, el lead se crea igual.
  - Si el formulario llega sin `industry`/`nivel_de_madurez`, no escribir valores vacíos que pisen datos de un contacto existente (hoy el `PATCH` de duplicados envía todas las propiedades; con este formulario corto, enviar solo las que vengan con valor).
  - `company` sigue siendo requerida (la función ya lo exige).
- Al éxito (`res.ok`): ocultar el formulario, mostrar "¡Listo! Descarga tu checklist" con un botón al PDF, y disparar `gtag('event','generate_lead', {lead_source:'lead_magnet', lead_magnet_id:'checklist-cierre-fiscal', blog_slug})`. El botón de descarga también dispara `file_download` (nativo de GA4 si Enhanced Measurement está activo; si no, `cta_click` con `cta_id: 'checklist_pdf'`).

### 3. Archivo PDF

- Ruta: `downloads/checklist-cierre-fiscal-digital-pymes.pdf`, versionado en el repo (el PDF de esta entrega se genera aparte y se agrega a este mismo PR/rama).
- `netlify.toml`: header `X-Robots-Tag: noindex` para `/downloads/*` (que el PDF no compita con la landing en buscadores) y `Cache-Control` moderado.
- Limitación asumida: el PDF no está protegido por contraseña; quien conozca la URL puede bajarlo sin formulario. Para un checklist de este tipo es aceptable.

### 4. Conexión con el blog y las redes

Una vez desplegada la landing (orden importa):

1. Editar el post "Checklist de cierre fiscal digital para PyMEs" con `actualizar_post_blog` (MCP del CRM): reemplazar *"dejando tu correo abajo — te llega en PDF"* por un botón/enlace a `/recursos/checklist-cierre-fiscal.html`. `crear_post_blog`/`actualizar_post_blog` sanitizan HTML: verificar que el enlace sobreviva.
2. Los teasers de la pieza 3 (24 nov y 1 dic) pueden apuntar **directo a la landing** con UTMs, en lugar de al artículo.

## Criterios de aceptación

- Enviar el formulario con datos válidos: respuesta 201, el lead aparece en HubSpot (con `catalysis_lead_magnet`) y en Catalysis CRM (con `Descargó: …` en `notas`), se muestra el botón de descarga y el PDF abre.
- Un envío con Turnstile inválido o sin aceptar privacidad **no** muestra el PDF ni dispara `generate_lead`.
- `generate_lead` llega a GA4 con `lead_source=lead_magnet`; el evento incluye `blog_slug`/UTMs de la sesión sin datos personales.
- Un contacto existente que usa el formulario corto no pierde su `industry` ni `nivel_de_madurez`.
- La página es usable en móvil y pasa el mismo flujo de Turnstile que `contacto.html`.
- `/downloads/checklist-cierre-fiscal-digital-pymes.pdf` responde `200` con `Content-Type: application/pdf` y `X-Robots-Tag: noindex`.

## Acciones manuales

- HubSpot: crear la propiedad de contacto `catalysis_lead_magnet` (texto de una línea), junto con las de la spec de medición.
- Revisión del contenido del PDF por un contador antes de publicar: el checklist evita fechas y montos regulatorios a propósito, pero conviene validar redacción fiscal.

## Fuera de alcance

- Envío del PDF por correo y secuencia de nurturing (fase 2: workflow de HubSpot o Brevo).
- Lead magnet de la pieza 6 (plantilla de prompts): mismo patrón, se reutilizará esta página y función con otro `lead_magnet`.
- Cualquier cambio en `catalysis-crm`.

## Documentación

Al terminar, agregar la fila de la nueva página a la tabla "Páginas" de `CLAUDE.md` y documentar el flujo en `docs/medicion-leads.md` (no expandir `CLAUDE.md`).
