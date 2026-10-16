// Pantalla Estado: rango (cinturón), nivel, XP, racha, semana y ajustes.
import { BELTS, IMG, SESS, APP_VERSION } from '../data.js';
import { get, save, ymd, dow, sessionFor, exportJSON, importJSON, reset } from '../store.js';
import { habitCards } from '../ui.js';
import { tarjetaHTML, tarjetaBind, esIOS } from '../instalar.js';
import { totalXP, levelInfo, streak, dayStats } from '../xp.js';

const DL = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function weekStrip() {
  const now = new Date(), start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // lunes
  let out = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const k = ymd(d), st = dayStats(k);
    const cls = [st.complete ? 'done' : st.done ? 'part' : '', k === ymd() ? 'today' : ''].join(' ');
    out += `<div class="${cls}">${DL[d.getDay()]}<i></i></div>`;
  }
  return out;
}

export function render(root, ctx) {
  const S = get(), xp = totalXP(), L = levelInfo(xp);
  const belt = BELTS.find((b) => b.id === S.profile.belt) || BELTS[1];
  const today = ymd(), st = dayStats(today), sid = sessionFor(today);
  const days = Math.ceil((new Date(S.profile.exam + 'T12:00') - new Date()) / 864e5);
  const examTxt = days > 0 ? `${days} días` : days === 0 ? 'Hoy' : 'Pasó';

  root.innerHTML = `
  <div class="head"><h1>Estado</h1><span class="up">${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>

  <section class="panel">
    <div class="hero">
      <img src="${IMG.logo}" alt="Arise">
      <div>
        <div class="up">Nivel</div>
        <div class="lvl num">${L.lvl} <span style="font-size:1rem;color:var(--ink);letter-spacing:.1em">· ${L.title.toUpperCase()}</span></div>
        <div style="margin:8px 0 6px" class="belt"><i></i>Cinturón ${belt.n}</div>
        <div class="bar"><b style="width:${L.pct}%"></b></div>
        <div class="row mut num" style="font-size:.78rem;margin-top:5px"><span>${xp} XP</span><span class="sp"></span><span>Próx. nivel: ${L.next} XP</span></div>
      </div>
    </div>
  </section>

  <div class="grid2" style="margin-bottom:14px">
    <div class="panel stat" style="margin:0"><div class="up">Racha</div><b>${streak()} <span style="font-size:.9rem">días</span></b></div>
    <div class="panel stat" style="margin:0"><div class="up">Examen de cinturón</div><b>${examTxt}</b></div>
  </div>

  ${habitCards()}

  <section class="panel sc" style="--sc:${SESS[sid].color}">
    <div class="row"><div><div class="up">Hoy</div><div style="font-weight:700;margin-top:2px">${SESS[sid].n}</div>
      <div class="mut" style="font-size:.85rem">${st.done}/${st.total || SESS[sid].ex.filter((e) => true).length} ejercicios · +${st.xp} XP</div></div>
      <span class="sp"></span><a class="btn pri" href="#/hoy">${st.complete ? 'Ver' : 'Ir a la misión'}</a></div>
  </section>

  <section class="panel"><div class="up" style="margin-bottom:10px">Esta semana</div><div class="week">${weekStrip()}</div></section>

  ${tarjetaHTML()}

  <section class="panel" id="ajustes">
    <div class="up" style="margin-bottom:6px">Ajustes</div>
    <table class="tbl">
      <tr><td>Cinturón</td><td><select class="s" id="belt">${BELTS.map((b) => `<option value="${b.id}" ${b.id === belt.id ? 'selected' : ''}>${b.n}</option>`).join('')}</select></td></tr>
      <tr><td>Se obtuvo</td><td><input type="month" id="since" value="${S.profile.since}"></td></tr>
      <tr><td>Próximo examen</td><td><input type="date" id="exam" value="${S.profile.exam}"></td></tr>
    </table>
    ${esIOS() ? '<p class="msg">iPhone y iPad: guardá una copia de seguridad. Si usás Arise desde Safari sin instalarla y pasan 7 días sin abrirla, iOS puede borrar tus datos.</p>' : ''}
    <div class="btns" style="margin-top:14px">
      <button class="btn sm" id="exp">Exportar copia</button>
      <label class="btn sm">Importar<input type="file" id="imp" accept="application/json" hidden></label>
      <button class="btn sm ghost" id="rst">Borrar todo</button>
    </div>
    <p class="mut" style="font-size:.78rem;margin:12px 0 0">Tus datos viven solo en este dispositivo. Exportá una copia de vez en cuando.</p>
    <p class="mut num" style="font-size:.78rem;margin:8px 0 0">Arise v${APP_VERSION} · <a href="#/novedades" style="text-decoration:underline">Novedades</a></p>
  </section>`;

  tarjetaBind(root);
  const on = (id, ev, f) => root.querySelector(id).addEventListener(ev, f);
  on('#belt', 'change', (e) => { S.profile.belt = e.target.value; save(); ctx.refresh(); });
  on('#since', 'change', (e) => { S.profile.since = e.target.value; save(); });
  on('#exam', 'change', (e) => { S.profile.exam = e.target.value; save(); ctx.refresh(); });
  on('#exp', 'click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportJSON()], { type: 'application/json' }));
    a.download = `arise-${ymd()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  on('#imp', 'change', async (e) => {
    try { importJSON(await e.target.files[0].text()); ctx.toast('Copia importada'); ctx.refresh(); } catch { ctx.toast('Archivo no válido'); }
  });
  on('#rst', 'click', () => { if (confirm('¿Borrar todos tus datos de Arise?')) { reset(); ctx.refresh(); } });
}
