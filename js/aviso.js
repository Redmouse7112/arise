// Ventana discreta de novedades: aparece una sola vez cuando cambia la versión.
// La última versión vista vive en su propia clave, fuera del estado principal.
import { APP_VERSION } from './data.js';
import { NOVEDADES } from './novedades.js';

const SEEN = 'arise.seen';
const read = () => { try { return localStorage.getItem(SEEN); } catch { return null; } };
const write = (v) => { try { localStorage.setItem(SEEN, v); } catch {} };
export const shortVer = (v) => v.split('.').slice(0, 2).join('.');

// hadData: había datos de Arise antes de abrir (si no, es la primera instalación y no se muestra).
export function initNovedades(hadData) {
  const seen = read();
  if (seen === APP_VERSION) return;
  if (seen === null && !hadData) { write(APP_VERSION); return; }
  setTimeout(show, 1400);
}

function show() {
  const entry = NOVEDADES.find((n) => n.v === APP_VERSION) || NOVEDADES[0];
  const back = document.activeElement;
  const el = document.createElement('div');
  el.id = 'news'; el.className = 'panel'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Novedades');
  el.innerHTML = `<div class="up" style="margin-bottom:6px">Novedades · v${shortVer(entry.v)}</div>
    <ul>${entry.items.map((t) => `<li>${t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</li>`).join('')}</ul>
    <div class="btns" style="justify-content:flex-end;margin-top:10px"><button class="btn sm pri" id="newsok">Entendido</button></div>`;
  document.body.appendChild(el);
  const btn = el.querySelector('#newsok');
  const close = () => {
    write(APP_VERSION);
    document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onOut, true);
    el.classList.remove('on'); setTimeout(() => el.remove(), 350);
    try { back && back.focus && back.focus(); } catch {}
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const onOut = (e) => { if (!el.contains(e.target)) close(); };
  btn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  setTimeout(() => document.addEventListener('pointerdown', onOut, true), 300);
  setTimeout(() => { el.classList.add('on'); btn.focus({ preventScroll: true }); }, 30);
}
