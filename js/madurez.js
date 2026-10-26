/* ====================================
   MARCO DE MADUREZ: SELECTOR DE NIVEL
   Los cinco niveles ya están completos en el HTML (los lee cualquier crawler o agente);
   las pestañas solo muestran u ocultan. Nivel activo en la URL: ?nivel=3
   ==================================== */
const tabs = [...document.querySelectorAll('#niveles-tabs .tab')];
const panels = [...document.querySelectorAll('#niveles .lvl')];

function activar(n, { desdeUsuario = false } = {}) {
  tabs.forEach((t) => t.setAttribute('aria-pressed', String(Number(t.dataset.nivel) === n)));
  panels.forEach((p) => p.classList.toggle('is-active', Number(p.dataset.nivel) === n));
  if (desdeUsuario) {
    const url = new URL(location.href);
    url.searchParams.set('nivel', String(n));
    history.replaceState(null, '', url);
    if (window.catTrack) window.catTrack.event('marco_nivel_ver', { nivel: n });
  }
}

const inicial = Number(new URLSearchParams(location.search).get('nivel'));
if (Number.isInteger(inicial) && inicial >= 1 && inicial <= panels.length) activar(inicial);

tabs.forEach((t) => t.addEventListener('click', () => activar(Number(t.dataset.nivel), { desdeUsuario: true })));
