// Pantalla Estado: rango (cinturón), nivel, XP, racha, semana y ajustes.
import { BELTS, IMG, APP_VERSION, MODULOS } from '../data.js';
import { get, save, ymd, dow, sesionDia, exportJSON, importJSON, reset, modActivo, hayMision, setMod } from '../store.js';
import { reducir } from '../imagen.js';
import { habitCards, esc } from '../ui.js';
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
  const today = ymd(), st = dayStats(today), ses = sesionDia(today);
  const days = Math.ceil((new Date(S.profile.exam + 'T12:00') - new Date()) / 864e5);
  const examTxt = days > 0 ? `${days} días` : days === 0 ? 'Hoy' : 'Pasó';
  const artes = modActivo('artes'), mision = hayMision();

  root.innerHTML = `
  <div class="head"><h1>Estado</h1><span class="up">${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>

  <section class="panel">
    <div class="hero">
      <img src="${IMG.logo}" alt="Arise">
      <div>
        <div class="up">Nivel</div>
        <div class="lvl num">${L.lvl} <span style="font-size:1rem;color:var(--ink);letter-spacing:.1em">· ${L.title.toUpperCase()}</span></div>
        ${artes ? `<div style="margin:8px 0 6px" class="belt"><i></i>Cinturón ${belt.n}</div>` : '<div style="height:8px"></div>'}
        <div class="bar"><b style="width:${L.pct}%"></b></div>
        <div class="row mut num" style="font-size:.78rem;margin-top:5px"><span>${xp} XP</span><span class="sp"></span><span>Próx. nivel: ${L.next} XP</span></div>
      </div>
    </div>
  </section>

  <div class="grid2" style="margin-bottom:14px${artes ? '' : ';grid-template-columns:1fr'}">
    <div class="panel stat" style="margin:0"><div class="up">Racha</div><b>${streak()} <span style="font-size:.9rem">días</span></b></div>
    ${artes ? `<div class="panel stat" style="margin:0"><div class="up">Examen de cinturón</div><b>${examTxt}</b></div>` : ''}
  </div>

  ${habitCards()}

  ${!mision ? '' : ses ? `<section class="panel sc" style="--sc:${ses.color}">
    <div class="row"><div><div class="up">Hoy</div><div style="font-weight:700;margin-top:2px">${esc(ses.n)}</div>
      <div class="mut" style="font-size:.85rem">${st.done}/${st.total || ses.ex.filter((e) => !e.opt).length} ejercicios · +${st.xp} XP</div></div>
      <span class="sp"></span><a class="btn pri" href="#/hoy">${st.complete ? 'Ver' : 'Ir a la misión'}</a></div>
  </section>` : `<section class="panel"><div class="row"><div><div class="up">Hoy</div><div style="font-weight:700;margin-top:2px">Sin rutina</div></div>
      <span class="sp"></span><a class="btn pri" href="#/hoy">Elegir</a></div></section>`}

  ${mision ? `<section class="panel"><div class="up" style="margin-bottom:10px">Esta semana</div><div class="week">${weekStrip()}</div></section>` : ''}

  ${tarjetaHTML()}

  <section class="panel" id="ajustes">
    <div class="up" style="margin-bottom:6px">Ajustes</div>
    <div class="up" style="margin:10px 0 2px;color:var(--ink)">Módulos</div>
    <p class="mut" style="font-size:.8rem;margin:0 0 4px">Se ocultan, tus datos quedan guardados.</p>
    ${MODULOS.map((m) => `<label class="row li"><div style="flex:1;min-width:0"><div class="t">${m.n}</div><div class="mut" style="font-size:.78rem">${m.d}</div></div>
      <input type="checkbox" data-mod="${m.k}" aria-label="${m.n}" ${modActivo(m.k) ? 'checked' : ''}></label>`).join('')}
    <div class="up" style="margin:16px 0 2px;color:var(--ink)">Temporizadores</div>
    <label class="row li"><div style="flex:1;min-width:0"><div class="t">Descanso automático</div><div class="mut" style="font-size:.78rem">Arranca solo al marcar una serie (no después de la última).</div></div>
      <input type="checkbox" id="descAuto" aria-label="Descanso automático" ${S.ajustes.descansoAuto !== false ? 'checked' : ''}></label>
    ${artes ? `<div class="up" style="margin:16px 0 2px;color:var(--ink)">Artes marciales</div>
    <table class="tbl">
      <tr><td>Cinturón</td><td><select class="s" id="belt">${BELTS.map((b) => `<option value="${b.id}" ${b.id === belt.id ? 'selected' : ''}>${b.n}</option>`).join('')}</select></td></tr>
      <tr><td>Se obtuvo</td><td><input type="month" id="since" value="${S.profile.since}"></td></tr>
      <tr><td>Próximo examen</td><td><input type="date" id="exam" value="${S.profile.exam}"></td></tr>
      <tr><td>Nombre del dojo</td><td><input class="tx" id="dojon" maxlength="40" placeholder="Opcional" value="${esc(S.dojo.nombre || '')}"></td></tr>
      <tr><td>Logo del dojo</td><td>${S.dojo.logo ? `<img src="${esc(S.dojo.logo)}" alt="Logo del dojo" id="dojoimg" style="width:56px;height:56px;object-fit:contain;border-radius:8px;vertical-align:middle;margin-right:8px">` : ''}
        <label class="btn sm">${S.dojo.logo ? 'Cambiar' : 'Elegir imagen'}<input type="file" id="dojologo" accept="image/*" hidden></label>${S.dojo.logo ? ' <button class="btn sm ghost" id="dojoquitar">Quitar</button>' : ''}</td></tr>
    </table>` : ''}
    <div class="up" style="margin:16px 0 8px;color:var(--ink)">Copia de seguridad</div>
    ${esIOS() ? '<p class="msg">iPhone y iPad: guardá una copia de seguridad. Si usás Arise desde Safari sin instalarla y pasan 7 días sin abrirla, iOS puede borrar tus datos.</p>' : ''}
    <div class="btns" style="margin-top:4px">
      <button class="btn sm" id="exp">Exportar copia</button>
      <label class="btn sm">Importar<input type="file" id="imp" accept="application/json" hidden></label>
      <button class="btn sm ghost" id="rst">Borrar todo</button>
    </div>
    <p class="mut" style="font-size:.78rem;margin:12px 0 0">Tus datos viven solo en este dispositivo. Exportá una copia de vez en cuando.</p>
    <p class="mut num" style="font-size:.78rem;margin:8px 0 0">Arise v${APP_VERSION} · <a href="#/novedades" style="text-decoration:underline">Novedades</a></p>
  </section>`;

  tarjetaBind(root);
  const on = (id, ev, f) => { const el = root.querySelector(id); if (el) el.addEventListener(ev, f); };
  root.querySelectorAll('[data-mod]').forEach((c) => c.addEventListener('change', () => {
    if (!setMod(c.dataset.mod, c.checked)) { c.checked = true; ctx.toast('Tiene que quedar al menos un módulo activo'); return; }
    ctx.refresh();
  }));
  on('#descAuto', 'change', (e) => { S.ajustes.descansoAuto = e.target.checked; save(); ctx.refresh(); });
  on('#belt', 'change', (e) => { S.profile.belt = e.target.value; save(); ctx.refresh(); });
  on('#since', 'change', (e) => { S.profile.since = e.target.value; save(); });
  on('#exam', 'change', (e) => { S.profile.exam = e.target.value; save(); ctx.refresh(); });
  on('#dojon', 'change', (e) => { S.dojo.nombre = e.target.value.trim().slice(0, 40); save(); ctx.refresh(); });
  on('#dojologo', 'change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { S.dojo.logo = await reducir(f, 256); save(); ctx.toast('Logo guardado'); ctx.refresh(); } catch { ctx.toast('No se pudo usar esa imagen'); }
  });
  on('#dojoquitar', 'click', () => { S.dojo.logo = null; save(); ctx.refresh(); });
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
