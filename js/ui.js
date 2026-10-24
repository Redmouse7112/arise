// Utilidades de interfaz compartidas por las vistas.
import { MUS, IMG } from './data.js';
import { get, pref, sesionDia, exFor, modActivo, nombreDojo } from './store.js';
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

export const durTxt = (s) => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : `${s} s`);

export function target(ex) {
  if (ex.type === 'timed') return `${ex.rounds ? ex.rounds + ' × ' : ''}${durTxt(pref(ex.id, { dur: ex.dur }).dur)}`;
  if (ex.type === 'check') return 'Un toque';
  return `${ex.sets} × ${ex.reps}${ex.rl === 'm' ? ' m' : ''}`;
}

export function exDone(id, date) {
  const L = get().log[date];
  return isDone(exFor(date, id), L && L.ex[id]);
}

// Escapa texto escrito por el usuario antes de meterlo en HTML.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Dos tarjetas compactas (proteína y lectura de hoy) para Estado y Misión.
export function habitCards() {
  const d = ymd(), f = foodDay(d), r = readDay(d);
  const card = (href, color, label, now, goal, unit, pct) => `<a class="panel sc mini" href="${href}" style="--sc:${color};--acc:${color};margin:0">
    <div class="up">${label}</div><div class="num"><b>${now}</b><span class="mut"> / ${goal} ${unit}</span></div>
    <div class="bar"><b style="width:${Math.min(100, pct)}%"></b></div></a>`;
  const cs = [modActivo('comida') ? card('#/comida', 'var(--mod-comida)', 'Proteína de hoy', f.g, f.goal, 'g', f.pct) : '', modActivo('lectura') ? card('#/lectura', 'var(--mod-lectura)', 'Lectura de hoy', r.pages, r.goal, 'págs', r.pct) : ''].filter(Boolean);
  return cs.length ? `<div class="grid2" style="margin-bottom:14px${cs.length === 1 ? ';grid-template-columns:1fr' : ''}">${cs.join('')}</div>` : '';
}

// ---- piezas compartidas por las vistas de ejercicio especiales (trote, clase, sparring) ----
export function exHead(ex, extra = '') {
  const mus = MUS[ex.muscle] || MUS.cardio;
  return `<div class="head"><div><a class="up" href="#/hoy">← Misión</a><h1 style="margin-top:6px;font-size:1.15rem">${esc(ex.n)}</h1></div>${extra}</div>
  <div class="mus">${muscleImg(ex.muscle)}<span>${mus[0]}</span></div>`;
}
export function exNav(id, date) {
  const ids = ((sesionDia(date) || {}).ex || []).map((e) => e.id), i = ids.indexOf(id), prev = ids[i - 1], next = ids[i + 1];
  if (i < 0) return '';
  return `<div class="nav2" style="margin-top:14px">${prev ? `<a class="btn sm" href="#/ej/${prev}">← ${esc(exFor(date, prev).n)}</a>` : '<span></span>'}${next ? `<a class="btn sm" href="#/ej/${next}">${esc(exFor(date, next).n)} →</a>` : '<span></span>'}</div>`;
}
const RC = 2 * Math.PI * 100;
export const ringHTML = (label = '') => `<div class="ring"><svg viewBox="0 0 220 220"><circle class="bg" cx="110" cy="110" r="100"/><circle class="fg" id="rf" cx="110" cy="110" r="100" stroke-dasharray="${RC}" stroke-dashoffset="${RC}"/></svg>
  <div class="tm"><b id="rt">--:--</b><span class="up" id="rs">${label}</span></div></div>`;
export function ringSet(root, frac, time, label) {
  const f = root.querySelector('#rf'), t = root.querySelector('#rt'), s = root.querySelector('#rs');
  if (f) f.setAttribute('stroke-dashoffset', String(RC * (1 - Math.max(0, Math.min(1, frac)))));
  if (t) t.textContent = time; if (s) s.textContent = label;
}
// Selector 1-5 (sensación o esfuerzo). Se lee con feelBind.
export const feelHTML = (id, val) => `<div class="feel" id="${id}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${n === val ? 'on' : ''}" data-f="${n}" aria-label="${n}">${n}</button>`).join('')}</div>`;
export function feelBind(root, id, onPick) {
  const box = root.querySelector('#' + id);
  box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    box.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); onPick(+b.dataset.f);
  }));
}
