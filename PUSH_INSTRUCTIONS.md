# Instrucciones para Push a GitHub

## Estado Actual

✅ Todas las ramas están listas y sincronizadas
✅ Código limpio sin Flask
✅ Documentación actualizada
✅ Listo para desplegar a producción

## Comandos para Ejecutar

Abre tu terminal y ejecuta:

```bash
# Navega al directorio del proyecto
cd /Users/l03104653/Documents/Catalysis/WebSite

# Verifica que estás en la rama production
git branch

# Push de la rama production
git push -u origin production

# Cambia a main y haz push también
git checkout main
git push origin main
```

## Autenticación

GitHub te pedirá autenticación. Tienes dos opciones:

### Opción 1: Personal Access Token (Recomendado)

1. Ve a GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)"
3. Nombre: "Catalysis Deploy"
4. Scopes: Marca `repo` (todos los permisos de repositorio)
5. "Generate token"
6. **Copia el token** (no lo podrás ver de nuevo)
7. Cuando git pida contraseña, pega el token

### Opción 2: SSH (Para el futuro)

```bash
# Generar clave SSH
ssh-keygen -t ed25519 -C "tu-email@example.com"

# Copiar clave pública
cat ~/.ssh/id_ed25519.pub

# Agregar a GitHub:
# Settings → SSH and GPG keys → New SSH key
# Pega la clave y guarda

# Cambiar remote a SSH
git remote set-url origin git@github.com:AlfonsoPiedrabuena/WebSite-Catalysis.git

# Ahora push sin contraseña
git push -u origin production
```

## Después del Push

Una vez que hayas hecho push exitoso:

### 1. Verifica en GitHub
- Ve a: https://github.com/AlfonsoPiedrabuena/WebSite-Catalysis
- Deberías ver las ramas `main` y `production` actualizadas
- Verifica que no haya directorios `Site_Flask/` o `Templates/`

### 2. Despliega en Netlify

1. **Ve a:** https://app.netlify.com
2. **Login** con GitHub
3. **"Add new site"** → "Import an existing project"
4. **Autoriza** a Netlify para acceder a tus repos de GitHub
5. **Selecciona:** `AlfonsoPiedrabuena/WebSite-Catalysis`
6. **Configuración:**
   ```
   Branch to deploy: production
   Base directory: site
   Publish directory: site
   Build command: (dejar vacío)
   ```
7. **Click:** "Deploy site"

### 3. Espera el Deploy (1-2 minutos)

Netlify te mostrará:
- ✅ "Site deploy in progress"
- ✅ "Site is live"
- URL temporal: `https://random-name-12345.netlify.app`

### 4. Configura tu Sitio

En Netlify Dashboard:
- **Site settings** → **Change site name** → `catalysis-blog`
- Tu URL será: `https://catalysis-blog.netlify.app`

### 5. Verifica el Sitio

Abre tu sitio y verifica:
- ✅ Páginas cargan (index, servicios, blog, contacto)
- ✅ Firebase está conectado (F12 → Console)
- ✅ Blog muestra posts (si los agregaste en Firebase)
- ✅ Formulario de contacto funciona

### 6. Configura Dominio (Opcional)

Si tienes un dominio:
- Netlify → **Domain settings** → **Add custom domain**
- Sigue las instrucciones para configurar DNS

## Problemas Comunes

### "Authentication failed"
- Usa Personal Access Token en lugar de contraseña
- O configura SSH

### "Permission denied"
- Verifica que tengas permisos de escritura en el repo
- Verifica que el token tenga scope `repo`

### "Push rejected"
- Haz pull primero: `git pull origin production`
- Luego intenta push de nuevo

## Comandos de Verificación

```bash
# Ver estado de git
git status

# Ver ramas
git branch -a

# Ver últimos commits
git log --oneline -5

# Ver remotes
git remote -v
```

## ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa los mensajes de error completos
2. Verifica tu autenticación en GitHub
3. Asegúrate de tener permisos en el repositorio

---

**¡Todo está listo para producción!** 🚀

Solo necesitas hacer el push y configurar Netlify.
