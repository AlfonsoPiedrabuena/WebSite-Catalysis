/* ====================================
   CLOUDFLARE TURNSTILE (render explícito)
   La clave de sitio es pública. El script se carga una sola vez, bajo demanda
   (al abrir un panel o al mostrar un formulario), para no pesar en el LCP.
   ==================================== */

export const TURNSTILE_SITEKEY = '0x4AAAAAADHWxARy0r_0MZ3b';
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let cargando = null;
function cargarScript() {
  if (window.turnstile) return Promise.resolve();
  if (!cargando) {
    cargando = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { cargando = null; reject(new Error('turnstile')); };
      document.head.appendChild(s);
    });
  }
  return cargando;
}

/**
 * Renderiza el widget en `contenedor`. Devuelve { token(), reset(), remove(), listo }.
 * `appearance`: 'always' (visible) o 'interaction-only' (solo si hace falta un reto).
 * Si el script no carga (bloqueador), token() devuelve null y el envío mostrará el error de verificación.
 */
export function montarTurnstile(contenedor, { appearance = 'always', onChange } = {}) {
  let token = null;
  let widgetId = null;
  const avisar = () => { if (onChange) onChange(token); };
  const listo = cargarScript()
    .then(() => {
      widgetId = window.turnstile.render(contenedor, {
        sitekey: TURNSTILE_SITEKEY,
        theme: 'light',
        appearance,
        callback: (t) => { token = t; avisar(); },
        'error-callback': () => { token = null; avisar(); },
        'expired-callback': () => { token = null; avisar(); },
      });
    })
    .catch(() => { token = null; avisar(); });
  return {
    listo,
    token: () => token,
    reset() {
      token = null;
      avisar();
      if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
    },
    remove() {
      if (widgetId !== null && window.turnstile) window.turnstile.remove(widgetId);
      widgetId = null;
      token = null;
    },
  };
}
