# 🚀 Guía de Inicio Rápido - Catalysis Flask App

## ✅ Estado de la Aplicación

**¡La aplicación está completamente funcional y lista para usar!**

La aplicación se ha probado exitosamente con:
- ✅ Servidor Flask corriendo en puerto 5001
- ✅ Base de datos PostgreSQL configurada
- ✅ Tablas creadas
- ✅ Datos de ejemplo cargados (3 posts de blog)
- ✅ Página principal funcionando
- ✅ Blog funcionando
- ✅ Formulario de contacto listo

## 🎯 Accesos Rápidos

Una vez que inicies el servidor, accede a:

- **Página Principal**: http://localhost:5001
- **Blog**: http://localhost:5001/blog
- **Servicios**: http://localhost:5001/servicios
- **Contacto**: http://localhost:5001/contacto

## 🏃‍♂️ Cómo Iniciar la Aplicación

### Opción 1: Inicio Rápido (La aplicación ya está configurada)

```bash
cd Site_Flask
source ../website_catalysis/bin/activate
python3 app.py
```

Luego abre tu navegador en: **http://localhost:5001**

### Opción 2: Reiniciar desde Cero

Si necesitas reconstruir la base de datos:

```bash
cd Site_Flask
source ../website_catalysis/bin/activate

# Eliminar la base de datos actual
psql -U $(whoami) postgres -c "DROP DATABASE catalysis_db;"
psql -U $(whoami) postgres -c "CREATE DATABASE catalysis_db;"

# Recrear tablas y datos
python3 init_db.py

# Iniciar servidor
python3 app.py
```

## 📊 Base de Datos

La base de datos ya está inicializada con:

### Posts de Blog de Ejemplo:
1. **"Cómo iniciar tu transformación digital en 2025"**
   - Autor: María González
   - Categoría: Transformación Digital

2. **"5 aplicaciones de IA Generativa en empresas"**
   - Autor: Carlos Ramírez
   - Categoría: Inteligencia Artificial

3. **"Migración a la nube: Guía completa 2025"**
   - Autor: Ana Martínez
   - Categoría: Cloud Computing

### Categorías de Blog:
- Transformación Digital
- Inteligencia Artificial
- Cloud Computing
- Data Analytics

## 🛠️ Estructura del Proyecto

```
Site_Flask/
├── app.py                    # ⭐ Aplicación principal
├── init_db.py               # Script para inicializar BD
├── config.py                # Configuración
├── .env                     # Variables de entorno (ya configurado)
├── requirements.txt         # Dependencias (ya instaladas)
│
├── models/                  # Modelos de BD
│   ├── contact.py          # Contactos
│   └── blog.py             # Blog
│
├── routes/                 # Rutas
│   ├── main.py            # Rutas principales
│   └── blog.py            # Rutas del blog
│
├── forms/                 # Formularios
│   └── contact_form.py   # Formulario de contacto
│
├── templates/            # Plantillas HTML
│   ├── base.html        # Template base
│   ├── index.html       # Home
│   ├── servicios.html   # Servicios
│   ├── contacto.html    # Contacto
│   ├── blog.html        # Lista blog
│   └── blog_post.html   # Post individual
│
└── static/              # Archivos estáticos
    ├── css/style.css   # Estilos
    └── js/main.js      # JavaScript
```

## 📝 Próximas Tareas Sugeridas

### 1. Probar la aplicación en tu navegador
   - Navega por todas las páginas
   - Prueba el formulario de contacto
   - Lee los posts del blog

### 2. Personalizar contenido
   - Agregar más posts de blog
   - Modificar información de contacto
   - Añadir imágenes

### 3. Preparar para producción (cuando estés listo)
   - Cambiar SECRET_KEY en .env
   - Configurar servidor de producción (Gunicorn)
   - Configurar HTTPS
   - Ajustar credenciales de base de datos

## 🎨 Crear Nuevos Posts de Blog

Puedes crear posts usando la shell de Flask:

```bash
source ../website_catalysis/bin/activate
python3
```

```python
from app import create_app
from models import db
from models.blog import BlogPost
from datetime import datetime

app = create_app()
with app.app_context():
    post = BlogPost(
        titulo="Tu título aquí",
        slug="tu-titulo-aqui",
        resumen="Resumen corto del post",
        contenido="<p>Contenido HTML del post</p>",
        autor="Tu Nombre",
        categoria="Transformación Digital",
        tags="tag1,tag2,tag3",
        publicado=True,
        fecha_publicacion=datetime.now()
    )
    db.session.add(post)
    db.session.commit()
    print("✅ Post creado!")
```

## 🔍 Ver Contactos Recibidos

```python
from app import create_app
from models.contact import Contact

app = create_app()
with app.app_context():
    contactos = Contact.query.all()
    for c in contactos:
        print(f"{c.nombre} - {c.email} - {c.empresa}")
```

## ⚙️ Configuración Actual

**Base de datos**: PostgreSQL
- Database: `catalysis_db`
- Host: `localhost`
- Configurado en: `.env`

**Puerto del servidor**: 5001
- Cambiado de 5000 a 5001 para evitar conflictos con AirPlay en macOS

**Entorno virtual**: `website_catalysis`
- Ubicado en: `../website_catalysis/`
- Python: 3.12

## 📞 Soporte

Si encuentras algún problema:

1. Verifica que PostgreSQL esté corriendo
2. Confirma que el entorno virtual esté activado
3. Revisa los logs en la terminal
4. Consulta el README.md para más detalles

---

**¡Todo está listo para que empieces a trabajar con tu sitio Catalysis! 🎉**
