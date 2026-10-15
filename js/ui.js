// Utilidades de interfaz compartidas por las vistas.
import { EX, MUS, SESS, IMG } from './data.js';
import { get, pref } from './store.js';
import { isDone } from './xp.js';

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
