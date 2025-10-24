# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Catalysis es un sitio web de consultoría en transformación digital construido con HTML estático y Firebase.

**Implementación de producción:**
- **site/** - Sitio web HTML estático con Firebase Firestore

## Project Structure

```
/
├── site/                   # 🎯 SITIO WEB DE PRODUCCIÓN
│   ├── index.html         # Página principal
│   ├── servicios.html     # Página de servicios
│   ├── contacto.html      # Página de contacto con formulario
│   ├── blog.html          # Listado de artículos del blog
│   ├── blog-post.html     # Vista individual de artículo
│   ├── test-firebase.html # Herramienta de diagnóstico
│   ├── README.md          # Documentación completa de Firebase
│   ├── SETUP_FIREBASE.md  # Guía de configuración
│   ├── GUIA_PASO_A_PASO.md # Tutorial detallado
│   ├── POSTS_PARA_FIREBASE.txt # Posts para cargar
│   ├── DEPLOY_INSTRUCTIONS.md # Guía de despliegue
│   ├── css/
│   │   └── style.css      # Estilos del sitio
│   ├── js/
│   │   ├── main.js        # JavaScript principal
│   │   ├── firebase-config.js  # Configuración de Firebase
│   │   ├── blog.js        # Carga de posts desde Firestore
│   │   ├── blog-post.js   # Vista individual de post
│   │   └── contact.js     # Formulario de contacto a Firestore
│   ├── images/            # Imágenes del sitio
│   ├── firebase.json      # Configuración de Firebase Hosting
│   ├── firestore.rules    # Reglas de seguridad
│   ├── firestore.indexes.json # Índices de Firestore
│   └── .firebaserc        # Proyecto de Firebase
│
├── CLAUDE.md              # Este archivo
├── README.md              # Documentación principal
└── .gitignore             # Archivos ignorados por git
```

## Arquitectura Actual

### Stack Tecnológico

**Frontend:**
- HTML5 estático
- CSS3 con CSS Custom Properties
- Vanilla JavaScript (ES6+)

**Backend:**
- Firebase Firestore (base de datos NoSQL)
- Firebase Hosting (opcional para deployment)

**Sin dependencias de frameworks:** No se usa React, Vue, Angular, Flask, etc.

### Firebase Collections

**1. `blog_posts`** - Artículos del blog
```javascript
{
  titulo: string,
  slug: string,              // URL-friendly (opcional)
  resumen: string,
  contenido: string,         // HTML
  autor: string,
  imagen_portada: string,    // URL (opcional)
  categoria: string,         // Opcional
  tags: array,               // Array de strings
  publicado: boolean,        // Solo se muestran si es true
  fecha_publicacion: timestamp,
  fecha_creacion: timestamp,
  vistas: number            // Se incrementa automáticamente
}
```

**2. `contactos`** - Formularios de contacto
```javascript
{
  nombre: string,
  email: string,
  empresa: string,
  telefono: string,
  mensaje: string,
  fecha_creacion: timestamp,  // Auto-generado
  atendido: boolean          // Para marcar como leído
}
```

### Reglas de Seguridad de Firestore

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

## Desarrollo Local

### Requisitos
- Navegador web moderno
- Servidor HTTP local (no funciona con `file://`)

### Opciones para servidor local

```bash
# Opción 1: Python
cd site
python3 -m http.server 8000

# Opción 2: Node.js
npm install -g http-server
cd site
http-server -p 8000

# Opción 3: VS Code Live Server
# Instalar extensión y hacer clic derecho > Open with Live Server
```

Luego abrir http://localhost:8000

### Configuración de Firebase

**Primer uso:**
1. Ver `site/README.md` para instrucciones completas
2. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
3. Configurar Firestore Database
4. Copiar credenciales a `site/js/firebase-config.js`
5. Configurar reglas de seguridad

## Funcionalidades del Sitio

### Páginas Principales

1. **index.html** - Homepage
   - Hero section
   - Sección "Sobre Nosotros" con estadísticas
   - Preview de servicios (9 servicios)
   - Metodología (5 pasos)
   - Formulario de contacto rápido
   - Footer

2. **servicios.html** - Servicios detallados
   - 9 tarjetas de servicios con descripciones completas

3. **contacto.html** - Formulario de contacto
   - Formulario completo con validación
   - Información de contacto
   - Guarda en Firestore `contactos` collection

4. **blog.html** - Listado de blog
   - Carga posts desde Firestore
   - Solo muestra posts con `publicado: true`
   - Ordenados por fecha (más reciente primero)
   - Tarjetas con imagen, categoría, título, resumen

5. **blog-post.html** - Vista individual de post
   - Carga post por ID (URL: `?id=POST_ID`)
   - Muestra contenido completo
   - Incrementa contador de vistas automáticamente
   - Muestra tags si existen

### JavaScript Modules

**main.js:**
- Navbar scroll effect (agrega clase `scrolled` después de 100px)
- Smooth scrolling para anchor links
- Actualiza año en footer automáticamente

**firebase-config.js:**
- Inicializa Firebase con credenciales del proyecto
- Expone `window.firestoreDb` para otros scripts

**blog.js:**
- Carga posts desde Firestore
- Filtra solo posts publicados
- Crea tarjetas de posts dinámicamente
- Maneja estados de carga y sin posts

**blog-post.js:**
- Obtiene ID de post desde URL params
- Carga post individual desde Firestore
- Renderiza contenido HTML
- Incrementa vistas automáticamente
- Maneja errores (post no encontrado, no publicado)

**contact.js:**
- Maneja submits de formularios (contacto y quick-contact)
- Guarda datos en Firestore
- Muestra mensajes de éxito/error
- Resetea formulario después de envío exitoso

### CSS Architecture

**CSS Custom Properties (Variables):**
```css
--primary: #0f0f0f     /* Negro/dark */
--secondary: #ffffff    /* Blanco */
--text: #666666        /* Gris para texto */
--light-bg: #fafafa    /* Fondo claro */
--border: #e5e5e5      /* Color de bordes */
```

**Características:**
- Diseño responsive (móvil, tablet, desktop)
- Tipografía: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI)
- Animaciones suaves (transitions)
- Grid y Flexbox para layouts
- Mobile-first approach

## Gestión de Contenido

### Crear Posts de Blog

**Desde Firebase Console (Recomendado):**

1. Ir a Firestore Database
2. Colección `blog_posts`
3. "Agregar documento"
4. Completar campos:
   - `titulo`: string
   - `resumen`: string
   - `contenido`: string (puede incluir HTML)
   - `autor`: string
   - `categoria`: string
   - `tags`: array
   - `publicado`: boolean (true)
   - `fecha_publicacion`: timestamp (ahora)
   - `fecha_creacion`: timestamp (ahora)
   - `vistas`: number (0)
   - `imagen_portada`: string (URL, opcional)

5. Guardar

**Contenido HTML:**
El campo `contenido` acepta HTML completo:
```html
<h2>Título de sección</h2>
<p>Párrafo de texto...</p>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
<img src="url-imagen.jpg" alt="Descripción">
```

### Ver Contactos Recibidos

1. Firebase Console > Firestore
2. Colección `contactos`
3. Ver documentos ordenados por `fecha_creacion`
4. Marcar `atendido: true` cuando se procesen

## Deployment

### Opción 1: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
cd site
firebase init hosting
firebase deploy
```

### Opción 2: Netlify

1. Conectar repositorio GitHub
2. Build settings:
   - Base directory: `site`
   - Publish directory: `site`
   - Build command: (none)
3. Deploy

### Opción 3: Vercel

```bash
npm install -g vercel
cd site
vercel
```

### Opción 4: GitHub Pages

1. Settings > Pages
2. Source: Deploy from branch
3. Branch: main, folder: `/site`

**Nota:** Para cualquier opción, asegúrate de configurar correctamente `firebase-config.js` con tus credenciales.

## Diseño y Contenido

### Servicios (9 total)

1. Evaluación y Estrategia Digital
2. Optimización de Procesos
3. Adopción de Tecnologías Cloud
4. Data & Analytics
5. Experiencia del Cliente Digital
6. Inteligencia Artificial Generativa
7. Agentes de IA Autónomos
8. Analítica Predictiva con IA
9. Computer Vision & NLP

### Metodología (5 pasos)

1. Diagnóstico
2. Estrategia
3. Quick Wins
4. Transformación
5. Evolución

### Estadísticas

- 200+ Proyectos completados
- 150+ Clientes satisfechos
- 85% Aumento de eficiencia
- 12+ Años de experiencia

## Development Guidelines

### Agregar Nueva Página

1. Crear archivo HTML en `site/`
2. Incluir estructura base (nav, footer)
3. Agregar links en navegación de todas las páginas
4. Si usa Firebase, incluir scripts SDK y configuración

### Modificar Estilos

- Editar `site/css/style.css`
- Usar variables CSS existentes
- Mantener diseño responsive
- Probar en móvil, tablet y desktop

### Agregar Funcionalidad JavaScript

- Crear archivo en `site/js/`
- Incluir en HTML correspondiente
- Usar vanilla JS (no frameworks)
- Manejar errores apropiadamente

### Trabajar con Firestore

**Leer datos:**
```javascript
const snapshot = await window.firestoreDb
  .collection('nombre_coleccion')
  .where('campo', '==', 'valor')
  .get();
```

**Escribir datos:**
```javascript
await window.firestoreDb
  .collection('nombre_coleccion')
  .add({ campo: 'valor' });
```

**Actualizar:**
```javascript
await window.firestoreDb
  .collection('nombre_coleccion')
  .doc('doc_id')
  .update({ campo: 'nuevo_valor' });
```

## Archivos Importantes

**NO modificar sin leer documentación:**
- `site/js/firebase-config.js` - Contiene credenciales (no commitear con datos reales)
- `site/js/blog.js` - Lógica de carga de blog
- `site/js/blog-post.js` - Vista individual de posts
- `site/js/contact.js` - Formulario de contacto

**Seguro modificar:**
- `site/css/style.css` - Estilos
- `site/index.html` - Contenido de homepage
- `site/servicios.html` - Contenido de servicios
- Cualquier archivo HTML (estructura/contenido)

## Troubleshooting

### Posts no se cargan

1. Verificar consola del navegador (F12)
2. Verificar `firebase-config.js` tiene credenciales correctas
3. Verificar reglas de Firestore permiten lectura
4. Verificar que posts tengan `publicado: true`

### Formulario no envía

1. Verificar consola del navegador
2. Verificar reglas de Firestore permiten `create` en `contactos`
3. Verificar Firebase SDK está cargado

### Error CORS

No usar `file://` - siempre usar servidor HTTP local

## Recursos Adicionales

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [README completo](site/README.md) - Instrucciones detalladas de setup

## Notas de Desarrollo

**Versión actual:** 2.0 (HTML + Firebase)
**Última actualización:** Octubre 2025

**Características del stack:**
- Arquitectura JAMstack (JavaScript, APIs, Markup)
- Sin servidor backend tradicional
- Base de datos serverless con Firestore
- Hosting estático con CDN global
- SSL/HTTPS automático
- Escalabilidad automática
