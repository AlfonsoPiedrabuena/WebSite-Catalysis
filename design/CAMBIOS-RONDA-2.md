# Qué cambió respecto a la versión aprobada (ronda 2)

Cuándo leer este archivo: antes de comparar el prototipo con la ronda 1 o de abrir un PR de diseño. Base: el pedido de diseño de la ronda 2 (ya no está en el repo; sus decisiones están en `reqs/rediseno-sitio-catalysis.md`, sección 2).

## Decisiones reflejadas
- **Flotantes siempre visibles.** "Habla con nuestro agente" de la barra superior (y de la tarjeta de Contacto) abre el chat; ya no va a Calendly. En Contacto se oculta solo el botón del formulario.
- **Asistente automático con guion fijo, sin IA.** Se presenta como tal. La interfaz solo lee mensajes y paso; el guion es una función pura reemplazable.
- **Sin correo.** Copy nuevo de la evaluación (tabla de la sección 8 del spec), suscripción del Blog eliminada, tarjeta "Guía de decisión: CRM a la medida vs. licencia" eliminada (en Inicio y en Blog) y "recurso relacionado" del destacado del Blog eliminado.

## Páginas nuevas (1360 px)
Servicios, Artículo (con carga, "no encontrado" y cierre con recurso), Contacto (formulario completo y 7 estados), Aviso de privacidad, pie completo en todas las páginas (Servicios / Empresa / Recursos, contacto, año; sin "Nosotros").

## Componentes y estados nuevos
- **Buscador `Ctrl K`:** abierto, resultados agrupados, sin resultados.
- **Blog:** cargando, vacío, error de carga, "Cargar más", tarjeta sin portada.
- **Formulario flotante:** inicial, más detalles, errores, enviando, error de envío, éxito.
- **Asistente:** paso de **consentimiento** (aviso obligatorio; WhatsApp separado, opcional y sin marcar), tarjeta de confirmación (Confirmar / Corregir), correo inválido, texto no entendido (formulario o Calendly), error al guardar con reintento, salida al formulario y reiniciar.
- **Evaluación:** error al enviar el formulario de resultado.
- **Sistema:** foco visible, hover y deshabilitado (hoja `EstadosInteraccion`), global en la hoja de estilos del prototipo.

## Cambios en lo ya aprobado
- Inicio: las tarjetas de servicios son enlaces a `Servicios#servicio-N`; "Ver todos los servicios"; recursos pasan de 3 a 2 tarjetas; pie completo; CTAs de "Agendar" apuntan a Contacto (antes Calendly).
- Marco de madurez: **texto completo** por nivel (antes abreviado); el diseño soporta listas largas.
- Evaluación y Blog: copy sin correo (ver arriba) y estados de error/envío.
- Barra lateral y barra móvil: el botón del agente abre el chat; buscador funcional.
- Tablas del artículo: apiladas con encabezado por celda en móvil.
- Se mantienen: tokens (`#F4F2EC`, `#14171C`, `#C23E15`, Sora/Inter/IBM Plex Mono), sidebar de 272 px, tarjetas y wordmark provisional.

## Responsive
Móvil 390 px (9 tableros, menú abierto; Inicio también cerrado), flotantes en móvil con teclado abierto (5) y tablet 768 px (Inicio, Servicios, Contacto). Dos puntos de quiebre: 900 y 640 px.

## Discrepancias detectadas contra el sitio actual (a resolver en Fase 0)
1. `contacto.html` **premarca** la casilla de WhatsApp; el diseño la deja sin marcar (la regla es consentimiento explícito).
2. El teléfono del aviso de privacidad (`+52 55 1234 5678`) no coincide con el del resto del sitio (`+52 55 3933 7086`).
3. El `<select>` de nivel de madurez del sitio no tiene "No lo sé".
4. El destacado del Blog en el prototipo es un artículo de muestra ("CRM a la medida vs. licencia") que no está entre los 10 publicados; el contenido del artículo y el contador de vistas también son de muestra.
5. `Ctrl K` es un atajo global: el formato del prototipo no lo permite, así que solo está diseñado el estado abierto.
6. El error de guardado del asistente solo se ve por escenario; en el sitio depende de la respuesta de `lead-register`.
