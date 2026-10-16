// Ejercicio "Trote": continuo o por intervalos, con registro de distancia y sensación.
import { get, save, ymd, entry, exFor } from '../store.js';
import { saveRun, runDay, runBonus } from '../entreno.js';
import * as T from '../timer.js';
import { exHead, exNav, ringHTML, ringSet, feelHTML, feelBind, durTxt } from '../ui.js';
import { markDone } from './ejercicio.js';

const PRESETS = { '1:1': { run: 1, walk: 1, rounds: 10 }, '2:1': { run: 2, walk: 1, rounds: 8 }, '3:1': { run: 3, walk: 1, rounds: 6 } };
const PNAME = { '1:1': '1:1 × 10', '2:1': '2:1 × 8', '3:1': '3:1 × 6', custom: 'Personalizado' };
const ID = 'trote';
const isRun = (v) => !!(v && v.meta && v.meta.kind === 'run');

export function render(root, ctx) {
  const S = get(), date = ymd(), ex = exFor(date, ID), rec = S.log[date] && S.log[date].ex[ID];
  const cfg = () => ({ mode: 'cont', dur: ex.dur, preset: '1:1', custom: { run: 2, walk: 1, rounds: 6 }, ...(S.prefs[ID] || {}) });
  const setCfg = (p) => { S.prefs[ID] = { ...cfg(), ...p }; save(); };
  let finishing = false, manual = false, feel = 3, lastSig = '';

  const plan = () => {
    const c = cfg();
    if (c.mode === 'cont') return { mode: 'cont', min: c.dur / 60, phases: null };
    const p = c.preset === 'custom' ? c.custom : PRESETS[c.preset];
    const phases = [];
    for (let i = 1; i <= p.rounds; i++) {
      phases.push({ label: 'Trotar', ms: p.run * 60000, round: i, rounds: p.rounds });
      phases.push({ label: 'Caminar', ms: p.walk * 60000, round: i, rounds: p.rounds });
    }
    return { mode: 'int', min: (p.run + p.walk) * p.rounds, phases };
  };

  const finishHTML = (min) => `<section class="panel sc"><div class="up" style="margin-bottom:10px">Guardar trote</div>
    <div class="row" style="gap:18px;flex-wrap:wrap;margin-bottom:12px">
      <label class="fld">Minutos <input type="number" id="fmin" min="1" max="600" value="${Math.max(1, Math.round(min))}"></label>
      <label class="fld">Distancia (km, opcional) <input type="number" id="fkm" min="0" max="100" step="0.1" placeholder="0.0" inputmode="decimal"></label></div>
    <div class="up" style="margin-bottom:6px">¿Cómo te sentiste? (1 = muy duro, 5 = excelente)</div>${feelHTML('ffeel', feel)}
    <div class="btns" style="margin-top:14px"><button class="btn pri" id="fsave">Guardar y marcar hecho</button><button class="btn ghost" id="fcancel">Cancelar</button></div></section>`;

  const draw = () => {
    const v = T.view(), c = cfg(), active = isRun(v) && !v.done, fin = finishing || (isRun(v) && v.done);
    const done = !!(rec && rec.done) || !!(S.log[date] && S.log[date].ex[ID] && S.log[date].ex[ID].done);
    const today = runDay(date);
    lastSig = sig();
    let body;
    if (fin) {
      body = finishHTML(manual ? plan().min : isRun(v) ? (v.done ? v.meta.min || v.total / 60000 : T.elapsedOf(v) / 60000) : plan().min);
    } else if (active) {
      body = `<section class="panel sc">${ringHTML('')}<div class="btns" id="tb"></div></section>`;
    } else {
      const p = c.preset === 'custom' ? c.custom : PRESETS[c.preset];
      body = `<section class="panel sc">
        ${today ? `<p class="msg" style="margin-top:0">Hoy ya trotaste ${today.min} min${today.km ? ' · ' + today.km + ' km' : ''}. Otro registro se suma al de hoy.</p>` : ''}
        <div class="seg"><button class="${c.mode === 'cont' ? 'on' : ''}" data-mode="cont">Continuo</button><button class="${c.mode === 'int' ? 'on' : ''}" data-mode="int">Intervalos</button></div>
        ${c.mode === 'cont'
          ? `<div class="stepper" style="margin-top:14px"><button class="btn sm" data-dur="-60">−1 min</button><b class="num">${durTxt(c.dur)}</b><button class="btn sm" data-dur="60">+1 min</button></div>
             <p class="mut" style="text-align:center;font-size:.85rem;margin:0 0 12px">Ritmo en el que puedas hablar.</p>`
          : `<div class="chips" style="grid-template-columns:repeat(2,1fr)">${Object.keys(PNAME).map((k) => `<button class="chip-b ${c.preset === k ? 'sel' : ''}" data-pre="${k}"><b>${PNAME[k]}</b>${k === 'custom' ? '' : `<span>${PRESETS[k].run} min trote · ${PRESETS[k].walk} min caminata</span>`}</button>`).join('')}</div>
             ${c.preset === 'custom' ? `<div class="row" style="gap:12px;flex-wrap:wrap;margin-top:12px">
               <label class="fld">Trote (min) <input type="number" id="cr" min="1" max="60" value="${c.custom.run}"></label>
               <label class="fld">Caminata (min) <input type="number" id="cw" min="1" max="60" value="${c.custom.walk}"></label>
               <label class="fld">Rondas <input type="number" id="cn" min="1" max="40" value="${c.custom.rounds}"></label></div>` : ''}
             <p class="mut" style="text-align:center;font-size:.85rem;margin:12px 0">${p.rounds} rondas · ${(p.run + p.walk) * p.rounds} min en total</p>`}
        <div class="btns"><button class="btn pri" id="go">Iniciar</button><button class="btn" id="man">Cargar a mano</button></div>
        <p class="mut" style="font-size:.78rem;text-align:center;margin:10px 0 0">Con más de 20 min sumás +1 XP cada 2 min extra (hasta +20).</p>
      </section>`;
    }
    root.innerHTML = `${exHead(ex, done ? '<span class="chip">Hecho ✓</span>' : '')}${body}
      <div class="note">${ex.note}</div>${exNav(ID, date)}`;
    bind(v);
  };
  const sig = () => { const v = T.view(); return `${finishing}|${manual}|${isRun(v)}|${v && v.done}|${v && v.paused}|${v && v.idx}`; };
  const q = (s) => root.querySelector(s);

  function bind(v) {
    if (q('#fsave')) {
      feelBind(root, 'ffeel', (n) => { feel = n; });
      q('#fcancel').onclick = () => { finishing = false; manual = false; if (isRun(T.view())) T.stop(); draw(); };
      q('#fsave').onclick = () => {
        const min = Math.round(+q('#fmin').value), km = parseFloat(q('#fkm').value) || 0;
        if (!(min > 0)) return ctx.toast('Poné los minutos');
        const pl = plan(), meta = isRun(T.view()) ? T.view().meta : null;
        saveRun(date, { mode: meta ? meta.runMode : pl.mode, min, km, feel });
        markDone(date, ID, min * 60);
        if (isRun(T.view())) T.stop();
        finishing = false; manual = false;
        const b = runBonus(runDay(date).min);
        ctx.commit(); ctx.toast(b ? `¡Trote guardado! +${b} XP extra` : '¡Trote guardado!'); ctx.refresh(true);
      };
      return;
    }
    if (q('#tb')) { paintControls(v); return; }
    root.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => { setCfg({ mode: b.dataset.mode }); draw(); });
    root.querySelectorAll('[data-dur]').forEach((b) => b.onclick = () => { setCfg({ dur: Math.max(60, cfg().dur + +b.dataset.dur) }); draw(); });
    root.querySelectorAll('[data-pre]').forEach((b) => b.onclick = () => { setCfg({ preset: b.dataset.pre }); draw(); });
    ['cr', 'cw', 'cn'].forEach((k) => { const i = q('#' + k); if (i) i.onchange = () => {
      const c = { ...cfg().custom }, f = { cr: 'run', cw: 'walk', cn: 'rounds' }[k];
      c[f] = Math.max(1, Math.min(k === 'cn' ? 40 : 60, Math.round(+i.value) || 1)); setCfg({ custom: c }); draw(); }; });
    q('#go').onclick = () => {
      const pl = plan(), meta = { kind: 'run', exId: ID, date, label: 'Trote', min: pl.min, runMode: pl.mode };
      if (pl.mode === 'cont') T.startDown(pl.min * 60000, meta); else T.startPhases(pl.phases, meta);
      draw();
    };
    q('#man').onclick = () => { manual = true; finishing = true; draw(); };
  }

  function paintControls(v) {
    const tb = q('#tb'); if (!tb) return;
    if (!tb.dataset.s || tb.dataset.s !== `${v.paused}`) {
      tb.dataset.s = `${v.paused}`;
      tb.innerHTML = `<button class="btn" id="pp">${v.paused ? 'Seguir' : 'Pausa'}</button><button class="btn" id="p30">+30 s</button>
        <button class="btn pri" id="end">Terminar</button><button class="btn ghost" id="stp">Cancelar</button>`;
      q('#pp').onclick = () => (T.view().paused ? T.resume() : T.pause());
      q('#p30').onclick = () => T.add(30000);
      q('#end').onclick = () => { T.pause(); finishing = true; manual = false; draw(); };
      q('#stp').onclick = () => { T.stop(); draw(); };
    }
    paint(v);
  }
  function paint(v) {
    if (!v || !q('#rf')) return;
    if (v.mode === 'phases') {
      const p = v.phase, tot = p.ms;
      ringSet(root, 1 - v.left / tot, T.fmt(v.left), `Ronda ${p.round}/${p.rounds} · ${p.label}`);
    } else ringSet(root, 1 - v.left / v.total, T.fmt(v.left), 'Trotando');
  }

  draw();
  return T.sub((type, v) => {
    if (!root.isConnected) return;
    if (sig() !== lastSig) { if (!(finishing && root.querySelector('input:focus'))) draw(); } else paint(v);
  });
}
