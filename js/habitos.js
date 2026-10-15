// Datos de hábitos: proteína (Comida) y Lectura. Sin interfaz; lo usan las vistas, xp.js y app.js.
import { get, save, ymd } from './store.js';

export const XP_FOOD = 30, XP_READ_DAY = 20, XP_BOOK = 100, FOOD_HIT = 0.9;

const back = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
export const lastDays = (n) => Array.from({ length: n }, (_, i) => back(n - 1 - i));

// ---------- Comida ----------
export const foodGoal = (date) => get().food.gl[date] ?? get().food.goal;
export function foodDay(date) {
  const items = get().food.log[date] || [], goal = foodGoal(date);
  const g = items.reduce((a, x) => a + (+x.g || 0), 0);
  return { items, g, goal, pct: goal ? Math.round((g / goal) * 100) : 0 };
}
export function addFood(date, n, g) {
  const F = get().food;
  if (F.gl[date] == null) F.gl[date] = F.goal;
  (F.log[date] || (F.log[date] = [])).push({ n, g, t: Date.now() });
  save();
}
export function delFood(date, i) { const l = get().food.log[date]; if (l) { l.splice(i, 1); save(); } }
export function setFoodGoal(v) {
  const F = get().food; F.goal = v;
  const t = ymd(); if (F.gl[t] != null) F.gl[t] = v;   // hoy sigue la meta nueva; los días pasados conservan la suya
  save();
}
export function setQuick(list) { get().food.quick = list; save(); }
export const foodXP = () => Object.keys(get().food.log).reduce((a, d) => a + (foodDay(d).g >= FOOD_HIT * foodGoal(d) && foodGoal(d) > 0 ? XP_FOOD : 0), 0);

// ---------- Lectura ----------
export const readGoal = (date) => get().read.gl[date] ?? get().read.goal;
export function readDay(date) {
  const e = get().read.log[date] || {}, goal = readGoal(date), pages = e.pages || 0;
  return { pages, min: e.min || 0, goal, pct: goal ? Math.round((pages / goal) * 100) : 0 };
}
const rEntry = (date) => {
  const R = get().read;
  if (R.gl[date] == null) R.gl[date] = R.goal;
  return R.log[date] || (R.log[date] = { pages: 0, min: 0 });
};
export const currentBook = () => { const R = get().read; return R.books.find((b) => b.id === R.current && !b.done) || null; };
export function addBook(t, a, pages) {
  const R = get().read, b = { id: 'b' + Date.now().toString(36), t, a: a || '', pages, cur: 0, done: null };
  R.books.push(b);
  if (!currentBook()) R.current = b.id;
  save(); return b;
}
export function setCurrent(id) { const R = get().read; if (R.books.some((b) => b.id === id && !b.done)) { R.current = id; save(); } }
// Suma (o corrige con negativos) páginas al libro actual y al registro del día. Devuelve { add, finished } o null.
export function addPages(date, n) {
  const R = get().read, b = currentBook();
  if (!b || !n) return null;
  const add = n > 0 ? Math.min(n, b.pages - b.cur) : -Math.min(-n, b.cur);
  if (!add) return null;
  const e = rEntry(date);
  e.pages = Math.max(0, e.pages + add); b.cur += add;
  let finished = null;
  if (b.cur >= b.pages) { b.done = date; R.current = null; finished = b; }
  save(); return { add, finished };
}
export function addMinutes(date, min) { const e = rEntry(date); e.min = (e.min || 0) + min; save(); }
export function setReadGoal(v) {
  const R = get().read; R.goal = v;
  const t = ymd(); if (R.gl[t] != null) R.gl[t] = v;
  save();
}
// Días estimados para terminar el libro actual según el promedio de los últimos 7 días.
export function estimate() {
  const b = currentBook(); if (!b) return null;
  const avg = lastDays(7).reduce((a, d) => a + readDay(d).pages, 0) / 7;
  return avg > 0 ? { avg, days: Math.ceil((b.pages - b.cur) / avg) } : { avg: 0, days: null };
}
export const readXP = () => {
  const R = get().read;
  const days = Object.keys(R.log).reduce((a, d) => a + (readDay(d).pages >= readGoal(d) && readGoal(d) > 0 ? XP_READ_DAY : 0), 0);
  return days + XP_BOOK * R.books.filter((b) => b.done).length;
};
