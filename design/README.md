# design/: referencia visual aprobada (solo lectura)

Cuándo leer este archivo: antes de implementar cualquier página o componente del rediseño.

Estos archivos son el prototipo aprobado por Poncho (ronda 1: 2026-10-25/26; ronda 2, completa: 2026-10-26). Lo que cambió entre rondas está en `CAMBIOS-RONDA-2.md`. **No son código de producción ni se despliegan.** Son HTML con una sintaxis de plantillas propia (`{{ valor }}`, `<sc-for>`, `<sc-if>`, un bloque `<script type="text/x-dc">`) que solo se renderiza dentro del editor de diseño de Claude; **no se abren directamente en el navegador** (les falta `support.js`). Léelos como texto: estructura, estilos en línea, copy y lógica de interacción están completos.

| Archivo | Qué muestra |
|---|---|
| `Main.dc.html` | Inicio: hero, recursos gratuitos, bloque de evaluación, blog, servicios, metodología, CTA, pie completo |
| `Servicios.dc.html` | Los 9 servicios (01-09, anclas `#servicio-N`), CTA a evaluación y diagnóstico |
| `Madurez.dc.html` | Marco de madurez: selector de nivel y detalle por nivel (texto completo) |
| `Evaluacion.dc.html` | Evaluación de 6 preguntas, resultado y formulario (copy sin correo, estados de envío y error) |
| `Blog.dc.html` | Blog y recursos: filtros, destacado, "Cargar más", tarjeta sin portada; con `state` = `loading`, `empty`, `error` |
| `Articulo.dc.html` | Artículo: cabecera, columna de lectura (`.prose`), tabla, imagen, tags, cierre `closing` = `eval` o `resource`; `state` = `loading`, `notfound` |
| `Contacto.dc.html` | Contacto: datos + formulario completo (usa `FormContacto.dc.html`) |
| `FormContacto.dc.html` | Componente del formulario completo; `state` = vacío, `filled`, `errors`, `combo`, `sending`, `server`, `success` |
| `Aviso.dc.html` | Aviso de privacidad: plantilla de texto largo con tabla de contenido |
| `Flotantes.dc.html` | Botones flotantes, formulario corto y asistente automático de guion fijo; `scenario` = estado a mostrar |
| `Buscador.dc.html` | Buscador `Ctrl K`: abierto, resultados agrupados, sin resultados |
| `EstadosAgente.dc.html` | 10 estados del asistente (consentimiento, confirmación, errores, reintento, texto no entendido) |
| `EstadosFormulario.dc.html` | 7 estados del formulario flotante |
| `EstadosContacto.dc.html` | 7 estados del formulario de Contacto |
| `EstadosBuscador.dc.html` | Buscador: abierto, resultados, vacío |
| `EstadosInteraccion.dc.html` | Foco visible, hover y deshabilitado de botones, filtros, campos, casillas, tarjetas y enlaces |
| `Blog-cargando`, `Blog-vacio`, `Blog-error`, `Articulo-cargando`, `Articulo-noencontrado`, `Articulo-recurso`, `Evaluacion-error` (`.dc.html`) | Estados de página completos (envoltorios que importan la página con `state` o `scenario`) |
| `Movil-*.dc.html` (9) | Móvil 390 px, menú abierto (Inicio también cerrado) |
| `Movil-Flotantes-*.dc.html` (5) | Flotantes en móvil: barra de botones, hoja del formulario, hoja del asistente, ambas con teclado abierto |
| `Tablet-*.dc.html` (3) | Tablet 768 px: Inicio (menú abierto), Servicios, Contacto |
| `canvas.json` | Disposición de los artboards en el lienzo (no se usa en la app) |

## Cómo usarlos

1. **Stack real:** el sitio es HTML/CSS/JS vanilla en Netlify. El prototipo se traduce a **HTML estático + CSS con variables + JS vanilla**, no a componentes de un framework. Ver `reqs/rediseno-sitio-catalysis.md` (secciones 3 y 4).
2. **Estilos:** los estilos del prototipo van en línea; pásalos a CSS con los tokens de la sección 5 del spec. No dupliques valores sueltos.
3. **Copy y contenido:** el texto de servicios, metodología, marco de madurez (completo), contacto y aviso sale del sitio actual. Los **artículos, autores, fechas y el contador de vistas son de muestra**; en la app vienen de Firestore.
4. **Imágenes:** las portadas del blog en el prototipo son copias reducidas servidas desde el editor de diseño (`/_blob/...`); esas rutas **no existen en el repo**. En la app salen de `imagen_portada` (archivos en `images/`).
5. **Datos de ejemplo:** los artículos son una muestra de los publicados. En la app vienen de Firestore, solo publicados.
6. **Lógica:** el estado (nivel elegido, paso de la evaluación, panel abierto, filtro) está en el bloque `<script type="text/x-dc">` de cada archivo. El cálculo de la evaluación y el flujo del asistente (`reduceChat`) se reimplementan como funciones puras y probadas, no copiadas tal cual. **El asistente es un guion fijo sin IA**; su interfaz solo lee mensajes y paso (ver el spec, sección 10).
7. **Correo:** ya no hay promesas de correo ni suscripción en el prototipo (no existe herramienta de correo). El copy de la evaluación es el de la sección 8 del spec.
8. **Lo que el prototipo NO resuelve:** envío real de formularios, Turnstile, persistencia, IA para el asistente, foco atrapado en paneles, el atajo global `Ctrl/Cmd + K` y la medición de la altura del teclado en móvil (`visualViewport`). El prototipo ya muestra todos los estados y la versión móvil/tablet; el comportamiento del teclado se simula con un bloque de 290 px. Están especificados.
9. **Logo:** el wordmark del prototipo es provisional. El logo real es cian y hoy solo existe como PNG con fondo blanco.
10. Si el diseño cambia, Poncho reemplaza estos archivos y se anota en `docs/decisions.md`.

11. **Anotaciones dentro del prototipo:** los textos de apoyo de las hojas `Estados*` y del artículo describen reglas; no son copy del sitio.
12. **Los flotantes en las páginas** se importan con `scenario` vacío; el atributo existe solo para mostrar estados en el lienzo. En el sitio no hay "escenarios".
