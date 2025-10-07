# Catalysis - Sitio Web Flask

Aplicación web para Catalysis, consultoría en transformación digital, construida con Flask y PostgreSQL.

## Requisitos

- Python 3.8+
- PostgreSQL 12+
- pip

## Instalación

### 1. Crear entorno virtual

```bash
cd Site_Flask
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar la base de datos PostgreSQL

Crear la base de datos en PostgreSQL:

```sql
CREATE DATABASE catalysis_db;
CREATE USER catalysis_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE catalysis_db TO catalysis_user;
```

### 4. Configurar variables de entorno

Copiar el archivo de ejemplo y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```
DATABASE_URL=postgresql://catalysis_user:your_password@localhost/catalysis_db
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

### 5. Inicializar la base de datos

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

## Ejecutar la aplicación

```bash
python app.py
```

La aplicación estará disponible en `http://localhost:5000`

## Estructura del proyecto

```
Site_Flask/
├── app.py                 # Aplicación principal
├── config.py              # Configuración
├── requirements.txt       # Dependencias
├── .env.example          # Ejemplo de variables de entorno
├── models/               # Modelos de base de datos
│   ├── __init__.py
│   ├── contact.py        # Modelo de contactos
│   └── blog.py           # Modelos del blog
├── routes/               # Rutas/Vistas
│   ├── __init__.py
│   ├── main.py           # Rutas principales
│   └── blog.py           # Rutas del blog
├── forms/                # Formularios WTForms
│   ├── __init__.py
│   └── contact_form.py   # Formulario de contacto
├── templates/            # Templates Jinja2
│   ├── base.html         # Template base
│   ├── index.html        # Página principal
│   ├── servicios.html    # Página de servicios
│   ├── contacto.html     # Página de contacto
│   ├── blog.html         # Lista de blog posts
│   └── blog_post.html    # Post individual
└── static/               # Archivos estáticos
    ├── css/
    │   └── style.css     # Estilos principales
    ├── js/
    │   └── main.js       # JavaScript principal
    └── images/           # Imágenes
```

## Modelos de Base de Datos

### Contact
- Almacena información de consultas de clientes
- Campos: nombre, email, empresa, telefono, mensaje, fecha_creacion, atendido

### BlogPost
- Gestiona artículos del blog
- Campos: titulo, slug, resumen, contenido, autor, imagen_portada, categoria, tags, publicado, fechas, vistas

### BlogCategory
- Categorías para organizar posts del blog
- Campos: nombre, slug, descripcion

## Comandos útiles

### Migraciones de base de datos

```bash
# Crear una nueva migración
flask db migrate -m "Descripción del cambio"

# Aplicar migraciones
flask db upgrade

# Revertir última migración
flask db downgrade
```

### Crear un post de blog (Python shell)

```bash
flask shell
```

```python
from models import db
from models.blog import BlogPost
from datetime import datetime

post = BlogPost(
    titulo="Mi primer post",
    slug="mi-primer-post",
    resumen="Resumen del post",
    contenido="<p>Contenido del post en HTML</p>",
    autor="Tu Nombre",
    categoria="Tecnología",
    tags="flask,python,web",
    publicado=True,
    fecha_publicacion=datetime.utcnow()
)

db.session.add(post)
db.session.commit()
```

## Desarrollo

Para ejecutar en modo desarrollo con recarga automática:

```bash
export FLASK_ENV=development
export FLASK_APP=app.py
flask run
```

## Producción

Para producción, se recomienda usar un servidor WSGI como Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## Características

- ✅ Gestión de contactos con formularios validados
- ✅ Blog con sistema de posts y categorías
- ✅ Diseño responsive
- ✅ Base de datos PostgreSQL
- ✅ Migraciones de base de datos con Flask-Migrate
- ✅ Validación de formularios con WTForms
- ✅ Templates Jinja2
- ✅ Arquitectura modular con Blueprints

## Soporte

Para más información, contacta a: contacto@catalysis.com.mx
