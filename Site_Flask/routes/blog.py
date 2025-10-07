"""
Rutas del blog
"""
from flask import Blueprint, render_template, abort
from models.blog import BlogPost

blog = Blueprint('blog', __name__, url_prefix='/blog')


@blog.route('/')
def index():
    """Lista de artículos del blog"""
    page = request.args.get('page', 1, type=int)
    per_page = 9  # 9 posts por página (3x3 grid)

    # Obtener solo posts publicados, ordenados por fecha
    pagination = BlogPost.query.filter_by(publicado=True)\
        .order_by(BlogPost.fecha_publicacion.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    posts = pagination.items

    return render_template('blog.html', posts=posts, pagination=pagination)


@blog.route('/<string:slug>')
def post(slug):
    """Artículo individual del blog"""
    post = BlogPost.query.filter_by(slug=slug, publicado=True).first_or_404()

    # Incrementar contador de vistas
    post.incrementar_vistas()

    return render_template('blog_post.html', post=post)


# Importar request para la paginación
from flask import request
