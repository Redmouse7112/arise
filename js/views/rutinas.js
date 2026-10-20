// Rutinas (#/rutinas) y su editor (#/rutinas/<id>): crear, duplicar, renombrar, ordenar y editar ejercicios.
import { IMG, MUS, EX, DAYS, MODULOS, TRABAJO } from '../data.js';
import { get, save, ymd, biblioteca, defOf, routineOf, modActivo, modOf } from '../store.js';
import * as R from '../rutinas.js';
import { abrirModal } from '../modal.js';
import { esc, muscleImg, target } from '../ui.js';

const COLORES = ['#38bdf8', '#fbbf24', '#ef4444', '#34d399', '#a78bfa', '#fb923c', '#22d3ee', '#f472b6'];
const IMGS = { gym: 'Pesas', calistenia: 'Calistenia', trote: 'Trote', sparring: 'Sparring', dojo: 'Dojo', cuerpo: 'Cuerpo', comida: 'Comida', lectura: 'Lectura' };
const TIPOS = { sets: 'Series con peso', timed: 'Con temporizador', check: 'Un toque' };
const PROPIOS = ['trote', 'clase', 'spar'];   // ejercicios base con pantalla propia: solo se cambia nombre y nota
const NOTA_HOY = 'Los cambios valen de hoy en adelante: los días ya registrados no se modifican. Si hoy ya empezaste la rutina, el cambio vale desde mañana.';
const kg = (x) => String(x).replace('.', ',');
const dias = (S, id) => R.diasEnPlan(S, id).map((d) => DAYS[d].slice(0, 3)).join(', ');

export function render(root, ctx, arg) {
  const S = get();
  let picker = false, filtro = '';

  const rr = () => { save(); draw(); };

  // ---------- diálogos ----------
  function datosRutina(r) {
    let color = r ? r.color : COLORES[0];
    abrirModal({
      form: true, label: 'Datos de la rutina', titulo: r ? 'Nombre y color' : 'Nueva rutina',
      html: `<label class="fld">Nombre<input class="tx" id="rn" maxlength="40" value="${esc(r ? r.n : '')}" placeholder="Ej.: Piernas"></label>
        <div class="up" style="margin:12px 0 6px">Color</div><div class="swatches" id="rc">${COLORES.map((c) => `<button type="button" class="sw ${c === color ? 'on' : ''}" data-c="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join('')}</div>
        <label class="fld" style="margin-top:12px">Módulo<select class="pick" id="rm">${[...TRABAJO.map((k) => [k, MODULOS.find((m) => m.k === k).n]), ['', 'Ninguno']].map(([k, t]) => `<option value="${k}" ${(r ? modOf(r) : (TRABAJO.find(modActivo) || 'gym')) === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="fld" style="margin-top:12px">Imagen<select class="pick" id="ri">${Object.entries(IMGS).map(([k, t]) => `<option value="${k}" ${r && r.img === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`,
      botones: [{ t: 'Cancelar' }, { t: 'Guardar', cls: 'pri', fn: (close, d) => {
        const n = d.querySelector('#rn').value.trim(); if (!n) { ctx.toast('Poné un nombre'); return false; }
        const img = d.querySelector('#ri').value, mod = d.querySelector('#rm').value;
        if (r) { r.n = n; r.color = color; r.img = img; r.mod = mod; rr(); } else { const nr = R.nuevaRutina(S, n, color, img, mod); save(); location.hash = '#/rutinas/' + nr.id; }
      } }],
      onClose: null,
    });
    document.querySelectorAll('#rc .sw').forEach((b) => b.addEventListener('click', () => { color = b.dataset.c; document.querySelectorAll('#rc .sw').forEach((x) => x.classList.toggle('on', x === b)); }));
  }

  function eliminarRutina(r) {
    const usos = R.diasEnPlan(S, r.id), otras = S.routines.filter((x) => x.id !== r.id);
    if (usos.length && !otras.length) {
      abrirModal({ label: 'No se puede eliminar', titulo: 'No se puede eliminar', html: `<p style="margin:0">«${esc(r.n)}» es la única rutina y está en el plan semanal (${dias(S, r.id)}). Creá otra rutina primero para poder reemplazarla.</p>`, boton: 'Entendido' });
      return;
    }
    abrirModal({
      form: true, label: 'Eliminar rutina', titulo: 'Eliminar rutina',
      html: usos.length
        ? `<p style="margin:0 0 10px">«${esc(r.n)}» está en el plan semanal (${dias(S, r.id)}). Elegí con qué rutina la reemplazás.</p><select class="pick" id="rep">${otras.map((x) => `<option value="${esc(x.id)}">${esc(x.n)}</option>`).join('')}</select>`
        : `<p style="margin:0">¿Eliminar «${esc(r.n)}»? Los días ya registrados no cambian.</p>`,
      botones: [{ t: 'Cancelar' }, { t: usos.length ? 'Reemplazar y eliminar' : 'Eliminar', cls: 'pri', fn: (close, d) => {
        R.eliminarRutina(S, r.id, usos.length ? d.querySelector('#rep').value : '', ymd());
        if (arg === r.id) location.hash = '#/rutinas'; rr(); ctx.toast('Rutina eliminada');
      } }],
    });
  }

  // Editor de ejercicio (base o propio). `alCrear(id)` se llama al crear uno nuevo.
  function editarEj(id, alCrear) {
    const base = id && EX[id], cur = id ? defOf(id) : { type: 'sets', muscle: 'pecho', sets: 3, reps: '8-10', rest: 90, dur: 600, note: '', inc: 2.5, n: '' };
    const solo = base && (PROPIOS.includes(id));
    const tipoFijo = !!id, tipo0 = cur.type;
    const campos = (t) => `
      <div data-t="sets" ${t === 'sets' ? '' : 'hidden'}>
        <div class="row" style="gap:12px;flex-wrap:wrap;margin-top:12px"><label class="fld">Series<input type="number" id="es" min="1" max="10" value="${cur.sets ?? 3}"></label>
          <label class="fld">Repeticiones<input class="tx" id="er" maxlength="7" inputmode="numeric" value="${esc(cur.reps ?? '8-10')}" style="width:96px;text-align:center"></label>
          <label class="fld">Descanso (s)<input type="number" id="ed" min="0" max="600" step="5" value="${cur.rest ?? 90}"></label>
          <label class="fld">Subir (kg)<input type="number" id="ei" min="0" max="20" step="0.5" value="${cur.inc ?? 2.5}"></label></div></div>
      <div data-t="timed" ${t === 'timed' ? '' : 'hidden'}><div class="row" style="gap:12px;margin-top:12px"><label class="fld">Duración (min)<input type="number" id="em" min="0.25" max="180" step="0.25" value="${(cur.dur ?? 600) / 60}"></label></div></div>`;
    const xpTxt = base ? `Puntos: ${EX[id].xp} XP (fijos)` : 'Los puntos se calculan solos según el tipo: series 25, un toque 30, temporizador de 10 a 40.';
    abrirModal({
      form: true, label: 'Ejercicio', titulo: id ? 'Editar ejercicio' : 'Nuevo ejercicio',
      html: `<label class="fld">Nombre<input class="tx" id="en" maxlength="40" value="${esc(cur.n)}" placeholder="Ej.: Press inclinado"></label>
        ${tipoFijo ? `<p class="mut" style="margin:10px 0 0;font-size:.85rem">Tipo: ${TIPOS[tipo0]}${cur.custom || !base ? '' : ' (base)'}</p>`
          : `<label class="fld" style="margin-top:12px">Tipo<select class="pick" id="et">${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}" ${k === tipo0 ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`}
        ${base ? '' : `<label class="fld" style="margin-top:12px">Músculo<select class="pick" id="em2">${Object.entries(MUS).map(([k, m]) => `<option value="${k}" ${k === cur.muscle ? 'selected' : ''}>${m[0]}</option>`).join('')}</select></label>`}
        <div class="mpreview" id="mp">${muscleImg(cur.muscle || 'pecho')}</div>
        ${solo ? '<p class="mut" style="margin:10px 0 0;font-size:.85rem">Este ejercicio tiene una pantalla propia: acá solo podés cambiar el nombre y la nota.</p>' : campos(tipo0)}
        <label class="fld" style="margin-top:12px">Nota (opcional)<textarea id="eo" rows="2" maxlength="200">${esc(cur.note || '')}</textarea></label>
        <p class="mut" style="margin:10px 0 0;font-size:.8rem">${xpTxt}</p>`,
      botones: [{ t: 'Cancelar' },
        ...(base ? (R.hayExo(S, id) ? [{ t: 'Restaurar', fn: () => { R.restaurarEj(S, id); rr(); ctx.toast('Valores originales'); } }] : [])
          : id ? [{ t: 'Eliminar', fn: () => {
            const u = R.rutinasConEj(S, id);
            if (u.length) { ctx.toast('Lo usan: ' + u.map((x) => x.n).join(', ')); return false; }
            if (!confirm('¿Eliminar este ejercicio?')) return false;
            R.eliminarEj(S, id); rr();
          } }] : []),
        { t: 'Guardar', cls: 'pri', fn: (close, d) => {
          const v = (s) => d.querySelector(s);
          const n = v('#en').value.trim(); if (!n) { ctx.toast('Poné un nombre'); return false; }
          const t = v('#et') ? v('#et').value : tipo0, out = { n, note: v('#eo').value.trim() };
          if (!solo) {
            if (t === 'sets') {
              const sets = Math.round(+v('#es').value), reps = v('#er').value.trim(), rest = Math.round(+v('#ed').value), inc = +v('#ei').value;
              if (!(sets >= 1 && sets <= 10)) { ctx.toast('Series: de 1 a 10'); return false; }
              if (!/^\d{1,3}(-\d{1,3})?$/.test(reps)) { ctx.toast('Repeticiones: un número o un rango, como 8-10'); return false; }
              if (!(rest >= 0 && rest <= 600)) { ctx.toast('Descanso: hasta 600 s'); return false; }
              Object.assign(out, { sets, reps, rest, inc: inc > 0 ? inc : 2.5 });
            } else if (t === 'timed') {
              const dur = Math.round(+v('#em').value * 60);
              if (!(dur >= 15 && dur <= 10800)) { ctx.toast('Duración: de 15 s a 180 min'); return false; }
              out.dur = dur;
            }
          }
          if (id) { R.guardarEj(S, id, out); rr(); ctx.toast('Ejercicio guardado'); return; }
          const nid = R.crearEj(S, { ...out, type: t, muscle: v('#em2').value, sets: out.sets ?? 3, reps: out.reps ?? '8-10', rest: out.rest ?? 90, dur: out.dur ?? 600, inc: out.inc ?? 2.5 });
          if (alCrear) alCrear(nid); rr(); ctx.toast('Ejercicio creado');
        } }],
    });
    const m2 = document.getElementById('em2');
    if (m2) m2.addEventListener('change', () => { document.getElementById('mp').innerHTML = muscleImg(m2.value); });
    const et = document.getElementById('et');
    if (et) et.addEventListener('change', () => document.querySelectorAll('.mdl [data-t]').forEach((g) => { g.hidden = g.dataset.t !== et.value; }));
  }

  // ---------- pantallas ----------
  function lista() {
    const rs = S.routines, lib = biblioteca();
    root.innerHTML = `<div class="head"><h1>Rutinas</h1><button class="btn sm pri" id="nueva">Nueva rutina</button></div>
    <p class="msg" style="margin-top:0">${NOTA_HOY}</p>
    ${rs.length ? rs.map((r) => `<section class="panel sc" style="--sc:${esc(r.color)}${modActivo(modOf(r)) ? '' : ';opacity:.55'}"><div class="sess" style="grid-template-columns:56px 1fr;gap:12px"><img src="${IMG[r.img] || IMG.gym}" alt="" style="width:56px;height:56px">
      <div><div style="font-weight:700">${esc(r.n)}</div><div class="mut num" style="font-size:.8rem">${r.ex.length} ejercicios · bonus +${r.bonus} XP${modActivo(modOf(r)) ? '' : ' · módulo apagado'}</div>
        ${R.diasEnPlan(S, r.id).length ? `<div class="mut" style="font-size:.78rem">Plan: ${dias(S, r.id)}</div>` : ''}</div></div>
      <div class="btns" style="margin-top:12px;justify-content:flex-start"><a class="btn sm pri" href="#/rutinas/${esc(r.id)}">Editar</a><button class="btn sm" data-ds="${esc(r.id)}">Nombre y color</button>
        <button class="btn sm" data-dup="${esc(r.id)}">Duplicar</button><button class="btn sm ghost" data-del="${esc(r.id)}">Eliminar</button></div></section>`).join('')
      : '<section class="panel"><div class="up">Todavía no tenés rutinas</div><p style="margin:8px 0 0">Creá la primera y después asignala a los días en el Plan.</p></section>'}
    <div class="head" style="margin-top:20px"><h1 style="font-size:1.05rem">Ejercicios</h1><button class="btn sm" id="nuevoEj">Nuevo ejercicio</button></div>
    <section class="panel">${lib.map((e) => `<div class="row li"><div class="thumb">${muscleImg(e.muscle)}</div><div style="flex:1;min-width:0"><div class="t">${esc(e.n)}</div>
      <div class="mut num" style="font-size:.76rem">${target(e)} · ${e.custom ? 'Propio' : 'Base'} · ${e.xp} XP</div></div><button class="btn sm" data-ee="${esc(e.id)}">Editar</button></div>`).join('')}</section>
    <p class="mut" style="text-align:center"><a href="#/plan" style="text-decoration:underline">Plan semanal</a> · <a href="#/mas" style="text-decoration:underline">← Más</a></p>`;
    const q = (s) => root.querySelector(s);
    q('#nueva').onclick = () => datosRutina(null);
    q('#nuevoEj').onclick = () => editarEj(null);
    root.querySelectorAll('[data-ds]').forEach((b) => b.onclick = () => datosRutina(routineOf(b.dataset.ds)));
    root.querySelectorAll('[data-dup]').forEach((b) => b.onclick = () => { R.duplicarRutina(S, b.dataset.dup); rr(); ctx.toast('Rutina duplicada'); });
    root.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => eliminarRutina(routineOf(b.dataset.del)));
    root.querySelectorAll('[data-ee]').forEach((b) => b.onclick = () => editarEj(b.dataset.ee));
  }

  function editor(r) {
    const exs = r.ex.map((id) => defOf(id)).filter(Boolean);
    const libre = biblioteca().filter((e) => !r.ex.includes(e.id) && e.n.toLowerCase().includes(filtro.toLowerCase()));
    root.innerHTML = `<div class="head"><div><a class="up" href="#/rutinas">← Rutinas</a><h1 style="margin-top:6px;font-size:1.15rem">${esc(r.n)}</h1></div><button class="btn sm" id="ds">Nombre y color</button></div>
    <p class="msg" style="margin-top:0">${NOTA_HOY}</p>
    <section class="panel sc" style="--sc:${esc(r.color)}"><div class="up" style="margin-bottom:6px">Ejercicios · bonus por completar +${r.bonus} XP</div>
      ${exs.length ? exs.map((e, i) => `<div class="row li"><div class="thumb">${muscleImg(e.muscle)}</div>
        <div style="flex:1;min-width:0"><div class="t">${esc(e.n)}${e.opt ? '<span class="opt">opcional</span>' : ''}</div><div class="mut num" style="font-size:.76rem">${target(e)} · ${e.xp} XP</div></div>
        <div class="mvs"><button class="mv" data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Subir">↑</button><button class="mv" data-dn="${i}" ${i === exs.length - 1 ? 'disabled' : ''} aria-label="Bajar">↓</button>
          <button class="mv" data-ed="${esc(e.id)}" aria-label="Editar">✎</button><button class="mv" data-rm="${i}" aria-label="Quitar">✕</button></div></div>`).join('')
        : '<p class="mut" style="margin:6px 0 0">Esta rutina todavía no tiene ejercicios.</p>'}
      <div class="btns" style="margin-top:12px;justify-content:flex-start"><button class="btn pri" id="add">${picker ? 'Cerrar biblioteca' : 'Agregar ejercicio'}</button></div></section>
    ${picker ? `<section class="panel"><div class="up" style="margin-bottom:8px">Biblioteca</div>
      <input class="tx" id="flt" placeholder="Buscar…" value="${esc(filtro)}" style="width:100%;margin-bottom:8px">
      ${libre.length ? libre.map((e) => `<div class="row li"><div class="thumb">${muscleImg(e.muscle)}</div><div style="flex:1;min-width:0"><div class="t">${esc(e.n)}</div>
        <div class="mut num" style="font-size:.76rem">${target(e)} · ${e.xp} XP</div></div><button class="btn sm pri" data-add="${esc(e.id)}">Agregar</button></div>`).join('') : '<p class="mut" style="margin:0 0 8px">No hay más ejercicios para agregar.</p>'}
      <div class="btns" style="margin-top:10px;justify-content:flex-start"><button class="btn sm" id="nuevoEj">Crear ejercicio nuevo</button></div></section>` : ''}`;
    const q = (s) => root.querySelector(s);
    q('#ds').onclick = () => datosRutina(r);
    q('#add').onclick = () => { picker = !picker; draw(); };
    root.querySelectorAll('[data-up]').forEach((b) => b.onclick = () => { R.moverEj(S, r.id, +b.dataset.up, -1); rr(); });
    root.querySelectorAll('[data-dn]').forEach((b) => b.onclick = () => { R.moverEj(S, r.id, +b.dataset.dn, 1); rr(); });
    root.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { R.quitarEj(S, r.id, +b.dataset.rm); rr(); });
    root.querySelectorAll('[data-ed]').forEach((b) => b.onclick = () => editarEj(b.dataset.ed));
    root.querySelectorAll('[data-add]').forEach((b) => b.onclick = () => { R.agregarEj(S, r.id, b.dataset.add); rr(); });
    const f = q('#flt');
    if (f) f.addEventListener('input', () => {
      filtro = f.value; const pos = f.selectionStart; draw(); const n = root.querySelector('#flt'); n.focus(); n.setSelectionRange(pos, pos);
    });
    const ne = q('#nuevoEj'); if (ne) ne.onclick = () => editarEj(null, (nid) => R.agregarEj(S, r.id, nid));
  }

  function draw() {
    const r = arg ? routineOf(arg) : null;
    if (arg && !r) { location.hash = '#/rutinas'; return; }
    if (r) editor(r); else lista();
  }
  draw();
}
