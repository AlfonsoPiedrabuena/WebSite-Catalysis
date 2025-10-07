# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Catalysis is a digital transformation consulting company website with two implementations:
1. **Templates/** - Original static HTML/CSS/JS templates (reference/design source)
2. **Site_Flask/** - Production Flask application with PostgreSQL backend (active development)

## Project Structure

```
/
├── Site_Flask/          # 🎯 MAIN FLASK APPLICATION (PRODUCTION)
│   ├── app.py          # Flask application entry point
│   ├── config.py       # Configuration management
│   ├── init_db.py      # Database initialization script
│   ├── requirements.txt # Python dependencies
│   ├── .env            # Environment variables (not in git)
│   ├── models/         # SQLAlchemy models
│   │   ├── contact.py  # Contact form submissions
│   │   └── blog.py     # Blog posts and categories
│   ├── routes/         # Flask blueprints
│   │   ├── main.py     # Main pages (home, services, contact)
│   │   └── blog.py     # Blog routes
│   ├── forms/          # WTForms forms
│   │   └── contact_form.py
│   ├── templates/      # Jinja2 templates
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── servicios.html
│   │   ├── contacto.html
│   │   ├── blog.html
│   │   └── blog_post.html
│   └── static/         # Static assets
│       ├── css/style.css
│       ├── js/main.js
│       └── images/
│
├── Templates/          # Original static templates (reference only)
│   ├── index.html
│   ├── servicios.html
│   ├── contacto.html
│   ├── blog.html
│   ├── css/style.css
│   └── js/main.js
│
├── website_catalysis/  # Python virtual environment
└── CLAUDE.md          # This file
```

## Development Environment

### Flask Application Setup

**Prerequisites:**
- Python 3.12+
- PostgreSQL 12+
- Virtual environment in `website_catalysis/`

**Quick Start:**
```bash
# Navigate to Flask app
cd Site_Flask

# Activate virtual environment
source ../website_catalysis/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Initialize database (first time only)
python init_db.py

# Run application
python app.py
```

**Application runs on:** http://localhost:5001

### Database Setup

**PostgreSQL Database:**
- Database name: `catalysis_db`
- Configuration in: `Site_Flask/.env`
- Models location: `Site_Flask/models/`

**Database Models:**
1. **Contact** - Contact form submissions
   - Fields: nombre, email, empresa, telefono, mensaje, fecha_creacion, atendido

2. **BlogPost** - Blog articles
   - Fields: titulo, slug, resumen, contenido, autor, imagen_portada, categoria, tags, publicado, fechas, vistas

3. **BlogCategory** - Blog categories
   - Fields: nombre, slug, descripcion

**Common Database Tasks:**
```bash
# Reinitialize database with sample data
python init_db.py

# Access Flask shell for manual DB operations
flask shell
```

## Architecture Notes

### Flask Application Architecture

**Pattern:** Factory Pattern with Application Factory
- Entry point: `app.py` with `create_app()` function
- Blueprints for modular routing:
  - `main` blueprint: Home, services, contact pages
  - `blog` blueprint: Blog listing and individual posts
- Configuration: Environment-based (development/production)
- Database: SQLAlchemy ORM with Flask-Migrate for migrations
- Forms: Flask-WTF with CSRF protection

### Template System (Jinja2)

**Base Template Pattern:**
- `base.html` contains common structure (nav, footer)
- All pages extend base template
- Blocks: `title`, `content`, `extra_css`, `extra_js`
- Template inheritance for consistent design

**Template Features:**
- Semantic HTML5
- Spanish language content (lang="es")
- Responsive meta viewport configuration
- Flash messages for user feedback
- Dynamic navigation with url_for()

### CSS Architecture

- CSS uses CSS custom properties (CSS variables) for theming
- Color scheme defined in `:root`:
  - `--primary`: #0f0f0f (dark)
  - `--secondary`: #ffffff (white)
  - `--text`: #666666 (gray)
  - `--light-bg`: #fafafa (light background)
  - `--border`: #e5e5e5 (border color)
- Responsive design with flexbox/grid layouts
- Modern CSS features: backdrop-filter, smooth scrolling

### JavaScript Features

The main navigation includes:
- Scroll-triggered navbar styling (`.scrolled` class added after 100px scroll)
- Smooth scrolling for anchor links
- Event delegation for navigation

### Key Content Sections

The site includes 9 service offerings:
1. Evaluación y Estrategia Digital
2. Optimización de Procesos
3. Adopción de Tecnologías Cloud
4. Data & Analytics
5. Experiencia del Cliente Digital
6. Inteligencia Artificial Generativa
7. Agentes de IA Autónomos
8. Analítica Predictiva con IA
9. Computer Vision & NLP

### Design Patterns

- Fixed navigation with blur backdrop effect
- Service cards with numbered items (01-09)
- 5-step methodology section (PASO 01-05)
- Statistics display with prominent numbers
- Contact form integration section
- Footer with multi-column layout

## Development Guidelines

### Working with Flask Application

**File Organization:**
- New routes: Add to appropriate blueprint in `routes/`
- New models: Create in `models/` and import in `models/__init__.py`
- New forms: Add to `forms/`
- New templates: Add to `templates/` and extend `base.html`

**Database Changes:**
```bash
# After modifying models
flask db migrate -m "Description of changes"
flask db upgrade
```

**Adding Blog Posts:**
- Use `init_db.py` as reference
- Or use Flask shell for manual creation
- Ensure slug is unique and URL-friendly

**Form Validation:**
- All forms use Flask-WTF for CSRF protection
- Validators defined in form classes
- Error messages in Spanish

### Code Style

**Python:**
- Follow PEP 8
- Use docstrings for functions and classes
- Type hints where appropriate
- Keep functions focused and single-purpose

**Templates:**
- Maintain consistent Spanish language content
- Use Jinja2 filters for formatting
- Keep logic minimal in templates
- Use url_for() for all internal links

**CSS/JavaScript:**
- Reference existing CSS custom properties
- Maintain vanilla JS (no framework dependencies)
- Keep responsive design considerations
- Maintain minimalist, professional aesthetic

### Important Files

**DO NOT commit to git:**
- `Site_Flask/.env` - Contains sensitive credentials
- `website_catalysis/` - Virtual environment
- `__pycache__/` - Python cache files
- `*.pyc` - Compiled Python files

**Key configuration:**
- `Site_Flask/config.py` - Application configuration
- `Site_Flask/.env` - Environment variables (create from .env.example)
- `Site_Flask/requirements.txt` - Python dependencies
