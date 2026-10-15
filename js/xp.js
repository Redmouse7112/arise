// XP, nivel, racha. Todo se calcula desde el registro: sin duplicados ni desajustes.
import { SESS, EX, TITLES } from './data.js';
import { get, ymd, sessionFor } from './store.js';

export function isDone(ex, rec) {
  if (!rec) return false;
  if (ex.type === 'sets') {
    const need = rec.n || ex.sets;
    return (rec.sets || []).filter((s) => s && s.d).length >= need;
  }
  return !!rec.done;
}

export function dayStats(date) {
  const L = get().log[date];
  if (!L) return { xp: 0, done: 0, total: 0, complete: false };
  const sess = SESS[L.s];
  if (!sess) return { xp: 0, done: 0, total: 0, complete: false };
  let xp = 0, done = 0, total = 0;
  for (const id of sess.ex) {
    const ex = EX[id];
    const ok = isDone(ex, L.ex[id]);
    if (ok) xp += ex.xp;
    if (!ex.opt) { total++; if (ok) done++; }
  }
  const complete = total > 0 && done === total;
  if (complete) xp += sess.bonus;
  return { xp, done, total, complete };
}

export function totalXP() {
  let t = 0;
  for (const d of Object.keys(get().log)) t += dayStats(d).xp;
  return t;
}

export function levelInfo(xp) {
  const lvl = Math.floor(Math.sqrt(xp / 60)) + 1;
  const base = 60 * (lvl - 1) ** 2, next = 60 * lvl ** 2;
  let title = TITLES[0][1];
  for (const [l, t] of TITLES) if (lvl >= l) title = t;
  return { lvl, base, next, pct: Math.round(((xp - base) / (next - base)) * 100), title };
}

// Racha: días seguidos con sesión completa. Un descanso planificado no corta la racha.
export function streak() {
  const S = get();
  const d = new Date();
  let n = 0, first = true;
  for (let i = 0; i < 400; i++) {
    const key = ymd(d);
    if (dayStats(key).complete) n++;
    else if (first) { /* hoy aún puede completarse */ }
    else if (sessionFor(key) === 'descanso' && !S.log[key]) { /* descanso sin marcar: no corta */ }
    else break;
    first = false;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
