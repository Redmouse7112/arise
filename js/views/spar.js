// Ejercicio "Sparring": rondas de 3 min con descanso de 1 min y diario al terminar.
import { get, save, ymd, exFor } from '../store.js';
import { addSpar, lastWork } from '../entreno.js';
import * as T from '../timer.js';
import { exHead, exNav, ringHTML, ringSet, feelBind, esc } from '../ui.js';
import { markDone } from './ejercicio.js';
import { formHTML, formRead } from './diario.js';

const ID = 'spar', ROUND = 180000, REST = 60000;
const isSp = (v) => !!(v && v.meta && v.meta.kind === 'spar');

export function render(root, ctx) {
  const S = get(), date = ymd(), ex = exFor(date, ID);
  const done = !!(S.log[date] && S.log[date].ex[ID] && S.log[date].ex[ID].done);
  const rounds = () => Math.max(1, Math.min(30, (S.prefs[ID] && S.prefs[ID].rounds) || 3));
  let finishing = false, feel = 3, fr = 3, lastSig = '';
  const sig = () => { const v = T.view(); return `${finishing}|${isSp(v)}|${v && v.done}|${v && v.paused}`; };
  const q = (s) => root.querySelector(s);

  const draw = () => {
    const v = T.view(), active = isSp(v) && !v.done, fin = finishing || (isSp(v) && v.done);
    lastSig = sig();
    if (isSp(v) && v.done) fr = v.meta.rounds;
    let body;
    if (fin) {
      body = `<section class="panel sc"><div class="up" style="margin-bottom:10px">Diario del sparring</div>${formHTML({ date, rounds: fr, feel, good: '', bad: '', work: '' })}
        <div class="btns" style="margin-top:14px"><button class="btn pri" id="ok">Guardar y marcar hecho (+80 XP)</button><button class="btn ghost" id="no">Cancelar</button></div></section>`;
    } else if (active) {
      body = `<section class="panel sc">${ringHTML('')}<div class="btns" id="tb"></div></section>`;
    } else {
      const lw = lastWork();
      body = `<section class="panel sc">
        ${lw ? `<div class="note" style="margin:0 0 12px"><b>A trabajar:</b> ${esc(lw)}</div>` : ''}
        <div class="stepper"><button class="btn sm" data-r="-1">−</button><b class="num">${rounds()} rondas</b><button class="btn sm" data-r="1">+</button></div>
        <p class="mut" style="text-align:center;font-size:.85rem;margin:0 0 12px">3 min de ronda · 1 min de descanso · aviso a los 10 s</p>
        <div class="btns"><button class="btn pri" id="go">Iniciar</button><button class="btn" id="man">${done ? 'Escribir otra entrada' : 'Marcar hecho y escribir diario'}</button></div>
        <p class="mut" style="text-align:center;font-size:.8rem;margin:12px 0 0"><a href="#/sparring" style="text-decoration:underline">Ver diario de sparring</a></p></section>`;
    }
    root.innerHTML = `${exHead(ex, done ? '<span class="chip">Hecho ✓</span>' : '')}${body}${exNav(ID, date)}`;
    bind(v);
  };

  function bind(v) {
    if (q('#ok')) {
      feelBind(root, 'sf', (n) => { feel = n; });
      q('#no').onclick = () => { finishing = false; if (isSp(T.view())) T.stop(); draw(); };
      q('#ok').onclick = () => {
        const d = formRead(root, feel); if (!d) return ctx.toast('Poné las rondas');
        addSpar(d); markDone(date, ID);
        if (isSp(T.view())) T.stop();
        finishing = false;
        ctx.commit(); ctx.toast('Sparring guardado'); ctx.refresh(true);
      };
      return;
    }
    if (q('#tb')) { controls(v); return; }
    root.querySelectorAll('[data-r]').forEach((b) => b.onclick = () => {
      S.prefs[ID] = { ...(S.prefs[ID] || {}), rounds: Math.max(1, Math.min(30, rounds() + +b.dataset.r)) }; save(); draw();
    });
    q('#go').onclick = () => {
      const n = rounds(), ph = [];
      for (let i = 1; i <= n; i++) {
        ph.push({ label: 'Pelear', ms: ROUND, round: i, rounds: n, warn: 10000 });
        if (i < n) ph.push({ label: 'Descanso', ms: REST, round: i, rounds: n, warn: 10000 });
      }
      T.startPhases(ph, { kind: 'spar', exId: ID, date, label: 'Sparring', rounds: n });
      fr = n; draw();
    };
    q('#man').onclick = () => { fr = rounds(); finishing = true; draw(); };
  }
  function controls(v) {
    const tb = q('#tb');
    if (tb.dataset.s !== `${v.paused}`) {
      tb.dataset.s = `${v.paused}`;
      tb.innerHTML = `<button class="btn" id="pp">${v.paused ? 'Seguir' : 'Pausa'}</button><button class="btn" id="p30">+30 s</button>
        <button class="btn pri" id="end">Terminar</button><button class="btn ghost" id="stp">Cancelar</button>`;
      q('#pp').onclick = () => (T.view().paused ? T.resume() : T.pause());
      q('#p30').onclick = () => T.add(30000);
      q('#end').onclick = () => {   // rondas completadas hasta ahora
        const w = T.view(); fr = Math.max(1, w.phase.round - (w.phase.label === 'Pelear' ? 1 : 0));
        T.pause(); finishing = true; draw();
      };
      q('#stp').onclick = () => { T.stop(); draw(); };
    }
    paint(v);
  }
  function paint(v) {
    if (!v || !q('#rf') || v.mode !== 'phases') return;
    const p = v.phase;
    ringSet(root, 1 - v.left / p.ms, T.fmt(v.left), `Ronda ${p.round}/${p.rounds} · ${p.label}`);
    const r = q('#rf'); if (r) r.style.stroke = p.label === 'Descanso' ? 'var(--ok)' : '#ef4444';
  }

  draw();
  return T.sub(() => {
    if (!root.isConnected) return;
    const v = T.view();
    if (sig() !== lastSig) { if (!(finishing && root.querySelector(':focus'))) draw(); } else paint(v);
  });
}
