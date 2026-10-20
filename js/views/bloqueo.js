// Aviso cuando lo guardado viene de una versión de Dankai más nueva que este código: no se toca ni se sobrescribe nada.
import { getBloqueo, exportJSON, ymd } from '../store.js';

export function render(root) {
  const b = getBloqueo();
  root.innerHTML = `<div style="text-align:center;margin:18px 0 18px"><h1 style="margin:0 0 8px;font-size:1.25rem">Tus datos son de una versión más nueva</h1>
    <p class="mut" style="margin:0">Esta copia de Dankai es más vieja que la que guardó tus datos (esquema ${b.guardada}; esta app llega hasta el ${b.conocida}).</p></div>
  <section class="panel"><p style="margin:0 0 12px"><b>No se modificó nada.</b> Para no pisarlos, la app no guarda cambios hasta que la actualices.</p>
    <ol class="pasos"><li>Cerrá la app por completo y volvé a abrirla con conexión a internet.</li><li>Si sigue igual, tocá "Buscar la versión nueva".</li></ol>
    <div class="btns" style="margin-top:14px;justify-content:flex-start"><button class="btn pri" id="act">Buscar la versión nueva</button><button class="btn" id="bak">Descargar lo guardado</button></div></section>`;
  root.querySelector('#act').onclick = async () => {
    try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.update(); } catch {}
    location.reload();
  };
  root.querySelector('#bak').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportJSON()], { type: 'application/json' }));
    a.download = `dankai-guardado-${ymd()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}
