// Estado persistente en localStorage. Todo funciona offline.
import { DEFAULT_PLAN, SEED_LAST } from './data.js';
import * as R from './rutinas.js';

const KEY = 'arise.v1';
let S;

export const SCHEMA = 4;

// Alimentos rápidos por defecto: g = gramos de proteína aproximados por porción.
const QUICK = [
  ['huevo', 'Huevo', 6], ['pollo100', 'Pechuga de pollo (100 g)', 31], ['presa', 'Presa de pollo al horno', 25],
  ['milanesa', 'Milanesa', 22], ['atun', 'Lata de atún', 25], ['carne100', 'Carne vacuna (100 g)', 26],
  ['leche', 'Vaso de leche', 8], ['yogur', 'Yogur', 6], ['queso', 'Feta de queso', 5], ['arrozhuevo', 'Arroz con huevo', 18],
].map(([id, n, g]) => ({ id, n, g }));

const defaults = () => ({
  v: SCHEMA,
  profile: { belt: 'amarillo', since: '2026-08', exam: '2027-03-01' },
  setup: 'pendiente',  // 'pendiente' hasta que una instalación nueva elige rutina de ejemplo o vacío
  routines: R.rutinasBase(),   // [{ id, n, color, img, bonus, ex: [ids] }]
  exo: {},             // ediciones de ejercicios base: id -> { n, sets, reps, rest, dur, note, inc }
  custom: {},          // ejercicios propios: id 'c_<timestamp>' -> { id, n, type, muscle, sets, reps, rest, dur, note, inc }
  plan: [...DEFAULT_PLAN],   // domingo=0 -> id de rutina ('' = sin rutina)
  over: {},            // fecha -> rutina elegida para ese día
  log: {},             // fecha -> { s: rutina, f: copia congelada de la sesión, ex: { id: { sets:[{w,r,d}], n, done, t } } }
  last: JSON.parse(JSON.stringify(SEED_LAST)),
  prefs: {},           // id ejercicio -> { dur, rest }
  food: { goal: 180, kcal: 2600, quick: QUICK.map((q) => ({ ...q })), log: {}, gl: {} },   // log: fecha -> [{n, g, t}]; gl: meta congelada por día
  read: { goal: 10, current: null, books: [], log: {}, gl: {} },  // books: {id, t, a, pages, cur, done}; log: fecha -> {pages, min}
  run: { log: {} },    // fecha -> { mode, min, km, feel }
  dojo: { log: {} },   // fecha -> { type, effort, notes }
  spar: { log: [] },   // [ { id, date, rounds, feel, good, bad, work } ]
});

// Lleva datos de cualquier versión anterior al esquema actual sin borrar nada.
function migrate(o) {
  const d = defaults();
  const m = {
    ...d, ...o, v: SCHEMA,
    profile: { ...d.profile, ...o.profile },
    food: { ...d.food, ...o.food, log: { ...(o.food && o.food.log) }, gl: { ...(o.food && o.food.gl) } },
    read: { ...d.read, ...o.read, books: [...((o.read && o.read.books) || [])], log: { ...(o.read && o.read.log) }, gl: { ...(o.read && o.read.gl) } },
    run: { log: { ...(o.run && o.run.log) } },
    dojo: { log: { ...(o.dojo && o.dojo.log) } },
    spar: { log: [...((o.spar && o.spar.log) || [])] },
  };
  if (!(o.v >= 4)) Object.assign(m, R.aV4(o));   // v1-v3: sesiones pasan a ser rutinas y cada día con registro queda congelado
  else { m.routines = Array.isArray(o.routines) ? o.routines : d.routines; m.exo = { ...o.exo }; m.custom = { ...o.custom }; }
  m.setup = o.setup || 'listo';
  return m;
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

// Devuelve el registro del día. La primera vez lo crea y congela una copia de la sesión (log[fecha].f).
export function entry(date) {
  if (!S.log[date]) {
    const sid = sessionFor(date), f = R.congelar(S, sid);
    S.log[date] = f ? { s: sid, f, ex: {} } : { s: sid, ex: {} };
  }
  return S.log[date];
}
// Elegir otra rutina para hoy: si el día ya tenía registro, se vuelve a congelar con la elegida (los ejercicios hechos se conservan).
export function setSession(date, sid) {
  S.over[date] = sid;
  if (S.log[date]) { S.log[date].s = sid; const f = R.congelar(S, sid); if (f) S.log[date].f = f; else delete S.log[date].f; }
  save();
}

// Acceso a rutinas y ejercicios atado al estado real.
export const defOf = (id) => R.defOf(S, id);
export const biblioteca = () => R.biblioteca(S);
export const routineOf = (id) => R.routineOf(S, id);
export const esDescanso = (id) => R.esDescanso(S, id);
export const sugerenciaPeso = (id, date) => R.sugerenciaPeso(S, id, date);
export const sesionDia = (date) => R.sesionDia(S, date, sessionFor(date));
export const exFor = (date, id) => { const s = sesionDia(date); return (s && s.ex.find((e) => e.id === id)) || defOf(id); };
export const pref = (id, def) => ({ ...def, ...(S.prefs[id] || {}) });
