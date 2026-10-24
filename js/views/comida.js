// Pantalla Comida: proteína del día contra la meta. Sin culpa: solo ayuda a sumar.
import { IMG } from '../data.js';
import { get, ymd } from '../store.js';
import { foodDay, foodGoal, addFood, delFood, setFoodGoal, setQuick, lastDays, FOOD_HIT } from '../habitos.js';
import { esc } from '../ui.js';

const DL = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function message(day, quick) {
  const left = Math.max(0, day.goal - day.g);
  if (day.pct >= 100) return '¡Meta cumplida! Comiste bien hoy. 💪';
  if (day.pct >= FOOD_HIT * 100) return `¡Casi! Con ${left} g más cerrás la meta. Ya ganaste el XP de hoy.`;
  if (new Date().getHours() >= 16 && day.pct < 50) {
    const top = [...quick].sort((a, b) => b.g - a.g).slice(0, 3).map((q) => `${esc(q.n)} (${q.g} g)`).join(', ');
    return `Todavía hay tiempo: te faltan ${left} g. Algo rápido para sumar: ${top}.`;
  }
  return day.g ? `Vas ${day.g} g. Te faltan ${left} g, a tu ritmo.` : 'Sumá lo que comas y mirá cómo avanza el día.';
}

// Barras de los últimos 7 días; la línea marca la meta de hoy.
function chart() {
  const days = lastDays(7), data = days.map((d) => ({ d, g: foodDay(d).g, goal: foodGoal(d) }));
  const max = Math.max(...data.map((x) => Math.max(x.g, x.goal)), 1);
  return `<div class="bars">${data.map((x) => `<div class="${x.g >= FOOD_HIT * x.goal ? 'hit' : ''}${x.d === ymd() ? ' today' : ''}">
    <span class="num">${x.g || ''}</span><div class="col"><i style="height:${Math.round((x.g / max) * 100)}%"></i><u style="bottom:${Math.round((x.goal / max) * 100)}%"></u></div><em>${DL[new Date(x.d + 'T12:00').getDay()]}</em></div>`).join('')}</div>`;
}

export function render(root, ctx) {
  const F = get().food, date = ymd();
  let qty = 1, edit = false;

  const draw = () => {
    const day = foodDay(date), pct = Math.min(100, day.pct);
    root.innerHTML = `<div style="--acc:var(--mod-comida);--sc:var(--mod-comida)">
    <div class="head"><h1>Comida</h1><span class="up">${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}</span></div>
    <section class="panel sc">
      <div class="sess"><img src="${IMG.comida}" alt="">
        <div><div class="up">Proteína de hoy</div>
          <div class="num" style="font-size:2rem;font-weight:800;line-height:1.1">${day.g}<span class="mut" style="font-size:1rem"> / ${day.goal} g</span></div>
          <div class="bar" style="margin-top:8px"><b style="width:${pct}%"></b></div></div></div>
      <p class="msg">${message(day, F.quick)}</p>
      <div class="row" style="gap:18px;flex-wrap:wrap;margin-top:6px">
        <label class="fld">Meta (g) <input type="number" id="goal" min="20" max="500" value="${F.goal}"></label>
        <label class="fld">Calorías de referencia <input type="number" id="kcal" min="800" max="6000" step="50" value="${F.kcal}"></label>
      </div>
    </section>

    <section class="panel sc">
      <div class="row"><div class="up">Alimentos rápidos</div><span class="sp"></span>
        <div class="stepper" style="margin:0;gap:8px"><button class="btn sm" id="qm">−</button><b class="num" style="min-width:34px">×${qty}</b><button class="btn sm" id="qp">+</button></div></div>
      <div class="chips">${F.quick.map((q, i) => `<button class="chip-b" data-q="${i}"><b>${esc(q.n)}</b><span class="num">+${q.g * qty} g</span></button>`).join('')}</div>
      <div class="row" style="margin-top:10px"><button class="btn sm ghost" id="ed">${edit ? 'Listo' : 'Editar rápidos'}</button></div>
      ${edit ? `<div style="margin-top:10px">${F.quick.map((q, i) => `<div class="row qe">
          <input class="tx" data-n="${i}" value="${esc(q.n)}" maxlength="40"><input class="nm" type="number" data-g="${i}" value="${q.g}" min="0" max="200"><span class="mut">g</span>
          <button class="btn sm ghost" data-del="${i}" aria-label="Quitar">✕</button></div>`).join('')}
        <div class="row qe"><input class="tx" id="qn" placeholder="Nuevo alimento" maxlength="40"><input class="nm" type="number" id="qg" placeholder="g" min="0" max="200"><span class="mut">g</span>
          <button class="btn sm" id="qa">Agregar</button></div></div>` : ''}
    </section>

    <section class="panel sc">
      <div class="up" style="margin-bottom:8px">Agregar a mano</div>
      <div class="row qe"><input class="tx" id="mn" placeholder="¿Qué comiste?" maxlength="40"><input class="nm" type="number" id="mg" placeholder="g prot." min="1" max="300"><button class="btn sm" id="ma">Sumar</button></div>
    </section>

    <section class="panel sc">
      <div class="up" style="margin-bottom:6px">Hoy</div>
      ${day.items.length ? day.items.map((x, i) => `<div class="row li"><div style="flex:1;min-width:0"><div class="t">${esc(x.n)}</div>
        <div class="mut num" style="font-size:.76rem">${new Date(x.t).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div></div>
        <b class="num">+${x.g} g</b><button class="btn sm ghost" data-rm="${i}" aria-label="Borrar">✕</button></div>`).join('')
        : '<p class="mut" style="margin:6px 0 0">Todavía no cargaste nada hoy.</p>'}
    </section>

    <section class="panel sc"><div class="up" style="margin-bottom:10px">Últimos 7 días</div>${chart()}
      <p class="mut" style="font-size:.78rem;margin:8px 0 0">La línea es la meta. Con ${Math.round(FOOD_HIT * 100)} % o más ganás +30 XP por día.</p></section>
    </div>`;
    bind();
  };

  const after = () => { ctx.commit(); ctx.refresh(true); };
  const q = (s) => root.querySelector(s);
  function bind() {
    q('#qm').onclick = () => { qty = Math.max(1, qty - 1); draw(); };
    q('#qp').onclick = () => { qty = Math.min(9, qty + 1); draw(); };
    root.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => {
      const it = F.quick[+b.dataset.q]; addFood(date, qty > 1 ? `${qty} × ${it.n}` : it.n, it.g * qty); after();
    });
    root.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { delFood(date, +b.dataset.rm); after(); });
    q('#ma').onclick = () => {
      const n = q('#mn').value.trim(), g = Math.round(+q('#mg').value);
      if (!n || !(g > 0)) return ctx.toast('Poné nombre y gramos');
      addFood(date, n, g); after();
    };
    q('#goal').onchange = (e) => { const v = Math.round(+e.target.value); if (v >= 20) { setFoodGoal(v); after(); } };
    q('#kcal').onchange = (e) => { const v = Math.round(+e.target.value); if (v >= 800) { F.kcal = v; setQuick(F.quick); ctx.toast('Guardado'); } };
    q('#ed').onclick = () => { edit = !edit; draw(); };
    if (!edit) return;
    root.querySelectorAll('[data-n]').forEach((i) => i.onchange = () => { const v = i.value.trim(); if (v) { F.quick[+i.dataset.n].n = v; setQuick(F.quick); } });
    root.querySelectorAll('[data-g]').forEach((i) => i.onchange = () => { F.quick[+i.dataset.g].g = Math.max(0, Math.round(+i.value)); setQuick(F.quick); draw(); });
    root.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => { F.quick.splice(+b.dataset.del, 1); setQuick(F.quick); draw(); });
    q('#qa').onclick = () => {
      const n = q('#qn').value.trim(), v = q('#qg').value, g = Math.round(+v);
      if (!n || v === '' || !(g >= 0)) return ctx.toast('Poné nombre y gramos');
      F.quick.push({ id: 'q' + Date.now().toString(36), n, g }); setQuick(F.quick); draw();
    };
  }
  draw();
}
