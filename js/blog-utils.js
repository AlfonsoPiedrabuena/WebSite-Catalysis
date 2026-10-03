/* ====================================
   BLOG UTILS - SLUGS PARA URLS LEGIBLES
   ==================================== */

/**
 * Convierte un título en un slug seguro para usar en ?id=
 * "Cómo automatizar procesos con Business Intelligence + CRM"
 *   → "como_automatizar_procesos_con_business_intelligence_crm"
 * (se quitan acentos y símbolos como "+", que en un query string se leería como espacio)
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
    return String(text || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

/**
 * Identificador público del post en la URL: el campo `slug` si existe, si no el título.
 * @param {Object} post - Datos del post
 * @returns {string}
 */
function getPostSlug(post) {
    return slugify(post.slug || post.titulo);
}
