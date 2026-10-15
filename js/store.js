// Estado persistente en localStorage. Todo funciona offline.
import { DEFAULT_PLAN, SEED_LAST } from './data.js';

const KEY = 'arise.v1';
let S;

const defaults = () => ({
  v: 1,
  profile: { belt: 'amarillo', since: '2026-08', exam: '2027-03-01' },
  plan: [...DEFAULT_PLAN],
  over: {},            // fecha -> sesión elegida para ese día
  log: {},             // fecha -> { s: sesión, ex: { id: { sets:[{w,r,d}], n, done, t } } }
  last: JSON.parse(JSON.stringify(SEED_LAST)),
  prefs: {},           // id ejercicio -> { dur, rest }
});

export function load() {
  let o = null;
  try { o = JSON.parse(localStorage.getItem(KEY)); } catch {}
  const d = defaults();
  S = o && o.v === 1 ? { ...d, ...o, profile: { ...d.profile, ...o.profile } } : d;
  return S;
}
export const get = () => S;
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
export const exportJSON = () => JSON.stringify(S, null, 1);
export function importJSON(txt) {
  const o = JSON.parse(txt);
  if (!o || o.v !== 1 || typeof o.log !== 'object') throw new Error('Archivo no válido');
  S = { ...defaults(), ...o, profile: { ...defaults().profile, ...o.profile } };
  save();
}
export function reset() { S = defaults(); save(); }

export const ymd = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const dow = (date) => new Date(date + 'T12:00:00').getDay();
export const sessionFor = (date) => S.log[date]?.s || S.over[date] || S.plan[dow(date)];

// Devuelve el registro del día (lo crea y congela la sesión del día).
export function entry(date) {
  if (!S.log[date]) S.log[date] = { s: sessionFor(date), ex: {} };
  return S.log[date];
}
export function setSession(date, sid) {
  S.over[date] = sid;
  if (S.log[date]) S.log[date].s = sid;
  save();
}
export const pref = (id, def) => ({ ...def, ...(S.prefs[id] || {}) });
