// Ventana pequeña centrada con fondo apenas oscurecido. Cierra con el botón, Escape o un clic completo afuera
// (el clic afuera cuenta recién a los 2 s, para que un toque suelto al abrir no la cierre).
// `html` lo arma quien llama y debe venir ya escapado.
export function abrirModal({ id = '', label, titulo, html, boton = 'Entendido', onClose }) {
  if (document.querySelector('.mw')) return null;
  const back = document.activeElement, t0 = Date.now();
  const w = document.createElement('div');
  w.className = 'mw';
  w.innerHTML = `<div class="panel mdl" ${id ? `id="${id}"` : ''} role="dialog" aria-modal="true" aria-label="${label}">
    <div class="up" style="margin-bottom:8px">${titulo}</div><div class="mb">${html}</div>
    <div class="btns" style="justify-content:flex-end;margin-top:12px"><button class="btn sm pri" data-ok>${boton}</button></div></div>`;
  document.body.appendChild(w);
  const dlg = w.firstElementChild, btn = w.querySelector('[data-ok]');
  const close = () => {
    document.removeEventListener('keydown', onKey, true); document.removeEventListener('click', onOut, true);
    w.classList.remove('on'); setTimeout(() => w.remove(), 300);
    try { back && back.focus && back.focus(); } catch {}
    if (onClose) onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); else if (e.key === 'Tab') { e.preventDefault(); btn.focus(); } };
  const onOut = (e) => { if (!dlg.contains(e.target) && Date.now() - t0 > 2000) close(); };
  btn.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('click', onOut, true);
  setTimeout(() => { w.classList.add('on'); btn.focus({ preventScroll: true }); }, 30);
  return close;
}
