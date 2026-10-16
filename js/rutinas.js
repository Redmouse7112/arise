// Rutinas y ejercicios del usuario: funciones puras que reciben el estado S (sin tocar localStorage).
// store.js las expone ya atadas al estado real. Los ejercicios base de data.js son los valores por defecto.
import { EX, SESS } from './data.js';

export const INC = 2.5;                       // incremento de peso por defecto (kg)
const EDITABLES = ['n', 'sets', 'reps', 'rest', 'dur', 'note', 'inc'];   // lo único que se puede editar de un ejercicio base
const CONGELADO = ['id', 'n', 'type', 'xp', 'sets', 'reps', 'rl', 'rest', 'dur', 'opt', 'muscle'];

// XP de un ejercicio propio: no es editable, sale del tipo (timed: 10 a 40 según los minutos).
export const xpCustom = (c) => (c.type === 'sets' ? 25 : c.type === 'timed' ? Math.max(10, Math.min(40, Math.round(10 + ((c.dur || 0) / 60 - 5) * 2))) : 30);

// Rutinas iniciales: las sesiones de data.js (mismos ids, así el plan guardado sigue valiendo).
export const rutinasBase = () => Object.entries(SESS).map(([id, s]) => ({ id, n: s.n, color: s.color, img: s.img, bonus: s.bonus, ex: [...s.ex] }));

// Definición vigente de un ejercicio (base + ediciones, o propio). null si no existe.
export function defOf(S, id) {
  const b = EX[id];
  if (b) {
    const o = S.exo[id] || {}, d = { ...b, id };
    for (const k of EDITABLES) if (o[k] !== undefined) d[k] = o[k];
    d.inc = d.inc ?? INC;
    return d;
  }
  const c = S.custom[id];
  if (!c) return null;
  return { id, n: c.n, type: c.type, muscle: c.muscle, sets: c.sets, reps: c.reps, rl: 'reps', rest: c.rest, dur: c.dur, note: c.note || '', xp: xpCustom(c), inc: c.inc ?? INC, custom: true };
}
export const biblioteca = (S) => [...Object.keys(EX), ...Object.keys(S.custom)].map((id) => defOf(S, id)).filter(Boolean);
export const routineOf = (S, id) => S.routines.find((r) => r.id === id) || null;
// Un día de descanso planificado es una rutina que solo tiene el ejercicio "descanso".
export const esDescanso = (S, id) => { const r = routineOf(S, id); return !!r && r.ex.length === 1 && r.ex[0] === 'descanso'; };

// Copia congelada de la sesión de una rutina: de acá leen el XP, la racha y "sesión completa".
export function congelar(S, rid) {
  const r = routineOf(S, rid);
  if (!r) return null;
  return {
    n: r.n, bonus: r.bonus, color: r.color, img: r.img,
    ex: r.ex.map((id) => defOf(S, id)).filter(Boolean).map((d) => {
      const c = {};
      for (const k of CONGELADO) if (d[k] !== undefined) c[k] = d[k];
      c.opt = !!d.opt;
      return c;
    }),
  };
}

// Sesión de un día para mostrar: la congelada si el día ya tiene registro, si no la rutina vigente.
// En la congelada mandan sus valores y los datos que solo sirven para mostrar (nota, paso) salen de la definición vigente.
export function sesionDia(S, date, sid) {
  const L = S.log[date];
  if (L && L.f) return { ...L.f, id: L.s, ex: L.f.ex.map((e) => ({ ...(defOf(S, e.id) || {}), ...e })) };
  const r = routineOf(S, sid);
  return r ? { id: r.id, n: r.n, color: r.color, img: r.img, bonus: r.bonus, ex: r.ex.map((id) => defOf(S, id)).filter(Boolean) } : null;
}

// Migración v3 → v4: las sesiones pasan a ser rutinas del usuario y cada día con registro queda congelado.
export function aV4(o) {
  const T = { routines: rutinasBase(), exo: {}, custom: {} };
  const log = {};
  for (const [d, L] of Object.entries(o.log || {})) log[d] = L.f ? L : { ...L, f: congelar(T, L.s) || undefined };
  for (const d of Object.keys(log)) if (log[d].f === undefined) delete log[d].f;
  return { routines: T.routines, exo: {}, custom: {}, log };
}

// Sugerencia de peso: si la última vez que se hizo el ejercicio (el día anterior más reciente con todas las series hechas)
// todas las series llegaron al tope del rango de repeticiones, propone subir `inc` kg. Nunca cambia nada sola.
export function sugerenciaPeso(S, id, date) {
  const num = (v) => parseFloat(String(v ?? '').replace(',', '.'));
  for (const d of Object.keys(S.log).filter((k) => k < date && S.log[k].ex[id]).sort().reverse()) {
    const L = S.log[d], rec = L.ex[id];
    const def = (L.f && L.f.ex.find((e) => e.id === id)) || defOf(S, id);
    if (!def || def.type !== 'sets') return null;
    const need = rec.n || def.sets, sets = (rec.sets || []).slice(0, need);
    if (sets.filter((s) => s && s.d).length < need) continue;   // ese día no lo completó: miro el anterior
    const top = parseInt(String(def.reps).split('-').pop(), 10);
    const pesos = sets.map((s) => num(s.w)).filter((w) => w > 0);
    if (!top || pesos.length === 0 || !sets.every((s) => num(s.r) >= top)) return null;
    const inc = defOf(S, id).inc, desde = Math.max(...pesos);
    return { w: Math.round((desde + inc) * 100) / 100, desde, inc, fecha: d, reps: top };
  }
  return null;
}

// ---------- Edición de rutinas y ejercicios (cambian S; quien llama guarda) ----------
const nuevoId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
// El bonus de una rutina no se edita: sale de cuántos ejercicios obligatorios tiene (0 si tiene menos de 2).
export function bonusPara(S, ids) {
  const n = ids.map((id) => defOf(S, id)).filter((d) => d && !d.opt).length;
  return n >= 2 ? Math.min(60, 10 + 5 * n) : 0;
}
export function nuevaRutina(S, n, color, img) {
  const r = { id: nuevoId('r_'), n, color, img, bonus: 0, ex: [] };
  S.routines.push(r); return r;
}
export function duplicarRutina(S, id) {
  const o = routineOf(S, id); if (!o) return null;
  const r = { ...o, id: nuevoId('r_'), n: o.n + ' (copia)', ex: [...o.ex] };
  S.routines.splice(S.routines.indexOf(o) + 1, 0, r); return r;
}
export const diasEnPlan = (S, id) => S.plan.map((p, d) => (p === id ? d : -1)).filter((d) => d >= 0);
// Elimina la rutina; sus días del plan pasan a `reemplazo`. Los días ya registrados no cambian (están congelados).
export function eliminarRutina(S, id, reemplazo, hoy) {
  S.plan = S.plan.map((p) => (p === id ? reemplazo : p));
  for (const d of Object.keys(S.over)) if (S.over[d] === id && d >= hoy && !S.log[d]) delete S.over[d];
  S.routines = S.routines.filter((r) => r.id !== id);
}
export function moverEj(S, rid, i, dir) {
  const r = routineOf(S, rid), j = i + dir;
  if (!r || j < 0 || j >= r.ex.length) return;
  [r.ex[i], r.ex[j]] = [r.ex[j], r.ex[i]];
}
export function agregarEj(S, rid, id) { const r = routineOf(S, rid); if (r && !r.ex.includes(id)) { r.ex.push(id); r.bonus = bonusPara(S, r.ex); } }
export function quitarEj(S, rid, i) { const r = routineOf(S, rid); if (r) { r.ex.splice(i, 1); r.bonus = bonusPara(S, r.ex); } }
export const rutinasConEj = (S, id) => S.routines.filter((r) => r.ex.includes(id));
export const hayExo = (S, id) => !!S.exo[id] && Object.keys(S.exo[id]).length > 0;
// Guarda un ejercicio: en los base solo se guardan las diferencias con el valor original; los propios se guardan completos.
export function guardarEj(S, id, d) {
  if (EX[id]) {
    const o = {}, b = EX[id];
    for (const k of EDITABLES) { const orig = k === 'inc' ? (b.inc ?? INC) : b[k]; if (d[k] !== undefined && d[k] !== orig && d[k] !== (orig ?? '') ) o[k] = d[k]; }
    if (Object.keys(o).length) S.exo[id] = o; else delete S.exo[id];
  } else if (S.custom[id]) Object.assign(S.custom[id], d);
}
export function crearEj(S, d) {
  const id = 'c_' + Date.now();
  S.custom[id] = { id, n: d.n, type: d.type, muscle: d.muscle, sets: d.sets, reps: d.reps, rest: d.rest, dur: d.dur, note: d.note || '', inc: d.inc };
  return id;
}
export function restaurarEj(S, id) { delete S.exo[id]; }
export function eliminarEj(S, id) { if (S.custom[id] && rutinasConEj(S, id).length === 0) { delete S.custom[id]; return true; } return false; }
