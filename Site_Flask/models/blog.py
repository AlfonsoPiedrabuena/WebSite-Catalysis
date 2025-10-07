"""
Modelos para el blog
"""
from datetime import datetime
from models import db


class BlogPost(db.Model):
    """Modelo para artículos del blog"""
    __tablename__ = 'blog_posts'

    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    resumen = db.Column(db.Text, nullable=False)
    contenido = db.Column(db.Text, nullable=False)
    autor = db.Column(db.String(100), nullable=False)
    imagen_portada = db.Column(db.String(255), nullable=True)
    categoria = db.Column(db.String(50), nullable=True)
    tags = db.Column(db.String(255), nullable=True)  # Tags separados por comas
    publicado = db.Column(db.Boolean, default=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    fecha_publicacion = db.Column(db.DateTime, nullable=True)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    vistas = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<BlogPost {self.titulo}>'

    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'titulo': self.titulo,
            'slug': self.slug,
            'resumen': self.resumen,
            'contenido': self.contenido,
            'autor': self.autor,
            'imagen_portada': self.imagen_portada,
            'categoria': self.categoria,
            'tags': self.tags.split(',') if self.tags else [],
            'publicado': self.publicado,
            'fecha_creacion': self.fecha_creacion.isoformat(),
            'fecha_publicacion': self.fecha_publicacion.isoformat() if self.fecha_publicacion else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat(),
            'vistas': self.vistas
        }

    def incrementar_vistas(self):
        """Incrementa el contador de vistas"""
        self.vistas += 1
        db.session.commit()


class BlogCategory(db.Model):
    """Modelo para categorías del blog"""
    __tablename__ = 'blog_categories'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)
    slug = db.Column(db.String(50), unique=True, nullable=False)
    descripcion = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f'<BlogCategory {self.nombre}>'
