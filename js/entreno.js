// Datos de entrenos propios: trote, dojo y diario de sparring. Sin interfaz.
import { get, save, ymd } from './store.js';

// ---------- Trote ----------
// +1 XP por cada 2 min por encima de 20, con tope de +20.
export const runBonus = (min) => Math.min(20, Math.max(0, Math.floor((min - 20) / 2)));
export const runDay = (date) => get().run.log[date] || null;
export function saveRun(date, { mode, min, km, feel }) {
  const R = get().run.log, p = R[date], k = Math.round(((p && p.km) || 0) * 10 + (km || 0) * 10) / 10;
  R[date] = { mode, min: ((p && p.min) || 0) + min, km: k > 0 ? k : null, feel };   // un segundo trote el mismo día se suma
  save();
}
export const runList = () => Object.entries(get().run.log).map(([date, r]) => ({ date, ...r })).sort((a, b) => (a.date < b.date ? 1 : -1));

// ---------- Dojo ----------
export const DOJO_TYPES = ['Piernas y pliometría', 'Brazos y explosividad', 'Abdomen', 'Sparring', 'Otra'];
export const dojoDay = (date) => get().dojo.log[date] || null;
export function saveDojo(date, d) { get().dojo.log[date] = d; save(); }
export function delDojo(date) { delete get().dojo.log[date]; save(); }
// Asistencias: clases guardadas en el diario del dojo o marcadas como hechas en la misión.
export function attendance() {
  const S = get(), set = new Set(Object.keys(S.dojo.log));
  for (const d of Object.keys(S.log)) if (S.log[d].ex.clase && S.log[d].ex.clase.done) set.add(d);
  const now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const a = ymd(mon), m = ymd(now).slice(0, 7), today = ymd();
  let week = 0, month = 0;
  for (const d of set) { if (d >= a && d <= today) week++; if (d.slice(0, 7) === m) month++; }
  return { week, month };
}

// ---------- Sparring ----------
export const sparList = () => get().spar.log.map((e, i) => ({ e, i })).sort((a, b) => (a.e.date === b.e.date ? b.i - a.i : a.e.date < b.e.date ? 1 : -1)).map((x) => x.e);
export function addSpar(d) { const e = { id: 's' + Date.now().toString(36), date: ymd(), rounds: 3, feel: 3, good: '', bad: '', work: '', ...d }; get().spar.log.push(e); save(); return e; }
export function updateSpar(id, patch) { const e = get().spar.log.find((x) => x.id === id); if (e) { Object.assign(e, patch); save(); } }
export function delSpar(id) { const L = get().spar.log, i = L.findIndex((x) => x.id === id); if (i >= 0) { L.splice(i, 1); save(); } }
export const lastWork = () => (sparList().find((e) => e.work && e.work.trim()) || {}).work || '';
