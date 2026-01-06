# Configuración de Firebase para Formularios de Contacto

Este documento explica la configuración de Firebase para los formularios de contacto usando el proyecto existente **catalysis-blog**.

## ✅ Estado Actual

**¡Buenas noticias!** La configuración de Firebase ya está lista:

- ✅ Proyecto Firebase: `catalysis-blog` (ya configurado)
- ✅ Credenciales en: `site/js/firebase-config.js`
- ✅ Reglas de Firestore: Ya incluyen la colección `contactos`
- ✅ Los formularios están listos para funcionar

**Lo único que necesitas hacer es aplicar las reglas en Firebase Console** (ver instrucciones abajo).

## 📋 Estructura de Datos en Firestore

La colección `contactos` guardará los siguientes campos:

```javascript
{
  nombre: string,              // Hasta 100 caracteres
  apellido: string,            // Hasta 100 caracteres
  email: string,               // Email válido
  telefono: string,            // Hasta 30 caracteres
  empresa: string,             // Hasta 50 caracteres
  sector: string,              // Valor del select (retail, manufactura, etc.)
  nivel_madurez: string,       // "1", "2", "3", "4" o "5"
  problema: string,            // Hasta 500 caracteres
  whatsapp: boolean,           // Checkbox - acepta contacto por WhatsApp
  privacidad_aceptada: boolean, // Checkbox - acepta políticas (required)
  tipo_solicitud: string,      // Solo en formulario rápido (opcional)
  fecha_creacion: timestamp,   // Auto-generado por Firebase
  atendido: boolean           // false por defecto, true cuando se procese
}
```

## 🔑 Credenciales de Firebase (Ya Configuradas)

El sitio web ya está configurado con el proyecto **catalysis-blog**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA8LOLGmz2srW0wsC8P7VjjYjNaqe4qGFw",
  authDomain: "catalysis-blog.firebaseapp.com",
  projectId: "catalysis-blog",
  storageBucket: "catalysis-blog.firebasestorage.app",
  messagingSenderId: "650112690481",
  appId: "1:650112690481:web:a3a923f734083e2b3d6810"
};
```

**Ubicación:** `/site/js/firebase-config.js`

## 📚 Colecciones en el Proyecto

El proyecto `catalysis-blog` ahora tiene dos colecciones:

1. **`blog_posts`** - Posts del blog (lectura pública, escritura autenticada)
2. **`contactos`** - Formularios de contacto (creación pública, lectura/edición autenticada)

## ⚙️ Aplicar las Reglas de Seguridad en Firebase

Las reglas ya están definidas en el archivo `site/firestore.rules`, pero necesitas aplicarlas en Firebase Console:

### Paso 1: Acceder a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Selecciona el proyecto **"catalysis-blog"**

### Paso 2: Actualizar Reglas de Firestore

1. En el menú lateral, ve a **"Firestore Database"**
2. Ve a la pestaña **"Reglas"** o **"Rules"**
3. Verifica que el contenido sea (o actualízalo si es diferente):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Blog posts - lectura pública, escritura solo para usuarios autenticados
    match /blog_posts/{postId} {
      allow read: if true;  // Cualquiera puede leer posts
      allow write: if request.auth != null;  // Solo usuarios autenticados pueden escribir
    }

    // Contactos - solo escritura pública (para formulario de contacto)
    match /contactos/{contactId} {
      allow read: if request.auth != null;  // Solo admin autenticado puede leer
      allow create: if true;  // Cualquiera puede crear (enviar formulario)
      allow update, delete: if request.auth != null;  // Solo admin puede actualizar/eliminar
    }
  }
}
```

4. Clic en **"Publicar"** o **"Publish"**

### Paso 3: (Opcional) Deployment Automático de Reglas

Si tienes Firebase CLI instalado, puedes aplicar las reglas desde el archivo local:

```bash
cd site
firebase deploy --only firestore:rules
```

Esto aplicará automáticamente las reglas definidas en `site/firestore.rules`.

## 🔒 Seguridad

### Dominios Autorizados (Recomendado)

Para mayor seguridad en producción, limita los dominios que pueden usar tu API:

1. En Firebase Console, ve a **Authentication**
2. Si no está habilitado, habilita Authentication (puedes dejarlo sin proveedores)
3. Pestaña **"Settings"** → **"Authorized domains"**
4. Agrega tu dominio de producción (ej: `catalysis.com.mx`)

**Nota:** `localhost` ya está autorizado por defecto para desarrollo.

### Protección de Credenciales

Las credenciales de Firebase en `firebase-config.js` son seguras para uso público porque:
- La seguridad real está en las **Reglas de Firestore**
- Las reglas evitan que usuarios no autenticados lean los contactos
- Solo permiten crear nuevos registros (formulario)
- Para leer/editar/eliminar contactos se requiere autenticación de admin

## ✅ Verificar la Configuración

1. Inicia un servidor local:
   ```bash
   cd site
   python3 -m http.server 8000
   ```

2. Abre http://localhost:8000

3. Abre la consola del navegador (F12)

4. Ve a la página de contacto y llena el formulario

5. Al enviar, deberías ver en la consola:
   - "Firebase initialized successfully" (si todo está bien)
   - Error de CORS o Firebase not initialized (si algo falla)

6. Verifica en Firebase Console → Firestore Database que se creó el documento

## 📊 Ver los Contactos Recibidos

1. Ve a Firebase Console → Firestore Database
2. Navega a la colección `contactos`
3. Verás todos los documentos guardados con sus campos
4. Puedes editarlos manualmente (ej: marcar `atendido: true`)

## 🚨 Solución de Problemas

### Error: "Firebase not initialized"
- Verifica que los scripts de Firebase SDK se carguen antes de `firebase-config.js`
- Revisa la consola para errores de inicialización

### Error: "Missing or insufficient permissions"
- Aplica las reglas de Firestore en Firebase Console (ver sección anterior)
- Asegúrate de que `allow create: if true;` esté en la regla de `contactos`

### Error CORS
- No uses `file://` - siempre usa un servidor HTTP local
- Verifica que tu dominio esté en "Authorized domains" de Firebase

### Campos vacíos en Firestore
- Verifica que los `id` de los campos HTML coincidan con los del JavaScript
- Abre la consola del navegador (F12) para ver errores específicos

### Formulario no se envía / No pasa nada al hacer submit
- Verifica en la consola si hay errores de JavaScript
- Confirma que el checkbox de "políticas de privacidad" esté marcado (es obligatorio)
- Verifica que todos los campos requeridos estén llenos

## 📞 Información Adicional

Para más información sobre Firebase:
- [Documentación de Firestore](https://firebase.google.com/docs/firestore)
- [Guía de Seguridad](https://firebase.google.com/docs/rules)
- [Límites Gratuitos](https://firebase.google.com/pricing)

---

**Nota:** El plan gratuito de Firebase (Spark) incluye:
- 50,000 lecturas/día
- 20,000 escrituras/día
- 20,000 eliminaciones/día
- 1 GB de almacenamiento

Esto es más que suficiente para un sitio web de contacto con volumen moderado.
