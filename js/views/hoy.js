// Misión del día: sesión de hoy con lista de ejercicios.
import { IMG } from '../data.js';
import { get, ymd, sessionFor, sesionDia, setSession, modActivo, modOf } from '../store.js';
import { dayStats } from '../xp.js';
import { lastWork } from '../entreno.js';
import { esc } from '../ui.js';
import { muscleImg, target, exDone, CHECK, habitCards } from '../ui.js';

export function render(root, ctx) {
  const S = get(), date = ymd(), sid = sessionFor(date), sess = sesionDia(date), st = dayStats(date);
  const visibles = S.routines.filter((r) => modActivo(modOf(r)) || r.id === sid);   // las de un módulo apagado no se ofrecen
  const opts = visibles.map((r) => `<option value="${esc(r.id)}" ${r.id === sid ? 'selected' : ''}>${esc(r.n)}</option>`).join('');
  if (!sess) {   // sin rutina para hoy (plan vacío o rutina eliminada)
    root.innerHTML = `<div class="head"><h1>Misión del día</h1></div>
    <section class="panel"><div class="up">Hoy no tenés rutina</div>
      <p style="margin:8px 0 12px">${visibles.length ? 'Elegí una para hoy, o asignale una rutina a cada día en el Plan.' : 'Todavía no creaste ninguna rutina.'}</p>
      ${visibles.length ? `<select class="pick" id="pick"><option value="">Elegir rutina…</option>${opts}</select>` : ''}
      <div class="btns" style="margin-top:12px"><a class="btn pri" href="#/rutinas">${visibles.length ? 'Mis rutinas' : 'Crear mi primera rutina'}</a><a class="btn" href="#/plan">Plan semanal</a></div></section>
    <div style="margin-top:14px">${habitCards()}</div>`;
    const pk = root.querySelector('#pick'); if (pk) pk.addEventListener('change', (e) => { if (e.target.value) { setSession(date, e.target.value); ctx.refresh(); } });
    return;
  }
  const exs = sess.ex;
  const req = exs.filter((e) => !e.opt).length, doneReq = exs.filter((e) => !e.opt && exDone(e.id, date)).length;

  root.innerHTML = `
  <div class="head"><h1>Misión del día</h1><span class="up">+${st.xp} XP</span></div>
  <section class="panel sc" style="--sc:${sess.color}">
    <div class="sess"><img src="${IMG[sess.img]}" alt="">
      <div><div class="up">Hoy · ${new Date().toLocaleDateString('es-AR', { weekday: 'long' })}</div>
        <h2 style="margin:4px 0 8px;font-size:1.15rem">${esc(sess.n)}</h2>
        <div class="bar"><b style="width:${req ? Math.round((doneReq / req) * 100) : 0}%;background:${sess.color};box-shadow:0 0 12px ${sess.color}"></b></div>
        <div class="mut num" style="font-size:.8rem;margin-top:5px">${doneReq}/${req} ejercicios${st.complete ? ` · ¡Sesión completa! +${sess.bonus} XP bonus` : ''}</div></div>
    </div>
  </section>

  ${exs.some((e) => e.id === 'spar') && lastWork() ? `<section class="panel sc" style="--sc:#ef4444"><div class="up">Para trabajar hoy</div><p style="margin:6px 0 0">${esc(lastWork())}</p></section>` : ''}

  <div>${exs.map((e) => {
    const d = exDone(e.id, date);
    return `<a class="ex ${d ? 'done' : ''}" href="#/ej/${e.id}">${muscleImg(e.muscle)}
      <div><div class="t">${esc(e.n)}${e.opt ? '<span class="opt">opcional</span>' : ''}</div><div class="mut num" style="font-size:.82rem">${target(e)} · +${e.xp} XP</div></div>
      <div class="chk">${d ? CHECK : ''}</div></a>`;
  }).join('')}</div>

  <div style="margin-top:14px">${habitCards()}</div>

  <section class="panel">
    <div class="up" style="margin-bottom:8px">¿Cambió el plan de hoy?</div>
    <select class="pick" id="pick">${opts}</select>
  </section>`;

  root.querySelector('#pick').addEventListener('change', (e) => { setSession(date, e.target.value); ctx.refresh(); });
}
