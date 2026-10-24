// Diario de sparring (#/sparring): lista, alta, edición y borrado. El formulario también lo usa la pantalla del ejercicio.
import { ymd } from '../store.js';
import { sparList, addSpar, updateSpar, delSpar } from '../entreno.js';
import { feelHTML, feelBind, esc } from '../ui.js';

export function formHTML(e) {
  return `<div class="row" style="gap:18px;flex-wrap:wrap;margin-bottom:12px"><label class="fld">Rondas <input type="number" id="sr" min="1" max="30" value="${e.rounds}"></label>
    <label class="fld">Fecha <input type="date" id="sd" value="${e.date}" style="width:auto"></label></div>
    <div class="up" style="margin-bottom:6px">Sensación (1 = mal, 5 = excelente)</div>${feelHTML('sf', e.feel)}
    <label class="fld" style="margin-top:12px">Qué salió bien<textarea id="sg" rows="2" maxlength="400">${esc(e.good)}</textarea></label>
    <label class="fld" style="margin-top:10px">Qué falló<textarea id="sb" rows="2" maxlength="400">${esc(e.bad)}</textarea></label>
    <label class="fld" style="margin-top:10px">A trabajar en el próximo<textarea id="sw" rows="2" maxlength="400">${esc(e.work)}</textarea></label>`;
}
// Lee el formulario; devuelve los datos o null si falta algo.
export function formRead(root, feel) {
  const rounds = Math.round(+root.querySelector('#sr').value);
  if (!(rounds > 0)) return null;
  return { rounds, date: root.querySelector('#sd').value || ymd(), feel, good: root.querySelector('#sg').value.trim(), bad: root.querySelector('#sb').value.trim(), work: root.querySelector('#sw').value.trim() };
}

export function render(root, ctx) {
  let editId = null;   // null = lista, 'new' = nueva, id = editando
  const fmtDate = (d) => new Date(d + 'T12:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });

  const draw = () => {
    const list = sparList();
    const cur = editId === 'new' ? { date: ymd(), rounds: 3, feel: 3, good: '', bad: '', work: '' } : list.find((x) => x.id === editId);
    let feel = cur ? cur.feel : 3;
    root.innerHTML = `<div style="--acc:var(--mod-spar);--sc:var(--mod-spar)"><div class="head"><h1>Diario de sparring</h1>${editId ? '' : '<button class="btn sm pri" id="new">Nueva entrada</button>'}</div>
    ${cur ? `<section class="panel sc"><div class="up" style="margin-bottom:10px">${editId === 'new' ? 'Nueva entrada' : 'Editar entrada'}</div>${formHTML(cur)}
      <div class="btns" style="margin-top:14px"><button class="btn pri" id="ok">Guardar</button><button class="btn ghost" id="no">Cancelar</button></div></section>`
    : list.length ? list.map((e) => `<section class="panel sc"><div class="row"><div style="flex:1"><div style="font-weight:700;text-transform:capitalize">${fmtDate(e.date)}</div>
        <div class="mut num" style="font-size:.8rem">${e.rounds} rondas · sensación ${e.feel}/5</div></div>
        <button class="btn sm" data-ed="${e.id}">Editar</button><button class="btn sm ghost" data-del="${e.id}" aria-label="Borrar">✕</button></div>
        ${[['Salió bien', e.good], ['Falló', e.bad], ['A trabajar', e.work]].filter((x) => x[1]).map(([k, v]) => `<div class="note"><b>${k}:</b> ${esc(v)}</div>`).join('')}</section>`).join('')
    : '<section class="panel sc"><p class="mut" style="margin:0">Todavía no hay entradas. Después de cada sparring anotá qué salió bien, qué falló y qué trabajar.</p></section>'}</div>`;
    const q = (s) => root.querySelector(s);
    if (q('#new')) q('#new').onclick = () => { editId = 'new'; draw(); };
    root.querySelectorAll('[data-ed]').forEach((b) => b.onclick = () => { editId = b.dataset.ed; draw(); });
    root.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => { if (confirm('¿Borrar esta entrada del diario?')) { delSpar(b.dataset.del); draw(); } });
    if (cur) {
      feelBind(root, 'sf', (n) => { feel = n; });
      q('#no').onclick = () => { editId = null; draw(); };
      q('#ok').onclick = () => {
        const d = formRead(root, feel); if (!d) return ctx.toast('Poné las rondas');
        if (editId === 'new') addSpar(d); else updateSpar(editId, d);
        editId = null; ctx.toast('Guardado'); draw();
      };
    }
  };
  draw();
}
