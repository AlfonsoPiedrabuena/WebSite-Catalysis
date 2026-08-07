# Catalysis - Sitio Web con Firebase

Sitio web estático de Catalysis Consultoría con integración de Firebase para gestión de blog y formulario de contacto.

## Estructura del Proyecto

Este README cubre solo la parte de Firebase (blog + Firestore). Para la
arquitectura completa del sitio (Netlify Functions, HubSpot, Turnstile,
Google Analytics) ver [`CLAUDE.md`](./CLAUDE.md), que es la referencia
actualizada.

```
./                        # raíz del repo = raíz del sitio (sin subcarpeta site/)
├── index.html
├── servicios.html
├── contacto.html
├── blog.html
├── blog-post.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── firebase-config.js
│   ├── blog.js
│   ├── blog-post.js
│   └── contact.js
├── netlify/functions/    # formularios → HubSpot (ver CLAUDE.md)
└── images/                # imágenes del sitio (agregar assets aquí)
```

## Configuración de Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Nombra tu proyecto (ej: "catalysis-website")
4. Sigue los pasos para crear el proyecto

### 2. Configurar Firestore Database

1. En la consola de Firebase, ve a **Build > Firestore Database**
2. Haz clic en "Crear base de datos"
3. Selecciona el modo de inicio:
   - **Modo de producción**: Para producción
   - **Modo de prueba**: Para desarrollo (permite lectura/escritura temporalmente)
4. Elige la ubicación (preferiblemente `us-central1` o la más cercana a tus usuarios)
5. Haz clic en "Habilitar"

### 3. Configurar Reglas de Seguridad de Firestore

En la pestaña "Reglas" de Firestore, configura las siguientes reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Blog posts - lectura pública, escritura solo para admin
    match /blog_posts/{postId} {
      allow read: if true;  // Cualquiera puede leer posts
      allow write: if request.auth != null;  // Solo usuarios autenticados pueden escribir
    }

    // Contactos - solo escritura pública (para formulario)
    match /contactos/{contactId} {
      allow read: if request.auth != null;  // Solo admin puede leer
      allow create: if true;  // Cualquiera puede crear (enviar formulario)
      allow update, delete: if request.auth != null;  // Solo admin puede actualizar/eliminar
    }
  }
}
```

### 4. Obtener Credenciales del Proyecto

1. En Firebase Console, ve a **Configuración del proyecto** (ícono de engranaje)
2. En la pestaña "General", baja hasta "Tus apps"
3. Haz clic en el ícono web `</>` para agregar una app web
4. Nombra tu app (ej: "Catalysis Web")
5. **NO** marques "Configurar Firebase Hosting"
6. Copia las credenciales que aparecen

### 5. Configurar el Sitio Web

1. Abre el archivo `js/firebase-config.js`
2. Reemplaza las credenciales con las de tu proyecto:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT_ID.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT_ID.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};
```

### 6. Agregar Firebase SDK a las Páginas HTML

Asegúrate de que las páginas que usan Firebase (`index.html`, `blog.html`, `blog-post.html`, `contacto.html`) incluyan los scripts de Firebase **antes** de los scripts personalizados:

```html
<!-- Firebase App (the core Firebase SDK) -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<!-- Firebase Firestore -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

<!-- Scripts del sitio -->
<script src="js/main.js"></script>
<script src="js/firebase-config.js"></script>
<!-- Otros scripts según la página -->
```

## Estructura de Datos en Firestore

### Colección: `blog_posts`

Cada documento de blog debe tener la siguiente estructura:

```javascript
{
  titulo: "Título del artículo",
  slug: "titulo-del-articulo",  // URL-friendly (opcional)
  resumen: "Breve resumen del artículo...",
  contenido: "<p>Contenido HTML del artículo...</p>",
  autor: "Nombre del Autor",
  imagen_portada: "https://url-de-imagen.com/imagen.jpg",  // Opcional
  categoria: "Inteligencia Artificial",  // Opcional
  tags: ["IA", "Transformación Digital", "Cloud"],  // Array de strings
  publicado: true,  // Boolean - solo se muestran posts con publicado=true
  fecha_publicacion: Timestamp,  // Timestamp de Firebase
  fecha_creacion: Timestamp,  // Timestamp de Firebase
  vistas: 0  // Número, se incrementa automáticamente
}
```

### Colección: `contactos` (legacy)

El formulario público ya no escribe aquí directo desde el navegador — pasa
por una Netlify Function que valida Turnstile y persiste en HubSpot CRM
(ver `CLAUDE.md`). Esta colección queda como respaldo/legado del panel
admin, con esta estructura de documentos:

```javascript
{
  nombre: "Juan Pérez",
  email: "juan@empresa.com",
  empresa: "Empresa S.A.",
  telefono: "+52 55 1234 5678",
  mensaje: "Mensaje del usuario...",
  fecha_creacion: Timestamp,  // Se crea automáticamente
  atendido: false  // Para marcar como leído por admin
}
```

## Crear Posts de Blog desde Firebase Console

### Opción 1: Desde la Consola de Firebase (Recomendado para empezar)

1. Ve a **Firestore Database** en Firebase Console
2. Haz clic en "Iniciar colección"
3. ID de colección: `blog_posts`
4. Haz clic en "Siguiente"
5. Agrega un documento con los campos mencionados arriba
6. Para el campo `fecha_publicacion`, usa el tipo "timestamp" y selecciona la fecha actual
7. Haz clic en "Guardar"

### Ejemplo de Post Inicial

```
titulo: "Bienvenidos a Catalysis"
resumen: "Descubre cómo la transformación digital puede impulsar tu negocio."
contenido: "<h2>Transformación Digital</h2><p>En Catalysis, ayudamos a las empresas...</p>"
autor: "Equipo Catalysis"
categoria: "General"
tags: ["Bienvenida", "Transformación Digital"]
publicado: true
fecha_publicacion: [Timestamp actual]
fecha_creacion: [Timestamp actual]
vistas: 0
```

### Opción 2: Usando Scripts (Para cargas masivas)

Puedes crear un script Node.js para cargar posts:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addBlogPost() {
  await db.collection('blog_posts').add({
    titulo: "Título del Post",
    resumen: "Resumen...",
    contenido: "<p>Contenido...</p>",
    autor: "Nombre Autor",
    categoria: "Categoría",
    tags: ["tag1", "tag2"],
    publicado: true,
    fecha_publicacion: admin.firestore.FieldValue.serverTimestamp(),
    fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
    vistas: 0
  });
}

addBlogPost();
```

## Despliegue

**Netlify es el destino de producción** — no usar `firebase deploy` para
hosting. `firebase.json` en este repo solo se usa para desplegar las
reglas de Firestore (`firebase deploy --only firestore:rules`). Detalle
completo de variables de entorno y `netlify.toml` en `CLAUDE.md`.

```bash
netlify deploy --prod
# o por integración Git: push a la rama configurada en Netlify
```

### Servidor Web Local

```bash
# Recomendado: Netlify CLI (ejecuta también las Netlify Functions)
netlify dev          # http://localhost:8888

# Alternativa solo-frontend (sin Netlify Functions)
python3 -m http.server 8000
```

No abrir los HTML con `file://` — Firebase y las Netlify Functions requieren un servidor HTTP.

## Funcionalidades

### Blog
- ✅ Carga dinámica de posts desde Firestore
- ✅ Ordenamiento por fecha de publicación (más reciente primero)
- ✅ Solo muestra posts con `publicado: true`
- ✅ Contador automático de vistas
- ✅ Soporte para imágenes, categorías y tags
- ✅ Contenido HTML enriquecido

### Formulario de Contacto
- ✅ Guarda submissions en Firestore
- ✅ Validación de campos requeridos
- ✅ Mensajes de éxito/error
- ✅ Timestamp automático
- ✅ Disponible en homepage y página de contacto

## Solución de Problemas

### Los posts no se cargan

1. Verifica que Firebase esté correctamente configurado en `firebase-config.js`
2. Abre la consola del navegador (F12) y busca errores
3. Verifica que las reglas de Firestore permitan lectura pública
4. Asegúrate de que los scripts de Firebase estén cargados antes de tus scripts

### El formulario no envía datos

1. Verifica que las reglas de Firestore permitan crear documentos en `contactos`
2. Abre la consola del navegador y busca errores
3. Verifica que Firebase esté inicializado correctamente

### Error de CORS

Si estás probando localmente con `file://`, Firebase no funcionará. Usa un servidor HTTP local.

## Recursos Adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Firestore Getting Started](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)

## Soporte

Para problemas o preguntas, consulta la documentación de Firebase o contacta al equipo de desarrollo.
