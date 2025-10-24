# Guía Paso a Paso - Configuración de Firebase

Sigue estos pasos exactos para configurar tu sitio.

## PASO 1: Habilitar Firestore Database

### 1.1 Acceder a Firebase Console

1. Abre tu navegador
2. Ve a: https://console.firebase.google.com/
3. Inicia sesión con tu cuenta de Google
4. Verás tu proyecto **"catalysis-blog"** - haz clic en él

### 1.2 Crear Firestore Database

1. En el menú lateral izquierdo, busca la sección **"Build"** (Compilar)
2. Haz clic en **"Firestore Database"**
3. Verás un botón grande que dice **"Crear base de datos"** o **"Create database"**
4. Haz clic en ese botón

### 1.3 Configurar el modo de seguridad

Te aparecerá una ventana con dos opciones:

**Opción A - Para producción (Recomendado):**
- Selecciona **"Iniciar en modo de producción"** o **"Start in production mode"**
- Esto es más seguro
- Nuestras reglas personalizadas ya están listas

**Opción B - Para desarrollo:**
- Selecciona **"Iniciar en modo de prueba"** o **"Start in test mode"**
- Solo usar si estás probando (30 días de acceso abierto)

Haz clic en **"Siguiente"** o **"Next"**

### 1.4 Elegir ubicación

1. Te preguntará la ubicación del servidor
2. Selecciona la más cercana a tus usuarios:
   - **us-central1** (Iowa) - Recomendado para México/LATAM
   - **southamerica-east1** (São Paulo) - Si tus usuarios están en Sudamérica
   - **us-east1** (Carolina del Sur) - También buena para México

3. Haz clic en **"Habilitar"** o **"Enable"**

4. Espera 1-2 minutos mientras Firebase crea tu base de datos

✅ **¡Listo!** Ahora tienes Firestore habilitado.

---

## PASO 2: Publicar Reglas de Seguridad

### 2.1 Acceder a las Reglas

1. Ya deberías estar en la página de Firestore Database
2. En la parte superior, verás varias pestañas: **Datos**, **Reglas**, **Índices**, **Uso**
3. Haz clic en la pestaña **"Reglas"** o **"Rules"**

### 2.2 Copiar las Reglas

1. Verás un editor de código con reglas por defecto
2. **Selecciona TODO el contenido** (Ctrl+A o Cmd+A)
3. **Borra** todo el contenido
4. Abre el archivo `firestore.rules` que está en tu carpeta `site/`
5. **Copia todo** el contenido de ese archivo
6. **Pega** en el editor de Firebase Console

El código debería verse así:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /blog_posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /contactos/{contactId} {
      allow read: if request.auth != null;
      allow create: if true;
      allow update, delete: if request.auth != null;
    }
  }
}
```

### 2.3 Publicar las Reglas

1. Haz clic en el botón **"Publicar"** o **"Publish"** (arriba a la derecha)
2. Confirma si te pide confirmación
3. Verás un mensaje de éxito: "Reglas publicadas correctamente"

✅ **¡Listo!** Las reglas están configuradas.

---

## PASO 3: Crear tu Primer Post de Blog

### 3.1 Crear la Colección

1. En Firestore, haz clic en la pestaña **"Datos"** o **"Data"**
2. Verás la pantalla vacía con el mensaje "Empezar creando una colección"
3. Haz clic en **"Iniciar colección"** o **"Start collection"**

### 3.2 Nombrar la Colección

1. Te pedirá el **ID de la colección**
2. Escribe exactamente: `blog_posts` (sin espacios, con guion bajo)
3. Haz clic en **"Siguiente"** o **"Next"**

### 3.3 Agregar el Primer Documento

Ahora agregarás campos uno por uno. Para cada campo:
- Haz clic en **"Agregar campo"** o **"Add field"**
- Escribe el nombre del campo
- Selecciona el tipo
- Escribe el valor

**ID del documento:**
- Deja que Firebase genere automáticamente el ID (ya está seleccionado)
- O escribe: `bienvenida-catalysis`

**Campos a agregar:**

| Campo | Tipo | Valor |
|-------|------|-------|
| `titulo` | string | `Bienvenidos a Catalysis` |
| `resumen` | string | `Descubre cómo la transformación digital puede impulsar tu negocio hacia el futuro.` |
| `contenido` | string | Ver contenido HTML abajo ⬇️ |
| `autor` | string | `Equipo Catalysis` |
| `categoria` | string | `Transformación Digital` |
| `tags` | array | Ver cómo agregar array abajo ⬇️ |
| `publicado` | boolean | `true` (selecciona true) |
| `fecha_publicacion` | timestamp | Haz clic en el reloj y selecciona fecha/hora actual |
| `fecha_creacion` | timestamp | Haz clic en el reloj y selecciona fecha/hora actual |
| `vistas` | number | `0` |
| `imagen_portada` | string | `https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800` |

### Contenido HTML para el campo `contenido`:

```html
<h2>Transformación Digital en la Era Moderna</h2>

<p>En Catalysis, entendemos que la transformación digital no es solo adoptar nuevas tecnologías, sino reinventar completamente la forma en que tu empresa opera, compite y crea valor.</p>

<h3>¿Por qué es importante?</h3>

<p>Las empresas que abrazan la transformación digital están:</p>

<ul>
  <li>Aumentando su eficiencia operativa en un 85%</li>
  <li>Mejorando la experiencia del cliente significativamente</li>
  <li>Creando nuevas fuentes de ingresos</li>
  <li>Posicionándose como líderes en sus industrias</li>
</ul>

<h3>Nuestro Enfoque</h3>

<p>Trabajamos contigo para diseñar e implementar soluciones que generan resultados medibles. Desde diagnósticos de madurez digital hasta la implementación de inteligencia artificial avanzada, cada proyecto está diseñado para impulsar el crecimiento sostenible de tu empresa.</p>

<blockquote>
  <p>"La transformación digital no es el futuro, es el presente. Las empresas que no se adapten quedarán rezagadas."</p>
</blockquote>

<h3>¿Listo para transformar tu empresa?</h3>

<p>Agenda una consulta estratégica gratuita con nuestro equipo de expertos y descubre cómo podemos ayudarte a alcanzar tus objetivos de negocio.</p>
```

### Cómo agregar el campo `tags` (array):

1. Nombre del campo: `tags`
2. Tipo: **array**
3. Haz clic en el botón **"+"** para agregar elementos
4. Para cada elemento:
   - Tipo: **string**
   - Valor: escribe el tag

Agrega estos 3 tags:
- `Bienvenida`
- `Transformación Digital`
- `Innovación`

### 3.4 Guardar el Documento

1. Revisa que todos los campos estén correctos
2. Haz clic en **"Guardar"** o **"Save"**
3. Verás tu primer documento en la colección `blog_posts`

✅ **¡Listo!** Tu primer post está creado.

---

## PASO 4: Verificar que el Blog Funciona

### 4.1 Refrescar el Sitio

1. Ve a tu navegador donde tienes abierto http://localhost:8000
2. Ve a la página **Blog** (http://localhost:8000/blog.html)
3. Refresca la página (F5 o Ctrl+R / Cmd+R)

### 4.2 Deberías Ver:

- ✅ Una tarjeta con tu post "Bienvenidos a Catalysis"
- ✅ La imagen de portada (si la agregaste)
- ✅ La categoría "Transformación Digital"
- ✅ El resumen del post
- ✅ El nombre del autor y la fecha

### 4.3 Probar el Post Individual

1. Haz clic en la tarjeta del post
2. Deberías ver la página completa del artículo
3. Verás el contenido HTML formateado
4. Los tags al final del artículo
5. El contador de vistas debería incrementarse (refresca y verás el cambio en Firebase)

✅ **¡Listo!** El blog está funcionando.

---

## PASO 5: Probar el Formulario de Contacto

### 5.1 Ir al Formulario

1. Ve a http://localhost:8000/contacto.html
2. Completa el formulario con datos de prueba:
   - Nombre: `Juan Pérez`
   - Email: `juan@test.com`
   - Empresa: `Test S.A.`
   - Teléfono: `5512345678`
   - Mensaje: `Prueba de formulario`

### 5.2 Enviar el Formulario

1. Haz clic en **"Enviar mensaje"**
2. Deberías ver un mensaje verde: "¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto."
3. El formulario se limpiará automáticamente

### 5.3 Verificar en Firebase

1. Ve a Firebase Console
2. Firestore Database > Datos
3. Deberías ver una nueva colección llamada **`contactos`**
4. Haz clic en ella
5. Verás tu mensaje de prueba con todos los campos
6. Nota que tiene `fecha_creacion` automática y `atendido: false`

✅ **¡Listo!** El formulario está funcionando.

---

## PASO 6: Crear Más Posts (Opcional)

Para agregar más posts, repite el PASO 3, pero con diferentes contenidos.

**Sugerencias de posts:**

### Post 2: Inteligencia Artificial
- Titulo: "Cómo la IA está Transformando los Negocios"
- Categoría: "Inteligencia Artificial"
- Tags: ["IA", "Automatización", "Innovación"]

### Post 3: Cloud Computing
- Titulo: "Migración a la Nube: Guía Completa"
- Categoría: "Cloud Computing"
- Tags: ["Cloud", "AWS", "Migración"]

### Post 4: Data Analytics
- Titulo: "El Poder de los Datos en la Toma de Decisiones"
- Categoría: "Data & Analytics"
- Tags: ["Datos", "Analytics", "BI"]

---

## Solución de Problemas

### ❌ El blog sigue mostrando "Cargando..."

**Solución:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Verifica:
   - ✓ Firestore está habilitado
   - ✓ Las reglas están publicadas
   - ✓ Hay al menos un post con `publicado: true`

### ❌ "Firebase not initialized"

**Solución:**
1. Verifica que `firebase-config.js` tiene tus credenciales
2. Recarga la página (Ctrl+Shift+R / Cmd+Shift+R)
3. Verifica que los scripts de Firebase estén cargando (pestaña Network en DevTools)

### ❌ El formulario no envía

**Solución:**
1. Abre la consola del navegador (F12)
2. Verifica las reglas de Firestore permiten `create` en `contactos`
3. Verifica que el sitio esté corriendo en servidor HTTP (no `file://`)

---

## ¡Felicidades! 🎉

Has configurado exitosamente tu sitio con Firebase. Ahora puedes:

- ✅ Crear y gestionar posts de blog desde Firebase Console
- ✅ Recibir mensajes del formulario de contacto
- ✅ Ver estadísticas de vistas en cada post
- ✅ Agregar, editar y eliminar contenido fácilmente

### Próximos Pasos Opcionales:

1. **Desplegar a producción** - Ver `README.md` sección "Deployment"
2. **Personalizar diseño** - Editar `css/style.css`
3. **Agregar más funcionalidades** - Ver `CLAUDE.md` para guías

### Recursos:

- 📖 **README.md** - Documentación completa
- 🔥 **Firebase Console** - https://console.firebase.google.com/
- 💡 **CLAUDE.md** - Guía de desarrollo

---

**¿Necesitas ayuda?** Consulta la documentación de Firebase o revisa los archivos de ayuda del proyecto.
