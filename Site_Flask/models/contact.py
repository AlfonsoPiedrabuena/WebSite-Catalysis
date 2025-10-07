"""
Modelo para registros de contacto
"""
from datetime import datetime
from models import db


class Contact(db.Model):
    """Modelo para almacenar información de contacto de clientes potenciales"""
    __tablename__ = 'contacts'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    empresa = db.Column(db.String(100), nullable=True)
    telefono = db.Column(db.String(20), nullable=True)
    mensaje = db.Column(db.Text, nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    atendido = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Contact {self.nombre} - {self.email}>'

    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'empresa': self.empresa,
            'telefono': self.telefono,
            'mensaje': self.mensaje,
            'fecha_creacion': self.fecha_creacion.isoformat(),
            'atendido': self.atendido
        }
