// Arranque, router por hash, barra de temporizador, toasts.
import { load, get, ymd, save } from './store.js';
import { initNovedades, hasData } from './aviso.js';
import * as Inst from './instalar.js';
import { BELTS } from './data.js';
import { totalXP, levelInfo } from './xp.js';
import * as T from './timer.js';
import { markDone } from './views/ejercicio.js';
import { addMinutes } from './habitos.js';

const VIEWS = {
  estado: () => import('./views/estado.js'),
  hoy: () => import('./views/hoy.js'),
  comida: () => import('./views/comida.js'),
  lectura: () => import('./views/lectura.js'),
  mas: () => import('./views/mas.js'),
  plan: () => import('./views/plan.js'),
  sparring: () => import('./views/diario.js'),
  trote: () => import('./views/historial.js'),
  novedades: () => import('./views/novedades.js'),
  ej: () => import('./views/ejercicio.js'),
};
// Ejercicios con pantalla propia (el resto usa views/ejercicio.js).
const SPECIAL = { trote: () => import('./views/trote.js'), clase: () => import('./views/clase.js'), spar: () => import('./views/spar.js') };
const NAVKEY = { ej: 'hoy', plan: 'mas', sparring: 'mas', trote: 'mas', novedades: 'mas' };
const ICON = {
  mas: '<svg viewBox="0 0 24 24"><circle cx="5.500" cy="12" r="1.600"/><circle cx="12" cy="12" r="1.600"/><circle cx="18.500" cy="12" r="1.600"/></svg>',
  estado: '<svg viewBox="0 0 24 24"><path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><path d="M12 8v5l3 2"/></svg>',
  hoy: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
  comida: '<svg viewBox="0 0 24 24"><path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8a2 2 0 0 1-2 2M9 3v6"/><path d="M17 3c-2 2-3 4.500-3 7.500 0 1.500 1 2.500 3 2.500v8"/></svg>',
  lectura: '<svg viewBox="0 0 24 24"><path d="M12 6.500C10 5 7 4.500 4 5v13c3-.5 6 0 8 1.500 2-1.500 5-2 8-1.500V5c-3-.5-6 0-8 1.500z"/><path d="M12 6.500v13"/></svg>',
  plan: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
};

const hadData = hasData();   // sin datos previos es instalación nueva: no se muestran novedades
load();
const root = document.getElementById('view');
const nav = document.getElementById('nav');
const tbar = document.getElementById('tbar');
const toastEl = document.getElementById('toast');
let cleanup = null, lastXP = totalXP(), tTimer;

nav.innerHTML = [['estado', 'Estado'], ['hoy', 'Misión'], ['comida', 'Comida'], ['lectura', 'Lectura'], ['mas', 'Más']]
  .map(([k, n]) => `<a href="#/${k}" data-k="${k}">${ICON[k]}<span>${n}</span></a>`).join('');

export function toast(msg) {
  toastEl.textContent = msg; toastEl.classList.add('on');
  clearTimeout(tTimer); tTimer = setTimeout(() => toastEl.classList.remove('on'), 2200);
}

function theme() {
  const b = BELTS.find((x) => x.id === get().profile.belt) || BELTS[1];
  document.documentElement.style.setProperty('--acc', b.c);
}

const ctx = {
  toast,
  refresh: (keep) => route(keep),   // keep=true conserva el scroll
  // Calcula la diferencia de XP y avisa (incluye subida de nivel).
  commit() {
    const xp = totalXP(), d = xp - lastXP, a = levelInfo(lastXP).lvl, b = levelInfo(xp).lvl;
    if (b > a) toast(`¡Nivel ${b}!  ${levelInfo(xp).title}`);
    else if (d > 0) toast(`+${d} XP`);
    else if (d < 0) toast(`${d} XP`);
    lastXP = xp;
  },
};

async function route(keep) {
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  theme();
  const [, k = 'estado', arg] = location.hash.replace('#', '').split('/');
  const name = VIEWS[k] ? k : 'estado';
  nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.k === (NAVKEY[name] || name)));
  const mod = await (name === 'ej' && SPECIAL[arg] ? SPECIAL[arg]() : VIEWS[name]());
  const c = mod.render(root, ctx, arg);
  cleanup = typeof c === 'function' ? c : null;
  root.style.animation = 'none'; void root.offsetWidth; root.style.animation = '';
  if (k === 'estado' && arg === 'ajustes') { const a = document.getElementById('ajustes'); if (a) a.scrollIntoView(); }
  else if (!keep) window.scrollTo(0, 0);
  renderBar(T.view());
}
window.addEventListener('hashchange', () => route());

// ---- barra global del temporizador ----
let barSig = '';
function renderBar(v) {
  const here = v && v.meta && v.meta.exId && location.hash === `#/ej/${v.meta.exId}`;
  if (!v || here) { tbar.innerHTML = ''; tbar.className = ''; barSig = ''; return; }
  const txt = v.mode === 'up' ? T.fmtUp(v.elapsed) : T.fmt(v.left);
  const label = v.mode === 'phases' ? `${v.phase.round ? `Ronda ${v.phase.round}/${v.phase.rounds} · ` : ''}${v.phase.label}` : v.meta.label || '';
  const sig = `${v.mode}|${v.paused}|${v.done}|${v.idx}`;
  tbar.className = v.done ? 'done' : '';
  if (sig !== barSig) {
    barSig = sig;
    tbar.innerHTML = `<div><span class="tt num" id="tbt"></span><span class="tl">${v.done ? '¡Tiempo cumplido!' : label}</span>
      ${v.done ? '' : `<button class="btn sm" id="tp">${v.paused ? 'Seguir' : 'Pausa'}</button>`}
      ${v.mode !== 'up' && !v.done ? '<button class="btn sm" id="t30">+30</button>' : ''}
      ${v.meta.exId && v.meta.kind !== 'ex' ? `<a class="btn sm" href="#/ej/${v.meta.exId}">Abrir</a>` : ''}
      <button class="btn sm ghost" id="tx">${v.done ? 'Cerrar' : 'Parar'}</button></div>`;
    const on = (s, f) => { const e = tbar.querySelector(s); if (e) e.addEventListener('click', f); };
    on('#tp', () => (T.view().paused ? T.resume() : T.pause()));
    on('#t30', () => T.add(30000));
    on('#tx', () => T.stop());
  }
  const el = tbar.querySelector('#tbt'); if (el) el.textContent = txt;
}
T.sub((type, v) => {
  if (type === 'done' && v.meta) {
    if (v.meta.kind === 'ex') {
      markDone(v.meta.date, v.meta.exId, Math.round(v.total / 1000));
      ctx.commit(); toast('¡Hecho!');
      if (location.hash.startsWith('#/ej/') || location.hash === '#/hoy') route();
    } else if (v.meta.kind === 'run' || v.meta.kind === 'spar') {
      toast('¡Terminaste! Guardá tu registro');
    } else if (v.meta.kind === 'read') {
      addMinutes(v.meta.date, v.meta.min || Math.round(v.total / 60000));
      toast(`Lectura terminada · ${v.meta.min || Math.round(v.total / 60000)} min`);
      if (location.hash === '#/lectura') route(true);
    } else toast('Descanso terminado');
  }
  renderBar(v);
});

// ---- inicio ----
Inst.init(toast);
// Si cambia el estado de instalación, redibujo Estado o Más (sin tocar un campo que se esté escribiendo).
Inst.onChange(() => { if (/^#\/(estado|mas)?$|^#\/(estado|mas)\//.test(location.hash || '#/estado') && !document.querySelector('#view :focus')) route(true); });
route().then(() => {
  initNovedades(hadData);
  setTimeout(() => document.getElementById('splash').classList.add('off'), 700);
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
