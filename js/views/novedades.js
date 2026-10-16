// Historial completo de versiones (#/novedades).
import { APP_VERSION } from '../data.js';
import { NOVEDADES } from '../novedades.js';
import { esc } from '../ui.js';

export function render(root) {
  root.innerHTML = `<div class="head"><h1>Novedades</h1><span class="up">v${APP_VERSION}</span></div>
  ${NOVEDADES.map((n) => `<section class="panel"><div class="row"><b>Versión ${esc(n.v)}</b><span class="sp"></span>
      <span class="mut num" style="font-size:.8rem">${new Date(n.fecha + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
    <ul class="vlist">${n.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>`).join('')}
  <p class="mut" style="text-align:center"><a href="#/mas" style="text-decoration:underline">← Más</a></p>`;
}
