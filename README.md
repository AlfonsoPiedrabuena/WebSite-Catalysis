# Catalysis - Sitio Web de Consultoría en Transformación Digital

Sitio web corporativo con HTML estático y Firebase para gestión de contenido dinámico.

## 🎯 Stack Tecnológico

- **Frontend:** HTML5, CSS3 (Custom Properties), Vanilla JavaScript
- **Backend:** Firebase Firestore (base de datos NoSQL)
- **Hosting:** Compatible con cualquier hosting estático (Firebase Hosting, Netlify, Vercel, GitHub Pages)
- **Sin frameworks:** No requiere React, Vue, Angular ni backend tradicional

## 📁 Estructura del Proyecto

```
WebSite/
├── site/                   # 🎯 SITIO WEB PRINCIPAL (Producción)
│   ├── *.html             # Páginas del sitio
│   ├── css/               # Estilos
│   ├── js/                # JavaScript + Firebase
│   ├── images/            # Imágenes
│   ├── README.md          # Documentación completa de Firebase
│   ├── SETUP_FIREBASE.md  # Guía de configuración paso a paso
│   ├── GUIA_PASO_A_PASO.md # Tutorial detallado
│   ├── POSTS_PARA_FIREBASE.txt # Posts para cargar en Firestore
│   ├── firebase.json      # Configuración de Firebase
│   ├── firestore.rules    # Reglas de seguridad
│   └── firestore.indexes.json # Índices de Firestore
│
├── Site_Flask/            # ⚠️ DEPRECADO - Versión Flask anterior
├── Templates/             # ⚠️ LEGACY - Plantillas originales
├── CLAUDE.md              # Documentación para desarrollo
└── README.md              # Este archivo
```

## 🚀 Quick Start

### Desarrollo Local

```bash
# Clonar repositorio
git clone <repo-url>
cd WebSite/site

# Iniciar servidor local
python3 -m http.server 8000

# Abrir navegador
open http://localhost:8000
```

### Configurar Firebase (Primera vez)

1. **Ver guía completa:** `site/SETUP_FIREBASE.md`
2. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
3. Habilitar Firestore Database
4. Configurar credenciales en `site/js/firebase-config.js`
5. Publicar reglas de seguridad
6. Cargar posts iniciales desde `site/POSTS_PARA_FIREBASE.txt`

## 📖 Documentación

- **`site/README.md`** - Documentación completa de Firebase y el sitio
- **`site/SETUP_FIREBASE.md`** - Configuración paso a paso de Firebase
- **`site/GUIA_PASO_A_PASO.md`** - Tutorial detallado con capturas textuales
- **`site/POSTS_PARA_FIREBASE.txt`** - Posts originales listos para copiar a Firestore
- **`CLAUDE.md`** - Guía de desarrollo y arquitectura del proyecto

## 🎨 Características

### Páginas del Sitio
- ✅ Homepage con hero, servicios, metodología y formulario
- ✅ Página de servicios completa (9 servicios)
- ✅ Formulario de contacto integrado con Firebase
- ✅ Blog dinámico cargado desde Firestore
- ✅ Vista individual de posts con contador de vistas

### Funcionalidades
- ✅ Blog con posts desde Firebase Firestore
- ✅ Formulario de contacto guardando en Firestore
- ✅ Diseño responsive (móvil, tablet, desktop)
- ✅ Navegación smooth scroll
- ✅ Sin backend tradicional requerido
- ✅ Gestión de contenido desde Firebase Console

## 🔧 Tecnologías

### Frontend
- HTML5 semántico
- CSS3 con variables CSS
- JavaScript ES6+ (vanilla, sin frameworks)
- Sistema de grid y flexbox para layouts

### Firebase
- **Firestore Database:** Almacenamiento de posts y contactos
- **Firebase Hosting:** Opcional para deployment
- **Reglas de seguridad:** Configuradas para lectura pública y escritura autenticada

### Colecciones Firestore
- `blog_posts` - Artículos del blog
- `contactos` - Mensajes del formulario de contacto

## 📦 Deployment

### Opción 1: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
cd site
firebase init hosting
firebase deploy
```

### Opción 2: Netlify

1. Conectar repositorio
2. Build settings: Base directory `site`, Publish directory `site`
3. Deploy automático

### Opción 3: Vercel

```bash
npm install -g vercel
cd site
vercel
```

### Opción 4: GitHub Pages

Settings > Pages > Source: `/site` folder

## 🔐 Seguridad

Las reglas de Firestore están configuradas para:
- ✅ Lectura pública de posts del blog
- ✅ Escritura pública solo para crear contactos (formulario)
- ✅ Escritura de posts solo para usuarios autenticados
- ✅ Lectura de contactos solo para usuarios autenticados

Ver `site/firestore.rules` para detalles.

## 🧪 Testing

```bash
# Test de conexión Firebase
open http://localhost:8000/test-firebase.html

# Verificar todas las páginas funcionan
open http://localhost:8000/index.html
open http://localhost:8000/servicios.html
open http://localhost:8000/blog.html
open http://localhost:8000/contacto.html
```

## 📝 Gestión de Contenido

### Crear Posts de Blog

1. Firebase Console > Firestore Database
2. Colección `blog_posts` > Agregar documento
3. Ver `site/POSTS_PARA_FIREBASE.txt` para formato exacto
4. Campos requeridos: titulo, resumen, contenido, autor, categoria, tags, publicado, fecha_publicacion, vistas

### Ver Contactos Recibidos

1. Firebase Console > Firestore Database
2. Colección `contactos`
3. Ver mensajes ordenados por fecha_creacion
4. Marcar `atendido: true` cuando se procesen

## 🔄 Migración desde Flask

Este proyecto migró de Flask + PostgreSQL a HTML estático + Firebase en 2025.

**Beneficios:**
- ✅ Sin servidor backend requerido
- ✅ Hosting más económico (estático)
- ✅ Mejor escalabilidad
- ✅ Gestión de contenido más simple (Firebase Console)
- ✅ Despliegue más rápido

**Archivos legacy:**
- `Site_Flask/` - Aplicación Flask anterior (deprecada)
- `Templates/` - Templates HTML originales (referencia)

## 🐛 Solución de Problemas

### Posts no cargan en el blog
- Verifica que Firestore esté habilitado
- Verifica que las reglas estén publicadas
- Asegúrate que posts tengan `publicado: true`
- Revisa consola del navegador (F12) para errores

### Formulario no envía
- Verifica reglas de Firestore permiten `create` en `contactos`
- Asegúrate de usar servidor HTTP (no `file://`)
- Revisa consola del navegador para errores

### Error CORS
- No uses `file://` directamente
- Siempre usa un servidor HTTP local

## 📞 Soporte

Para problemas o preguntas:
- Ver documentación en `site/README.md`
- Consultar [Firebase Docs](https://firebase.google.com/docs)
- Revisar `CLAUDE.md` para guías de desarrollo

## 📄 Licencia

© 2025 Catalysis. Todos los derechos reservados.

---

**Versión:** 2.0 (HTML + Firebase)
**Última actualización:** Octubre 2025
**Stack anterior:** Flask + PostgreSQL (deprecado)
