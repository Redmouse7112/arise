// Primera vez: 1) elegir módulos, 2) rutina de ejemplo o vacío (o importar una copia).
import { get, save, importJSON, setMod } from '../store.js';
import { IMG, MODULOS } from '../data.js';

export function render(root, ctx) {
  const S = get();
  let paso = 1;
  const draw = () => {
    root.innerHTML = `<div style="text-align:center;margin:18px 0 22px"><img src="${IMG.logo}" alt="Arise" style="width:96px;border-radius:18px"><h1 style="margin:14px 0 6px;font-size:1.3rem">Bienvenido a Arise</h1>
      <p class="mut" style="margin:0">${paso === 1 ? 'Elegí qué querés usar. Podés cambiarlo cuando quieras en Ajustes.' : '¿Cómo querés empezar? Todo se puede cambiar después.'}</p></div>
    ${paso === 1 ? `<section class="panel">${MODULOS.map((m) => `<label class="row li"><div style="flex:1;min-width:0"><div class="t">${m.n}</div><div class="mut" style="font-size:.8rem">${m.d}</div></div>
        <input type="checkbox" data-mod="${m.k}" aria-label="${m.n}" ${S.mods[m.k] !== false ? 'checked' : ''}></label>`).join('')}
      <div class="btns" style="margin-top:14px"><button class="btn pri" id="sig">Continuar</button></div></section>
      <p class="mut" style="text-align:center;font-size:.85rem">Los módulos apagados solo se ocultan: tus datos quedan guardados.</p>`
    : `<section class="panel"><div style="font-weight:700">Empezar con la rutina de ejemplo</div>
      <p class="mut" style="margin:6px 0 12px;font-size:.9rem">Un plan semanal de ejemplo con pesos cargados. Solo se muestra lo de los módulos que elegiste. Podés editarlo.</p>
      <button class="btn pri" id="ej">Usar el ejemplo</button></section>
    <section class="panel"><div style="font-weight:700">Empezar vacío</div>
      <p class="mut" style="margin:6px 0 12px;font-size:.9rem">Sin rutinas ni pesos cargados: armás la tuya desde cero con los ejercicios de la biblioteca o los tuyos.</p>
      <button class="btn" id="vacio">Empezar vacío</button></section>
    <p class="mut" style="text-align:center;font-size:.85rem">¿Ya tenés una copia de seguridad? <label style="text-decoration:underline;cursor:pointer">Importarla<input type="file" id="imp" accept="application/json" hidden></label></p>
    <p style="text-align:center"><button class="btn sm ghost" id="atras">← Cambiar módulos</button></p>`}`;
    bind();
  };
  const q = (s) => root.querySelector(s);
  function bind() {
    if (paso === 1) {
      root.querySelectorAll('[data-mod]').forEach((c) => c.addEventListener('change', () => {
        if (!setMod(c.dataset.mod, c.checked)) { c.checked = true; ctx.toast('Elegí al menos un módulo'); }
      }));
      q('#sig').onclick = () => { paso = 2; draw(); };
      return;
    }
    q('#atras').onclick = () => { paso = 1; draw(); };
    q('#ej').onclick = () => { S.setup = 'listo'; save(); location.hash = '#/estado'; ctx.refresh(); };
    q('#vacio').onclick = () => {
      S.setup = 'listo'; S.routines = []; S.plan = ['', '', '', '', '', '', '']; S.last = {}; S.prefs = {}; save();
      location.hash = '#/rutinas'; ctx.refresh();
    };
    q('#imp').onchange = async (e) => {
      try { importJSON(await e.target.files[0].text()); ctx.toast('Copia importada'); location.hash = '#/estado'; ctx.refresh(); } catch { ctx.toast('Archivo no válido'); }
    };
  }
  draw();
}
