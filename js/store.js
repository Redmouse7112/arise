// Estado persistente en localStorage. Todo funciona offline.
import { DEFAULT_PLAN, SEED_LAST } from './data.js';

const KEY = 'arise.v1';
let S;

export const SCHEMA = 2;

// Alimentos rápidos por defecto: g = gramos de proteína aproximados por porción.
const QUICK = [
  ['huevo', 'Huevo', 6], ['pollo100', 'Pechuga de pollo (100 g)', 31], ['presa', 'Presa de pollo al horno', 25],
  ['milanesa', 'Milanesa', 22], ['atun', 'Lata de atún', 25], ['carne100', 'Carne vacuna (100 g)', 26],
  ['leche', 'Vaso de leche', 8], ['yogur', 'Yogur', 6], ['queso', 'Feta de queso', 5], ['arrozhuevo', 'Arroz con huevo', 18],
].map(([id, n, g]) => ({ id, n, g }));

const defaults = () => ({
  v: SCHEMA,
  profile: { belt: 'amarillo', since: '2026-08', exam: '2027-03-01' },
  plan: [...DEFAULT_PLAN],
  over: {},            // fecha -> sesión elegida para ese día
  log: {},             // fecha -> { s: sesión, ex: { id: { sets:[{w,r,d}], n, done, t } } }
  last: JSON.parse(JSON.stringify(SEED_LAST)),
  prefs: {},           // id ejercicio -> { dur, rest }
  food: { goal: 180, kcal: 2600, quick: QUICK.map((q) => ({ ...q })), log: {}, gl: {} },   // log: fecha -> [{n, g, t}]; gl: meta congelada por día
  read: { goal: 10, current: null, books: [], log: {}, gl: {} },  // books: {id, t, a, pages, cur, done}; log: fecha -> {pages, min}
});

// Lleva datos de cualquier versión anterior al esquema actual sin borrar nada.
function migrate(o) {
  const d = defaults();
  return {
    ...d, ...o, v: SCHEMA,
    profile: { ...d.profile, ...o.profile },
    food: { ...d.food, ...o.food, log: { ...(o.food && o.food.log) }, gl: { ...(o.food && o.food.gl) } },
    read: { ...d.read, ...o.read, books: [...((o.read && o.read.books) || [])], log: { ...(o.read && o.read.log) }, gl: { ...(o.read && o.read.gl) } },
  };
}

export function load() {
  let o = null;
  try { o = JSON.parse(localStorage.getItem(KEY)); } catch {}
  if (o && o.v >= 1 && o.v <= SCHEMA && typeof o.log === 'object') {
    S = migrate(o);
    if (o.v < SCHEMA) {   // copia de respaldo de los datos previos y guarda ya migrado
      try { localStorage.setItem(KEY + '.bak' + o.v, JSON.stringify(o)); } catch {}
      save();
    }
  } else S = defaults();
  return S;
}
export const get = () => S;
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
export const exportJSON = () => JSON.stringify(S, null, 1);
export function importJSON(txt) {
  const o = JSON.parse(txt);
  if (!o || !(o.v >= 1 && o.v <= SCHEMA) || typeof o.log !== 'object') throw new Error('Archivo no válido');
  S = migrate(o);
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
