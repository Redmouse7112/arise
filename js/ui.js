// Utilidades de interfaz compartidas por las vistas.
import { EX, MUS, SESS, IMG } from './data.js';
import { get, pref } from './store.js';
import { isDone } from './xp.js';
import { foodDay, readDay } from './habitos.js';
import { ymd } from './store.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>';

// Imagen del músculo; si falta el archivo, usa el emblema de la sección.
export function muscleImg(id, cls = '') {
  const m = MUS[id] || MUS.cardio;
  return `<img class="${cls}" src="${m[1]}" alt="${m[0]}" loading="lazy" onerror="this.onerror=null;this.src='${IMG.gym}'">`;
}

export function target(ex) {
  if (ex.type === 'timed') return `${Math.round(pref(ex.id, { dur: ex.dur }).dur / 60)} min`;
  if (ex.type === 'check') return 'Un toque';
  return `${ex.sets} × ${ex.reps}${ex.rl === 'm' ? ' m' : ''}`;
}

export function exDone(id, date) {
  const L = get().log[date];
  return isDone(EX[id], L && L.ex[id]);
}

export const sessEx = (sid) => SESS[sid].ex.map((id) => EX[id]);

// Escapa texto escrito por el usuario antes de meterlo en HTML.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Dos tarjetas compactas (proteína y lectura de hoy) para Estado y Misión.
export function habitCards() {
  const d = ymd(), f = foodDay(d), r = readDay(d);
  const card = (href, color, label, now, goal, unit, pct) => `<a class="panel sc mini" href="${href}" style="--sc:${color};--acc:${color};margin:0">
    <div class="up">${label}</div><div class="num"><b>${now}</b><span class="mut"> / ${goal} ${unit}</span></div>
    <div class="bar"><b style="width:${Math.min(100, pct)}%"></b></div></a>`;
  return `<div class="grid2" style="margin-bottom:14px">${card('#/comida', '#34d399', 'Proteína de hoy', f.g, f.goal, 'g', f.pct)}${card('#/lectura', '#22d3ee', 'Lectura de hoy', r.pages, r.goal, 'págs', r.pct)}</div>`;
}
