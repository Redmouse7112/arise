// Pantalla Lectura: libro actual, páginas del día y cronómetro de lectura.
import { IMG } from '../data.js';
import { get, ymd } from '../store.js';
import { readDay, addBook, setCurrent, addPages, setReadGoal, currentBook, estimate } from '../habitos.js';
import * as T from '../timer.js';
import { esc } from '../ui.js';

const MIN = 20;
const isReading = () => { const v = T.view(); return !!(v && v.meta && v.meta.kind === 'read'); };

export function render(root, ctx) {
  const R = get().read, date = ymd();
  let adding = false;

  const draw = () => {
    const day = readDay(date), b = currentBook(), est = estimate(), reading = isReading();
    const others = R.books.filter((x) => !x.done && (!b || x.id !== b.id)), done = R.books.filter((x) => x.done);
    root.innerHTML = `<div style="--acc:#22d3ee;--sc:#22d3ee">
    <div class="head"><h1>Lectura</h1><span class="up">${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}</span></div>
    <section class="panel sc">
      <div class="sess"><img src="${IMG.lectura}" alt="">
        <div><div class="up">Páginas de hoy</div>
          <div class="num" style="font-size:2rem;font-weight:800;line-height:1.1">${day.pages}<span class="mut" style="font-size:1rem"> / ${day.goal}</span></div>
          <div class="bar" style="margin-top:8px"><b style="width:${Math.min(100, day.pct)}%"></b></div>
          <div class="mut num" style="font-size:.78rem;margin-top:5px">${day.min ? day.min + ' min leyendo hoy' : ''}</div></div></div>
      <p class="msg">${day.pct >= 100 ? '¡Meta de hoy cumplida! +20 XP.' : b ? 'Unas páginas por día y el libro se termina solo.' : 'Agregá un libro para empezar.'}</p>
      <label class="fld">Meta diaria (páginas) <input type="number" id="goal" min="1" max="300" value="${R.goal}"></label>
    </section>

    <section class="panel sc">
      <div class="up" style="margin-bottom:8px">Libro actual</div>
      ${b ? `<div style="font-weight:700">${esc(b.t)}</div><div class="mut" style="font-size:.85rem">${esc(b.a) || 'Sin autor'}</div>
        <div class="bar" style="margin:10px 0 6px"><b style="width:${Math.round((b.cur / b.pages) * 100)}%"></b></div>
        <div class="row mut num" style="font-size:.8rem"><span>Página ${b.cur} de ${b.pages}</span><span class="sp"></span><span>${Math.round((b.cur / b.pages) * 100)} %</span></div>
        <p class="mut" style="font-size:.85rem;margin:8px 0 0">${est && est.days ? `Al ritmo de ${est.avg.toFixed(1)} págs/día, lo terminás en unos ${est.days} días.` : 'Leé unos días y te estimo cuándo lo terminás.'}</p>
        <div class="btns" style="margin-top:12px"><button class="btn" data-p="5">+5</button><button class="btn" data-p="10">+10</button>
          <input class="nm" id="pg" type="number" placeholder="págs" min="-999" max="999"><button class="btn pri" id="pa">Sumar</button></div>
        <div class="btns" style="margin-top:12px">${reading
          ? '<span class="mut">Leyendo… mirá la barra de abajo.</span>'
          : `<button class="btn" id="tm">Leer ${MIN} min</button>`}</div>`
        : '<p class="mut" style="margin:0">No tenés un libro marcado como actual.</p>'}
    </section>

    ${others.length ? `<section class="panel sc"><div class="up" style="margin-bottom:6px">En espera</div>${others.map((x) => `<div class="row li"><div style="flex:1;min-width:0">
      <div class="t">${esc(x.t)}</div><div class="mut num" style="font-size:.76rem">${x.cur}/${x.pages} págs${x.a ? ' · ' + esc(x.a) : ''}</div></div>
      <button class="btn sm" data-cur="${x.id}">Leer ahora</button></div>`).join('')}</section>` : ''}

    <section class="panel sc">
      <div class="row"><div class="up">Agregar libro</div><span class="sp"></span><button class="btn sm ghost" id="tg">${adding ? 'Cancelar' : 'Nuevo'}</button></div>
      ${adding ? `<div style="margin-top:10px"><div class="row qe"><input class="tx" id="bt" placeholder="Título" maxlength="80"></div>
        <div class="row qe"><input class="tx" id="ba" placeholder="Autor (opcional)" maxlength="60"><input class="nm" id="bp" type="number" placeholder="págs" min="1" max="5000"><button class="btn sm" id="bs">Guardar</button></div></div>` : ''}
    </section>

    ${done.length ? `<section class="panel sc"><div class="up" style="margin-bottom:6px">Terminados · +100 XP c/u</div>${done.map((x) => `<div class="row li">
      <div style="flex:1;min-width:0"><div class="t">${esc(x.t)}</div><div class="mut num" style="font-size:.76rem">${x.pages} págs · ${esc(x.done)}${x.a ? ' · ' + esc(x.a) : ''}</div></div><span style="color:var(--ok)">✓</span></div>`).join('')}</section>` : ''}
    </div>`;
    bind();
  };

  const q = (s) => root.querySelector(s);
  const pages = (n) => {
    const r = addPages(date, n);
    if (!r) return ctx.toast(n < 0 ? 'No hay nada para restar' : 'Nada para sumar');
    ctx.commit();
    if (r.finished) ctx.toast(`¡Terminaste "${r.finished.t}"! +100 XP`);
    ctx.refresh(true);
  };
  function bind() {
    q('#goal').onchange = (e) => { const v = Math.round(+e.target.value); if (v >= 1) { setReadGoal(v); ctx.commit(); ctx.refresh(true); } };
    root.querySelectorAll('[data-p]').forEach((x) => x.onclick = () => pages(+x.dataset.p));
    root.querySelectorAll('[data-cur]').forEach((x) => x.onclick = () => { setCurrent(x.dataset.cur); ctx.refresh(true); });
    const pa = q('#pa'); if (pa) pa.onclick = () => { const n = Math.round(+q('#pg').value); if (n) pages(n); else ctx.toast('Escribí cuántas páginas'); };
    const tm = q('#tm'); if (tm) tm.onclick = () => { T.startDown(MIN * 60000, { kind: 'read', date, min: MIN, label: 'Leyendo' }); draw(); };
    q('#tg').onclick = () => { adding = !adding; draw(); };
    const bs = q('#bs'); if (bs) bs.onclick = () => {
      const t = q('#bt').value.trim(), n = Math.round(+q('#bp').value);
      if (!t || !(n > 0)) return ctx.toast('Poné título y total de páginas');
      addBook(t, q('#ba').value.trim(), n); adding = false; ctx.toast('Libro agregado'); draw();
    };
  }
  draw();

  // Si el temporizador de lectura empieza o termina mientras estoy acá, actualizo el botón.
  let was = isReading();
  return T.sub(() => {
    const now = isReading();
    if (now !== was && root.isConnected && !root.contains(document.activeElement && document.activeElement.matches('input') ? document.activeElement : null)) draw();
    was = now;
  });
}
