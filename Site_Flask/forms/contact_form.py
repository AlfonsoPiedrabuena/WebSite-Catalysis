"""
Formulario de contacto
"""
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Email, Length, Optional


class ContactForm(FlaskForm):
    """Formulario de contacto para consultas estratégicas"""
    nombre = StringField('Nombre completo', validators=[
        DataRequired(message='El nombre es requerido'),
        Length(min=2, max=100, message='El nombre debe tener entre 2 y 100 caracteres')
    ])

    email = StringField('Correo electrónico', validators=[
        DataRequired(message='El correo electrónico es requerido'),
        Email(message='Ingresa un correo electrónico válido'),
        Length(max=120)
    ])

    empresa = StringField('Empresa', validators=[
        Optional(),
        Length(max=100, message='El nombre de la empresa no puede exceder 100 caracteres')
    ])

    telefono = StringField('Teléfono', validators=[
        Optional(),
        Length(max=20, message='El teléfono no puede exceder 20 caracteres')
    ])

    mensaje = TextAreaField('Mensaje', validators=[
        Optional(),
        Length(max=1000, message='El mensaje no puede exceder 1000 caracteres')
    ])

    submit = SubmitField('Solicitar consulta estratégica')
