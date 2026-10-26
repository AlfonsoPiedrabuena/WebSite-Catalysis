/* ====================================
   ANALÍTICA (GA4): window.catTrack + clics en CTA
   - cta_click: delegado en document para todo elemento con data-cta
     (data-cta-location opcional). Parámetros: cta_id, cta_location, destination, blog_slug.
   - generate_lead: lo disparan los formularios SOLO tras respuesta correcta, con
     lead_source y sin datos personales (nunca correo, teléfono, nombre ni empresa).
   - Los enlaces a Calendly salen con los UTM del último toque.
   Si gtag o localStorage no existen, no pasa nada: nunca debe romper la página.
   ==================================== */
(function () {
    'use strict';

    function send() {
        try {
            if (typeof window.gtag === 'function') window.gtag.apply(null, arguments);
        } catch (e) { /* la analítica nunca rompe la página */ }
    }

    function fuente() {
        try {
            return typeof window.getFuente === 'function' ? window.getFuente() : {};
        } catch (e) {
            return {};
        }
    }

    function conArticulo(params) {
        var p = Object.assign({}, params);
        var slug = fuente().blogOrigen;
        if (slug) p.blog_slug = slug;
        return p;
    }

    /** Agrega los UTM del último toque a un enlace de Calendly (la reserva los conserva). */
    function calendlyUrl(url) {
        try {
            var u = new URL(url, location.href);
            if (!/(^|\.)calendly\.com$/.test(u.hostname)) return url;
            var f = fuente();
            [['utmSource', 'utm_source'], ['utmMedium', 'utm_medium'], ['utmCampaign', 'utm_campaign'], ['utmContent', 'utm_content']]
                .forEach(function (par) {
                    if (f[par[0]] && !u.searchParams.has(par[1])) u.searchParams.set(par[1], f[par[0]]);
                });
            return u.toString();
        } catch (e) {
            return url;
        }
    }

    window.catTrack = {
        event: function (name, params) { send('event', name, conArticulo(params || {})); },
        lead: function (params) { send('event', 'generate_lead', conArticulo(params || {})); },
        calendlyUrl: calendlyUrl,
    };

    document.addEventListener('click', function (e) {
        var el = e.target && e.target.closest ? e.target.closest('[data-cta]') : null;
        if (!el) return;
        var href = el.getAttribute('href') || '';
        if (href && /calendly\.com/.test(href)) el.setAttribute('href', calendlyUrl(href));
        var external = false;
        try { external = !!href && new URL(href, location.href).origin !== location.origin; } catch (err) { /* href no válido */ }
        var params = conArticulo({
            cta_id: el.getAttribute('data-cta'),
            cta_location: el.getAttribute('data-cta-location') || '',
            destination: href,
        });
        if (external) params.transport_type = 'beacon';
        send('event', 'cta_click', params);
    });
})();
