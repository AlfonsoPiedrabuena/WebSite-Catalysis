# Configuración de Firebase - Pasos Siguientes

Tu proyecto Firebase ya está configurado con las credenciales. Ahora sigue estos pasos:

## 1. Configurar Firestore Database

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **catalysis-blog**
3. En el menú lateral, ve a **Build > Firestore Database**
4. Haz clic en **"Crear base de datos"**
5. Selecciona el modo:
   - **Producción** (recomendado) - Más seguro
   - O **Modo de prueba** - Solo para desarrollo (30 días)
6. Elige la ubicación: **us-central1** o la más cercana a tus usuarios
7. Haz clic en **"Habilitar"**

## 2. Configurar las Reglas de Seguridad

Una vez creada la base de datos:

1. Ve a la pestaña **"Reglas"** en Firestore
2. Copia y pega el contenido del archivo `firestore.rules`
3. Haz clic en **"Publicar"**

O desde la terminal:
```bash
firebase deploy --only firestore:rules
```

## 3. Crear Post de Prueba

Para probar el blog, crea un post de ejemplo:

1. En Firestore, haz clic en **"Iniciar colección"**
2. ID de colección: `blog_posts`
3. Haz clic en **"Siguiente"**
4. ID del documento: (auto-generado)
5. Agrega estos campos:

### Campos del Post

| Campo | Tipo | Valor de ejemplo |
|-------|------|------------------|
| `titulo` | string | "Bienvenidos a Catalysis" |
| `resumen` | string | "Descubre cómo la transformación digital puede impulsar tu negocio hacia el futuro." |
| `contenido` | string | `<h2>Transformación Digital</h2><p>En Catalysis, ayudamos a las empresas a navegar su transformación digital con éxito...</p>` |
| `autor` | string | "Equipo Catalysis" |
| `categoria` | string | "Transformación Digital" |
| `tags` | array | ["Bienvenida", "Transformación Digital", "Innovación"] |
| `publicado` | boolean | true |
| `fecha_publicacion` | timestamp | (usa el botón para seleccionar fecha actual) |
| `fecha_creacion` | timestamp | (usa el botón para seleccionar fecha actual) |
| `vistas` | number | 0 |
| `imagen_portada` | string | (opcional) "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800" |

6. Haz clic en **"Guardar"**

## 4. Probar el Sitio Localmente

```bash
# Opción 1: Python
cd site
python3 -m http.server 8000

# Opción 2: Firebase Hosting (si tienes Firebase CLI instalado)
firebase serve

# Opción 3: VS Code Live Server
# Clic derecho en index.html > Open with Live Server
```

Luego abre http://localhost:8000 (o el puerto que indique)

## 5. Verificar Funcionalidades

### Blog
- Ve a http://localhost:8000/blog.html
- Deberías ver el post de prueba
- Haz clic para ver el detalle
- El contador de vistas debería incrementarse

### Formulario de Contacto
- Ve a http://localhost:8000/contacto.html
- Completa y envía el formulario
- Verifica en Firestore > Colección `contactos` que se guardó

## 6. Desplegar a Producción

### Opción A: Firebase Hosting (Recomendado)

```bash
# Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Login
firebase login

# Inicializar (solo la primera vez)
firebase init hosting
# Selecciona:
# - Public directory: . (punto)
# - Configure as SPA: No
# - Automatic builds: No

# Desplegar
firebase deploy --only hosting
```

### Opción B: Netlify

1. Conecta tu repositorio en [netlify.com](https://netlify.com)
2. Build settings:
   - Base directory: `site`
   - Publish directory: `site`
   - Build command: (dejar vacío)
3. Deploy

### Opción C: Vercel

```bash
npm install -g vercel
cd site
vercel
```

## 7. Crear Más Posts

Para agregar más posts al blog:

1. Firebase Console > Firestore Database
2. Colección `blog_posts`
3. **"Agregar documento"**
4. Completa los campos igual que en el post de prueba
5. Asegúrate de que `publicado: true`

## Estructura Recomendada de Contenido HTML

El campo `contenido` acepta HTML completo:

```html
<h2>Título de Sección</h2>
<p>Introducción o primer párrafo explicando el tema...</p>

<h3>Subtítulo</h3>
<p>Contenido del subtítulo con información relevante.</p>

<ul>
  <li>Punto importante 1</li>
  <li>Punto importante 2</li>
  <li>Punto importante 3</li>
</ul>

<blockquote>
  <p>Cita o texto destacado importante</p>
</blockquote>

<h3>Otro Subtítulo</h3>
<p>Más contenido...</p>

<h2>Conclusión</h2>
<p>Resumen final y call to action...</p>
```

## 8. Gestionar Contactos

Los mensajes del formulario se guardan en la colección `contactos`:

1. Firebase Console > Firestore > `contactos`
2. Ver mensajes recibidos
3. Para marcar como atendido:
   - Clic en el documento
   - Editar campo `atendido` a `true`

## Solución de Problemas

### Posts no aparecen en el sitio
- ✓ Verifica que Firestore esté habilitado
- ✓ Verifica que las reglas estén publicadas
- ✓ Verifica que el post tenga `publicado: true`
- ✓ Abre la consola del navegador (F12) para ver errores

### Formulario no envía
- ✓ Verifica las reglas de Firestore
- ✓ Verifica consola del navegador
- ✓ Asegúrate de usar servidor HTTP (no `file://`)

### Error de CORS
- ✓ No uses `file://` directo
- ✓ Usa servidor HTTP local

## Recursos

- [Firebase Console](https://console.firebase.google.com/)
- [Documentación de Firestore](https://firebase.google.com/docs/firestore)
- `README.md` - Documentación completa del proyecto
- `CLAUDE.md` - Guía de desarrollo

---

¡Todo listo! Ahora solo necesitas configurar Firestore y crear contenido. 🚀
