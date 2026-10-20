// Ejercicio "Clase": tipo de clase, esfuerzo y notas. El nombre y el logo del dojo los configura el usuario en Ajustes.
import { get, ymd, entry, save, exFor } from '../store.js';
import { DOJO_TYPES, dojoDay, saveDojo, delDojo, attendance } from '../entreno.js';
import { exHead, exNav, feelHTML, feelBind, esc } from '../ui.js';
import { markDone } from './ejercicio.js';

const ID = 'clase';

export function render(root, ctx) {
  const S = get(), date = ymd(), ex = exFor(date, ID);
  const done = !!(S.log[date] && S.log[date].ex[ID] && S.log[date].ex[ID].done);
  const saved = dojoDay(date);
  let type = (saved && saved.type) || DOJO_TYPES[0], effort = (saved && saved.effort) || 3, editing = !done;
  const a = attendance();

  const draw = () => {
    root.innerHTML = `${exHead(ex, done ? '<span class="chip">Hecho ✓</span>' : '')}
    <section class="panel sc"><div class="grid2" style="gap:10px">
      <div class="stat"><div class="up">Esta semana</div><b class="num">${a.week}</b></div>
      <div class="stat"><div class="up">Este mes</div><b class="num">${a.month}</b></div></div>
      <p class="mut" style="font-size:.78rem;text-align:center;margin:8px 0 0">Asistencias a clase</p>
      ${S.dojo.logo ? `<div style="text-align:center;margin-top:10px"><img src="${esc(S.dojo.logo)}" alt="Logo del dojo" style="max-width:96px;max-height:96px;border-radius:10px"></div>` : ''}</section>
    ${editing ? `<section class="panel sc">
      <div class="up" style="margin-bottom:8px">Tipo de clase</div>
      <div class="chips" style="margin-top:0">${DOJO_TYPES.map((t) => `<button class="chip-b ${t === type ? 'sel' : ''}" data-t="${esc(t)}"><b>${esc(t)}</b></button>`).join('')}</div>
      <div class="up" style="margin:14px 0 6px">Esfuerzo percibido (1 = suave, 5 = al límite)</div>${feelHTML('eff', effort)}
      <label class="fld" style="margin-top:14px">Notas (opcional)<textarea id="notes" rows="3" maxlength="400" placeholder="Qué trabajaron, cómo te sentiste…">${esc(saved ? saved.notes : '')}</textarea></label>
      <div class="btns" style="margin-top:14px"><button class="btn pri" id="save">${done ? 'Guardar cambios' : 'Guardar y marcar hecho (+60 XP)'}</button>${done ? '<button class="btn ghost" id="cancel">Cancelar</button>' : ''}</div>
    </section>`
    : `<section class="panel sc"><div class="up">Clase de hoy</div>
      <div style="font-weight:700;margin:6px 0">${esc(saved ? saved.type : 'Clase registrada')}</div>
      ${saved ? `<div class="mut num" style="font-size:.85rem">Esfuerzo ${saved.effort}/5</div>${saved.notes ? `<p style="margin:8px 0 0">${esc(saved.notes)}</p>` : ''}` : '<p class="mut" style="margin:0">La marcaste como hecha sin detalles.</p>'}
      <div class="btns" style="margin-top:14px"><button class="btn" id="edit">Editar</button><button class="btn ghost" id="undo">Deshacer</button></div></section>`}
    ${exNav(ID, date)}`;
    bind();
  };
  const q = (s) => root.querySelector(s);
  function bind() {
    root.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => {
      type = b.dataset.t; root.querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('sel', x === b));
    });
    if (q('#eff')) feelBind(root, 'eff', (n) => { effort = n; });
    if (q('#save')) q('#save').onclick = () => {
      saveDojo(date, { type, effort, notes: q('#notes').value.trim() });
      markDone(date, ID);
      ctx.commit(); ctx.toast('Clase guardada'); ctx.refresh(true);
    };
    if (q('#cancel')) q('#cancel').onclick = () => { editing = false; draw(); };
    if (q('#edit')) q('#edit').onclick = () => { editing = true; draw(); };
    if (q('#undo')) q('#undo').onclick = () => {
      delDojo(date); const r = entry(date).ex[ID]; if (r) r.done = false; save();
      ctx.commit(); ctx.refresh(true);
    };
  }
  draw();
}
