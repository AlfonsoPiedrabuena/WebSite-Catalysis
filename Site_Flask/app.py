"""
Aplicación Flask principal para Catalysis
"""
import os
from datetime import datetime
from flask import Flask, render_template
from flask_migrate import Migrate
from config import config
from models import db


def create_app(config_name=None):
    """Factory para crear la aplicación Flask"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Inicializar extensiones
    db.init_app(app)
    migrate = Migrate(app, db)

    # Registrar blueprints
    from routes.main import main
    from routes.blog import blog

    app.register_blueprint(main)
    app.register_blueprint(blog)

    # Context processor para variables globales en templates
    @app.context_processor
    def inject_globals():
        return {
            'current_year': datetime.now().year
        }

    # Manejo de errores
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('500.html'), 500

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5001)
