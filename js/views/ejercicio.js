// Detalle de ejercicio: imagen del músculo, series, temporizador y cronómetro.
import { EX, MUS, SESS } from '../data.js';
import { get, save, ymd, sessionFor, entry, pref } from '../store.js';
import * as T from '../timer.js';
import { muscleImg, target, durTxt, CHECK } from '../ui.js';

const topReps = (r) => parseInt(String(r).split('-').pop(), 10) || '';
const C = 2 * Math.PI * 100;

export function markDone(date, id, secs) {
  const L = entry(date), r = L.ex[id] || (L.ex[id] = {});
  r.done = true; if (secs) r.t = secs;
  save();
}

export function render(root, ctx, id) {
  const ex = EX[id];
  if (!ex) { location.hash = '#/hoy'; return; }
  const S = get(), date = ymd(), ids = SESS[sessionFor(date)].ex, idx = ids.indexOf(id);
  const prev = ids[idx - 1], next = ids[idx + 1];
  const rec = S.log[date] && S.log[date].ex[id];
  const P = pref(id, { dur: ex.dur, rest: ex.rest });
  const last = S.last[id];
  const mus = MUS[ex.muscle] || MUS.cardio;
  let off = null;
  const STEP = ex.step || 60;

  let body = '';
  if (ex.type === 'sets') {
    const n = (rec && rec.n) || ex.sets;
    let rows = '';
    for (let i = 0; i < n; i++) {
      const s = rec && rec.sets && rec.sets[i];
      const w = s && s.w !== undefined ? s.w : last && last.w !== undefined ? last.w : '';
      const r = s && s.r !== undefined ? s.r : last && last.r !== undefined ? last.r : topReps(ex.reps);
      const d = !!(s && s.d);
      rows += `<tr data-i="${i}"><td class="mut num">${i + 1}</td>
        <td><input inputmode="decimal" data-k="w" value="${w}" placeholder="kg" aria-label="Peso serie ${i + 1}"></td>
        <td><input inputmode="numeric" data-k="r" value="${r}" aria-label="${ex.rl === 'm' ? 'Metros' : 'Repeticiones'} serie ${i + 1}"></td>
        <td><button class="chk ${d ? 'on' : ''}" data-chk aria-label="Serie ${i + 1} hecha">${d ? CHECK : ''}</button></td></tr>`;
    }
    body = `
    <section class="panel sc">
      <table class="sets"><thead><tr><th>Serie</th><th>Peso (kg)</th><th>${ex.rl === 'm' ? 'Metros' : 'Reps'}</th><th>Hecha</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="btns" style="margin-top:12px">
        <button class="btn sm" id="addset">+ Serie</button>${n > 1 ? '<button class="btn sm ghost" id="delset">− Serie</button>' : ''}
      </div>
      ${last ? `<p class="mut num" style="font-size:.85rem;margin:12px 0 0">Última vez: ${last.w !== undefined ? last.w + ' kg' : ''}${last.r !== undefined ? ' × ' + last.r + (ex.rl === 'm' ? ' m' : '') : ''}</p>` : ''}
    </section>
    <section class="panel">
      <div class="up" style="margin-bottom:10px">Temporizadores</div>
      <div class="stepper"><button class="btn sm" data-rest="-15">−15 s</button><b class="num">Descanso ${P.rest} s</b><button class="btn sm" data-rest="15">+15 s</button></div>
      <div class="btns"><button class="btn sm" id="restnow">Iniciar descanso</button><button class="btn sm" id="sw">Cronómetro</button></div>
      <p class="mut" style="font-size:.78rem;margin:10px 0 0;text-align:center">El descanso arranca solo al marcar una serie.</p>
    </section>`;
  } else if (ex.type === 'timed') {
    body = `
    <section class="panel sc">
      <div class="ring"><svg viewBox="0 0 220 220"><circle class="bg" cx="110" cy="110" r="100"/><circle class="fg" id="rf" cx="110" cy="110" r="100" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
        <div class="tm"><b id="rt">--:--</b><span class="up" id="rs">${ex.n}</span></div></div>
      <div class="stepper" id="dur"><button class="btn sm" data-dur="-${STEP}">−${STEP === 60 ? '1 min' : STEP + ' s'}</button><b class="num" id="durv">${durTxt(P.dur)}</b><button class="btn sm" data-dur="${STEP}">+${STEP === 60 ? '1 min' : STEP + ' s'}</button></div>
      <div class="btns" id="tb"></div>
    </section>`;
  } else {
    const d = !!(rec && rec.done);
    body = `<section class="panel sc"><div class="btns"><button class="btn ${d ? '' : 'pri'}" id="tog">${d ? 'Hecho · deshacer' : 'Marcar como hecho'}</button></div></section>`;
  }

  root.innerHTML = `
  <div class="head"><div><a class="up" href="#/hoy">← Misión</a><h1 style="margin-top:6px;font-size:1.15rem">${ex.n}</h1></div>
    <span class="chip num">${target(ex)}</span></div>
  <div class="mus">${muscleImg(ex.muscle)}<span>${mus[0]}</span></div>
  ${body}
  ${ex.note || ex.prog ? `<div class="note">${[ex.note, ex.prog].filter(Boolean).join('<br>')}</div>` : ''}
  <div class="nav2" style="margin-top:14px">${prev ? `<a class="btn sm" href="#/ej/${prev}">← ${EX[prev].n}</a>` : '<span></span>'}${next ? `<a class="btn sm" href="#/ej/${next}">${EX[next].n} →</a>` : '<span></span>'}</div>`;

  const q = (s) => root.querySelector(s);

  if (ex.type === 'sets') {
    const ensure = () => { const L = entry(date); const r = L.ex[id] || (L.ex[id] = {}); r.sets = r.sets || []; return r; };
    const read = (tr) => ({ w: tr.querySelector('[data-k=w]').value, r: tr.querySelector('[data-k=r]').value });
    root.querySelectorAll('tr[data-i]').forEach((tr) => {
      const i = +tr.dataset.i;
      tr.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => {
        const r = ensure(), v = read(tr); r.sets[i] = { ...(r.sets[i] || {}), w: v.w, r: v.r }; save();
      }));
      tr.querySelector('[data-chk]').addEventListener('click', () => {
        T.unlockAudio();
        const r = ensure(), v = read(tr), was = !!(r.sets[i] && r.sets[i].d);
        r.sets[i] = { w: v.w, r: v.r, d: !was };
        if (!was) {
          S.last[id] = { w: v.w === '' ? undefined : parseFloat(v.w), r: v.r === '' ? undefined : parseFloat(v.r) };
          const n = r.n || ex.sets, left = [...Array(n).keys()].filter((k) => !(r.sets[k] && r.sets[k].d)).length;
          if (left > 0) T.startDown(P.rest * 1000, { kind: 'rest', label: `Descanso · ${ex.n}` });
          else if (T.view() && T.view().meta && T.view().meta.kind === 'rest') T.stop();
        }
        save(); ctx.commit(); ctx.refresh();
      });
    });
    q('#addset').addEventListener('click', () => { const r = ensure(); r.n = (r.n || ex.sets) + 1; save(); ctx.refresh(); });
    const del = q('#delset');
    if (del) del.addEventListener('click', () => { const r = ensure(), n = r.n || ex.sets; if (n > 1) { r.n = n - 1; r.sets.length = Math.min(r.sets.length, r.n); save(); ctx.commit(); ctx.refresh(); } });
    root.querySelectorAll('[data-rest]').forEach((b) => b.addEventListener('click', () => {
      S.prefs[id] = { ...(S.prefs[id] || {}), rest: Math.max(15, P.rest + +b.dataset.rest) }; save(); ctx.refresh();
    }));
    q('#restnow').addEventListener('click', () => T.startDown(P.rest * 1000, { kind: 'rest', label: `Descanso · ${ex.n}` }));
    q('#sw').addEventListener('click', () => T.startUp({ kind: 'stopwatch', label: `Cronómetro · ${ex.n}` }));
  } else if (ex.type === 'timed') {
    const mine = (v) => v && v.meta && v.meta.kind === 'ex' && v.meta.exId === id;
    const paint = (v) => {
      const a = mine(v), done = !!(get().log[date] && get().log[date].ex[id] && get().log[date].ex[id].done);
      q('#rt').textContent = a ? T.fmt(v.left) : T.fmt(P.dur * 1000);
      q('#rf').style.strokeDashoffset = a ? C * (1 - v.left / v.total) : 0;
      q('#rs').textContent = a ? (v.paused ? 'En pausa' : v.done ? '¡Listo!' : ex.n) : done ? 'Hecho' : ex.n;
      q('#dur').style.display = a ? 'none' : 'flex';
      const tb = q('#tb'), sig = a ? `${v.paused}|${v.done}` : 'idle|' + done;
      if (tb.dataset.sig !== sig) {
        tb.dataset.sig = sig;
        tb.innerHTML = a && !v.done
          ? `<button class="btn pri" id="pp">${v.paused ? 'Reanudar' : 'Pausa'}</button><button class="btn" id="p30">+30 s</button><button class="btn ghost" id="stp">Detener</button>`
          : `<button class="btn pri" id="go">${done ? 'Repetir' : 'Iniciar'}</button>${done ? '' : '<button class="btn" id="man">Marcar hecho</button>'}`;
        const b = (s, f) => { const e = tb.querySelector(s); if (e) e.addEventListener('click', f); };
        b('#pp', () => (T.view().paused ? T.resume() : T.pause()));
        b('#p30', () => T.add(30000));
        b('#stp', () => T.stop());
        b('#go', () => T.startDown(P.dur * 1000, { kind: 'ex', exId: id, date, label: ex.n }));
        b('#man', () => { markDone(date, id, P.dur); ctx.commit(); ctx.refresh(); });
      }
    };
    paint(T.view());
    off = T.sub((type, v) => { if (root.isConnected && q('#rt')) paint(v); });
    root.querySelectorAll('[data-dur]').forEach((b) => b.addEventListener('click', () => {
      S.prefs[id] = { ...(S.prefs[id] || {}), dur: Math.max(STEP, P.dur + +b.dataset.dur) }; save(); ctx.refresh();
    }));
  } else {
    q('#tog').addEventListener('click', () => {
      const L = entry(date), r = L.ex[id] || (L.ex[id] = {}); r.done = !r.done; save(); ctx.commit(); ctx.refresh();
    });
  }
  return () => off && off();
}
