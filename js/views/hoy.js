// Misión del día: sesión de hoy con lista de ejercicios.
import { SESS, IMG } from '../data.js';
import { get, ymd, sessionFor, setSession } from '../store.js';
import { dayStats } from '../xp.js';
import { muscleImg, target, exDone, sessEx, CHECK, habitCards } from '../ui.js';

export function render(root, ctx) {
  const S = get(), date = ymd(), sid = sessionFor(date), sess = SESS[sid], st = dayStats(date);
  const exs = sessEx(sid);
  const req = exs.filter((e) => !e.opt).length, doneReq = exs.filter((e) => !e.opt && exDone(e.id, date)).length;

  root.innerHTML = `
  <div class="head"><h1>Misión del día</h1><span class="up">+${st.xp} XP</span></div>
  <section class="panel sc" style="--sc:${sess.color}">
    <div class="sess"><img src="${IMG[sess.img]}" alt="">
      <div><div class="up">Hoy · ${new Date().toLocaleDateString('es-AR', { weekday: 'long' })}</div>
        <h2 style="margin:4px 0 8px;font-size:1.15rem">${sess.n}</h2>
        <div class="bar"><b style="width:${req ? Math.round((doneReq / req) * 100) : 0}%;background:${sess.color};box-shadow:0 0 12px ${sess.color}"></b></div>
        <div class="mut num" style="font-size:.8rem;margin-top:5px">${doneReq}/${req} ejercicios${st.complete ? ` · ¡Sesión completa! +${sess.bonus} XP bonus` : ''}</div></div>
    </div>
  </section>

  <div>${exs.map((e) => {
    const d = exDone(e.id, date);
    return `<a class="ex ${d ? 'done' : ''}" href="#/ej/${e.id}">${muscleImg(e.muscle)}
      <div><div class="t">${e.n}${e.opt ? '<span class="opt">opcional</span>' : ''}</div><div class="mut num" style="font-size:.82rem">${target(e)} · +${e.xp} XP</div></div>
      <div class="chk">${d ? CHECK : ''}</div></a>`;
  }).join('')}</div>

  <div style="margin-top:14px">${habitCards()}</div>

  <section class="panel">
    <div class="up" style="margin-bottom:8px">¿Cambió el plan de hoy?</div>
    <select class="pick" id="pick">${Object.entries(SESS).map(([k, v]) => `<option value="${k}" ${k === sid ? 'selected' : ''}>${v.n}</option>`).join('')}</select>
  </section>`;

  root.querySelector('#pick').addEventListener('change', (e) => { setSession(date, e.target.value); ctx.refresh(); });
}
