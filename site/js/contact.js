/* ====================================
   CONTACT FORM - SAVE TO FIRESTORE
   ==================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Handle main contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Handle quick contact form (from homepage)
    const quickContactForm = document.getElementById('quick-contact-form');
    if (quickContactForm) {
        quickContactForm.addEventListener('submit', handleQuickContactSubmit);
    }

    // Character counter for problema field
    const problemaField = document.getElementById('problema');
    const charCount = document.getElementById('char-count');
    if (problemaField && charCount) {
        problemaField.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
    }
});

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
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            empresa: document.getElementById('empresa').value,
            sector: document.getElementById('sector').value,
            nivel_madurez: document.getElementById('nivel-madurez').value,
            problema: document.getElementById('problema').value,
            whatsapp: document.getElementById('whatsapp').checked,
            privacidad_aceptada: document.getElementById('privacidad').checked,
            fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
            atendido: false
        };

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
        submitButton.textContent = 'Enviar mensaje';
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
            nombre: document.getElementById('quick-nombre').value,
            apellido: document.getElementById('quick-apellido').value,
            email: document.getElementById('quick-email').value,
            telefono: document.getElementById('quick-telefono').value,
            empresa: document.getElementById('quick-empresa').value,
            sector: document.getElementById('quick-sector').value,
            nivel_madurez: document.getElementById('quick-nivel-madurez').value,
            problema: document.getElementById('quick-problema').value,
            whatsapp: document.getElementById('quick-whatsapp').checked,
            privacidad_aceptada: document.getElementById('quick-privacidad').checked,
            tipo_solicitud: 'Consulta gratuita desde homepage',
            fecha_creacion: firebase.firestore.FieldValue.serverTimestamp(),
            atendido: false
        };

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
        submitButton.textContent = 'Agendar consulta gratuita';
    }
}
