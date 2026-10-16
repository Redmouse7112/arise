// Ventana discreta de novedades: aparece una sola vez cuando cambia la versión.
// La última versión vista vive en su propia clave, fuera del estado principal.
import { APP_VERSION } from './data.js';
import { NOVEDADES } from './novedades.js';

const SEEN = 'arise.seen';
const read = () => { try { return localStorage.getItem(SEEN); } catch { return null; } };
const write = (v) => { try { localStorage.setItem(SEEN, v); } catch {} };
export const shortVer = (v) => v.split('.').slice(0, 2).join('.');

// Compara versiones como números: 2.9.0 < 2.10.0. Devuelve <0, 0 o >0.
export function cmpVer(a, b) {
  const x = String(a).split('.').map((n) => parseInt(n, 10) || 0), y = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; }
  return 0;
}

// ¿Había datos de Arise antes de este arranque? Llamar antes de load().
// Hay datos si el estado guardado tiene algún registro o si existe alguna copia arise.v1.bak*.
export function hasData() {
  try {
    for (let i = 0; i < localStorage.length; i++) if (localStorage.key(i).startsWith('arise.v1.bak')) return true;
    const o = JSON.parse(localStorage.getItem('arise.v1'));
    if (!o || typeof o !== 'object') return false;
    const has = (x) => (Array.isArray(x) ? x.length > 0 : !!x && typeof x === 'object' && Object.keys(x).length > 0);
    return [o.log, o.food && o.food.log, o.read && o.read.log, o.read && o.read.books, o.run && o.run.log, o.dojo && o.dojo.log, o.spar && o.spar.log].some(has);
  } catch { return false; }
}

// Instalación nueva (sin datos y sin versión vista): se guarda la versión actual y no se muestra nada.
// Con datos y sin versión vista cuenta como 0.0.0, así que se muestra. Solo se muestra si la versión vista es menor.
export function initNovedades(hadData) {
  let seen = read();
  if (seen === null) {
    if (!hadData) { write(APP_VERSION); return; }
    seen = '0.0.0';
  }
  if (cmpVer(seen, APP_VERSION) >= 0) return;
  setTimeout(() => show(), 1400);
}

// Muestra la última novedad a pedido (Más → Novedades), sin depender de la versión vista.
export const verUltima = () => show();

function show() {
  if (document.getElementById('news')) return;
  const entry = NOVEDADES.find((n) => n.v === APP_VERSION) || NOVEDADES[0];
  const back = document.activeElement, t0 = Date.now();
  const el = document.createElement('div');
  el.id = 'news'; el.className = 'panel'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Novedades');
  el.innerHTML = `<div class="up" style="margin-bottom:6px">Novedades · v${shortVer(entry.v)}</div>
    <ul>${entry.items.map((t) => `<li>${t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</li>`).join('')}</ul>
    <div class="btns" style="justify-content:flex-end;margin-top:10px"><button class="btn sm pri" id="newsok">Entendido</button></div>`;
  document.body.appendChild(el);
  const btn = el.querySelector('#newsok');
  const close = () => {
    if (cmpVer(read() || '0.0.0', APP_VERSION) < 0) write(APP_VERSION);
    document.removeEventListener('keydown', onKey); document.removeEventListener('click', onOut, true);
    el.classList.remove('on'); setTimeout(() => el.remove(), 350);
    try { back && back.focus && back.focus(); } catch {}
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  // Tocar afuera cierra, pero no un toque suelto apenas aparece ni el inicio de un scroll (solo cuenta un "click" completo).
  const onOut = (e) => { if (!el.contains(e.target) && Date.now() - t0 > 2000) close(); };
  btn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.addEventListener('click', onOut, true);
  setTimeout(() => { el.classList.add('on'); btn.focus({ preventScroll: true }); }, 30);
}
