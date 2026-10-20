// Ejercicio "Sparring": rondas configurables (Kickboxing, Boxeo o personalizado) con cuenta previa, campana y diario al terminar.
import { get, save, ymd, exFor, entry } from '../store.js';
import { addSpar, lastWork } from '../entreno.js';
import * as T from '../timer.js';
import { exHead, exNav, ringHTML, ringSet, feelBind, esc } from '../ui.js';
import { markDone } from './ejercicio.js';
import { formHTML, formRead } from './diario.js';

const ID = 'spar';
const PRESETS = { kick: { n: 'Kickboxing', rounds: 3, dur: 120, rest: 60 }, box: { n: 'Boxeo', rounds: 3, dur: 180, rest: 60 } };
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const isSp = (v) => !!(v && v.meta && v.meta.kind === 'spar');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// Configuración guardada en prefs.spar (campos opcionales; antes solo existía `rounds`).
export function configSpar(S) {
  const p = (S.prefs && S.prefs[ID]) || {};
  const c = { rounds: clamp(p.rounds || 3, 1, 30), dur: clamp(p.dur || 180, 30, 900), rest: clamp(p.rest ?? 60, 0, 600), pre: p.pre !== false, warn: p.warn !== false };
  c.preset = Object.keys(PRESETS).find((k) => PRESETS[k].rounds === c.rounds && PRESETS[k].dur === c.dur && PRESETS[k].rest === c.rest) || 'custom';
  return c;
}
// Fases del temporizador: cuenta previa (opcional), rondas con campana al empezar y al terminar, y descansos entre rondas.
export function fasesSpar(c) {
  const ph = [];
  if (c.pre) ph.push({ label: 'Preparate', ms: 10000, round: 0, rounds: c.rounds });
  for (let i = 1; i <= c.rounds; i++) {
    ph.push({ label: 'Pelear', ms: c.dur * 1000, round: i, rounds: c.rounds, in: 'campana', out: 'campana', ...(c.warn && c.dur > 20 ? { warn: 10000 } : {}) });
    if (i < c.rounds && c.rest > 0) ph.push({ label: 'Descanso', ms: c.rest * 1000, round: i, rounds: c.rounds, ...(c.warn && c.rest > 20 ? { warn: 10000 } : {}) });
  }
  return ph;
}

export function render(root, ctx) {
  const S = get(), date = ymd(), ex = exFor(date, ID);
  const done = !!(S.log[date] && S.log[date].ex[ID] && S.log[date].ex[ID].done);
  const setCfg = (patch) => { S.prefs[ID] = { ...(S.prefs[ID] || {}), ...patch }; save(); };
  let finishing = false, feel = 3, fr = 3, lastSig = '';
  const sig = () => { const v = T.view(); return `${finishing}|${isSp(v)}|${v && v.done}|${v && v.paused}`; };
  const q = (s) => root.querySelector(s);

  const draw = () => {
    const v = T.view(), active = isSp(v) && !v.done, fin = finishing || (isSp(v) && v.done), c = configSpar(S);
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
        <div class="seg" style="grid-template-columns:repeat(3,1fr)">${[...Object.entries(PRESETS).map(([k, p]) => [k, p.n]), ['custom', 'Personalizado']].map(([k, n]) => `<button class="${c.preset === k ? 'on' : ''}" data-pre="${k}">${n}</button>`).join('')}</div>
        <div class="stepper" style="margin-top:14px"><button class="btn sm" data-r="-1" aria-label="Menos rondas">−</button><b class="num">${c.rounds} rondas</b><button class="btn sm" data-r="1" aria-label="Más rondas">+</button></div>
        <div class="stepper"><button class="btn sm" data-d="-15" aria-label="Ronda más corta">−15 s</button><b class="num">Ronda ${mmss(c.dur)}</b><button class="btn sm" data-d="15" aria-label="Ronda más larga">+15 s</button></div>
        <div class="stepper"><button class="btn sm" data-e="-15" aria-label="Menos descanso">−15 s</button><b class="num">Descanso ${mmss(c.rest)}</b><button class="btn sm" data-e="15" aria-label="Más descanso">+15 s</button></div>
        <label class="row li"><div style="flex:1"><div class="t">Cuenta previa de 10 s</div></div><input type="checkbox" id="pre" ${c.pre ? 'checked' : ''}></label>
        <label class="row li"><div style="flex:1"><div class="t">Aviso a los 10 s finales</div></div><input type="checkbox" id="warn" ${c.warn ? 'checked' : ''}></label>
        <div class="btns" style="margin-top:14px"><button class="btn pri" id="go">Iniciar</button><button class="btn" id="man">${done ? 'Escribir otra entrada' : 'Marcar hecho y escribir diario'}</button></div>
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
        const c = configSpar(S), m = isSp(T.view()) ? T.view().meta : null, dur = m ? m.dur : c.dur, rest = m ? m.rest : c.rest;
        addSpar({ ...d, dur, rest });                       // dur y rest son opcionales y aditivos (esquema v4)
        markDone(date, ID);
        const r = entry(date).ex[ID]; r.rondas = d.rounds; r.dur = dur; r.rest = rest; save();   // rondas completadas en el registro del día
        if (isSp(T.view())) T.stop();
        finishing = false;
        ctx.commit(); ctx.toast('Sparring guardado'); ctx.refresh();
      };
      return;
    }
    if (q('#tb')) { controls(v); return; }
    const c = configSpar(S);
    root.querySelectorAll('[data-pre]').forEach((b) => b.onclick = () => {
      const k = b.dataset.pre; if (k !== 'custom') setCfg({ rounds: PRESETS[k].rounds, dur: PRESETS[k].dur, rest: PRESETS[k].rest }); draw();
    });
    root.querySelectorAll('[data-r]').forEach((b) => b.onclick = () => { setCfg({ rounds: clamp(c.rounds + +b.dataset.r, 1, 30) }); draw(); });
    root.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { setCfg({ dur: clamp(c.dur + +b.dataset.d, 30, 900) }); draw(); });
    root.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => { setCfg({ rest: clamp(c.rest + +b.dataset.e, 0, 600) }); draw(); });
    q('#pre').onchange = (e) => setCfg({ pre: e.target.checked });
    q('#warn').onchange = (e) => setCfg({ warn: e.target.checked });
    q('#go').onclick = () => {
      T.startPhases(fasesSpar(c), { kind: 'spar', exId: ID, date, label: 'Sparring', rounds: c.rounds, dur: c.dur, rest: c.rest, preset: c.preset });
      fr = c.rounds; draw();
    };
    q('#man').onclick = () => { fr = c.rounds; finishing = true; draw(); };
  }
  function controls(v) {
    const tb = q('#tb');
    if (tb.dataset.s !== `${v.paused}` || !tb.childElementCount) {
      tb.dataset.s = `${v.paused}`;
      tb.innerHTML = `<button class="btn" id="pp">${v.paused ? 'Seguir' : 'Pausa'}</button><button class="btn" id="p30">+30 s</button>
        <button class="btn pri" id="end">Terminar</button><button class="btn ghost" id="stp">Cancelar</button>`;
      q('#pp').onclick = () => (T.view().paused ? T.resume() : T.pause());
      q('#p30').onclick = () => T.add(30000);
      q('#end').onclick = () => {   // rondas completadas hasta ahora
        const w = T.view(); fr = Math.max(0, w.phase.round - (w.phase.label === 'Pelear' ? 1 : 0));
        T.pause(); finishing = true; draw();
      };
      q('#stp').onclick = () => { T.stop(); draw(); };
    }
    paint(v);
  }
  function paint(v) {
    if (!v || !q('#rf') || v.mode !== 'phases') return;
    const p = v.phase;
    ringSet(root, 1 - v.left / p.ms, T.fmt(v.left), p.round ? `Ronda ${p.round}/${p.rounds} · ${p.label}` : p.label);
    const r = q('#rf'); if (r) r.style.stroke = p.label === 'Descanso' ? 'var(--ok)' : p.label === 'Preparate' ? '#22d3ee' : '#ef4444';
  }

  draw();
  return T.sub(() => {
    if (!root.isConnected) return;
    const v = T.view();
    if (sig() !== lastSig) { if (!(finishing && root.querySelector(':focus'))) draw(); } else paint(v);
  });
}
