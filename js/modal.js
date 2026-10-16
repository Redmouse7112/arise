// Ventana pequeña centrada con fondo apenas oscurecido.
// Simple (por defecto): cierra con el botón, Escape o un clic completo afuera (a los 2 s, para que un toque suelto al abrir no la cierre).
// Con `form: true` (formularios): solo cierra con Escape o sus botones, para no perder lo escrito, y deja usar Tab entre campos.
// `botones`: [{ t, cls, fn(close) }] reemplaza al botón único; si fn devuelve false la ventana no se cierra.
// `html` lo arma quien llama y debe venir ya escapado. Devuelve la función que la cierra.
export function abrirModal({ id = '', label, titulo, html, boton = 'Entendido', botones, form = false, onClose }) {
  if (document.querySelector('.mw:not(.out)')) return null;
  const back = document.activeElement, t0 = Date.now();
  const bs = botones || [{ t: boton, cls: 'pri' }];
  const w = document.createElement('div');
  w.className = 'mw';
  w.innerHTML = `<div class="panel mdl" ${id ? `id="${id}"` : ''} role="dialog" aria-modal="true" aria-label="${label}">
    <div class="up" style="margin-bottom:8px">${titulo}</div><div class="mb">${html}</div>
    <div class="btns" style="justify-content:flex-end;margin-top:12px">${bs.map((b, i) => `<button class="btn sm ${b.cls || ''}" data-b="${i}">${b.t}</button>`).join('')}</div></div>`;
  document.body.appendChild(w);
  const dlg = w.firstElementChild, btns = [...w.querySelectorAll('[data-b]')];
  let cerrada = false;
  const close = () => {
    if (cerrada) return; cerrada = true;
    document.removeEventListener('keydown', onKey, true); document.removeEventListener('click', onOut, true);
    w.classList.remove('on'); w.classList.add('out'); setTimeout(() => w.remove(), 300);
    try { back && back.focus && back.focus(); } catch {}
    if (onClose) onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); else if (!form && e.key === 'Tab') { e.preventDefault(); btns[btns.length - 1].focus(); } };
  const onOut = (e) => { if (!form && !dlg.contains(e.target) && Date.now() - t0 > 2000) close(); };
  btns.forEach((b, i) => b.addEventListener('click', () => { const r = bs[i].fn ? bs[i].fn(close, dlg) : undefined; if (r !== false) close(); }));
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('click', onOut, true);
  setTimeout(() => { w.classList.add('on'); if (!form) btns[btns.length - 1].focus({ preventScroll: true }); }, 30);
  return close;
}
