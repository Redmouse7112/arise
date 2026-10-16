// Primera vez: elegir la rutina de ejemplo o empezar vacío.
import { get, save, importJSON } from '../store.js';
import { IMG } from '../data.js';

export function render(root, ctx) {
  root.innerHTML = `<div style="text-align:center;margin:18px 0 22px"><img src="${IMG.logo}" alt="Arise" style="width:96px;border-radius:18px"><h1 style="margin:14px 0 6px;font-size:1.3rem">Bienvenido a Arise</h1>
    <p class="mut" style="margin:0">¿Cómo querés empezar? Todo se puede cambiar después.</p></div>
  <section class="panel"><div style="font-weight:700">Empezar con la rutina de ejemplo</div>
    <p class="mut" style="margin:6px 0 12px;font-size:.9rem">Un plan semanal con gym, calistenia, trote, dojo y sparring, con pesos de ejemplo. Podés editarlo.</p>
    <button class="btn pri" id="ej">Usar el ejemplo</button></section>
  <section class="panel"><div style="font-weight:700">Empezar vacío</div>
    <p class="mut" style="margin:6px 0 12px;font-size:.9rem">Sin rutinas ni pesos cargados: armás la tuya desde cero con los ejercicios de la biblioteca o los tuyos.</p>
    <button class="btn" id="vacio">Empezar vacío</button></section>
  <p class="mut" style="text-align:center;font-size:.85rem">¿Ya tenés una copia de seguridad? <label style="text-decoration:underline;cursor:pointer">Importarla<input type="file" id="imp" accept="application/json" hidden></label></p>`;
  const S = get();
  root.querySelector('#ej').onclick = () => { S.setup = 'listo'; save(); location.hash = '#/estado'; ctx.refresh(); };
  root.querySelector('#vacio').onclick = () => {
    S.setup = 'listo'; S.routines = []; S.plan = ['', '', '', '', '', '', '']; S.last = {}; S.prefs = {}; save();
    location.hash = '#/rutinas'; ctx.refresh();
  };
  root.querySelector('#imp').onchange = async (e) => {
    try { importJSON(await e.target.files[0].text()); ctx.toast('Copia importada'); location.hash = '#/estado'; ctx.refresh(); } catch { ctx.toast('Archivo no válido'); }
  };
}
