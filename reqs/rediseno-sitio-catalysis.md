# Spec: Rediseño del sitio catalysis.com.mx

> Ruta en el repo: `reqs/rediseno-sitio-catalysis.md` (repo `WebSite-Catalysis`, el mismo que sirve el sitio)
> Estado: **v4. Diseño aprobado por Poncho (ronda 1); ronda 2 de diseño completa el prototipo (páginas interiores, estados y móvil/tablet). Stack y acento decididos el 2026-10-26.** Prototipo visual en `design/`; lo que cambió respecto a la ronda 1 está en `design/CAMBIOS-RONDA-2.md`.
> Reemplaza a v1 y v2, que asumían Next.js + Vercel y un sitio nuevo. Esta versión se escribió después de revisar el código real.
> Relacionados: en `reqs/`, `medicion-leads-ga4-utm.md` y `lead-magnet-checklist-cierre-fiscal.md`; en `docs/`, `crm-fuente-contrato.md`, `crm-leads.md` y `agent-friendly.md` (los specs `crm-destino-principal` y `agent-friendly-web` ya se implementaron y se borraron).

> **Avance (2026-10-26, rama `rediseno-fundaciones`):** el frontend de las Fases 1 y 2 está implementado (tokens, shell, Inicio, Servicios, Marco de madurez, Evaluación, Blog, Artículo, Contacto, Aviso, flotantes, asistente automático, buscador, lead magnet, GA4) con 179 pruebas en verde. **Pendiente:** canales nuevos en el CRM (repo `catalysis-crm`, antes de desplegar), revisión visual y Lighthouse en el preview, logo definitivo y las preguntas abiertas de `docs/decisions.md`. Cómo está construido: `docs/rediseno-frontend.md`.

## 1. Objetivo y prioridades

Rediseñar catalysis.com.mx con una experiencia tipo "dashboard" (navegación lateral, tarjetas modulares, buscador) **sobre el stack actual**, sin romper lo que ya funciona: SEO, versiones markdown para agentes, alta de leads al CRM y GA4.

Prioridades de negocio, en este orden:
1. **Captar leads rápido:** dos botones flotantes siempre visibles (formulario corto y agente conversacional).
2. **Marco de Madurez Digital y su evaluación interactiva** como diferenciador y puerta de entrada.
3. **Lead magnets y blog** con más peso en la home y en cada artículo.

## 2. Decisiones tomadas

| Tema | Decisión | Fecha |
|---|---|---|
| Stack | **Se mantiene:** HTML/CSS/JS vanilla, Netlify (Functions y Edge Functions), Firebase (blog y admin), Cloudflare Turnstile, GA4. **No se migra a Next.js.** Un generador estático (Eleventy o Astro) queda como opción futura si la duplicación del shell duele. | 2026-10-26 |
| Acento de UI | **Naranja `#C23E15`** del prototipo (identidad de interfaz nueva). El **logo conserva su cian**; validar visualmente la combinación en el shell. | 2026-10-26 |
| Referencia visual | Prototipo aprobado en `design/`; patrón general inspirado en Dashfolio Neo sin copiar nada de esa plantilla. | 2026-10-25 |
| Botones flotantes | **Se quedan siempre** en las páginas públicas: "Agenda tu diagnóstico" (formulario corto) y "Habla con el agente" (chat). El botón "Habla con nuestro agente" de la barra superior **abre el chat**; ya no apunta a Calendly. | 2026-10-26 |
| Agente | **Asistente automático con guion fijo, sin IA.** Se presenta como asistente automático. La interfaz del chat no depende de cómo se generan las respuestas: otro desarrollo podrá conectarle IA después sin tocarla. Ver 10. | 2026-10-26 |
| Contacto vs. flotantes | El formulario completo está visible en Contacto **y** existe el flotante (redundancia a propósito). En Contacto se oculta **solo el botón del formulario**; el del agente se queda. | 2026-10-26 |
| Correo | No hay herramienta de correo. Se usa el copy de 8, se quita la suscripción del Blog y la tarjeta "Guía de decisión: CRM a la medida vs. licencia". | 2026-10-26 |
| Leads | Se reutiliza `lead-register` (Netlify Function). **No se crean endpoints nuevos.** | regla de `CLAUDE.md` |

Dashfolio Neo: **prohibido** copiar código, assets, textos, íconos o el layout exacto, o mencionar "Dashfolio" en código, commits o UI.

## 3. Estado actual verificado (no volver a descubrir)

- **Páginas públicas:** `index.html` (secciones `#inicio`, `#servicios`, `#metodologia`, `#marco-madurez`, `#contacto-preview`), `servicios.html`, `contacto.html`, `blog.html`, `blog-post.html`, `aviso-privacidad.html`, `eventsync-sv-onepager.html`. Fuera de alcance: `admin-*.html`, `verificar-configuracion.html`, `clients/*`.
- **Estilos:** `css/style.css` (895 líneas; `--primary #0f0f0f`, `--secondary #fff`, `--text #666`, `--light-bg #fafafa`, `--border #e5e5e5`; fuente del sistema). Sin framework, sin build.
- **Blog:** Firestore `blog_posts` (`titulo, slug, resumen, contenido, autor, imagen_portada, categoria, tags, publicado, fecha_publicacion, vistas`). `js/blog.js` muestra solo `publicado === true` y **corta a 12** (al 2026-10-26 hay 11 publicados y 4 borradores por publicar, así que el corte se activa pronto). Las tarjetas usan `imagen_portada` (portadas `pieza1` a `pieza15` en `images/`).
- **URLs canónicas del blog:** `blog-post.html?id=<slug>`. **No cambian.** `slugify()` debe mantenerse idéntica en `js/blog-utils.js`, `netlify/edge-lib/slug.ts` y `catalysis-crm`.
- **Agent-friendly (ya implementado, con vitest en `tests/`):** `/blog/<slug>.md`, `Accept: text/markdown`, `/llms.txt`, `/sitemap.xml`, `/blog/feed.xml`, JSON-LD y OG en `blog-og.ts`. Las páginas estáticas se registran a mano en `netlify/edge-lib/site.ts` (lista para `llms.txt` y lista para el sitemap). Regla de `CLAUDE.md`: al agregar un tipo de contenido nuevo, exponer su versión markdown y registrarlo en `llms.txt`.
- **Leads:** `js/contact.js` → `netlify/functions/lead-register.js` → verifica Turnstile → CRM `POST /api/external/v1/leads` (`X-Api-Key`, `Idempotency-Key`, 2 reintentos, `502` si falla; `200 duplicated:true` es éxito). Campos: `firstname`, `lastname` (opcional), `email`, `phone` (opcional), `company`, `industry`, `nivel_de_madurez`, `acepto_recibir_mensajes_de_whatsapp`, `acuerdodeprivacidad`, `fuente`. Sector y nivel viajan como texto en `contacto.notas`. **El CRM responde 400 ante claves desconocidas**, por eso `fuente` se filtra con lista blanca (`utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `blogOrigen`, `primerContacto`, `canal`, `leadMagnet`; `canal` ∈ `sitio-contacto`, `sitio-home`, `lead-magnet`).
- **Sector:** el `<select>` tiene ~150 opciones cuyo `value` son códigos tipo `GOVERNMENT_ADMINISTRATION` (herencia de HubSpot, ya retirado). Está duplicado en `contacto.html` y en el formulario rápido de la home.
- **Atribución:** `js/attribution.js` (UTMs, referrer, artículo de origen en `localStorage`) y `window.getFuente(canal)`.
- **Analítica:** GA4 `G-19DQMK1HYD`, snippet **inline en cada página pública** (copiarlo en cada página nueva). Hoy hay **0 eventos de conversión**.
- **Specs pendientes que tocan los mismos archivos:** `medicion-leads-ga4-utm.md` (eventos `generate_lead` y `cta_click` con `data-cta`) y `lead-magnet-checklist-cierre-fiscal.md` (landing `recursos/checklist-cierre-fiscal.html`, descarga inmediata, PDF ya en `downloads/`; **correo y nurturing fuera de alcance**, fecha límite 24 nov).
- **Nosotros:** la sección está **comentada** en `index.html` y contiene cifras (200+ proyectos, 150+ clientes, 85 %, 12+ años) que Poncho no ha validado. **No reactivarla ni copiar esas cifras** sin su aprobación.
- **Ramas y despliegue:** existen `main`, `production` y `sandbox`. **Netlify despliega desde `production`, no desde `main`.** `sandbox` tenía cambios no incluidos en `main` (docs de agent-friendly, `CLAUDE.md` v3.4) al 2026-10-26: confirmar su estado antes de ramificar. No hay `.claude/agents/`, ni `.github/`, ni `package.json` en la raíz; `netlify.toml` no tiene `ignore` ni `headers`.
- **Documentación:** `CLAUDE.md` tiene 254 líneas (el límite del proyecto es ~200); lo extendido debe vivir en `docs/`.

## 4. Principios de implementación en este stack

1. **No tocar `css/style.css`.** Las páginas que no se rediseñan (admin, clients, eventsync) siguen usándolo. El diseño nuevo vive en CSS nuevo (`css/tokens.css` + `css/site.css`) y las páginas públicas rediseñadas cambian de hoja una por una.
2. **Tokens, no valores sueltos:** color, tipografía, radios y espaciado en variables CSS. El acento se cambia en un solo lugar.
3. **El shell (sidebar, barra superior, pie) se repite en cada HTML**, como hoy el nav. Para evitar deriva: marcarlo con `<!-- shell:start -->`/`<!-- shell:end -->` y agregar una prueba vitest (`tests/shell.test.ts`) que falle si el bloque difiere entre páginas públicas. El GA4 y los flotantes se incluyen igual en todas.
4. **El contenido debe estar en el HTML**, no solo en JS: el marco de madurez (los 5 niveles completos) va en el DOM y las pestañas solo muestran/ocultan. Así lo leen buscadores y agentes.
5. **Lógica pura y probada:** el cálculo de la evaluación vive en un módulo ES sin DOM (`js/lib/evaluacion.mjs`) que usan la página y vitest.
6. **Una sola lista de sectores** compartida (`js/data/sectores.js`), usada por contacto, flotante y home. Decidir con Poncho si el valor enviado sigue siendo el código heredado o pasa a etiqueta legible.
7. **Tipografías:** Sora, Inter e IBM Plex Mono con `font-display: swap`; preferir alojarlas en el repo (WOFF2) para no depender de Google Fonts y proteger el LCP.
8. **No usar el valor literal de variables de entorno en archivos versionados** (el secret scanner de Netlify rompe el build).

## 5. Tokens del diseño aprobado

| Token | Valor |
|---|---|
| Fondo | `#F4F2EC` |
| Tinta / texto | `#14171C`; secundario `#3A3F47`; apagado `#5A6068` |
| Tarjeta | `#FFFFFF`, borde `#DAD6CB`, radio 14-22 px |
| Sidebar y bloques oscuros | `#14171C`; superficies `#1B1F26` / `#262B33`; borde `#2E333B`; texto `#D9D6CE` |
| Acento | `#C23E15` (contraste 5.26:1 sobre blanco); suave = acento al 12 % sobre blanco; texto sobre suave `#8F2D0F` |
| Tipografías | Sora (títulos), Inter (cuerpo), IBM Plex Mono (etiquetas) |
| Sidebar | 272 px; en móvil se apila arriba |
| Logo | `images/catalysis_logo.png` es un PNG con fondo blanco y wordmark negro; **no sirve sobre el sidebar oscuro**. Hace falta un SVG o PNG transparente (pendiente de Poncho). El prototipo usa un wordmark provisional. |

## 6. Navegación y páginas

Sidebar fijo en desktop (barra superior + menú en móvil) con buscador (`Ctrl/Cmd + K`): **Explorar** (Inicio, Servicios, Marco de madurez, Evaluación con etiqueta "Gratis"), **Aprender** (Blog, Recursos gratuitos), **Hablemos** (Contacto). Pie: tarjeta "Agenda tu diagnóstico" (Calendly).

Atajos de una sola tecla (I, S, M, E, B, R, C) del prototipo: deben poder **desactivarse** y no actuar con foco en un campo (WCAG 2.1.4). Solo `Ctrl/Cmd + K` queda fijo.

| Página | Archivo | Fase | Notas |
|---|---|---|---|
| Inicio | `index.html` | F1 | Mantiene las anclas `#servicios`, `#metodologia`, `#marco-madurez`; el formulario rápido de `#contacto-preview` se **reemplaza** por CTA + flotante |
| Servicios | `servicios.html` | F1 | Conserva `#servicio-1` a `#servicio-9` |
| Marco de madurez | `marco-madurez.html` (nueva) | F1 | Ver 7.3; la home conserva su resumen y `#marco-madurez` |
| Evaluación | `evaluacion.html` (nueva) | F2 | Ver 8 |
| Blog | `blog.html`, `blog-post.html` | F2 | URLs sin cambio |
| Recursos gratuitos | `recursos/*.html` (nuevas) | F2 | La del checklist ya está especificada |
| Contacto, Aviso | `contacto.html`, `aviso-privacidad.html` | F2 | Diseño en 7.6 y 7.7. Contenido legal sin cambios de fondo; el aviso aún menciona HubSpot (ver `docs/crm-leads.md`), revisión legal pendiente |
| Agente | flotante | F2 (interfaz y guion; sale junto con el formulario flotante) | Asistente de guion fijo; la IA, si llega, es un proyecto aparte |
| Nosotros, Productos, Casos, Stack, Feed | | F5 | Solo con contenido aprobado; **no inventar casos de clientes** |

## 7. Páginas (según `design/`)

### 7.1 Inicio (`design/Main.dc.html`)
Hero con CTA "Evalúa tu nivel de madurez digital" y "Agenda tu diagnóstico", tarjeta de los 5 niveles → Recursos gratuitos → bloque de Evaluación → Blog (destacado + 3 recientes, con portada) → Servicios (9) → Metodología (5) → CTA final → pie.

### 7.2 Blog y recursos (`design/Blog.dc.html`)
- Solo artículos con `publicado: true`; **nunca** borradores.
- Tarjetas con **portada** (`imagen_portada`), categoría, fecha y resumen. Filtros por categoría sobre los posts cargados. Hoy el listado corta a 12: usar "Cargar más" para no perder posts cuando haya más de 12.
- Destacado = el publicado más reciente. **Sin "recurso relacionado"** (el prototipo ya no lo muestra). El destacado del prototipo es un artículo de muestra; en la app sale de Firestore.
- Estados diseñados: cargando (6 tarjetas esqueleto), vacío, error de carga con "Reintentar", "Cargar más" (a partir de 9 visibles) y tarjeta sin portada (`Blog-cargando`, `Blog-vacio`, `Blog-error` en `design/`).
- Cada artículo cierra con un bloque de evaluación o de recurso descargable (lo inyecta `blog-post.js`; el `contenido` del post sigue sanitizado). Ver 7.5.
- Posible hallazgo editorial: "Cuáles son las 4 tecnologías base…" está en "CRM y Automatización"; sugerir moverlo a "Transformación Digital".
- **La suscripción por correo ya no aparece en el prototipo** (no hay herramienta de correo decidida). No implementarla hasta decidirla (Brevo es candidato).
- La tarjeta "Guía de decisión: CRM a la medida vs. licencia" se quitó (el recurso aún no existe).

### 7.3 Marco de madurez (`design/Madurez.dc.html`)
Introducción (Identificar, Reconocer, Planificar, Medir), selector de 5 niveles y detalle del nivel (estado, características, indicadores, retos, ejemplos). Sustituye la tabla de `index.html:245-530`, inutilizable en móvil. **El prototipo abrevia los textos: la fuente de verdad es el contenido completo que hoy está en `index.html`.** Nivel activo en la URL (`?nivel=3`); botones con `aria-pressed`. Cierra con CTA a la evaluación.

### 7.4 Servicios (`design/Servicios.dc.html`)
Encabezado, CTA a la evaluación y al diagnóstico, atajos a cada servicio, **9 tarjetas en orden 01-09** (número, título, descripción, 4 viñetas) con ancla `#servicio-1` a `#servicio-9`, bloque de evaluación y CTA final. El contenido sale de `servicios.html` (no se inventa nada). Las tarjetas de la home enlazan a su ancla.

### 7.5 Artículo del blog (`design/Articulo.dc.html`)
- **Cabecera:** volver al blog, categoría, título, autor, fecha, contador de vistas (`post.vistas`), portada 16:9.
- **Columna de lectura** de 720 px máx. con estilos para `h2`, `h3`, párrafos, listas, citas, enlaces, **tablas** e **imágenes con pie**. El `contenido` es HTML sanitizado de longitud variable: aplicar los estilos con una clase `.prose` sobre el contenedor, sin tocar el HTML del post. El texto del prototipo es muestra.
- **Tablas:** en escritorio, tabla con borde; en ≤ 640 px cada fila se apila en una tarjeta y cada celda muestra su encabezado (`data-label`). `blog-post.js` debe copiar el texto de `<th>` a `data-label` de cada `<td>` después de sanitizar.
- **Cierre:** etiquetas (tags) y un bloque de cierre: `closing=eval` (evaluación) o `closing=resource` (recurso descargable, p. ej. el checklist). El tipo lo decide la configuración (`content/recursos.js`), no el esquema de Firestore.
- **Estados:** cargando (esqueleto), "Artículo no encontrado" (con enlace al blog) y contenido normal.
- La URL canónica sigue siendo `blog-post.html?id=<slug>`.

### 7.6 Contacto (`design/Contacto.dc.html`, componente `FormContacto.dc.html`)
- Dos columnas: datos de contacto (oficina, correo, teléfono, horario, tarjeta "¿Prefieres conversar?" que abre el chat) y formulario.
- **Campos:** nombre, primer apellido, correo, teléfono, empresa, sector (lista larga con búsqueda: `<input list>` con `<datalist>` o combo accesible), nivel de madurez 1-5 o "No lo sé" con enlace a la evaluación, **consentimiento de privacidad (obligatorio)** y **consentimiento de WhatsApp separado, opcional y no premarcado**, y widget Turnstile.
- **Estados** (`EstadosContacto.dc.html`): vacío, completo, errores por campo con resumen, sector con búsqueda, enviando, error de servidor (sin éxito falso: los datos se conservan) y éxito.
- **Flotantes en Contacto:** se oculta solo "Agenda tu diagnóstico"; "Habla con el agente" se queda.
- Mismo flujo que hoy: `js/contact.js` → `lead-register` → Turnstile → CRM, `fuente.canal = 'sitio-contacto'`.
- Discrepancias con el código actual a resolver en Fase 0: el formulario real **premarca** la casilla de WhatsApp (el diseño y la regla de 9 la dejan sin marcar) y su `<select>` de nivel no tiene "No lo sé".

### 7.7 Aviso de privacidad (`design/Aviso.dc.html`)
Plantilla de texto largo: título, fecha de actualización, tabla de contenido (lateral fija en escritorio; plegable en ≤ 900 px), secciones numeradas con `h2`/`h3`, listas y tarjeta de datos del responsable. Comparte la clase `.prose` con el artículo. El texto legal es el actual del sitio sin cambios de fondo. El teléfono del aviso real (`+52 55 1234 5678`) no coincide con el del resto del sitio (`+52 55 3933 7086`): confirmar cuál es el vigente.

### 7.8 Pie de página (todas las páginas)
Fondo oscuro, 4 columnas (marca y contacto; **Servicios**; **Empresa**: Metodología, Marco de madurez, Blog, Contacto, Aviso de privacidad; **Recursos**: Artículos, Evaluación de madurez, Contacto) y línea de © con el año. **Sin "Nosotros".** Una columna en ≤ 640 px, con espacio inferior para que los flotantes no tapen el pie. El wordmark es provisional: dejar un contenedor del tamaño del logo (SVG en cian) listo para sustituirlo.

### 7.9 Buscador (`design/Buscador.dc.html`)
Se abre con el campo "Buscar en el sitio" y con `Ctrl/Cmd + K` (el prototipo solo lo abre con el botón: el formato de diseño no admite atajos globales). Campo con foco, sugerencias, resultados agrupados en **Páginas, Artículos y Servicios** (máx. 4 por grupo; sin acentos ni mayúsculas) y estado "Sin resultados". `Esc` cierra; `role="dialog"`, foco atrapado y retorno del foco. El índice se arma con las páginas, los artículos publicados y los 9 servicios.

### 7.10 Responsive (móvil 390 px y tablet 768 px)
Dos puntos de quiebre, en CSS (`@media`), no en JS:
- **≤ 900 px (tablet):** el sidebar se reemplaza por una barra superior (marca, buscar, menú). El menú abierto muestra Explorar, Aprender, Hablemos, "Habla con nuestro agente" y "Agenda tu diagnóstico" en un panel oscuro superpuesto; botón con `aria-expanded`. Rejillas de 3 y 4 columnas → 2. Márgenes laterales 32 px, `h1` 44 px, `h2` 28 px. Tabla de contenido del aviso, plegable.
- **≤ 640 px (móvil):** rejillas a **una columna**; márgenes 20 px; `h1` 34 px, `h2` 25 px; tablas del artículo apiladas (ver 7.5); objetivos táctiles ≥ 44 px; pie con 4 columnas → 1 y espacio inferior de 96 px; flotantes como en 9.
- Prototipo: `Movil-*.dc.html` (menú abierto; Inicio también cerrado), `Movil-Flotantes-*.dc.html` (barra, formulario, asistente y ambos con teclado abierto) y `Tablet-*.dc.html` (Inicio con menú abierto, Servicios, Contacto). Cada uno importa la misma página: el diseño responsivo vive en la página, no en copias.

## 8. Evaluación de madurez (`design/Evaluacion.dc.html`)

**Flujo:** introducción → 6 preguntas (una por pantalla) → resultado → formulario → confirmación.
**Dimensiones:** Procesos, Sistemas, Datos, Experiencia del cliente, IA y automatización, Equipo y cultura; 5 opciones por pregunta, una por nivel.
**Cálculo:** nivel de la opción elegida (1-5) por dimensión; nivel final = promedio de las 6 redondeado, entre 1 y 5. Función pura con pruebas vitest, incluidos los límites (promedios 1.49, 1.5, 2.5, 4.5, 5).
> El banco de 6 preguntas es una **propuesta mía** que Poncho debe validar. Vive en `content/evaluacion.js`.

**Qué se guarda:** al enviar el formulario, un lead por `lead-register` con `fuente.canal = 'evaluacion'` y, **sin claves nuevas**, líneas en `contacto.notas`: `Evaluación de madurez: Nivel N (promedio X.X)` y una línea con el puntaje por dimensión (respetar el límite de `notas`, ≤ 1000 caracteres junto con la atribución).
**Error al enviar:** el formulario de resultado muestra un mensaje de error y conserva los datos (`Evaluacion-error` en `design/`), igual que el flotante.
**Reporte por correo:** **no existe herramienta de correo.** En F2 el resultado se muestra en pantalla y el formulario promete lo que sí ocurre. Cambiar el copy del prototipo:

| Prototipo | F2 (mientras no haya correo) |
|---|---|
| "Recibe tu reporte con recomendaciones" | "Revisa tu resultado con un especialista" |
| "Te enviamos el detalle…" | "Una persona de Catalysis te contactará para revisar tu resultado" |
| "Enviarme el reporte" | "Quiero que me contacten" |
| "Listo, revisa tu correo" | "Listo, te contactaremos" |
| "Y un reporte… por correo" (introducción) | "Y la opción de revisarlo con un especialista" |

El reporte por correo entra cuando se decida la herramienta.

## 9. Formulario flotante (`design/Flotantes.dc.html`)

Dos botones fijos abajo a la derecha, en todas las páginas públicas, **siempre visibles**: **"Agenda tu diagnóstico"** (formulario corto) y **"Habla con el agente"** (chat). Paneles excluyentes. El "Habla con nuestro agente" de la barra superior y de la tarjeta de Contacto **abre el chat** (no Calendly). En **Contacto** se oculta solo el botón del formulario. En móvil los botones forman una barra inferior de dos botones (≥ 44 px) y los paneles son una hoja inferior casi a pantalla completa; con el teclado abierto la hoja sube sobre el teclado (`visualViewport`) y se desplaza por dentro, sin tapar campos ni el pie.

**Burbuja de invitación:** en producción aparece tras unos segundos o un scroll mínimo, se cierra y no reaparece en la sesión (`sessionStorage`). Al pulsarla abre el chat.

**Formulario:** nombre, correo de trabajo, empresa y privacidad (obligatoria). En "más detalles": sector (lista compartida), nivel de madurez 1-5 o "No lo sé" (con enlace a la evaluación), teléfono y su casilla de consentimiento de WhatsApp **separada y no premarcada**. Estados diseñados (`EstadosFormulario.dc.html`): inicial, con detalles, errores por campo, enviando, error de envío, éxito.

**Envío (reutilizar, no reinventar):**
- Validación compartida con `contact.js` (extraer `validateFormData`), **Turnstile** renderizado al abrir el panel, `idempotencyKey` por envío, mismo POST a `/.netlify/functions/lead-register`.
- `fuente.canal = 'sitio-flotante'`. **Los canales nuevos (`sitio-flotante`, `agente`, `evaluacion`) y los ids de `leadMagnet` hay que agregarlos primero a la lista blanca del CRM** (repo `catalysis-crm`), y después a `FUENTE_KEYS`/`CANALES_SITIO` de la función. **Orden: CRM primero, sitio después.**
- Respuestas: `201` éxito; `502` o error de red → mensaje claro sin éxito falso ("Reintentar envío", datos conservados); nunca mostrar "Registro creado" sin respuesta correcta.
- Accesibilidad: `dialog` con foco atrapado, `Esc` para cerrar, retorno del foco, `aria-expanded`; foco, hover y deshabilitado según `EstadosInteraccion.dc.html`.

## 10. Asistente automático (guion fijo, sin IA)

Decisión del 2026-10-26: el agente es un **bot con guion fijo, sin IA**. Se presenta como "asistente automático", lo dice en el encabezado y en el pie del panel, y no interpreta mensajes libres.

**Flujo** (`EstadosAgente.dc.html`, 10 estados): bienvenida → nombre → correo (con "correo inválido") → empresa → qué quiere resolver (opciones) → **consentimiento** (aviso de privacidad obligatorio; WhatsApp separado, opcional y no premarcado; "Continuar" inactivo hasta aceptar el aviso) → teléfono (solo si aceptó WhatsApp; se puede omitir) → **tarjeta de confirmación** "Registro por crear" con "Confirmar y guardar" y "Corregir" → guardando → registro creado (enlaces a la evaluación y al calendario). Además: texto no entendido (ofrece formulario, Calendly o continuar donde iba), **error al guardar con "Reintentar"** (los datos se conservan), **"Ir al formulario" en cualquier paso** (copia lo capturado al formulario) y **reiniciar** la conversación.

**Contrato de la interfaz (para poder cambiar el motor sin tocarla):** el panel solo lee `{ mensajes: [{rol, texto, tipo}], paso, chips, registro, consentimientos }` y emite eventos (`texto`, `elegir`, `alternar_consentimiento`, `confirmar`, `corregir`, `reintentar`, `reiniciar`). El prototipo implementa el guion con una función pura `reduceChat(estado, evento)`; un motor con IA solo tendría que producir la misma forma de estado. Se implementa igual en el sitio y se prueba con vitest (flujo feliz, correo inválido, teléfono inválido, texto desconocido, error al guardar, reintento, corrección).

**Guardado:** solo cuando la persona pulsa "Confirmar y guardar", por el mismo flujo que el formulario (`lead-register`, Turnstile, idempotencia), `fuente.canal = 'agente'`, con los consentimientos explícitos. No hay función nueva ni clave de API: **no se crea `agente-chat.js`**.
- No se guarda el historial de la conversación.
- Fuera de alcance: IA, WhatsApp como canal del agente (proyecto aparte).
- Si más adelante se conecta IA: el modelo nunca escribe en el CRM, solo propone el borrador; entrada y respuestas son datos no confiables; límites de turnos, tokens y gasto; clave solo en variables de entorno.

## 11. SEO, agent-friendly y migración

- **Ninguna URL existente cambia.** Páginas nuevas (`marco-madurez.html`, `evaluacion.html`, `recursos/*.html`) con `<title>`, descripción, OG y `canonical`.
- Registrar las páginas nuevas en `netlify/edge-lib/site.ts` (`llms.txt` y sitemap) y **ofrecer versión markdown** del marco de madurez, servicios y metodología siguiendo el patrón de `blog-md.ts`; actualizar las pruebas.
- Copiar el snippet de GA4 en cada página nueva y cargar `attribution.js` antes de `contact.js`.
- `robots.txt` sigue siendo la única fuente de política de bots.

## 12. Analítica

Alinear con `reqs/medicion-leads-ga4-utm.md` (que es **prerrequisito**):
- `generate_lead` con `lead_source` ∈ `contact_page`, `home_quick`, `lead_magnet` (ya especificados) más `floating_form`, `agent`, `maturity_assessment`; solo tras respuesta correcta; sin datos personales.
- `cta_click` mediante atributos `data-cta` / `data-cta-location` en todos los CTA nuevos (flotantes, evaluación, bloques de la home).
- Eventos propios de la evaluación: `evaluacion_inicio`, `evaluacion_completa` (con nivel) y `marco_nivel_ver`.
- Acciones manuales en GA4 ya descritas en esa spec (key events y dimensiones personalizadas).

## 13. Calidad

- WCAG 2.1 AA: foco visible, contraste, teclado, `prefers-reduced-motion`, etiquetas reales (no `div` clicables).
- Lighthouse móvil ≥ 90 en Performance, Accessibility, Best Practices y SEO en home, blog, evaluación y contacto; los flotantes se cargan diferidos para no dañar el LCP.
- Responsivo: los prototipos están pensados para 1280-1440 px y colapsan a una columna bajo ~760 px; verificar también tablet.
- Pruebas (vitest, `cd tests && npm install && npm test`): las existentes deben seguir en verde; agregar cálculo de la evaluación, deriva del shell, lista blanca de `fuente` (canales nuevos) y registro de páginas en `llms`/sitemap.

## 14. Reglas del proyecto (estándar Catalysis, adaptadas a este repo)

**Ramas y despliegue**
- Trabajar en ramas por bloque desde `sandbox` → PR → `main` → `production` (Netlify despliega desde `production`). Sin commits directos a `main` ni a `production`. Llevar `production` al día con `git push origin main:production` solo si está estrictamente detrás; si no, merge. Verificar el último deploy realmente publicado, no asumirlo.
- **Netlify tiene créditos de build limitados:** agrupar cambios en un solo merge a `production`, y no desplegar cambios solo de documentación (agregar un `ignore` en `netlify.toml` que omita el build si solo cambiaron `*.md`, `docs/` o `reqs/`).
- Un PR por bloque funcional, explicando qué cambia, por qué y qué decisiones se tomaron.

**Documentación y contexto**
- `CLAUDE.md` es autoritativo y debe bajar de 254 a ~200 líneas: mover lo extendido a `docs/*.md` (cada uno abre con 2-3 líneas que dicen cuándo leerlo). `README.md` y `AGENTS.md` como guías secundarias.
- Registrar decisiones de arquitectura y diseño en `docs/decisions.md`. `design/` es referencia de solo lectura, no se edita ni se despliega.

**Agentes (subagentes en `.claude/agents/`, aún no existen)**

| Agente | Función | Modelo | Disparador |
|---|---|---|---|
| `docs-maintainer` | Mantiene `CLAUDE.md`, `README.md`, `AGENTS.md` y `docs/*.md` actualizados y compactos | Claude Haiku 4.5 | Después de cada merge |
| `test-runner` | Corre `cd tests && npm test` y reporta fallas | Claude Haiku 4.5 | En cada push a `sandbox` |

El criterio de arquitectura y diseño se queda en el agente principal.

## 15. Orden y fases

| Fase | Entrega | Aceptación |
|---|---|---|
| **0. Verificación** | Los hallazgos de la sección 3 ya están verificados; falta confirmar con Poncho: estado de `sandbox`, qué partes de `medicion-leads-ga4-utm` ya están hechas, si el CRM ya deduplica por correo (el `CLAUDE.md` indica que sí), y qué canales y `leadMagnet` acepta hoy el CRM | Plan por fase aprobado |
| **P1. Prerrequisito** | `reqs/medicion-leads-ga4-utm.md` (GA4 + UTMs), incluido ocultar el botón muerto del agente (provisional: el botón vuelve con el chat en F2, así que no hay una fase publicada con el botón sin bot) | Criterios de esa spec |
| **P2. Prerrequisito** | `reqs/lead-magnet-checklist-cierre-fiscal.md` (landing + PDF), **antes del 24 nov** | Criterios de esa spec |
| **1. Fundaciones** | Agentes y `ignore` de Netlify, `CLAUDE.md` recortado, tokens y CSS nuevo, shell + prueba de deriva, Inicio, Servicios, Metodología, página del Marco de madurez | Preview en `sandbox` navegable en móvil y desktop; contenido completo; Lighthouse ≥ 90; pruebas en verde |
| **2. Conversión y contenido** | Evaluación, formulario flotante, **asistente automático de guion fijo** (interfaz de 10, canal `agente`; comparte validación, Turnstile e idempotencia con el flotante), canales nuevos en CRM y función, blog nuevo (portadas, filtros, "Cargar más", bloque de lead magnet), recursos, registro en `llms`/sitemap, eventos | Un lead de cada origen llega al CRM con consentimientos y fuente; la evaluación calcula bien sus límites; ninguna URL existente cambia; el asistente no escribe sin confirmar ni sin aviso de privacidad aceptado, y Poncho aprueba su texto en español |
| **3. Asistente con IA (opcional)** | Proyecto aparte de otro desarrollo: conecta un motor con IA a la misma interfaz (ver 10, "Si más adelante se conecta IA") | Fuera de la ruta de lanzamiento; no bloquea la Fase 4 |
| **4. Lanzamiento** | Merge a `main`, `production` al día, verificación del deploy | Aprobación explícita de Poncho; rollback = volver al deploy anterior desde Netlify. El asistente de guion fijo sale con la Fase 2; solo la IA queda fuera |
| **5. Evolución** | Nosotros, Productos, Casos, Stack, Feed, suscripción y reporte por correo | Cada módulo con su contenido aprobado |

## 16. Pendientes de Poncho (con valor por defecto)

| Tema | Default propuesto |
|---|---|
| Logo en SVG o PNG transparente | Wordmark provisional hasta tenerlo |
| Combinación logo cian + acento naranja | Validar en el preview de F1 |
| Preguntas de la evaluación | Las 6 del prototipo, sujetas a validación |
| Cifras de "Nosotros" | No publicarlas |
| Contenido de "Guía de decisión: CRM a la medida vs. licencia" | Tarjeta quitada del diseño; volver a mostrarla cuando exista el recurso |
| Herramienta de correo (suscripción y reporte de evaluación) | Diferido; Brevo es candidato |
| Valor de `industry` (código heredado de HubSpot vs. etiqueta) | Etiqueta legible si el CRM lo permite |
| IA para el asistente | Fuera de alcance por ahora; la interfaz ya no depende del motor |
| Historial del chat | No se guarda |
| Repo público con `clients/` | Confirmar si es intencional; las cotizaciones por cliente están `noindex` pero son legibles en GitHub |

## 17. Fuera de alcance

- Migrar a Next.js o Vercel.
- Páginas admin, `verificar-configuracion.html`, `clients/*` y Firebase Auth/2FA.
- Cambiar el esquema de `blog_posts` o crear un segundo CMS.
- Agente de WhatsApp (proyecto separado).
- Casos de éxito sin autorización del cliente.
