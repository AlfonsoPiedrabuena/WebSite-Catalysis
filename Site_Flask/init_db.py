"""
Script para inicializar la base de datos y crear datos de ejemplo
"""
from app import create_app
from models import db
from models.blog import BlogPost, BlogCategory
from datetime import datetime


def init_database():
    """Inicializa la base de datos y crea datos de ejemplo"""
    app = create_app()

    with app.app_context():
        # Crear todas las tablas
        db.create_all()
        print("✅ Tablas creadas exitosamente")

        # Verificar si ya existen categorías
        if BlogCategory.query.count() == 0:
            # Crear categorías de ejemplo
            categorias = [
                BlogCategory(nombre="Transformación Digital", slug="transformacion-digital",
                           descripcion="Artículos sobre estrategia y transformación digital"),
                BlogCategory(nombre="Inteligencia Artificial", slug="inteligencia-artificial",
                           descripcion="Contenido sobre IA y machine learning"),
                BlogCategory(nombre="Cloud Computing", slug="cloud-computing",
                           descripcion="Artículos sobre tecnologías en la nube"),
                BlogCategory(nombre="Data Analytics", slug="data-analytics",
                           descripcion="Contenido sobre análisis de datos")
            ]

            for categoria in categorias:
                db.session.add(categoria)

            print("✅ Categorías de blog creadas")

        # Verificar si ya existen posts
        if BlogPost.query.count() == 0:
            # Crear posts de ejemplo
            posts = [
                BlogPost(
                    titulo="Cómo iniciar tu transformación digital en 2025",
                    slug="como-iniciar-transformacion-digital-2025",
                    resumen="Descubre los pasos clave para comenzar el viaje de transformación digital de tu empresa con éxito.",
                    contenido="""
                    <p>La transformación digital ya no es opcional. En 2025, las empresas que no adopten tecnologías digitales quedarán rezagadas. Aquí te mostramos cómo comenzar:</p>
                    <h3>1. Evalúa tu madurez digital actual</h3>
                    <p>Antes de empezar, necesitas saber dónde estás. Realiza un diagnóstico completo de tus procesos, tecnología y cultura organizacional.</p>
                    <h3>2. Define objetivos claros y medibles</h3>
                    <p>No te embarques en la transformación sin saber a dónde quieres llegar. Establece KPIs específicos y realistas.</p>
                    <h3>3. Comienza con quick wins</h3>
                    <p>Genera momentum implementando mejoras rápidas que demuestren valor inmediato a la organización.</p>
                    """,
                    autor="María González",
                    categoria="Transformación Digital",
                    tags="transformación digital,estrategia,2025",
                    publicado=True,
                    fecha_publicacion=datetime.utcnow()
                ),
                BlogPost(
                    titulo="5 aplicaciones de IA Generativa en empresas",
                    slug="aplicaciones-ia-generativa-empresas",
                    resumen="Explora cómo la IA generativa está revolucionando la forma en que las empresas operan y crean valor.",
                    contenido="""
                    <p>La inteligencia artificial generativa está transformando radicalmente el panorama empresarial. Estas son las 5 aplicaciones más impactantes:</p>
                    <h3>1. Automatización de contenido</h3>
                    <p>Genera contenido de marketing, documentación técnica y comunicaciones en minutos en lugar de horas.</p>
                    <h3>2. Asistentes virtuales inteligentes</h3>
                    <p>Mejora la atención al cliente con chatbots que entienden contexto y pueden mantener conversaciones naturales.</p>
                    <h3>3. Análisis de datos</h3>
                    <p>Obtén insights profundos de tus datos con capacidades de análisis avanzadas.</p>
                    """,
                    autor="Carlos Ramírez",
                    categoria="Inteligencia Artificial",
                    tags="ia generativa,chatgpt,automatización",
                    publicado=True,
                    fecha_publicacion=datetime.utcnow()
                ),
                BlogPost(
                    titulo="Migración a la nube: Guía completa 2025",
                    slug="migracion-nube-guia-completa-2025",
                    resumen="Todo lo que necesitas saber para migrar tu infraestructura a la nube de manera exitosa.",
                    contenido="""
                    <p>Migrar a la nube es una decisión estratégica que puede transformar tu negocio. Aquí está nuestra guía completa:</p>
                    <h3>Evalúa tus necesidades</h3>
                    <p>No todas las cargas de trabajo son ideales para la nube. Identifica qué aplicaciones migrar primero.</p>
                    <h3>Elige el proveedor correcto</h3>
                    <p>AWS, Azure y Google Cloud tienen fortalezas diferentes. Selecciona el que mejor se adapte a tus necesidades.</p>
                    <h3>Planifica la migración</h3>
                    <p>Desarrolla un plan detallado que minimice el tiempo de inactividad y los riesgos.</p>
                    """,
                    autor="Ana Martínez",
                    categoria="Cloud Computing",
                    tags="cloud,aws,azure,migración",
                    publicado=True,
                    fecha_publicacion=datetime.utcnow()
                )
            ]

            for post in posts:
                db.session.add(post)

            print("✅ Posts de ejemplo creados")

        # Guardar todos los cambios
        db.session.commit()
        print("\n🎉 Base de datos inicializada correctamente!")
        print("\nPuedes acceder a:")
        print("- Página principal: http://localhost:5000")
        print("- Blog: http://localhost:5000/blog")
        print("- Contacto: http://localhost:5000/contacto")


if __name__ == '__main__':
    init_database()
