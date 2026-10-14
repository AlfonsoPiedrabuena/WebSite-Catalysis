/* ====================================
   ATRIBUCIÓN DE LEADS
   Guarda en localStorage { first, last, blog_slug } y expone
   window.getFuente(canal) para construir contacto.fuente del CRM
   (contrato: reqs/crm-fuente-contrato.md). Si localStorage está
   bloqueado, cae a memoria y el lead se guarda como orgánico.
   ==================================== */

(function () {
    const STORAGE_KEY = 'catalysis_attribution';
    const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

    // Sanitización: ≤100 caracteres, solo [A-Za-z0-9_\-.:+ ]
    function clean(value) {
        if (typeof value !== 'string') return '';
        return value.replace(/[^A-Za-z0-9_\-.:+ ]/g, '').trim().slice(0, 100);
    }

    function load() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    let memory = null;

    function save(data) {
        memory = data;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
            /* localStorage bloqueado: se queda en memoria */
        }
    }

    function referrerHost() {
        try {
            if (!document.referrer) return '';
            const host = new URL(document.referrer).hostname;
            return host === location.hostname ? '' : clean(host);
        } catch {
            return '';
        }
    }

    function capture() {
        const data = memory || load();
        const params = new URLSearchParams(location.search);

        const touch = {};
        UTM_KEYS.forEach((key) => {
            const value = clean(params.get(key) || '');
            if (value) touch[key] = value;
        });
        const hasUtm = Object.keys(touch).length > 0;
        const referrer = referrerHost();

        if (hasUtm || referrer) {
            if (referrer) touch.referrer = referrer;
            // Un referrer interno vacío no pisa el último toque con UTM
            if (hasUtm || !data.last || !Object.keys(data.last).some((k) => k.startsWith('utm_'))) {
                data.last = touch;
            }
            if (!data.first) data.first = touch;
        }

        // Artículo de origen: slug de la URL de blog-post.html?id=<slug>
        if (/blog-post(\.html)?$/.test(location.pathname)) {
            const slug = clean(params.get('id') || '');
            if (slug) data.blog_slug = slug;
        }

        save(data);
    }

    /** Arma contacto.fuente; omite claves sin valor. */
    window.getFuente = function (canal, leadMagnet) {
        const data = memory || load();
        const first = data.first || {};
        const last = data.last || {};
        const pick = (key) => last[key] || first[key] || '';

        const fuente = {
            utmSource: pick('utm_source'),
            utmMedium: pick('utm_medium'),
            utmCampaign: pick('utm_campaign'),
            utmContent: pick('utm_content'),
            blogOrigen: data.blog_slug || '',
            primerContacto: first.utm_source || first.referrer || '',
            canal: canal || '',
            leadMagnet: leadMagnet || '',
        };
        Object.keys(fuente).forEach((key) => {
            if (!fuente[key]) delete fuente[key];
        });
        return fuente;
    };

    try {
        capture();
    } catch {
        /* la atribución nunca debe romper la página */
    }
})();
