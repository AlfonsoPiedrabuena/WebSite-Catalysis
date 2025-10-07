"""
Rutas principales de la aplicación
"""
from flask import Blueprint, render_template, request, flash, redirect, url_for
from models import db
from models.contact import Contact
from forms.contact_form import ContactForm

main = Blueprint('main', __name__)


@main.route('/')
def index():
    """Página principal"""
    form = ContactForm()
    return render_template('index.html', form=form)


@main.route('/servicios')
def servicios():
    """Página de servicios"""
    return render_template('servicios.html')


@main.route('/contacto', methods=['GET', 'POST'])
def contacto():
    """Página de contacto"""
    form = ContactForm()

    if form.validate_on_submit():
        # Crear nuevo registro de contacto
        nuevo_contacto = Contact(
            nombre=form.nombre.data,
            email=form.email.data,
            empresa=form.empresa.data,
            telefono=form.telefono.data,
            mensaje=form.mensaje.data
        )

        try:
            db.session.add(nuevo_contacto)
            db.session.commit()
            flash('¡Gracias por tu interés! Nos pondremos en contacto contigo pronto.', 'success')
            return redirect(url_for('main.contacto'))
        except Exception as e:
            db.session.rollback()
            flash('Hubo un error al enviar tu mensaje. Por favor, intenta de nuevo.', 'error')
            print(f"Error al guardar contacto: {e}")

    return render_template('contacto.html', form=form)
