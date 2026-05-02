/* ====================================
   CONTACT FORM - SEND TO HUBSPOT
   Envía los datos a la Netlify Function
   /.netlify/functions/hubspot-register
   ==================================== */

const HUBSPOT_ENDPOINT = '/.netlify/functions/hubspot-register';

// Token de Cloudflare Turnstile — lo emite el widget vía callback
let turnstileToken = null;

window.onTurnstileSuccess = function (token) {
    turnstileToken = token;
};
window.onTurnstileError = function () {
    turnstileToken = null;
};
window.onTurnstileExpired = function () {
    turnstileToken = null;
};

document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) =>
            handleSubmit(e, getMainFormData, 'form-message')
        );
        const telefono = document.getElementById('telefono');
        if (telefono) telefono.addEventListener('input', validatePhone);
    }

    const quickContactForm = document.getElementById('quick-contact-form');
    if (quickContactForm) {
        quickContactForm.addEventListener('submit', (e) =>
            handleSubmit(e, getQuickFormData, 'quick-form-message')
        );
        const quickTelefono = document.getElementById('quick-telefono');
        if (quickTelefono) quickTelefono.addEventListener('input', validatePhone);
    }
});

function validatePhone(e) {
    const cleaned = e.target.value.replace(/[^0-9 +\-]/g, '');
    if (e.target.value !== cleaned) e.target.value = cleaned;
}

function getMainFormData() {
    return {
        firstname: document.getElementById('nombre').value.trim(),
        lastname: document.getElementById('apellido').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('telefono').value.trim(),
        company: document.getElementById('empresa').value.trim(),
        industry: document.getElementById('sector').value,
        nivel_de_madurez: document.getElementById('nivel-madurez').value,
        acepto_recibir_mensajes_de_whatsapp: document.getElementById('whatsapp').checked,
        acuerdodeprivacidad: document.getElementById('privacidad').checked,
    };
}

function getQuickFormData() {
    return {
        firstname: document.getElementById('quick-nombre').value.trim(),
        lastname: document.getElementById('quick-apellido').value.trim(),
        email: document.getElementById('quick-email').value.trim(),
        phone: document.getElementById('quick-telefono').value.trim(),
        company: document.getElementById('quick-empresa').value.trim(),
        industry: document.getElementById('quick-sector').value,
        nivel_de_madurez: document.getElementById('quick-nivel-madurez').value,
        acepto_recibir_mensajes_de_whatsapp: document.getElementById('quick-whatsapp').checked,
        acuerdodeprivacidad: document.getElementById('quick-privacidad').checked,
    };
}

function validateFormData(data) {
    if (data.firstname.length > 100) return 'El nombre no puede exceder 100 caracteres';
    if (data.lastname.length > 100) return 'El apellido no puede exceder 100 caracteres';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) return 'Por favor ingresa un correo electrónico válido';

    if (data.phone.length > 30) return 'El teléfono no puede exceder 30 caracteres';
    const phoneRegex = /^[0-9 +\-]{7,30}$/;
    if (!phoneRegex.test(data.phone))
        return 'El teléfono debe contener entre 7 y 30 caracteres válidos (números, +, -, espacios)';

    if (data.company.length > 50) return 'El nombre de la empresa no puede exceder 50 caracteres';
    if (!data.acuerdodeprivacidad)
        return 'Debes aceptar las políticas de privacidad para continuar';

    return null;
}

async function handleSubmit(e, getData, messageElementId) {
    e.preventDefault();

    const formMessage = document.getElementById(messageElementId);
    const submitButton = e.target.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    if (formMessage) formMessage.style.display = 'none';

    try {
        const data = getData();
        const validationError = validateFormData(data);
        if (validationError) throw new Error(validationError);

        if (!turnstileToken) {
            throw new Error('Verificación de seguridad pendiente. Espera un segundo e intenta de nuevo.');
        }

        const res = await fetch(HUBSPOT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, turnstileToken }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'No se pudo enviar la solicitud');
        }

        if (formMessage) {
            formMessage.style.display = 'block';
            formMessage.style.color = 'green';
            formMessage.textContent =
                '¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.';
        }

        e.target.reset();
        // Token de Turnstile es de un solo uso — resetear widget para emitir uno nuevo
        if (window.turnstile) {
            turnstileToken = null;
            window.turnstile.reset();
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        if (formMessage) {
            formMessage.style.display = 'block';
            formMessage.style.color = 'red';
            formMessage.textContent =
                error.message || 'Hubo un error al enviar tu mensaje. Por favor, intenta nuevamente.';
        }
        // Si el envío falló, el token ya se "consumió" en el server (o no existe). Resetear.
        if (window.turnstile) {
            turnstileToken = null;
            window.turnstile.reset();
        }
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar consulta';
    }
}
