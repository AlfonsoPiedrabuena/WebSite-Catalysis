# Instrucciones de Despliegue a Producción

## Opción 1: Firebase Hosting (Recomendado)

### Paso 1: Instalar Firebase CLI

```bash
# Opción A: Con permisos de administrador
sudo npm install -g firebase-tools

# Opción B: Sin sudo (instalación local)
npm install firebase-tools
npx firebase --version
```

### Paso 2: Autenticar con Firebase

```bash
firebase login
# Se abrirá tu navegador para autenticar con Google
```

### Paso 3: Desplegar

```bash
# Desde el directorio /site
firebase deploy --only hosting

# O desplegar todo (hosting + rules)
firebase deploy
```

### Resultado:
Tu sitio estará disponible en:
- **https://catalysis-blog.web.app**
- **https://catalysis-blog.firebaseapp.com**

---

## Opción 2: Netlify (Muy Fácil)

### Método A: Desde la Web (Sin comandos)

1. Ve a [netlify.com](https://netlify.com) e inicia sesión con GitHub
2. Haz clic en **"Add new site" > "Import an existing project"**
3. Conecta tu repositorio de GitHub
4. Configuración:
   - **Base directory:** `site`
   - **Publish directory:** `site`
   - **Build command:** (dejar vacío)
5. Haz clic en **"Deploy site"**

### Método B: Netlify CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Autenticar
netlify login

# Desplegar desde /site
netlify deploy --prod
```

### Resultado:
- URL temporal: https://random-name-12345.netlify.app
- Puedes configurar dominio personalizado después

---

## Opción 3: Vercel (También Muy Fácil)

### Método A: Desde la Web

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Haz clic en **"Add New" > "Project"**
3. Importa tu repositorio
4. Configuración:
   - **Framework Preset:** Other
   - **Root Directory:** `site`
   - **Build Command:** (dejar vacío)
   - **Output Directory:** `site`
5. Haz clic en **"Deploy"**

### Método B: Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Autenticar
vercel login

# Desplegar desde /site
vercel --prod
```

### Resultado:
- URL: https://tu-proyecto.vercel.app
- Dominio personalizado disponible

---

## Opción 4: GitHub Pages

### Configuración:

1. Push tu código a GitHub (si no lo has hecho):
   ```bash
   git push -u origin production
   git push origin main
   ```

2. Ve a tu repositorio en GitHub
3. **Settings > Pages**
4. En **"Source"**:
   - Branch: `production` o `main`
   - Folder: `/site`
5. Haz clic en **"Save"**

### Resultado:
- URL: https://alfonsopiedrabuena.github.io/WebSite-Catalysis/

**IMPORTANTE:** GitHub Pages es estático, pero Firebase funcionará perfectamente porque se ejecuta en el navegador del cliente.

---

## Opción 5: Cloudflare Pages

1. Ve a [pages.cloudflare.com](https://pages.cloudflare.com)
2. Conecta con GitHub
3. Selecciona tu repositorio
4. Configuración:
   - **Build command:** (vacío)
   - **Build output directory:** `site`
5. Deploy

### Resultado:
- URL: https://catalysis.pages.dev
- CDN global de Cloudflare

---

## Recomendación por Orden

### 🥇 **Firebase Hosting** (Mejor integración)
- ✅ Misma plataforma que Firestore
- ✅ CDN global rápido
- ✅ SSL automático
- ✅ Fácil actualización con `firebase deploy`

### 🥈 **Netlify** (Más fácil para principiantes)
- ✅ Deploy desde GitHub automático
- ✅ SSL automático
- ✅ Builds automáticos en cada push
- ✅ Muy buena interfaz web

### 🥉 **Vercel** (Alternativa sólida)
- ✅ Similar a Netlify
- ✅ Excelente rendimiento
- ✅ Deploy automático

### GitHub Pages (Opción gratuita básica)
- ✅ Totalmente gratis
- ⚠️ URL más larga
- ⚠️ Configuración manual

---

## Post-Deployment: Configurar Dominio Personalizado

Todos los servicios anteriores permiten agregar un dominio personalizado:

### En Firebase:
```bash
firebase hosting:channel:deploy production --expires 30d
```
Luego en Console > Hosting > Agregar dominio personalizado

### En Netlify/Vercel:
- Dashboard > Domain Settings > Add custom domain

---

## Verificación Post-Deploy

Después de desplegar, verifica:

1. ✅ El sitio carga correctamente
2. ✅ Firebase está conectado (abre consola del navegador)
3. ✅ El blog carga posts desde Firestore
4. ✅ El formulario de contacto funciona
5. ✅ Todas las páginas son accesibles
6. ✅ Diseño responsive funciona

---

## Próximos Pasos Después del Deploy

1. **Agregar posts al blog**
   - Usa `POSTS_PARA_FIREBASE.txt` para copiar los 3 posts iniciales
   - O crea posts nuevos directamente en Firebase Console

2. **Configurar Analytics** (Opcional)
   - Firebase Analytics
   - Google Analytics
   - Hotjar para heatmaps

3. **Configurar dominio personalizado**
   - Comprar dominio (ej: catalysis.com.mx)
   - Configurar DNS
   - Agregar en tu plataforma de hosting

4. **Habilitar HTTPS** (Automático en todos los servicios)

5. **Configurar SEO**
   - Agregar meta tags
   - Crear sitemap.xml
   - Google Search Console

---

## Comandos Rápidos de Referencia

```bash
# Firebase
firebase login
firebase deploy

# Netlify
netlify login
netlify deploy --prod

# Vercel
vercel login
vercel --prod

# Git (para GitHub Pages)
git push origin production
```

---

## Soporte

Si tienes problemas con el despliegue:

1. Revisa la consola del navegador (F12)
2. Verifica que `firebase-config.js` tenga las credenciales correctas
3. Asegúrate de que Firestore esté habilitado
4. Consulta los logs de tu plataforma de hosting

---

**¡Listo para producción!** 🚀

Elige la opción que prefieras y sigue los pasos. Firebase Hosting es la recomendada por la mejor integración con Firestore.
