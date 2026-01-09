/* ====================================
   CONTACT FORM - SAVE TO FIRESTORE
   ==================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Handle main contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
        // Add phone validation
        const telefono = document.getElementById('telefono');
        if (telefono) {
            telefono.addEventListener('input', validatePhone);
        }
    }

    // Handle quick contact form (from homepage)
    const quickContactForm = document.getElementById('quick-contact-form');
    if (quickContactForm) {
        quickContactForm.addEventListener('submit', handleQuickContactSubmit);
        // Add phone validation
        const quickTelefono = document.getElementById('quick-telefono');
        if (quickTelefono) {
            quickTelefono.addEventListener('input', validatePhone);
        }
    }

    // Character counter for problema field
    const problemaField = document.getElementById('problema');
    const charCount = document.getElementById('char-count');
    if (problemaField && charCount) {
        problemaField.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
    }

    // Character counter for quick-problema field
    const quickProblemaField = document.getElementById('quick-problema');
    const quickCharCount = document.getElementById('quick-char-count');
    if (quickProblemaField && quickCharCount) {
        quickProblemaField.addEventListener('input', function() {
            quickCharCount.textContent = this.value.length;
        });
    }
});

/**
 * Validate phone field - only allow numbers, +, -, spaces, and parentheses
 * @param {Event} e - Input event
 */
function validatePhone(e) {
    const input = e.target;
    const value = input.value;

    // Remove any characters that are not numbers, +, -, spaces, or parentheses
    const cleanedValue = value.replace(/[^0-9+\s\-()]/g, '');

    // Update input if value was changed
    if (value !== cleanedValue) {
        input.value = cleanedValue;
    }
}

/**
 * Validate form data before submission
 * @param {Object} formData - Form data object
 * @returns {Object} - {valid: boolean, error: string}
 */
function validateFormData(formData) {
    // Validate nombre (max 100 characters)
    if (formData.nombre.length > 100) {
        return { valid: false, error: 'El nombre no puede exceder 100 caracteres' };
    }

    // Validate apellido (max 100 characters)
    if (formData.apellido.length > 100) {
        return { valid: false, error: 'El apellido no puede exceder 100 caracteres' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        return { valid: false, error: 'Por favor ingresa un correo electrónico válido' };
    }

    // Validate telefono (max 30 characters, only numbers and allowed characters)
    if (formData.telefono.length > 30) {
        return { valid: false, error: 'El teléfono no puede exceder 30 caracteres' };
    }
    const phoneRegex = /^[0-9+\s\-()]{7,30}$/;
    if (!phoneRegex.test(formData.telefono)) {
        return { valid: false, error: 'El teléfono debe contener entre 7 y 30 caracteres válidos (números, +, -, espacios, paréntesis)' };
    }

    // Validate empresa (max 50 characters)
    if (formData.empresa.length > 50) {
        return { valid: false, error: 'El nombre de la empresa no puede exceder 50 caracteres' };
    }

    // Validate problema (max 500 characters)
    if (formData.problema.length > 500) {
        return { valid: false, error: 'El problema o duda no puede exceder 500 caracteres' };
    }

    // Validate privacidad_aceptada
    if (!formData.privacidad_aceptada) {
        return { valid: false, error: 'Debes aceptar las políticas de privacidad para continuar' };
    }

    return { valid: true, error: null };
}

/**
 * Handle contact form submission
 * @param {Event} e - Form submit event
 */
async function handleContactSubmit(e) {
    e.preventDefault();

    const formMessage = document.getElementById('form-message');
    const submitButton = e.target.querySelector('button[type="submit"]');

    // Disable submit button
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    try {
        // Check if Firebase is initialized
        if (!window.firestoreDb) {
            throw new Error('Firebase not initialized');
        }

        // Get form data
        const formData = {
            nombre: document.getElementById('nombre').value.trim(),
            apellido: document.getElementById('apellido').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            empresa: document.getElementById('empresa').value.trim(),
            sector: document.getElementById('sector').value,
            nivel_madurez: document.getElementById('nivel-madurez').value,
            problema: document.getElementById('problema').value.trim(),
            whatsapp: document.getElementById('whatsapp').checked,
            privacidad_aceptada: document.getElementById('privacidad').checked,
            fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
            atendido: false
        };

        // Validate form data
        const validation = validateFormData(formData);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Save to Firestore
        await window.firestoreDb.collection('contactos').add(formData);

        // Show success message
        formMessage.style.display = 'block';
        formMessage.style.color = 'green';
        formMessage.textContent = '¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.';

        // Reset form
        e.target.reset();

    } catch (error) {
        console.error('Error submitting contact form:', error);

        // Show error message
        formMessage.style.display = 'block';
        formMessage.style.color = 'red';
        formMessage.textContent = 'Hubo un error al enviar tu mensaje. Por favor, intenta nuevamente.';
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar consulta';
    }
}

/**
 * Handle quick contact form submission (from homepage)
 * @param {Event} e - Form submit event
 */
async function handleQuickContactSubmit(e) {
    e.preventDefault();

    const formMessage = document.getElementById('quick-form-message');
    const submitButton = e.target.querySelector('button[type="submit"]');

    // Disable submit button
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    try {
        // Check if Firebase is initialized
        if (!window.firestoreDb) {
            throw new Error('Firebase not initialized');
        }

        // Get form data
        const formData = {
            nombre: document.getElementById('quick-nombre').value.trim(),
            apellido: document.getElementById('quick-apellido').value.trim(),
            email: document.getElementById('quick-email').value.trim(),
            telefono: document.getElementById('quick-telefono').value.trim(),
            empresa: document.getElementById('quick-empresa').value.trim(),
            sector: document.getElementById('quick-sector').value,
            nivel_madurez: document.getElementById('quick-nivel-madurez').value,
            problema: document.getElementById('quick-problema').value.trim(),
            whatsapp: document.getElementById('quick-whatsapp').checked,
            privacidad_aceptada: document.getElementById('quick-privacidad').checked,
            tipo_solicitud: 'Consulta gratuita desde homepage',
            fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
            atendido: false
        };

        // Validate form data
        const validation = validateFormData(formData);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Save to Firestore
        await window.firestoreDb.collection('contactos').add(formData);

        // Show success message
        formMessage.style.display = 'block';
        formMessage.style.color = 'green';
        formMessage.textContent = '¡Gracias! Hemos recibido tu solicitud y nos pondremos en contacto contigo pronto.';

        // Reset form
        e.target.reset();

    } catch (error) {
        console.error('Error submitting quick contact form:', error);

        // Show error message
        formMessage.style.display = 'block';
        formMessage.style.color = 'red';
        formMessage.textContent = 'Hubo un error al enviar tu solicitud. Por favor, intenta nuevamente.';
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar consulta';
    }
}
