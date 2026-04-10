# Guía de Configuración: Firebase Authentication con 2FA

Esta guía te llevará paso a paso para configurar Firebase Authentication con autenticación de dos factores (2FA/MFA) para proteger el panel de administración de Catalysis.

## 📋 Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Habilitar Firebase Authentication](#paso-1-habilitar-firebase-authentication)
3. [Habilitar Multi-Factor Authentication](#paso-2-habilitar-multi-factor-authentication)
4. [Crear el Usuario Administrador](#paso-3-crear-el-usuario-administrador)
5. [Probar el Sistema](#paso-4-probar-el-sistema)
6. [Configurar 2FA en tu Cuenta](#paso-5-configurar-2fa-en-tu-cuenta)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisitos

- ✅ Proyecto de Firebase creado (catalysis-blog)
- ✅ Firestore Database habilitado
- ✅ Firebase configurado en `js/firebase-config.js`
- ✅ Acceso a Firebase Console

---

## Paso 1: Habilitar Firebase Authentication

### 1.1 Acceder a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **catalysis-blog**
3. En el menú lateral izquierdo, haz clic en **"Authentication"** (Autenticación)

### 1.2 Activar Email/Password Provider

1. Ve a la pestaña **"Sign-in method"** (Método de acceso)
2. Haz clic en **"Email/Password"**
3. Activa el toggle **"Enable"** (Habilitar)
4. **NO actives** "Email link (passwordless sign-in)" por ahora
5. Haz clic en **"Save"** (Guardar)

![Activar Email/Password](https://i.imgur.com/example1.png)

✅ **Verificación**: Deberías ver "Email/Password" con estado "Enabled" en la lista de proveedores.

---

## Paso 2: Habilitar Multi-Factor Authentication

### 2.1 Acceder a configuración de MFA

1. En la página de Authentication, ve a la pestaña **"Settings"** (Configuración)
2. Busca la sección **"Multi-factor authentication"**
3. Haz clic en **"Get started"** o **"Configure"**

### 2.2 Configurar MFA

1. **Enrollment**: Selecciona **"Optional"** (Opcional)
   - Esto permite que los usuarios decidan si quieren activar 2FA
   - Si seleccionas "Required", TODOS los usuarios deben tener 2FA

2. **SMS**: Déjalo desactivado (requiere pago)

3. **TOTP (Time-based One-Time Password)**: Actívalo
   - Esta es la opción que usa Google Authenticator
   - Es **GRATUITA** y más segura que SMS

4. Haz clic en **"Save"** (Guardar)

✅ **Verificación**: Deberías ver "Multi-factor authentication: Optional" y "TOTP: Enabled"

---

## Paso 3: Crear el Usuario Administrador

### 3.1 Crear usuario manualmente desde Firebase Console

1. En Authentication, ve a la pestaña **"Users"**
2. Haz clic en **"Add user"** (Agregar usuario)
3. Ingresa:
   - **Email**: tu email de administrador (ej: `admin@catalysis.com`)
   - **Password**: una contraseña segura (mínimo 6 caracteres)
4. Haz clic en **"Add user"**

### 3.2 Verificar usuario creado

Deberías ver tu nuevo usuario en la lista con:
- UID único
- Email
- Fecha de creación
- Providers: password
- MFA: Not enrolled (todavía)

---

## Paso 4: Probar el Sistema

### 4.1 Iniciar servidor local

```bash
cd /Users/l03104653/Documents/Catalysis/WebSite
python3 -m http.server 8000
```

### 4.2 Acceder al login

1. Abre: http://localhost:8000/admin-login.html
2. Ingresa el email y contraseña del usuario que creaste
3. Haz clic en **"Iniciar Sesión"**

✅ **Resultado esperado**: Deberías ser redirigido a `admin-contactos.html` y ver:
- Tu email en la esquina superior
- "⚠️ 2FA no activado"
- Los contactos de Firestore (si tienes permisos)

---

## Paso 5: Configurar 2FA en tu Cuenta

### 5.1 Instalar aplicación de autenticación

Si no tienes una app de autenticación, descarga una:

- **Google Authenticator** (iOS/Android)
  - [iOS](https://apps.apple.com/app/google-authenticator/id388497605)
  - [Android](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)

- **Authy** (iOS/Android/Desktop)
  - [Sitio oficial](https://authy.com/download/)

- **Microsoft Authenticator** (iOS/Android)
  - [iOS](https://apps.apple.com/app/microsoft-authenticator/id983156458)
  - [Android](https://play.google.com/store/apps/details?id=com.azure.authenticator)

### 5.2 Configurar 2FA desde el panel

1. Estando logueado en `admin-contactos.html`
2. Haz clic en **"🔐 Configurar 2FA"**
3. Sigue el wizard de 3 pasos:

**Paso 1: Verifica tu contraseña**
- Ingresa tu contraseña actual
- Haz clic en "Continuar"

**Paso 2: Escanea el código QR**
- Abre tu aplicación de autenticación
- Selecciona "Agregar cuenta" o "+"
- Escanea el código QR mostrado
- O ingresa manualmente el código secreto

**Paso 3: Verifica el código**
- Ingresa el código de 6 dígitos de tu app
- Haz clic en "Activar 2FA"

✅ **Resultado**: Verás "✅ ¡2FA Activado Correctamente!"

### 5.3 Probar 2FA

1. Cierra sesión desde `admin-contactos.html`
2. Ve a `admin-login.html`
3. Ingresa email y contraseña
4. **AHORA** te pedirá el código de 6 dígitos
5. Ingresa el código de tu app de autenticación
6. Deberías acceder al panel

---

## 🔒 Reglas de Seguridad de Firestore

Actualiza tus reglas de Firestore para permitir lectura a usuarios autenticados:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Blog posts - lectura pública, escritura solo autenticados
    match /blog_posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Contactos - lectura solo para usuarios autenticados
    match /contactos/{contactId} {
      allow read: if request.auth != null;  // Solo usuarios autenticados
      allow create: if true;                // Formulario público puede crear
      allow update, delete: if request.auth != null;
    }
  }
}
```

### Aplicar reglas:

1. Firebase Console > Firestore Database
2. Pestaña **"Rules"**
3. Copia y pega las reglas de arriba
4. Haz clic en **"Publish"**

---

## Troubleshooting

### Error: "Missing or insufficient permissions"

**Causa**: Las reglas de Firestore bloquean el acceso.

**Solución**:
1. Verifica que las reglas permitan lectura con `request.auth != null`
2. Verifica que estés autenticado (ve a console del navegador)
3. Cierra sesión y vuelve a iniciar sesión

### Error: "auth/multi-factor-auth-required" pero no se muestra pantalla de código

**Causa**: El resolver de MFA no se está manejando correctamente.

**Solución**:
1. Limpia cache del navegador
2. Recarga la página
3. Verifica en consola del navegador si hay errores

### No puedo escanear el código QR

**Solución**:
1. Usa la opción "Copiar código" debajo del QR
2. En tu app de autenticación, selecciona "Ingreso manual"
3. Pega el código secreto
4. Nombre de cuenta: Catalysis Admin
5. Tipo: Basado en tiempo

### Olvidé mi código 2FA / Perdí mi teléfono

**Solución temporal (solo para desarrollo)**:
1. Ve a Firebase Console > Authentication > Users
2. Encuentra tu usuario
3. Haz clic en los 3 puntos (⋮)
4. Selecciona **"Disable MFA"** (Deshabilitar MFA)
5. Inicia sesión sin 2FA
6. Vuelve a configurar 2FA

**⚠️ Para producción**: Implementa códigos de recuperación backup.

### Firebase Authentication no está habilitado

**Error en consola**: `auth/operation-not-allowed`

**Solución**:
1. Firebase Console > Authentication
2. Verifica que Email/Password esté "Enabled"
3. Si no lo está, actívalo siguiendo [Paso 1](#paso-1-habilitar-firebase-authentication)

---

## 📱 Flujo Completo del Usuario

### Primera vez (sin 2FA)

```
1. Ir a admin-login.html
2. Ingresar email + password
3. ✅ Acceso directo a admin-contactos.html
4. Ver aviso "⚠️ 2FA no activado"
5. (Opcional) Configurar 2FA
```

### Con 2FA activado

```
1. Ir a admin-login.html
2. Ingresar email + password
3. 🔐 Pantalla de código 2FA
4. Ingresar código de 6 dígitos de la app
5. ✅ Acceso a admin-contactos.html
```

---

## 🎯 Archivos del Sistema

### Páginas creadas

- `admin-login.html` - Login con email/password y verificación 2FA
- `admin-setup-2fa.html` - Wizard para configurar 2FA por primera vez
- `admin-contactos.html` - Panel protegido para ver contactos

### Flujo de navegación

```
admin-login.html
    │
    ├─→ (sin auth) → Login con email/password
    │       │
    │       ├─→ (sin 2FA) → admin-contactos.html
    │       │
    │       └─→ (con 2FA) → Verificar código → admin-contactos.html
    │
    └─→ (autenticado) → admin-contactos.html
            │
            └─→ "Configurar 2FA" → admin-setup-2fa.html
                                        │
                                        └─→ (completado) → admin-contactos.html
```

---

## 🔐 Seguridad: Mejores Prácticas

### ✅ Implementado

- ✅ Autenticación de dos factores con TOTP
- ✅ Reglas de Firestore que requieren autenticación
- ✅ No se almacenan contraseñas en código (Firebase las maneja)
- ✅ Logout seguro que limpia sesión
- ✅ Re-autenticación antes de configurar 2FA

### 🚀 Recomendaciones Futuras

- [ ] Códigos de recuperación backup
- [ ] Límite de intentos de login fallidos
- [ ] Logs de acceso (quién, cuándo, desde dónde)
- [ ] Notificaciones de nuevos logins
- [ ] Roles y permisos (admin, editor, viewer)
- [ ] Expiración de sesión automática (timeout)

---

## 📞 Soporte

Si tienes problemas, revisa:

1. Consola del navegador (F12 → Console)
2. Firebase Console → Authentication → Users
3. Firebase Console → Firestore → Rules

Busca mensajes que empiecen con:
- 🔐 = Autenticación
- ✅ = Éxito
- ❌ = Error
- ⏳ = Cargando

---

## 🎉 ¡Listo!

Tu panel de administración ahora está protegido con:

1. **Email/Password** - Primera capa de seguridad
2. **2FA con TOTP** - Segunda capa de seguridad
3. **Reglas de Firestore** - Control de acceso a datos

Incluso si alguien obtiene tu contraseña, necesitará acceso físico a tu teléfono con el authenticator para entrar.

---

**Última actualización**: Febrero 2026
**Versión**: 1.0
